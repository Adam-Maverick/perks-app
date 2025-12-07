import type { Metadata } from 'next';
import TaxSavingsCalculator from '@/components/modules/tax/TaxSavingsCalculator';

export const metadata: Metadata = {
    title: 'Tax Savings Calculator | Stipends - Financial Wellness Platform',
    description: 'Calculate your potential tax savings with employee welfare stipends. See how Nigeria\'s 150% tax deduction benefit can save your company millions annually.',
    openGraph: {
        title: 'Tax Savings Calculator | Stipends',
        description: 'Calculate your potential tax savings with employee welfare stipends under Nigeria\'s 150% tax deduction benefit.',
        type: 'website',
    },
};

export default function TaxCalculatorPage() {
    return <TaxSavingsCalculator />;
}
