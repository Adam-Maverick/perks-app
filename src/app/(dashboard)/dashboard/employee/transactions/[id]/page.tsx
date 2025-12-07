import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { transactions, escrowHolds } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { EscrowStatusBadge } from "@/components/modules/escrow/EscrowStatusBadge";
import { TransactionActions } from "@/components/modules/escrow/TransactionActions";
import { format } from "date-fns";
import { ArrowLeft, Store, Calendar, CreditCard, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function TransactionPage({ params }: PageProps) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const { id } = await params;

    const transaction = await db.query.transactions.findFirst({
        where: eq(transactions.id, id),
        with: {
            merchant: true,
            deal: true,
            escrowHold: {
                with: {
                    disputes: true,
                },
            },
        },
    });

    if (!transaction) notFound();

    // Security check: Ensure user owns the transaction
    if (transaction.userId !== userId) {
        redirect("/dashboard/employee");
    }

    const amountInNaira = (transaction.amount / 100).toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
    });

    const escrowState = transaction.escrowHold?.state || null;
    const hold = transaction.escrowHold;
    // Get the most recent dispute if any exist
    const dispute = hold?.disputes && hold.disputes.length > 0 ? hold.disputes[0] : undefined;

    return (
        <div className="container max-w-2xl mx-auto py-8 px-4">
            <div className="mb-6">
                <Link href="/dashboard/employee/transactions">
                    <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Transactions
                    </Button>
                </Link>
            </div>

            <Card className="shadow-lg border-t-4 border-t-blue-600">
                <CardHeader className="space-y-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl font-outfit">Transaction Details</CardTitle>
                            <CardDescription>ID: {transaction.paystackReference || transaction.id}</CardDescription>
                        </div>
                        {escrowState && <EscrowStatusBadge status={escrowState} />}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Dispute Status Alert */}
                    {dispute && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start space-x-3">
                            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-orange-900">Dispute Filed</h3>
                                <p className="text-sm text-orange-800 mt-1">
                                    Status: <span className="font-medium">{dispute.status.replace(/_/g, " ")}</span>
                                </p>
                                <p className="text-xs text-orange-700 mt-2">
                                    We are reviewing your case. You will be notified of any updates.
                                </p>
                                {dispute.resolution && (
                                    <div className="mt-2 pt-2 border-t border-orange-200">
                                        <p className="text-sm font-medium text-orange-900">Resolution:</p>
                                        <p className="text-sm text-orange-800">{dispute.resolution}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Deal Info */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <h3 className="font-semibold text-gray-900 flex items-center">
                            <CreditCard className="mr-2 h-4 w-4 text-blue-600" />
                            Purchase Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Item</p>
                                <p className="font-medium">{transaction.description}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Amount</p>
                                <p className="font-medium text-lg text-gray-900">{amountInNaira}</p>
                            </div>
                        </div>
                    </div>

                    {/* Merchant Info */}
                    <div className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="bg-blue-100 p-3 rounded-full">
                            <Store className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Merchant</p>
                            <p className="font-semibold text-lg">{transaction.merchant?.name}</p>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-blue-600" />
                            Timeline
                        </h3>
                        <div className="text-sm border-l-2 border-gray-200 pl-4 space-y-4 ml-2">
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-gray-300"></div>
                                <p className="font-medium">Order Placed</p>
                                <p className="text-gray-500">{format(transaction.createdAt, "PPP p")}</p>
                            </div>

                            {transaction.escrowHold && (
                                <div className="relative">
                                    <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full ${escrowState === 'HELD' ? 'bg-orange-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                    <p className="font-medium">Funds Held in Escrow</p>
                                    <p className="text-gray-500">{format(transaction.escrowHold.heldAt, "PPP p")}</p>
                                </div>
                            )}

                            {dispute && (
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-orange-600"></div>
                                    <p className="font-medium text-orange-700">Dispute Filed</p>
                                    <p className="text-gray-500">{format(dispute.createdAt, "PPP p")}</p>
                                </div>
                            )}

                            {transaction.escrowHold?.releasedAt && (
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-green-500"></div>
                                    <p className="font-medium text-green-700">Funds Released</p>
                                    <p className="text-gray-500">{format(transaction.escrowHold.releasedAt, "PPP p")}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 bg-gray-50/50 pt-6">
                    <TransactionActions
                        transactionId={transaction.id}
                        escrowHoldId={transaction.escrowHoldId}
                        escrowState={escrowState}
                        isOwner={true}
                        hasDispute={!!dispute}
                    />

                    {escrowState === 'RELEASED' && transaction.status === 'auto_completed' && (
                        <div className="w-full bg-blue-50 border border-blue-200 rounded-md p-3 text-center">
                            <p className="text-sm text-blue-700 font-medium">
                                ⚡ Auto-Completed: 14-day escrow period ended.
                            </p>
                        </div>
                    )}

                    {escrowState === 'RELEASED' && transaction.status !== 'auto_completed' && (
                        <p className="text-center text-sm text-green-600 font-medium">
                            ✓ Delivery confirmed. Transaction complete.
                        </p>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
