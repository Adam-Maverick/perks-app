'use server';

import { db } from '@/db';
import { transactions, wallets, users, employees } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export interface EmployeeSpending {
    userId: string;
    employeeName: string;
    email: string;
    amountSpent: number; // In kobo
    taxContribution: number; // 150% * 30% of spending, in kobo
}

export interface WelfareSpendingReport {
    organizationId: string;
    periodStart: Date;
    periodEnd: Date;
    totalFunded: number; // In kobo
    totalSpent: number; // In kobo
    taxDeduction: number; // 150% of spending, in kobo
    estimatedTaxSavings: number; // Deduction * 30%, in kobo
    employeeBreakdown: EmployeeSpending[];
}

/**
 * Calculate welfare spending report for an organization.
 * 
 * Formula:
 * - Tax Deduction = Total Spending × 1.5 (150%)
 * - Estimated Savings = Tax Deduction × 0.30 (30% corporate tax rate)
 * 
 * @param organizationId - The organization's Clerk ID
 * @param startDate - Report period start
 * @param endDate - Report period end
 * @returns WelfareSpendingReport with totals and employee breakdown
 */
export async function calculateWelfareSpending(
    organizationId: string,
    startDate: Date,
    endDate: Date
): Promise<WelfareSpendingReport> {
    // 1. Get all employees in this organization
    const orgEmployees = await db
        .select({
            userId: employees.userId,
            email: employees.email,
        })
        .from(employees)
        .where(eq(employees.organizationId, organizationId));

    const employeeUserIds = orgEmployees
        .map(e => e.userId)
        .filter((id): id is string => id !== null);

    if (employeeUserIds.length === 0) {
        return {
            organizationId,
            periodStart: startDate,
            periodEnd: endDate,
            totalFunded: 0,
            totalSpent: 0,
            taxDeduction: 0,
            estimatedTaxSavings: 0,
            employeeBreakdown: [],
        };
    }

    // 2. Calculate total SPENDING (debit transactions from wallets in period)
    // Spending = transactions with type='debit' and status='completed'
    const spendingByEmployee = await db
        .select({
            userId: transactions.userId,
            totalSpent: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.as('total_spent'),
        })
        .from(transactions)
        .where(
            and(
                sql`${transactions.userId} = ANY(${employeeUserIds})`,
                eq(transactions.type, 'debit'),
                eq(transactions.status, 'completed'),
                gte(transactions.createdAt, startDate),
                lte(transactions.createdAt, endDate)
            )
        )
        .groupBy(transactions.userId);

    // 3. Calculate total FUNDING (credit transactions to wallets in period)
    // This represents employer deposits
    const fundingTotal = await db
        .select({
            total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.as('total'),
        })
        .from(transactions)
        .innerJoin(wallets, eq(transactions.walletId, wallets.id))
        .innerJoin(users, eq(wallets.userId, users.id))
        .where(
            and(
                sql`${wallets.userId} = ANY(${employeeUserIds})`,
                eq(transactions.type, 'credit'),
                eq(transactions.status, 'completed'),
                gte(transactions.createdAt, startDate),
                lte(transactions.createdAt, endDate)
            )
        );

    const totalFunded = Number(fundingTotal[0]?.total ?? 0);

    // 4. Get user details for the report
    const userDetails = await db
        .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
        })
        .from(users)
        .where(sql`${users.id} = ANY(${employeeUserIds})`);

    const userMap = new Map(userDetails.map(u => [u.id, u]));

    // 5. Build employee breakdown with tax contribution
    const employeeBreakdown: EmployeeSpending[] = spendingByEmployee.map(row => {
        const user = userMap.get(row.userId);
        const amountSpent = Number(row.totalSpent);
        // Tax contribution = 150% × 30% of spending = 45% of spending
        const taxContribution = Math.floor(amountSpent * 0.45);

        return {
            userId: row.userId,
            employeeName: user
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
                : 'Unknown',
            email: user?.email || '',
            amountSpent,
            taxContribution,
        };
    });

    // 6. Calculate totals
    const totalSpent = employeeBreakdown.reduce((sum, e) => sum + e.amountSpent, 0);
    // Tax Deduction = 150% of spending (integer math to avoid floating point issues)
    const taxDeduction = Math.floor(totalSpent * 1.5);
    // Estimated Savings = Deduction × 30%
    const estimatedTaxSavings = Math.floor(taxDeduction * 0.30);

    return {
        organizationId,
        periodStart: startDate,
        periodEnd: endDate,
        totalFunded,
        totalSpent,
        taxDeduction,
        estimatedTaxSavings,
        employeeBreakdown,
    };
}
