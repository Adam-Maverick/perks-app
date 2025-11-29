"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDeliveryModal } from "./ConfirmDeliveryModal";
import { confirmDelivery } from "@/server/actions/escrow";
import { EscrowState } from "@/lib/escrow-state-machine";

interface TransactionActionsProps {
    transactionId: string;
    escrowHoldId: string | null;
    escrowState: EscrowState | null;
    isOwner: boolean;
    hasDispute?: boolean;
}

export function TransactionActions({
    transactionId,
    escrowHoldId,
    escrowState,
    isOwner,
    hasDispute = false,
}: TransactionActionsProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOwner) return null;

    // If there's a dispute, we don't show actions (status is shown in page)
    if (hasDispute) return null;

    // Only show buttons if escrow is HELD
    if (escrowState !== "HELD" || !escrowHoldId) {
        return null;
    }

    const handleConfirm = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await confirmDelivery(escrowHoldId);
            if (result.success) {
                // Success handled by Modal animation, then close
                // We wait for modal to close before refreshing
                setTimeout(() => {
                    router.refresh();
                }, 2000);
            } else {
                setError(result.error || "Failed to confirm delivery.");
                setIsLoading(false); // Stop loading so user can retry or see error
            }
        } catch (e) {
            setError("An unexpected error occurred.");
            setIsLoading(false);
        }
    };

    const handleReportIssue = () => {
        router.push(`/dashboard/employee/transactions/${transactionId}/dispute`);
    };

    return (
        <>
            <div className="flex flex-col gap-3 w-full">
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all"
                >
                    Confirm Delivery
                </Button>

                <Button
                    variant="outline"
                    onClick={handleReportIssue}
                    className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                >
                    Report Issue
                </Button>

                {error && (
                    <p className="text-sm text-red-600 text-center">{error}</p>
                )}
            </div>

            <ConfirmDeliveryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirm}
                onReportIssue={handleReportIssue}
                isLoading={isLoading}
            />
        </>
    );
}
