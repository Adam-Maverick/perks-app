import * as React from 'react';

interface EmployeeJoinedNotificationProps {
    employeeName: string;
    employeeEmail: string;
    transferDate: string;
}

export const EmployeeJoinedNotification: React.FC<EmployeeJoinedNotificationProps> = ({
    employeeName,
    employeeEmail,
    transferDate,
}) => (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: '20px', maxWidth: '600px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', color: '#2563EB' }}>New Employee Joined via Transfer</h1>
        <p>Hello,</p>
        <p>
            <strong>{employeeName}</strong> ({employeeEmail}) has joined your organization via account transfer.
        </p>
        <p>
            <strong>Transfer Date:</strong> {transferDate}
        </p>
        <p>
            This employee has transferred their existing Perks App account from their previous employer. Their transaction history and wallet balance have been preserved.
        </p>
        <p>
            They can now access benefits and perks associated with your organization.
        </p>
        <p style={{ marginTop: '24px', fontSize: '14px', color: '#666' }}>
            You can view this employee in your roster dashboard.
        </p>
        <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
        <p style={{ fontSize: '12px', color: '#999' }}>
            This is an automated message from Perks App. Please do not reply to this email.
        </p>
    </div>
);

export default EmployeeJoinedNotification;
