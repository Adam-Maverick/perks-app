import * as React from 'react';

interface EmployeeTransferredNotificationProps {
    employeeName: string;
    employeeEmail: string;
    transferDate: string;
}

export const EmployeeTransferredNotification: React.FC<EmployeeTransferredNotificationProps> = ({
    employeeName,
    employeeEmail,
    transferDate,
}) => (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: '20px', maxWidth: '600px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', color: '#2563EB' }}>Employee Transferred</h1>
        <p>Hello,</p>
        <p>
            <strong>{employeeName}</strong> ({employeeEmail}) has transferred their Perks App account to a new employer.
        </p>
        <p>
            <strong>Transfer Date:</strong> {transferDate}
        </p>
        <p>
            This employee will now appear as "Transferred" in your roster. Their account data has been moved to their new employer's organization.
        </p>
        <p style={{ marginTop: '24px', fontSize: '14px', color: '#666' }}>
            No action is required on your part. This is for your records only.
        </p>
        <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
        <p style={{ fontSize: '12px', color: '#999' }}>
            This is an automated message from Perks App. Please do not reply to this email.
        </p>
    </div>
);

export default EmployeeTransferredNotification;
