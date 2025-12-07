'use server';

import { z } from 'zod';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

const calculateEmployeeTaxContributionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export type CalculateEmployeeTaxContributionInput = z.infer<typeof calculateEmployeeTaxContributionSchema>;

export type CalculateEmployeeTaxContributionResponse = {
  success: boolean;
  data?: {
    taxSavings: number;
    totalSpent: number;
  };
  error?: string;
};

export async function calculateEmployeeTaxContribution(
  input: CalculateEmployeeTaxContributionInput
): Promise<CalculateEmployeeTaxContributionResponse> {
  try {
    const { userId: requesterId } = await auth();

    if (!requesterId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Validate input
    const validatedInput = calculateEmployeeTaxContributionSchema.parse(input);
    const { userId } = validatedInput;

    // Security: Ensure user can only request their own data
    if (userId !== requesterId) {
      return {
        success: false,
        error: 'Unauthorized: Cannot access other users data',
      };
    }

    // Query stipend wallet transactions (wallet transactions are debit type)
    const stipendTransactions = await db
      .select({
        amount: transactions.amount,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          isNotNull(transactions.walletId), // Stipend wallet transactions
          eq(transactions.type, 'debit'), // Spending transactions
          eq(transactions.status, 'completed') // Only completed transactions
        )
      );

    // Calculate total spent in Naira (amount is in kobo)
    const totalSpentKobo = stipendTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalSpent = totalSpentKobo / 100; // Convert kobo to Naira

    // Calculate tax savings: Total Spent × 1.5 × Employer Tax Rate (30%)
    const employerTaxRate = 0.30; // Nigeria corporate tax rate
    const taxSavings = totalSpent * 1.5 * employerTaxRate;

    return {
      success: true,
      data: {
        taxSavings: Math.round(taxSavings * 100) / 100, // Round to 2 decimal places
        totalSpent: Math.round(totalSpent * 100) / 100,
      },
    };
  } catch (error) {
    console.error('Error calculating employee tax contribution:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input: ' + (error.issues ? error.issues.map((e: any) => e.message).join(', ') : 'Unknown validation error'),
      };
    }

    return {
      success: false,
      error: 'Failed to calculate tax contribution. Please try again.',
    };
  }
}