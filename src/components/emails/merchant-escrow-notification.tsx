import * as React from "react";

interface MerchantEscrowNotificationProps {
    merchantName: string;
    amount: number;
    orderId: string;
    releaseDate: string;
}

export default function MerchantEscrowNotification({
    merchantName,
    amount,
    orderId,
    releaseDate,
}: MerchantEscrowNotificationProps) {
    // Convert amount from kobo to naira
    const amountInNaira = (amount / 100).toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
    });

    return (
        <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
            <div style={{ backgroundColor: "#2563EB", padding: "20px", textAlign: "center" }}>
                <h1 style={{ color: "white", margin: 0 }}>Payment Received</h1>
            </div>

            <div style={{ padding: "30px", backgroundColor: "#f9fafb" }}>
                <p style={{ fontSize: "16px", lineHeight: "1.6" }}>
                    Hello {merchantName},
                </p>

                <p style={{ fontSize: "16px", lineHeight: "1.6" }}>
                    We're writing to confirm that payment has been received for your order.
                </p>

                <div style={{
                    backgroundColor: "white",
                    padding: "20px",
                    borderRadius: "8px",
                    margin: "20px 0",
                    border: "1px solid #e5e7eb"
                }}>
                    <h2 style={{ color: "#1f2937", fontSize: "18px", marginTop: 0 }}>
                        Transaction Details
                    </h2>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: "8px 0", color: "#6b7280" }}>Order ID:</td>
                                <td style={{ padding: "8px 0", fontWeight: "bold", textAlign: "right" }}>
                                    {orderId}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: "8px 0", color: "#6b7280" }}>Amount:</td>
                                <td style={{ padding: "8px 0", fontWeight: "bold", textAlign: "right" }}>
                                    {amountInNaira}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: "8px 0", color: "#6b7280" }}>Expected Release:</td>
                                <td style={{ padding: "8px 0", fontWeight: "bold", textAlign: "right" }}>
                                    {releaseDate}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{
                    backgroundColor: "#FEF3C7",
                    padding: "15px",
                    borderRadius: "8px",
                    margin: "20px 0",
                    borderLeft: "4px solid #F59E0B"
                }}>
                    <p style={{ margin: 0, fontSize: "14px", color: "#92400E" }}>
                        <strong>⚠️ Funds Held in Escrow</strong><br />
                        Payment has been received and is currently held in escrow until delivery is confirmed by the customer.
                        Funds will be automatically released to your account after 7 days, or earlier if the customer confirms delivery.
                    </p>
                </div>

                <p style={{ fontSize: "16px", lineHeight: "1.6" }}>
                    <strong>What happens next?</strong>
                </p>

                <ul style={{ fontSize: "14px", lineHeight: "1.8", color: "#4b5563" }}>
                    <li>Fulfill the order and deliver to the customer</li>
                    <li>Customer will be prompted to confirm delivery</li>
                    <li>Once confirmed, funds will be transferred to your bank account within 24 hours</li>
                    <li>If no action is taken, funds will be automatically released on {releaseDate}</li>
                </ul>

                <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "30px" }}>
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
