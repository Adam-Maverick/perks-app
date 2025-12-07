import * as React from "react";

interface EscrowAutoReleasedEmailProps {
    employeeName: string;
    merchantName: string;
    amount: number;
    transactionId: string;
    transactionUrl: string;
}

export default function EscrowAutoReleasedEmail({
    employeeName,
    merchantName,
    amount,
    transactionId,
    transactionUrl,
}: EscrowAutoReleasedEmailProps) {
    const amountInNaira = (amount / 100).toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
    });

    return (
        <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
            <div style={{ backgroundColor: "#2563EB", padding: "20px", textAlign: "center" }}>
                <h1 style={{ color: "white", margin: 0 }}>Transaction Auto-Completed</h1>
            </div>

            <div style={{ padding: "30px", backgroundColor: "#f9fafb" }}>
                <p style={{ fontSize: "16px", lineHeight: "1.6" }}>
                    Hello {employeeName},
                </p>

                <p style={{ fontSize: "16px", lineHeight: "1.6" }}>
                    Your transaction with <strong>{merchantName}</strong> has been automatically completed as the 14-day escrow period has ended.
                </p>

                <div style={{
                    backgroundColor: "white",
                    padding: "20px",
                    borderRadius: "8px",
                    margin: "20px 0",
                    border: "1px solid #e5e7eb"
                }}>
                    <h2 style={{ color: "#1f2937", fontSize: "18px", marginTop: 0 }}>
                        Transaction Summary
                    </h2>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: "8px 0", color: "#6b7280" }}>Merchant:</td>
                                <td style={{ padding: "8px 0", fontWeight: "bold", textAlign: "right" }}>
                                    {merchantName}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: "8px 0", color: "#6b7280" }}>Amount:</td>
                                <td style={{ padding: "8px 0", fontWeight: "bold", textAlign: "right" }}>
                                    {amountInNaira}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: "8px 0", color: "#6b7280" }}>Transaction ID:</td>
                                <td style={{ padding: "8px 0", fontWeight: "bold", textAlign: "right" }}>
                                    {transactionId}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{
                    backgroundColor: "#D1FAE5",
                    padding: "15px",
                    borderRadius: "8px",
                    margin: "20px 0",
                    borderLeft: "4px solid #059669"
                }}>
                    <p style={{ margin: 0, fontSize: "14px", color: "#065F46" }}>
                        <strong>✅ Payment Released</strong><br />
                        We have released the funds to the merchant. No further action is needed from you.
                    </p>
                </div>

                <div style={{ textAlign: "center", margin: "30px 0" }}>
                    <a href={transactionUrl} style={{
                        backgroundColor: "#2563EB",
                        color: "white",
                        padding: "12px 24px",
                        borderRadius: "6px",
                        textDecoration: "none",
                        fontWeight: "bold",
                        display: "inline-block"
                    }}>
                        View Transaction
                    </a>
                </div>

                <p style={{ fontSize: "14px", color: "#6b7280" }}>
                    Best regards,<br />
                    <strong>The Stipends Team</strong>
                </p>
            </div>

            <div style={{
                backgroundColor: "#1f2937",
                padding: "20px",
                textAlign: "center",
                fontSize: "12px",
                color: "#9ca3af"
            }}>
                <p style={{ margin: 0 }}>
                    © 2025 Stipends. All rights reserved.
                </p>
            </div>
        </div>
    );
}
