import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';

interface RentReceiptEmailProps {
    recipientName: string;
    receiptNo: string;
    rentAmount: string;
    landlordName: string;
    propertyAddress: string;
    pdfUrl: string;
}

export const RentReceiptEmail: React.FC<RentReceiptEmailProps> = ({
    recipientName,
    receiptNo,
    rentAmount,
    landlordName,
    propertyAddress,
    pdfUrl,
}) => {
    return (
        <Html>
            <Head />
            <Preview>Your Rent Receipt ({receiptNo}) is Ready</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={heading}>Your Rent Receipt</Heading>

                    <Text style={paragraph}>
                        Hi {recipientName},
                    </Text>

                    <Text style={paragraph}>
                        Your rent receipt has been generated successfully. You can use this
                        receipt for tax relief purposes under the Nigeria Tax Act 2025.
                    </Text>

                    <Section style={detailsSection}>
                        <Text style={detailLabel}>Receipt Number:</Text>
                        <Text style={detailValue}>{receiptNo}</Text>

                        <Text style={detailLabel}>Amount Paid:</Text>
                        <Text style={detailValue}>{rentAmount}</Text>

                        <Text style={detailLabel}>Landlord:</Text>
                        <Text style={detailValue}>{landlordName}</Text>

                        <Text style={detailLabel}>Property:</Text>
                        <Text style={detailValue}>{propertyAddress}</Text>
                    </Section>

                    <Section style={buttonSection}>
                        <Link href={pdfUrl} style={button}>
                            Download Receipt (PDF)
                        </Link>
                    </Section>

                    <Text style={paragraph}>
                        Keep this receipt safe for your records. It's FIRS-compliant and
                        can be used as proof of payment for your tax filings.
                    </Text>

                    <Text style={footer}>
                        — The Stipend Team
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default RentReceiptEmail;

const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '40px 20px',
    marginBottom: '64px',
    borderRadius: '5px',
    maxWidth: '480px',
};

const heading = {
    fontSize: '24px',
    letterSpacing: '-0.5px',
    lineHeight: '1.3',
    fontWeight: '700',
    color: '#484848',
    padding: '17px 0 0',
};

const paragraph = {
    margin: '0 0 15px',
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#3c4149',
};

const detailsSection = {
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
    padding: '20px',
    marginBottom: '24px',
};

const detailLabel = {
    fontSize: '12px',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    margin: '0 0 4px',
};

const detailValue = {
    fontSize: '15px',
    color: '#111827',
    margin: '0 0 12px',
    fontWeight: '500',
};

const buttonSection = {
    textAlign: 'center' as const,
    marginBottom: '24px',
};

const button = {
    backgroundColor: '#5FA83B',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 24px',
};

const footer = {
    color: '#898989',
    fontSize: '14px',
    marginTop: '20px',
};
