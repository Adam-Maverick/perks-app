'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { verifyAndFundStipends } from '@/server/actions/stipends';

function CallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [fundedCount, setFundedCount] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');

    const reference = searchParams.get('reference') || searchParams.get('trxref');

    useEffect(() => {
        if (!reference) {
            setStatus('error');
            setErrorMessage('Missing payment reference');
            return;
        }

        async function verifyPayment() {
            const result = await verifyAndFundStipends(reference!);

            if (result.success && result.data) {
                setFundedCount(result.data.fundedCount);
                setStatus('success');
            } else {
                setStatus('error');
                setErrorMessage(result.error || 'Verification failed');
            }
        }

        verifyPayment();
    }, [reference]);

    if (status === 'verifying') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-8 text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#2563EB] mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold mb-2">Verifying Payment...</h2>
                        <p className="text-gray-500">
                            Please wait while we confirm your payment and fund employee wallets.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="text-6xl mb-4">🎉</div>
                        <CardTitle className="text-2xl text-[#2563EB]">Funding Successful!</CardTitle>
                        <CardDescription>
                            {fundedCount > 0
                                ? `Successfully funded ${fundedCount} employee wallet${fundedCount > 1 ? 's' : ''}`
                                : 'Payment was already processed'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-[#96E072] bg-opacity-20 rounded-lg p-4 text-center">
                            <p className="text-sm text-gray-700">
                                ✅ Employees have been notified via email
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => router.push('/dashboard/employer/stipends/fund')}
                            >
                                Fund More
                            </Button>
                            <Button
                                className="flex-1 bg-[#2563EB]"
                                onClick={() => router.push('/dashboard/employer')}
                            >
                                Dashboard
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <CardTitle className="text-2xl text-red-600">Payment Failed</CardTitle>
                    <CardDescription>
                        {errorMessage || 'We could not verify your payment'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => router.push('/dashboard/employer/stipends/fund')}
                        >
                            Try Again
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={() => router.push('/dashboard/employer')}
                        >
                            Dashboard
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function FundingCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-8 text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#2563EB] mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold mb-2">Loading...</h2>
                    </CardContent>
                </Card>
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}

