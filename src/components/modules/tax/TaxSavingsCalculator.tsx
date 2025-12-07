'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CalculationResults {
    monthlyCost: number;
    annualCost: number;
    annualSavings: number;
    netCost: number;
    costWithoutStipends: number;
}

// Format Naira with thousands separators
function formatNaira(amount: number): string {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Calculate tax savings per formula in story requirements
export function calculateTaxSavings(employees: number, stipendPerMonth: number): CalculationResults {
    const monthlyCost = employees * stipendPerMonth;
    const annualCost = monthlyCost * 12;
    // Formula: (employees × stipend × 12) × 1.5 × 0.30
    const annualSavings = annualCost * 1.5 * 0.30;
    const netCost = annualCost - annualSavings;
    // Cost without stipends = same expenditure taxed normally (no 150% deduction benefit)
    const costWithoutStipends = annualCost;

    return {
        monthlyCost,
        annualCost,
        annualSavings,
        netCost,
        costWithoutStipends,
    };
}

interface AnimatedCounterProps {
    value: number;
    prefix?: string;
    className?: string;
}

function AnimatedCounter({ value, prefix = '₦', className }: AnimatedCounterProps) {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        duration: prefersReducedMotion ? 0 : 1500,
        bounce: 0
    });
    const displayValue = useTransform(springValue, (latest: number) =>
        `${prefix}${Math.round(latest).toLocaleString('en-NG')}`
    );

    useEffect(() => {
        motionValue.set(value);
    }, [value, motionValue]);

    return (
        <motion.span
            className={className}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {displayValue}
        </motion.span>
    );
}

