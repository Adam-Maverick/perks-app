import * as React from 'react';

interface WelcomeEmailProps {
    firstName: string;
    employerName: string;
    dashboardUrl: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
    firstName,
    employerName,
    dashboardUrl,
}) => (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
        <h1>Welcome to Perks App!</h1>
        <p>Hi {firstName},</p>
        <p>
            You have successfully joined <strong>{employerName}</strong> on Perks App.
        </p>
        <p>
            We are excited to have you on board. You can now access your employee dashboard to view your benefits and perks.
        </p>
        <a
            href={dashboardUrl}
            style={{
                backgroundColor: '#007bff',
                color: 'white',
                padding: '10px 20px',
                textDecoration: 'none',
                borderRadius: '5px',
                display: 'inline-block',
                marginTop: '10px',
            }}
        >
            Go to Dashboard
        </a>
        <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
            If you have any questions, please contact your HR department.
        </p>
    </div>
);

export default WelcomeEmail;
