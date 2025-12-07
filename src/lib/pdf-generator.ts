'use server';

import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { RentReceipt } from '@/components/pdf/RentReceipt';
import { WelfareSpendingReportPDF } from '@/components/pdf/WelfareSpendingReport';
import type { WelfareSpendingReport } from '@/server/procedures/tax/calculate-welfare-spend';

export interface RentReceiptInput {
    receiptNo: string;
    date: string;
    tenantName: string;
    amount: number;
    period: string;
    propertyAddress: string;
    landlordName: string;
}

/**
 * Renders a RentReceipt PDF to a buffer.
 * Must be called from a Server Action or server-side code.
 */
export async function renderRentReceiptPdf(props: RentReceiptInput): Promise<Buffer> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(RentReceipt as any, props);
    // Cast to any to bypass react-pdf type incompatibility with standard React types
    const buffer = await renderToBuffer(element as any);
    return Buffer.from(buffer);
}

export interface WelfareReportInput {
    report: WelfareSpendingReport;
    organizationName: string;
    generatedAt: string;
    reportId: string;
}

/**
 * Renders a WelfareSpendingReport PDF to a buffer.
 * Must be called from a Server Action or server-side code.
 */
export async function renderWelfareReportPdf(props: WelfareReportInput): Promise<Buffer> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(WelfareSpendingReportPDF as any, props);
    const buffer = await renderToBuffer(element as any);
    return Buffer.from(buffer);
}
