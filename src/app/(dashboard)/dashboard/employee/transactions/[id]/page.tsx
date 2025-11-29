import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { transactions, escrowHolds } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { EscrowStatusBadge } from "@/components/modules/escrow/EscrowStatusBadge";
import { TransactionActions } from "@/components/modules/escrow/TransactionActions";
import { format } from "date-fns";
import { ArrowLeft, Store, Calendar, CreditCard } from "lucide-react";
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
            escrowHold: true,
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
                    />

                    {escrowState === 'RELEASED' && (
                        <p className="text-center text-sm text-green-600 font-medium">
                            ✓ Delivery confirmed. Transaction complete.
                        </p>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
