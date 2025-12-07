'use client';

import { useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateRentReceipt } from '@/server/actions/generateRentReceipt';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

// Form validation schema - amounts in Naira (UI converts to kobo)
const formSchema = z.object({
    landlordName: z.string().min(1, 'Landlord name is required').max(200),
    propertyAddress: z.string().min(1, 'Property address is required').max(500),
    rentAmount: z.string()
        .min(1, 'Rent amount is required')
        .refine((val) => {
            const num = Number(val.replace(/,/g, ''));
            return !isNaN(num) && num >= 50000 && num <= 5000000;
        }, 'Amount must be between ₦50,000 and ₦5,000,000'),
    paymentDate: z.string().min(1, 'Payment date is required'),
});

type FormData = z.infer<typeof formSchema>;

export default function RentReceiptPage() {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ pdfUrl?: string; error?: string } | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            landlordName: '',
            propertyAddress: '',
            rentAmount: '',
            paymentDate: new Date().toISOString().split('T')[0],
        },
    });

    const onSubmit = (data: FormData) => {
        setResult(null);
        startTransition(async () => {
            const response = await generateRentReceipt({
                landlordName: data.landlordName,
                propertyAddress: data.propertyAddress,
                rentAmount: Number(data.rentAmount.replace(/,/g, '')) * 100, // Convert Naira to kobo
                paymentDate: data.paymentDate,
            });

            if (response.success && response.data) {
                setResult({ pdfUrl: response.data.pdfUrl });
                reset();
            } else {
                setResult({ error: response.error || 'Failed to generate receipt' });
            }
        });
    };

    return (
        <div className="container mx-auto max-w-2xl py-8 px-4">
            <div className="mb-6">
                <Link href="/dashboard/employee" className="text-sm text-gray-500 hover:text-gray-700">
                    ← Back to Dashboard
                </Link>
                <h1 className="text-2xl font-bold mt-2">Rent Receipt Generator</h1>
                <p className="text-gray-600 mt-1">
                    Generate official rent receipts for tax relief under Nigeria Tax Act 2025.
                </p>
            </div>

            {/* Success Message */}
            {result?.pdfUrl && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">✅ Receipt generated successfully!</p>
                    <a
                        href={result.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                        Download PDF
                    </a>
                </div>
            )}

            {/* Error Message */}
            {result?.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800">{result.error}</p>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
                <div>
                    <label htmlFor="landlordName" className="block text-sm font-medium text-gray-700 mb-1">
                        Landlord / Property Manager Name
                    </label>
                    <input
                        {...register('landlordName')}
                        type="text"
                        id="landlordName"
                        placeholder="e.g., John Doe Estates"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                    />
                    {errors.landlordName && (
                        <p className="mt-1 text-sm text-red-600">{errors.landlordName.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="propertyAddress" className="block text-sm font-medium text-gray-700 mb-1">
                        Property Address
                    </label>
                    <textarea
                        {...register('propertyAddress')}
                        id="propertyAddress"
                        rows={2}
                        placeholder="e.g., Flat 4B, Block C, Lekki Phase 1, Lagos"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                    />
                    {errors.propertyAddress && (
                        <p className="mt-1 text-sm text-red-600">{errors.propertyAddress.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="rentAmount" className="block text-sm font-medium text-gray-700 mb-1">
                        Rent Amount (₦)
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">₦</span>
                        <input
                            {...register('rentAmount')}
                            type="text"
                            id="rentAmount"
                            placeholder="150,000"
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                        />
                    </div>
                    {errors.rentAmount && (
                        <p className="mt-1 text-sm text-red-600">{errors.rentAmount.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Min: ₦50,000 | Max: ₦5,000,000</p>
                </div>

                <div>
                    <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Date
                    </label>
                    <input
                        {...register('paymentDate')}
                        type="date"
                        id="paymentDate"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                    />
                    {errors.paymentDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.paymentDate.message}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3 px-4 bg-lime-600 text-white font-medium rounded-md hover:bg-lime-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isPending ? 'Generating...' : 'Generate Rent Receipt'}
                </button>
            </form>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">📋 About Rent Receipts</h3>
                <p className="text-sm text-blue-700">
                    Under the Nigeria Tax Act 2025, you can claim tax relief on rent payments.
                    This receipt is FIRS-compliant and can be used as proof of payment for your tax filings.
                </p>
            </div>
        </div>
    );
}
