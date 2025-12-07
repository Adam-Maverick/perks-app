import * as React from "react";

interface ReconciliationAlertEmailProps {
    escrowTotal: number;
    paystackBalance: number;
    discrepancy: number;
    timestamp: string;
}

export default function ReconciliationAlertEmail({
    escrowTotal,
    paystackBalance,
    discrepancy,
    timestamp,
}: ReconciliationAlertEmailProps) {
    const escrowNaira = (escrowTotal / 100).toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
    });
    const paystackNaira = (paystackBalance / 100).toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
    });
    const discrepancyNaira = (Math.abs(discrepancy) / 100).toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
    });

    return (
        <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
            <div style={{ backgroundColor: "#DC2626", padding: "20px", textAlign: "center" }}>
                <h1 style={{ color: "white", margin: 0 }}>⚠️ Escrow Reconciliation Alert</h1>
            </div>

            <div style={{ padding: "30px", backgroundColor: "#f9fafb" }}>
                <p style={{ fontSize: "16px", lineHeight: "1.6" }}>
                    <strong>URGENT: Escrow Balance Mismatch Detected</strong>
                </p>

                <p style={{ fontSize: "14px", color: "#6b7280" }}>
                    The automated reconciliation job has detected a discrepancy between the database escrow balance and the Paystack platform balance.
                </p>

                <div style={{
                    backgroundColor: "#FEE2E2",
                    padding: "20px",
                    borderRadius: "8px",
                    margin: "20px 0",
                    borderLeft: "4px solid #B91C1C"
                }}>
                    <h2 style={{ color: "#7F1D1D", fontSize: "18px", marginTop: 0 }}>
                        Discrepancy Details
                    </h2>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: "8px 0", color: "#7F1D1D" }}>Database Escrow Total (HELD):</td>
                                <td style={{ padding: "8px 0", fontWeight: "bold", textAlign: "right", color: "#7F1D1D" }}>
                                    {escrowNaira}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: "8px 0", color: "#7F1D1D" }}>Paystack Platform Balance:</td>
                                <td style={{ padding: "8px 0", fontWeight: "bold", textAlign: "right", color: "#7F1D1D" }}>
                                    {paystackNaira}
                                </td>
                            </tr>
                            <tr style={{ borderTop: "2px solid #B91C1C" }}>
                                <td style={{ padding: "8px 0", color: "#7F1D1D", fontWeight: "bold" }}>Discrepancy:</td>
                                <td style={{ padding: "8px 0", fontWeight: "bold", textAlign: "right", color: "#DC2626", fontSize: "18px" }}>
                                    {discrepancy > 0 ? "+" : ""}{discrepancyNaira}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{
                    backgroundColor: "white",
                    padding: "15px",
                    borderRadius: "8px",
                    margin: "20px 0",
                    border: "1px solid #e5e7eb"
                }}>
                    <p style={{ margin: 0, fontSize: "14px", color: "#374151" }}>
                        <strong>Timestamp:</strong> {new Date(timestamp).toLocaleString("en-NG", {
                            dateStyle: "full",
                            timeStyle: "long",
                        })}
                    </p>
                </div>

                <div style={{
                    backgroundColor: "#FEF3C7",
                    padding: "15px",
                    borderRadius: "8px",
                    margin: "20px 0",
                    borderLeft: "4px solid #D97706"
                }}>
                    <p style={{ margin: 0, fontSize: "14px", color: "#92400E" }}>
                        <strong>Action Required:</strong><br />
                        1. Review recent escrow transactions in the database<br />
                        2. Check Paystack dashboard for pending transfers or collections<br />
                        3. Investigate any failed auto-release jobs from the past 24 hours<br />
                        4. Verify all state transitions in escrow_audit_log<br />
                        5. Contact Paystack support if discrepancy persists
                    </p>
                </div>

                <p style={{ fontSize: "14px", color: "#6b7280" }}>
                    This is an automated alert from the Stipends Escrow Reconciliation System.
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
