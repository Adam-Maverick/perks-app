import React from 'react';
import { renderToFile } from '@react-pdf/renderer';
import { RentReceipt } from '../src/components/pdf/RentReceipt';
import path from 'path';

async function generate() {
    const outputPath = path.join(process.cwd(), 'rent-receipt-sample.pdf');

    console.log('🚀 Generating PDF Prototype...');
    console.log(`📄 Output Path: ${outputPath}`);

    try {
        await renderToFile(
            <RentReceipt
                receiptNo="RR-2025-001"
                date={new Date().toLocaleDateString()}
                tenantName="Adam Maverick"
                amount={1500000}
                period="Jan 1, 2025 - Dec 31, 2025"
                propertyAddress="Flat 4B, Lekki Phase 1, Lagos"
                landlordName="Perks Estate Management"
            />,
            outputPath
        );

        console.log('✅ PDF generated successfully!');
    } catch (error) {
        console.error('❌ Failed to generate PDF:', error);
        process.exit(1);
    }
}

generate();
