'use server';

import { z } from 'zod';
import { db } from '@/db';
import { taxReports, employers, organizations } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { ActionResponse } from '@/types';
import { calculateWelfareSpending } from '@/server/procedures/tax/calculate-welfare-spend';
import { renderWelfareReportPdf } from '@/lib/pdf-generator';
import { generateWelfareReportCSV } from '@/lib/csv-generator';
import { put } from '@vercel/blob';

// Validation Schema
const reportSchema = z.object({
    organizationId: z.string().min(1, 'Organization ID is required'),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid start date format',
    }),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid end date format',
    }),
    format: z.enum(['pdf', 'csv'], {
        error: 'Format must be pdf or csv',
    }),
});

export type WelfareReportInput = z.infer<typeof reportSchema>;

export type WelfareReportResult = {
    reportId: string;
    url: string;
    filename: string;
    summary: {
        totalFunded: number;
        totalSpent: number;
        taxDeduction: number;
        estimatedTaxSavings: number;
        employeeCount: number;
    };
};

/**
 * Server Action: Generate Employer Welfare Spending Report
 * 
 * Security: Validates auth().userId is an admin of the organization
 * 
 * @param input - Report generation parameters
 * @returns ActionResponse with report URL and summary
 */
export async function generateWelfareSpendingReport(
    input: WelfareReportInput
): Promise<ActionResponse<WelfareReportResult>> {
    try {
        // 1. Authentication Check
        const { userId } = await auth();

        if (!userId) {
            return {
                success: false,
                error: 'Unauthorized. Please sign in.',
            };
        }

        // 2. Input Validation
        const validatedInput = reportSchema.parse(input);
        const { organizationId, startDate, endDate, format } = validatedInput;

        // 3. Authorization Check - User must be an admin of the organization
        const employerRecord = await db.query.employers.findFirst({
            where: and(
                eq(employers.userId, userId),
                eq(employers.organizationId, organizationId),
                eq(employers.role, 'admin')
            ),
        });

        if (!employerRecord) {
            return {
                success: false,
                error: 'Access denied. You must be an admin of this organization.',
            };
        }

        // 4. Get organization details
        const org = await db.query.organizations.findFirst({
            where: eq(organizations.id, organizationId),
        });

        if (!org) {
            return {
                success: false,
                error: 'Organization not found.',
            };
        }

        // 5. Calculate report data
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validate date range
        if (start >= end) {
            return {
                success: false,
                error: 'Start date must be before end date.',
            };
        }

        const report = await calculateWelfareSpending(organizationId, start, end);

        // 6. Generate report file
        const reportId = `WR-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
        const generatedAt = new Date().toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        let fileBuffer: Buffer;
        let contentType: string;
        let fileExtension: string;

        if (format === 'pdf') {
            fileBuffer = await renderWelfareReportPdf({
                report,
                organizationName: org.name,
                generatedAt,
                reportId,
            });
            contentType = 'application/pdf';
            fileExtension = 'pdf';
        } else {
            const csvContent = generateWelfareReportCSV(report, org.name, reportId);
            fileBuffer = Buffer.from(csvContent, 'utf-8');
            contentType = 'text/csv';
            fileExtension = 'csv';
        }

        // 7. Upload to Vercel Blob
        const filename = `${reportId}.${fileExtension}`;
        const blobPath = `tax-reports/${organizationId}/${filename}`;
        const blob = await put(blobPath, fileBuffer, {
            access: 'public',
            contentType,
            addRandomSuffix: false,
        });

        // 8. Log report generation to database (AC#6 - Audit)
        const [dbReport] = await db.insert(taxReports).values({
            organizationId,
            periodStart: start,
            periodEnd: end,
            totalFunded: report.totalFunded,
            totalSpent: report.totalSpent,
            taxDeduction: report.taxDeduction,
            fileUrl: blob.url,
            format,
            createdBy: userId,
        }).returning();

        return {
            success: true,
            data: {
                reportId: dbReport.id,
                url: blob.url,
                filename: `${reportId}.${fileExtension}`,
                summary: {
                    totalFunded: report.totalFunded,
                    totalSpent: report.totalSpent,
                    taxDeduction: report.taxDeduction,
                    estimatedTaxSavings: report.estimatedTaxSavings,
                    employeeCount: report.employeeBreakdown.length,
                },
            },
        };

    } catch (error) {
        console.error('Error generating welfare spending report:', error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: 'Invalid input: ' + error.issues.map(e => e.message).join(', '),
            };
        }

        return {
            success: false,
            error: 'Failed to generate report. Please try again.',
        };
    }
}
