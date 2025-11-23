"use client";

import { useState } from "react";
import { transferEmployer } from "@/server/actions/transfer-employer";
import { useRouter } from "next/navigation";

export default function TransferPage() {
    const router = useRouter();
    const [invitationCode, setInvitationCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!invitationCode.trim()) {
            setError("Please enter an invitation code");
            return;
        }

        setShowConfirmModal(true);
    };

    const handleConfirmTransfer = async () => {
        setIsLoading(true);
        setError("");
        setShowConfirmModal(false);

        try {
            const result = await transferEmployer(invitationCode);

            if (result.success) {
                // Show success message and redirect
                alert(`Transfer successful! You are now with ${result.data?.newEmployerName}`);
                router.push("/dashboard/employee");
                router.refresh();
            } else {
                setError(result.error || "Transfer failed");
                setIsLoading(false);
            }
        } catch (err) {
            console.error("Transfer error:", err);
            setError("An unexpected error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px" }}>
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: "32px", color: "#2563EB", marginBottom: "8px" }}>
                Transfer to New Employer
            </h1>
            <p style={{ color: "#666", marginBottom: "32px" }}>
                If you've changed jobs, you can transfer your Perks App account to your new employer. Your transaction history and wallet balance will be preserved.
            </p>

            <div style={{ backgroundColor: "#FEF3C7", border: "1px solid #F59E0B", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
                <p style={{ margin: 0, fontSize: "14px", color: "#92400E" }}>
                    ⚠️ <strong>Important:</strong> This action will unlink your account from your current employer and link it to your new employer. Make sure you have the correct invitation code from your new employer.
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "24px" }}>
                    <label htmlFor="invitationCode" style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#374151" }}>
                        Invitation Code from New Employer
                    </label>
                    <input
                        type="text"
                        id="invitationCode"
                        value={invitationCode}
                        onChange={(e) => setInvitationCode(e.target.value)}
                        placeholder="Enter invitation code"
                        disabled={isLoading}
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #D1D5DB",
                            borderRadius: "6px",
                            fontSize: "16px",
                            fontFamily: "Inter, sans-serif",
                        }}
                    />
                </div>

                {error && (
                    <div style={{ backgroundColor: "#FEE2E2", border: "1px solid #EF4444", borderRadius: "8px", padding: "12px", marginBottom: "24px" }}>
                        <p style={{ margin: 0, fontSize: "14px", color: "#991B1B" }}>
                            ❌ {error}
                        </p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        backgroundColor: isLoading ? "#9CA3AF" : "#2563EB",
                        color: "white",
                        padding: "12px 24px",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "16px",
                        fontWeight: "600",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        width: "100%",
                    }}
                >
                    {isLoading ? "Processing..." : "Transfer Account"}
                </button>
            </form>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                }}>
                    <div style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "24px",
                        maxWidth: "400px",
                        width: "90%",
                    }}>
                        <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "24px", marginBottom: "16px" }}>
                            Confirm Transfer
                        </h2>
                        <p style={{ marginBottom: "24px", color: "#666" }}>
                            Are you sure you want to transfer your account to your new employer? This action cannot be undone.
                        </p>
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                style={{
                                    flex: 1,
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #D1D5DB",
                                    backgroundColor: "white",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmTransfer}
                                style={{
                                    flex: 1,
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: "none",
                                    backgroundColor: "#2563EB",
                                    color: "white",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                }}
                            >
                                Confirm Transfer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
