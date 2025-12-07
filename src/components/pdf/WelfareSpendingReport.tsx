import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import type { WelfareSpendingReport, EmployeeSpending } from '@/server/procedures/tax/calculate-welfare-spend';

// Register Roboto font which properly supports the Naira symbol (₦)
Font.register({
    family: 'Roboto',
    fonts: [
        {
            src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf',
            fontWeight: 'normal',
        },
        {
            src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf',
            fontWeight: 'bold',
        },
    ],
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Roboto',
        fontSize: 10,
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#2563EB',
        paddingBottom: 15,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 11,
        textAlign: 'center',
        marginTop: 5,
        color: '#666',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        color: '#2563EB',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingBottom: 5,
    },
    summaryCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        padding: 8,
        backgroundColor: '#F9FAFB',
        borderRadius: 4,
    },
    summaryLabel: {
        fontSize: 10,
        color: '#666',
    },
    summaryValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#111',
    },
    highlightCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        padding: 10,
        backgroundColor: '#ECFDF5',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    highlightLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#047857',
    },
    highlightValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#047857',
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        padding: 8,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        padding: 8,
    },
    tableCell: {
        fontSize: 9,
    },
    tableCellHeader: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#374151',
    },
    colName: { width: '35%' },
    colEmail: { width: '25%' },
    colSpent: { width: '20%', textAlign: 'right' },
    colTax: { width: '20%', textAlign: 'right' },
    disclaimer: {
        marginTop: 30,
        padding: 15,
        backgroundColor: '#FEF3C7',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    disclaimerText: {
        fontSize: 9,
        color: '#92400E',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#9CA3AF',
    },
});

interface WelfareSpendingReportPDFProps {
    report: WelfareSpendingReport;
    organizationName: string;
    generatedAt: string;
    reportId: string;
}

function formatNaira(kobo: number): string {
    const naira = kobo / 100;
    return `₦${naira.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export const WelfareSpendingReportPDF = ({
    report,
    organizationName,
    generatedAt,
    reportId,
}: WelfareSpendingReportPDFProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Employer Welfare Spending Report</Text>
                <Text style={styles.subtitle}>
                    Nigeria Tax Act 2025 - 150% Tax Deductible Welfare Spending
                </Text>
            </View>

            {/* Organization Info */}
            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Organization</Text>
                <Text style={styles.summaryValue}>{organizationName}</Text>
            </View>
            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Report Period</Text>
                <Text style={styles.summaryValue}>
                    {formatDate(report.periodStart)} - {formatDate(report.periodEnd)}
                </Text>
            </View>
            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Report ID</Text>
                <Text style={styles.summaryValue}>{reportId}</Text>
            </View>

            {/* Summary Section */}
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Stipend Funded</Text>
                <Text style={styles.summaryValue}>{formatNaira(report.totalFunded)}</Text>
            </View>
            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Employee Spending</Text>
                <Text style={styles.summaryValue}>{formatNaira(report.totalSpent)}</Text>
            </View>
            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Eligible Tax Deduction (150%)</Text>
                <Text style={styles.summaryValue}>{formatNaira(report.taxDeduction)}</Text>
            </View>
            <View style={styles.highlightCard}>
                <Text style={styles.highlightLabel}>Estimated Tax Savings (@ 30%)</Text>
                <Text style={styles.highlightValue}>{formatNaira(report.estimatedTaxSavings)}</Text>
            </View>

            {/* Employee Breakdown */}
            <Text style={styles.sectionTitle}>Employee Breakdown</Text>
            <View style={styles.table}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableCellHeader, styles.colName]}>Employee Name</Text>
                    <Text style={[styles.tableCellHeader, styles.colEmail]}>Email</Text>
                    <Text style={[styles.tableCellHeader, styles.colSpent]}>Amount Spent</Text>
                    <Text style={[styles.tableCellHeader, styles.colTax]}>Tax Contribution</Text>
                </View>
                {/* Table Rows */}
                {report.employeeBreakdown.map((employee, index) => (
                    <View key={index} style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.colName]}>{employee.employeeName}</Text>
                        <Text style={[styles.tableCell, styles.colEmail]}>{employee.email}</Text>
                        <Text style={[styles.tableCell, styles.colSpent]}>{formatNaira(employee.amountSpent)}</Text>
                        <Text style={[styles.tableCell, styles.colTax]}>{formatNaira(employee.taxContribution)}</Text>
                    </View>
                ))}
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
                <Text style={styles.disclaimerText}>
                    ⚠️ DISCLAIMER: Consult your tax advisor for filing. This report is provided for informational purposes only and does not constitute tax advice.
                </Text>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
                Generated by Stipends Platform on {generatedAt}
            </Text>
        </Page>
    </Document>
);

export default WelfareSpendingReportPDF;