export default function TaxSavingsCalculator() {
    const [employees, setEmployees] = useState(100);
    const [stipend, setStipend] = useState(15000);
    const [showTooltip, setShowTooltip] = useState(false);

    // Bounds per AC1
    const MIN_EMPLOYEES = 10;
    const MAX_EMPLOYEES = 10000;
    const MIN_STIPEND = 5000;
    const MAX_STIPEND = 50000;

    // Clamp values within bounds
    const clampEmployees = (value: number) => Math.min(Math.max(value, MIN_EMPLOYEES), MAX_EMPLOYEES);
    const clampStipend = (value: number) => Math.min(Math.max(value, MIN_STIPEND), MAX_STIPEND);

    // Calculate results reactively
    const results = useMemo(() => {
        return calculateTaxSavings(employees, stipend);
    }, [employees, stipend]);

    const handleEmployeesChange = (value: string) => {
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed)) {
            setEmployees(clampEmployees(parsed));
        }
    };

    const handleStipendChange = (value: string) => {
        const parsed = parseInt(value.replace(/[₦,]/g, ''), 10);
        if (!isNaN(parsed)) {
            setStipend(clampStipend(parsed));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-soft-light-grey to-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="font-outfit text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                        Tax Savings Calculator
                    </h1>
                    <p className="font-inter text-lg text-gray-600 max-w-2xl mx-auto">
                        See how much your company can save with employee welfare stipends under Nigeria's 150% tax deduction benefit.
                    </p>
                </div>

                {/* Calculator Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8">
                    {/* Input Section */}
                    <div className="grid md:grid-cols-2 gap-8 mb-10">
                        {/* Number of Employees */}
                        <div className="space-y-4">
                            <label htmlFor="employees" className="block font-outfit text-lg font-semibold text-gray-900">
                                Number of Employees
                            </label>
                            <div className="space-y-3">
                                <input
                                    type="range"
                                    id="employees-slider"
                                    min={MIN_EMPLOYEES}
                                    max={MAX_EMPLOYEES}
                                    value={employees}
                                    onChange={(e) => setEmployees(parseInt(e.target.value, 10))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-electric-royal-blue"
                                />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        id="employees"
                                        min={MIN_EMPLOYEES}
                                        max={MAX_EMPLOYEES}
                                        value={employees}
                                        onChange={(e) => handleEmployeesChange(e.target.value)}
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-inter text-lg focus:ring-2 focus:ring-electric-royal-blue focus:border-transparent"
                                    />
                                    <span className="font-inter text-gray-500">employees</span>
                                </div>
                                <div className="flex justify-between font-inter text-xs text-gray-400">
                                    <span>{MIN_EMPLOYEES.toLocaleString()}</span>
                                    <span>{MAX_EMPLOYEES.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Average Stipend */}
                        <div className="space-y-4">
                            <label htmlFor="stipend" className="block font-outfit text-lg font-semibold text-gray-900">
                                Average Stipend per Employee
                            </label>
                            <div className="space-y-3">
                                <input
                                    type="range"
                                    id="stipend-slider"
                                    min={MIN_STIPEND}
                                    max={MAX_STIPEND}
                                    step={1000}
                                    value={stipend}
                                    onChange={(e) => setStipend(parseInt(e.target.value, 10))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-electric-royal-blue"
                                />
                                <div className="flex items-center gap-2">
                                    <span className="font-inter text-lg text-gray-500">₦</span>
                                    <input
                                        type="number"
                                        id="stipend"
                                        min={MIN_STIPEND}
                                        max={MAX_STIPEND}
                                        value={stipend}
                                        onChange={(e) => handleStipendChange(e.target.value)}
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-inter text-lg focus:ring-2 focus:ring-electric-royal-blue focus:border-transparent"
                                    />
                                    <span className="font-inter text-gray-500">/month</span>
                                </div>
                                <div className="flex justify-between font-inter text-xs text-gray-400">
                                    <span>{formatNaira(MIN_STIPEND)}</span>
                                    <span>{formatNaira(MAX_STIPEND)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="border-t border-gray-200 pt-8">
                        <div className="grid sm:grid-cols-3 gap-6 mb-8">
                            {/* Monthly Cost */}
                            <div className="bg-soft-light-grey rounded-xl p-4 text-center">
                                <p className="font-inter text-sm text-gray-500 mb-1">Monthly Stipend Cost</p>
                                <p className="font-outfit text-2xl font-bold text-gray-900">
                                    <AnimatedCounter value={results.monthlyCost} />
                                </p>
                            </div>

                            {/* Annual Savings */}
                            <div className="bg-electric-lime/10 rounded-xl p-4 text-center relative">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <p className="font-inter text-sm text-gray-500">Annual Tax Savings</p>
                                    <button
                                        onClick={() => setShowTooltip(!showTooltip)}
                                        className="text-gray-400 hover:text-gray-600 text-xs"
                                        aria-label="Explain tax savings calculation"
                                    >
                                        ⓘ
                                    </button>
                                </div>
                                <p className="font-outfit text-2xl font-bold text-electric-lime">
                                    <AnimatedCounter value={results.annualSavings} />
                                </p>
                                {/* Tooltip */}
                                {showTooltip && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 max-w-xs whitespace-normal"
                                    >
                                        <p className="font-inter">
                                            Under Nigeria's tax law, employers can claim 150% tax deduction on employee welfare stipends.
                                            Savings = Annual Cost × 1.5 × 30% (corporate tax rate).
                                        </p>
                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Net Annual Cost */}
                            <div className="bg-soft-light-grey rounded-xl p-4 text-center">
                                <p className="font-inter text-sm text-gray-500 mb-1">Net Annual Cost</p>
                                <p className="font-outfit text-2xl font-bold text-gray-900">
                                    <AnimatedCounter value={results.netCost} />
                                </p>
                            </div>
                        </div>

                        {/* Comparison Display - AC3 */}
                        <div className="bg-gradient-to-r from-gray-100 to-electric-lime/10 rounded-xl p-6 mb-8">
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center">
                                <div>
                                    <p className="font-inter text-sm text-gray-500 mb-1">Without Stipends</p>
                                    <p className="font-outfit text-xl font-bold text-gray-900">
                                        {formatNaira(results.costWithoutStipends)} cost
                                    </p>
                                </div>
                                <div className="hidden sm:block text-2xl text-gray-400">→</div>
                                <div className="sm:hidden text-2xl text-gray-400">↓</div>
                                <div>
                                    <p className="font-inter text-sm text-gray-500 mb-1">With Stipends</p>
                                    <p className="font-outfit text-xl font-bold text-gray-900">
                                        {formatNaira(results.netCost)} cost
                                    </p>
                                </div>
                                <div className="bg-electric-lime/20 px-4 py-2 rounded-full">
                                    <p className="font-outfit text-lg font-bold text-electric-lime">
                                        {formatNaira(results.annualSavings)} saved!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* CTA Button - AC4 */}
                        <div className="text-center">
                            <Button
                                asChild
                                size="lg"
                                className="bg-vibrant-coral hover:bg-vibrant-coral/90 text-white font-outfit font-semibold text-lg px-8 py-4 h-auto rounded-full shadow-lg hover:shadow-xl transition-all"
                            >
                                <Link href="/">
                                    Get Started →
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Social Proof - AC6 */}
                <div className="text-center">
                    <p className="font-inter text-gray-600 text-lg">
                        <span className="font-semibold">Join 50+ employers</span> saving millions in taxes
                    </p>
                </div>
            </div>
        </div>
    );
}
