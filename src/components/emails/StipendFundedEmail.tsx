import * as React from 'react';

interface StipendFundedEmailProps {
    amount: string;
}

export const StipendFundedEmail: React.FC<StipendFundedEmailProps> = ({ amount }) => (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: '20px', backgroundColor: '#F8F9FA' }}>
        <div
            style={{
                maxWidth: '600px',
                margin: '0 auto',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '32px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
        >
            {/* Header with celebration emoji */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span style={{ fontSize: '48px' }}>🎉</span>
            </div>

            {/* Title */}
            <h1
                style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '28px',
                    fontWeight: '600',
                    color: '#2563EB', // Electric Royal Blue
                    textAlign: 'center',
                    marginBottom: '16px',
                }}
            >
                Your Stipend Has Arrived!
            </h1>

            {/* Amount Display */}
            <div
                style={{
                    backgroundColor: '#96E072', // Electric Lime
                    borderRadius: '8px',
                    padding: '24px',
                    textAlign: 'center',
                    marginBottom: '24px',
                }}
            >
                <p
                    style={{
                        fontSize: '14px',
                        color: '#1a1a1a',
                        margin: '0 0 8px 0',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                    }}
                >
                    Amount Credited
                </p>
                <p
                    style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '36px',
                        fontWeight: '700',
                        color: '#1a1a1a',
                        margin: '0',
                    }}
                >
                    {amount}
                </p>
            </div>

            {/* Message */}
            <p style={{ fontSize: '16px', color: '#4B5563', lineHeight: '1.6', marginBottom: '24px' }}>
                Great news! Your employer has funded your Perks wallet. You can now use this balance to
                access amazing deals from verified merchants.
            </p>

            {/* CTA Button */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <a
                    href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/employee/marketplace`}
                    style={{
                        backgroundColor: '#FA7921', // Vibrant Coral
                        color: '#FFFFFF',
                        padding: '14px 32px',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        display: 'inline-block',
                        fontWeight: '600',
                        fontSize: '16px',
                    }}
                >
                    Browse Deals Now
                </a>
            </div>

            {/* Footer */}
            <div
                style={{
                    borderTop: '1px solid #E5E7EB',
                    paddingTop: '20px',
                    marginTop: '20px',
                }}
            >
                <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', margin: '0' }}>
                    This is an automated message from Perks App. If you have questions, please contact
                    your HR department.
                </p>
            </div>
        </div>
    </div>
);

export default StipendFundedEmail;
