'use client';

import { useState } from 'react';
import { generateWelfareSpendingReport } from '@/server/actions/generateWelfareSpendingReport';
import { useAuth, useOrganization } from '@clerk/nextjs';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// Format kobo to Naira display
function formatNaira(kobo: number): string {
    const naira = kobo / 100;
    return `₦${naira.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TaxReportsPage() {
    const { isLoaded, isSignedIn } = useAuth();
    const { organization, isLoaded: orgLoaded } = useOrganization();

    // Default to previous month
    const defaultEnd = endOfMonth(subMonths(new Date(), 1));
    const defaultStart = startOfMonth(subMonths(new Date(), 1));

    const [startDate, setStartDate] = useState(format(defaultStart, 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(defaultEnd, 'yyyy-MM-dd'));
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [isCsvLoading, setIsCsvLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reportResult, setReportResult] = useState<{
        url: string;
        summary: {
            totalFunded: number;
            totalSpent: number;
            taxDeduction: number;
            estimatedTaxSavings: number;
            employeeCount: number;
        };
    } | null>(null);

    if (!isLoaded || !orgLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!isSignedIn || !organization) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-red-600">Access Denied</h1>
                    <p className="text-gray-600 mt-2">
                        You must be signed in as an employer admin to view this page.
                    </p>
                </div>
            </div>
        );
    }

    const handleGenerateReport = async (fileFormat: 'pdf' | 'csv') => {
        if (fileFormat === 'pdf') setIsPdfLoading(true);
        else setIsCsvLoading(true);

        setError(null);
        setReportResult(null);

        try {
            const result = await generateWelfareSpendingReport({
                organizationId: organization.id,
                startDate,
                endDate,
                format: fileFormat,
            });

            if (result.success && result.data) {
                // Trigger client-side download with correct filename
                try {
                    const response = await fetch(result.data.url);
                    const blob = await response.blob();
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = result.data.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(downloadUrl);
                } catch (downloadErr) {
                    console.error('Download failed, opening in new tab:', downloadErr);
                    window.open(result.data.url, '_blank');
                }

                setReportResult({
                    url: result.data.url,
                    summary: result.data.summary,
                });
            } else {
                setError(result.error || 'Failed to generate report.');
            }
        } catch (err) {
            setError('An unexpected error occurred.');
            console.error(err);
        } finally {
            if (fileFormat === 'pdf') setIsPdfLoading(false);
            else setIsCsvLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Welfare Spending Report
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Generate tax compliance reports for FIRS submission under Nigeria Tax Act 2025.
                    </p>
                </div>

                {/* Organization Info */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization</h2>
                    <p className="text-gray-700">{organization.name}</p>
                </div>

                {/* Date Range Picker */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Period</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Generate Buttons */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Report</h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => handleGenerateReport('pdf')}
                            disabled={isPdfLoading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {isPdfLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Generating...
                                </>
                            ) : (
                                '📄 Download PDF'
                            )}
                        </button>
                        <button
                            onClick={() => handleGenerateReport('csv')}
                            disabled={isCsvLoading}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {isCsvLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Generating...
                                </>
                            ) : (
                                '📊 Download CSV'
                            )}
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {/* Report Result */}
                {reportResult && (
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            ✅ Report Generated Successfully
                        </h2>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-500">Total Funded</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {formatNaira(reportResult.summary.totalFunded)}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-500">Total Spent</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {formatNaira(reportResult.summary.totalSpent)}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-500">Tax Deduction (150%)</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {formatNaira(reportResult.summary.taxDeduction)}
                                </p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <p className="text-sm text-green-700">Est. Tax Savings</p>
                                <p className="text-lg font-bold text-green-700">
                                    {formatNaira(reportResult.summary.estimatedTaxSavings)}
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 mb-4">
                            Employees included: {reportResult.summary.employeeCount}
                        </p>

                        {/* Download Link */}
                        <a
                            href={reportResult.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                            ⬇️ Open Report
                        </a>

                        {/* Disclaimer */}
                        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                                ⚠️ <strong>Disclaimer:</strong> Consult your tax advisor for filing. This report is provided for informational purposes only.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
