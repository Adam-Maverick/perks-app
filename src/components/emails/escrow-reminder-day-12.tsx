import * as React from "react";

interface EscrowReminderDay12EmailProps {
    employeeName: string;
    merchantName: string;
    amount: number;
    transactionId: string;
    transactionUrl: string;
}

export default function EscrowReminderDay12Email({
    employeeName,
    merchantName,
    amount,
    transactionId,
    transactionUrl,
}: EscrowReminderDay12EmailProps) {
    const amountInNaira = (amount / 100).toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
    });

    return (
        <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
            <div style={{ backgroundColor: "#DC2626", padding: "20px", textAlign: "center" }}>
                <h1 style={{ color: "white", margin: 0 }}>Final Reminder: Confirm Delivery</h1>
            </div>

            <div style={{ padding: "30px", backgroundColor: "#f9fafb" }}>
                <p style={{ fontSize: "16px", lineHeight: "1.6" }}>
                    Hello {employeeName},
                </p>

                <p style={{ fontSize: "16px", lineHeight: "1.6" }}>
                    This is your <strong>final reminder</strong> to confirm your delivery from <strong>{merchantName}</strong>.
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
                    backgroundColor: "#FEE2E2",
                    padding: "15px",
                    borderRadius: "8px",
                    margin: "20px 0",
                    borderLeft: "4px solid #B91C1C"
                }}>
                    <p style={{ margin: 0, fontSize: "14px", color: "#7F1D1D" }}>
                        <strong>⚠️ 2 Days Remaining</strong><br />
                        You have only 2 days left! If you do not report an issue by Day 14, funds will be automatically released to the merchant and this action cannot be undone.
                    </p>
                </div>

                <div style={{ textAlign: "center", margin: "30px 0" }}>
                    <a href={transactionUrl} style={{
                        backgroundColor: "#DC2626",
                        color: "white",
                        padding: "12px 24px",
                        borderRadius: "6px",
                        textDecoration: "none",
                        fontWeight: "bold",
                        display: "inline-block"
                    }}>
                        Confirm Delivery Immediately
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
                <p style={{ margin: 0, lineHeight: "1.5" }}>
                    © 2025 Stipends. All rights reserved.
                </p>
            </div>
        </div>
    );
}
