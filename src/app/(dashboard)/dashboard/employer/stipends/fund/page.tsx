'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getOrganizationEmployees, initiateFundingPayment } from '@/server/actions/stipends';

// Validation schema (Zod 4 compatible)
const fundingSchema = z.object({
    amountPerEmployee: z
        .number()
        .min(5000, 'Minimum amount is ₦5,000')
        .max(50000, 'Maximum amount is ₦50,000'),
});

type FundingFormData = z.infer<typeof fundingSchema>;

interface Employee {
    id: string;
    userId: string | null;
    email: string;
    firstName: string | null;
    lastName: string | null;
}

export default function StipendFundingPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<FundingFormData>({
        resolver: zodResolver(fundingSchema),
        defaultValues: {
            amountPerEmployee: 10000,
        },
    });

    const amountPerEmployee = watch('amountPerEmployee') || 0;
    const totalAmount = selectedEmployees.size * amountPerEmployee;

    // Fetch employees on mount
    useEffect(() => {
        async function fetchEmployees() {
            const result = await getOrganizationEmployees();
            if (result.success && result.data) {
                setEmployees(result.data);
            } else {
                toast.error(result.error || 'Failed to load employees');
            }
            setIsLoading(false);
        }
        fetchEmployees();
    }, []);

    // Toggle employee selection
    const toggleEmployee = useCallback((employeeId: string) => {
        setSelectedEmployees((prev) => {
            const next = new Set(prev);
            if (next.has(employeeId)) {
                next.delete(employeeId);
            } else {
                next.add(employeeId);
            }
            return next;
        });
    }, []);

    // Select all employees
    const selectAll = useCallback(() => {
        const eligibleEmployees = employees.filter((e) => e.userId !== null);
        setSelectedEmployees(new Set(eligibleEmployees.map((e) => e.id)));
    }, [employees]);

    // Deselect all employees
    const deselectAll = useCallback(() => {
        setSelectedEmployees(new Set());
    }, []);

    // Handle CSV upload
    const handleCsvUpload = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

            setCsvFile(file);
            const text = await file.text();
            const lines = text.split('\n').slice(1); // Skip header
            const emailsFromCsv = lines
                .map((line) => line.split(',')[0]?.trim().toLowerCase())
                .filter(Boolean);

            // Match emails to employees
            const matchedIds = employees
                .filter((e) => e.userId && emailsFromCsv.includes(e.email.toLowerCase()))
                .map((e) => e.id);

            setSelectedEmployees(new Set(matchedIds));
            toast.success(`Matched ${matchedIds.length} employees from CSV`);
        },
        [employees]
    );

    // Handle form submission
    const onSubmit = async (data: FundingFormData) => {
        if (selectedEmployees.size === 0) {
            toast.error('Please select at least one employee');
            return;
        }

        setIsSubmitting(true);

        try {
            // Convert to kobo
            const amountInKobo = data.amountPerEmployee * 100;
            const employeeIds = Array.from(selectedEmployees);

            const result = await initiateFundingPayment(employeeIds, amountInKobo);

            if (result.success && result.data) {
                // Redirect to Paystack
                window.location.href = result.data.authorizationUrl;
            } else {
                toast.error(result.error || 'Failed to initiate payment');
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error('Payment error:', error);
            toast.error('An unexpected error occurred');
            setIsSubmitting(false);
        }
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const eligibleEmployees = employees.filter((e) => e.userId !== null);

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-[#2563EB]">
                        Fund Employee Stipends
                    </CardTitle>
                    <CardDescription>
                        Select employees and enter an amount to fund their Perks wallets
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        {/* Amount Input */}
                        <div className="space-y-2">
                            <label htmlFor="amountPerEmployee" className="text-sm font-medium">
                                Amount per Employee (₦)
                            </label>
                            <input
                                id="amountPerEmployee"
                                type="number"
                                min={5000}
                                max={50000}
                                step={1000}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-lg"
                                placeholder="10,000"
                                {...register('amountPerEmployee', { valueAsNumber: true })}
                            />
                            {errors.amountPerEmployee && (
                                <p className="text-sm text-red-500">{errors.amountPerEmployee.message}</p>
                            )}
                            <p className="text-xs text-gray-500">
                                Min: ₦5,000 | Max: ₦50,000
                            </p>
                        </div>

                        {/* Employee Selection */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">
                                    Select Employees ({selectedEmployees.size} of {eligibleEmployees.length})
                                </label>
                                <div className="space-x-2">
                                    <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                                        Select All
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={deselectAll}
                                    >
                                        Deselect All
                                    </Button>
                                </div>
                            </div>

                            {/* CSV Upload */}
                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                                <label className="flex flex-col items-center cursor-pointer">
                                    <svg
                                        className="w-8 h-8 text-gray-400 mb-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                        />
                                    </svg>
                                    <span className="text-sm text-gray-600">
                                        {csvFile ? csvFile.name : 'Upload CSV to bulk select (email column)'}
                                    </span>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleCsvUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {/* Employee List */}
                            <div className="border rounded-lg max-h-64 overflow-y-auto">
                                {eligibleEmployees.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                        No eligible employees found. Employees must have linked accounts.
                                    </div>
                                ) : (
                                    eligibleEmployees.map((employee) => (
                                        <label
                                            key={employee.id}
                                            className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedEmployees.has(employee.id)}
                                                onChange={() => toggleEmployee(employee.id)}
                                                className="w-5 h-5 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
                                            />
                                            <div className="ml-3">
                                                <p className="font-medium">
                                                    {employee.firstName || employee.lastName
                                                        ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim()
                                                        : 'Unnamed Employee'}
                                                </p>
                                                <p className="text-sm text-gray-500">{employee.email}</p>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Preview Summary (AC: 3) */}
                        {selectedEmployees.size > 0 && amountPerEmployee > 0 && (
                            <div className="bg-[#F8F9FA] rounded-lg p-6 border-2 border-[#2563EB]">
                                <h3 className="font-semibold text-lg mb-3">Funding Summary</h3>
                                <div className="space-y-2 text-gray-700">
                                    <p>
                                        Fund <span className="font-bold">{selectedEmployees.size}</span>{' '}
                                        employees × <span className="font-bold">{formatCurrency(amountPerEmployee)}</span>
                                    </p>
                                    <p className="text-2xl font-bold text-[#2563EB]">
                                        Total: {formatCurrency(totalAmount)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isSubmitting || selectedEmployees.size === 0}
                            className="w-full py-6 text-lg bg-[#FA7921] hover:bg-[#e06d1d] text-white"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Processing...
                                </span>
                            ) : (
                                `Pay ${formatCurrency(totalAmount)} via Paystack`
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
