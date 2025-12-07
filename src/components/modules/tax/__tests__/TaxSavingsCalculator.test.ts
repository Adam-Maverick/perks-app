import { calculateTaxSavings } from '../TaxSavingsCalculator';

describe('calculateTaxSavings', () => {
    describe('formula correctness', () => {
        it('calculates monthly cost correctly', () => {
            const result = calculateTaxSavings(100, 10000);
            expect(result.monthlyCost).toBe(100 * 10000); // 1,000,000
        });

        it('calculates annual cost correctly', () => {
            const result = calculateTaxSavings(100, 10000);
            expect(result.annualCost).toBe(100 * 10000 * 12); // 12,000,000
        });

        it('calculates annual savings using formula: (employees × stipend × 12) × 1.5 × 0.30', () => {
            const result = calculateTaxSavings(100, 10000);
            const expected = (100 * 10000 * 12) * 1.5 * 0.30; // 5,400,000
            expect(result.annualSavings).toBe(expected);
        });

        it('calculates net cost as annualCost - annualSavings', () => {
            const result = calculateTaxSavings(100, 10000);
            expect(result.netCost).toBe(result.annualCost - result.annualSavings);
        });

        it('costWithoutStipends equals annualCost', () => {
            const result = calculateTaxSavings(100, 10000);
            expect(result.costWithoutStipends).toBe(result.annualCost);
        });
    });

    describe('boundary values - employees', () => {
        it('handles minimum employees (10)', () => {
            const result = calculateTaxSavings(10, 10000);
            expect(result.monthlyCost).toBe(100000);
            expect(result.annualSavings).toBe((10 * 10000 * 12) * 1.5 * 0.30);
        });

        it('handles maximum employees (10000)', () => {
            const result = calculateTaxSavings(10000, 10000);
            expect(result.monthlyCost).toBe(100000000);
            expect(result.annualSavings).toBe((10000 * 10000 * 12) * 1.5 * 0.30);
        });
    });

    describe('boundary values - stipend', () => {
        it('handles minimum stipend (5000)', () => {
            const result = calculateTaxSavings(100, 5000);
            expect(result.monthlyCost).toBe(500000);
            expect(result.annualSavings).toBe((100 * 5000 * 12) * 1.5 * 0.30);
        });

        it('handles maximum stipend (50000)', () => {
            const result = calculateTaxSavings(100, 50000);
            expect(result.monthlyCost).toBe(5000000);
            expect(result.annualSavings).toBe((100 * 50000 * 12) * 1.5 * 0.30);
        });
    });

    describe('edge cases', () => {
        it('handles minimum boundary combination (10 employees, 5000 stipend)', () => {
            const result = calculateTaxSavings(10, 5000);
            expect(result.monthlyCost).toBe(50000);
            expect(result.annualCost).toBe(600000);
            expect(result.annualSavings).toBe(270000); // 600000 * 1.5 * 0.30
            expect(result.netCost).toBe(330000); // 600000 - 270000
        });

        it('handles maximum boundary combination (10000 employees, 50000 stipend)', () => {
            const result = calculateTaxSavings(10000, 50000);
            expect(result.monthlyCost).toBe(500000000);
            expect(result.annualCost).toBe(6000000000);
            expect(result.annualSavings).toBe(2700000000); // 6B * 1.5 * 0.30
            expect(result.netCost).toBe(3300000000); // 6B - 2.7B
        });

        it('savings represent 45% of annual cost (1.5 * 0.30 = 0.45)', () => {
            const result = calculateTaxSavings(100, 10000);
            const savingsRatio = result.annualSavings / result.annualCost;
            expect(savingsRatio).toBeCloseTo(0.45, 10);
        });
    });

    describe('calculation verification', () => {
        it('net cost is always 55% of annual cost', () => {
            const result = calculateTaxSavings(250, 25000);
            const netRatio = result.netCost / result.annualCost;
            expect(netRatio).toBeCloseTo(0.55, 10);
        });

        it('total of netCost and annualSavings equals annualCost', () => {
            const result = calculateTaxSavings(500, 20000);
            expect(result.netCost + result.annualSavings).toBe(result.annualCost);
        });
    });
});
