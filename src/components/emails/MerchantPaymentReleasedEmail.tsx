import * as React from "react";

interface MerchantPaymentReleasedEmailProps {
    merchantName: string;
    amount: number;
    transactionId: string;
    customerName: string;
}

export default function MerchantPaymentReleasedEmail({
    merchantName,
    amount,
    transactionId,
    customerName,
}: MerchantPaymentReleasedEmailProps) {
    const amountInNaira = (amount / 100).toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
    });

    return (
        <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
            <div style={{ backgroundColor: "#059669", padding: "20px", textAlign: "center" }}>
                <h1 style={{ color: "white", margin: 0 }}>Payment Released!</h1>
            </div>

            <div style={{ padding: "30px", backgroundColor: "#f9fafb" }}>
                <p style={{ fontSize: "16px", lineHeight: "1.6" }}>
                    Hello {merchantName},
                </p>

                <p style={{ fontSize: "16px", lineHeight: "1.6" }}>
                    Great news! The customer, <strong>{customerName}</strong>, has confirmed delivery of their order.
                </p>

                <div style={{
                    backgroundColor: "white",
                    padding: "20px",
                    borderRadius: "8px",
                    margin: "20px 0",
                    border: "1px solid #e5e7eb"
                }}>
                    <h2 style={{ color: "#1f2937", fontSize: "18px", marginTop: 0 }}>
                        Payment Details
                    </h2>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: "8px 0", color: "#6b7280" }}>Amount Released:</td>
                                <td style={{ padding: "8px 0", fontWeight: "bold", textAlign: "right", color: "#059669" }}>
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
                    backgroundColor: "#ECFDF5",
                    padding: "15px",
                    borderRadius: "8px",
                    margin: "20px 0",
                    borderLeft: "4px solid #059669"
                }}>
                    <p style={{ margin: 0, fontSize: "14px", color: "#065F46" }}>
                        <strong>💰 Funds Transferred</strong><br />
                        We have initiated the transfer to your registered bank account.
                        Please allow up to <strong>24 hours</strong> for the funds to reflect in your account.
                    </p>
                </div>

                <p style={{ fontSize: "14px", color: "#6b7280" }}>
                    If you have any questions, please contact our support team.
                </p>

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
