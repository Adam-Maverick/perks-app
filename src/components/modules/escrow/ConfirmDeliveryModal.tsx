"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDeliveryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    onReportIssue: () => void;
    isLoading?: boolean;
}

export function ConfirmDeliveryModal({
    isOpen,
    onClose,
    onConfirm,
    onReportIssue,
    isLoading = false,
}: ConfirmDeliveryModalProps) {
    const [isSuccess, setIsSuccess] = useState(false);

    const handleConfirm = async () => {
        try {
            await onConfirm();
            setIsSuccess(true);
            // Close after animation
            setTimeout(() => {
                setIsSuccess(false);
                onClose();
            }, 2000);
        } catch (error) {
            console.error("Confirmation failed", error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isLoading && !isSuccess && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-outfit text-center">
                        {isSuccess ? "Payment Released!" : "Confirm Delivery?"}
                    </DialogTitle>
                    <DialogDescription className="text-center text-base pt-2">
                        {isSuccess
                            ? "Thank you! The merchant has been paid."
                            : "Did you receive your order as expected?"
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center py-6">
                    {isSuccess ? (
                        <div className="animate-in zoom-in duration-500">
                            <ShieldCheck className="h-24 w-24 text-green-500" />
                        </div>
                    ) : (
                        <div className="bg-blue-50 p-6 rounded-full">
                            <ShieldCheck className="h-16 w-16 text-blue-600" />
                        </div>
                    )}
                </div>

                {!isSuccess && (
                    <DialogFooter className="flex-col gap-3 sm:flex-col sm:space-x-0">
                        <Button
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-lg h-12"
                        >
                            {isLoading ? "Processing..." : "Yes, release payment"}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={onReportIssue}
                            disabled={isLoading}
                            className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                        >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            No, report issue
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={isLoading}
                            className="w-full text-gray-500"
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
