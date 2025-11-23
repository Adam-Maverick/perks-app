import * as React from 'react';

interface TransferConfirmationEmailProps {
    firstName: string;
    oldEmployerName: string;
    newEmployerName: string;
    dashboardUrl: string;
}

export const TransferConfirmationEmail: React.FC<TransferConfirmationEmailProps> = ({
    firstName,
    oldEmployerName,
    newEmployerName,
    dashboardUrl,
}) => (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: '20px', maxWidth: '600px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', color: '#2563EB' }}>Account Transfer Confirmed</h1>
        <p>Hi {firstName},</p>
        <p>
            Your Perks App account has been successfully transferred from <strong>{oldEmployerName}</strong> to <strong>{newEmployerName}</strong>.
        </p>
        <p>
            ✅ <strong>Your data is safe:</strong> All your transaction history and wallet balance have been preserved.
        </p>
        <p>
            You can now access your dashboard with your new employer's benefits and perks.
        </p>
        <a
            href={dashboardUrl}
            style={{
                backgroundColor: '#2563EB',
                color: 'white',
                padding: '12px 24px',
                textDecoration: 'none',
                borderRadius: '6px',
                display: 'inline-block',
                marginTop: '16px',
                fontWeight: '600',
            }}
        >
            Go to Dashboard
        </a>
        <p style={{ marginTop: '24px', fontSize: '14px', color: '#666' }}>
            If you did not request this transfer, please contact support immediately.
        </p>
        <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
        <p style={{ fontSize: '12px', color: '#999' }}>
            This is an automated message from Perks App. Please do not reply to this email.
        </p>
    </div>
);

export default TransferConfirmationEmail;
