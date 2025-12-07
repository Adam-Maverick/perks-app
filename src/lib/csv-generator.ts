import type { WelfareSpendingReport } from '@/server/procedures/tax/calculate-welfare-spend';

/**
 * Format kobo amount as Naira string for CSV (no symbol, just number)
 */
function formatNairaForCSV(kobo: number): string {
    return (kobo / 100).toFixed(2);
}

/**
 * Format date for CSV (YYYY-MM-DD)
 */
function formatDateForCSV(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Escape CSV field - wraps in quotes if contains comma, newline, or quote
 */
function escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

/**
 * Generate CSV content for welfare spending report.
 * 
 * @param report - The welfare spending report data
 * @param organizationName - Name of the organization
 * @param reportId - Unique report identifier
 * @returns CSV string content
 */
export function generateWelfareReportCSV(
    report: WelfareSpendingReport,
    organizationName: string,
    reportId: string
): string {
    const lines: string[] = [];

    // Header section
    lines.push('Employer Welfare Spending Report');
    lines.push(`Organization,${escapeCSV(organizationName)}`);
    lines.push(`Report ID,${reportId}`);
    lines.push(`Period Start,${formatDateForCSV(report.periodStart)}`);
    lines.push(`Period End,${formatDateForCSV(report.periodEnd)}`);
    lines.push('');

    // Summary section
    lines.push('SUMMARY');
    lines.push(`Total Stipend Funded (NGN),${formatNairaForCSV(report.totalFunded)}`);
    lines.push(`Total Employee Spending (NGN),${formatNairaForCSV(report.totalSpent)}`);
    lines.push(`Eligible Tax Deduction 150% (NGN),${formatNairaForCSV(report.taxDeduction)}`);
    lines.push(`Estimated Tax Savings 30% (NGN),${formatNairaForCSV(report.estimatedTaxSavings)}`);
    lines.push('');

    // Employee breakdown
    lines.push('EMPLOYEE BREAKDOWN');
    lines.push('Employee Name,Email,Amount Spent (NGN),Tax Contribution (NGN)');

    for (const employee of report.employeeBreakdown) {
        lines.push([
            escapeCSV(employee.employeeName),
            escapeCSV(employee.email),
            formatNairaForCSV(employee.amountSpent),
            formatNairaForCSV(employee.taxContribution),
        ].join(','));
    }

    lines.push('');
    lines.push('DISCLAIMER: Consult your tax advisor for filing. This report is for informational purposes only.');

    return lines.join('\n');
}
