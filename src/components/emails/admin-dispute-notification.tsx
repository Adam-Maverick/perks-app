import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Button,
} from "@react-email/components";
import * as React from "react";

interface AdminDisputeNotificationEmailProps {
    transactionId: string;
    disputeId: string;
    employeeName: string;
    merchantName: string;
    employeeDescription: string;
    adminUrl: string;
}

export const AdminDisputeNotificationEmail = ({
    transactionId,
    disputeId,
    employeeName,
    merchantName,
    employeeDescription,
    adminUrl,
}: AdminDisputeNotificationEmailProps) => (
    <Html>
        <Head />
        <Preview>New dispute requires review: {disputeId}</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>New Dispute Requires Review</Heading>
                <Text style={text}>
                    A new dispute has been submitted and requires manual resolution.
                </Text>
                <Section style={section}>
                    <Text style={text}><strong>Dispute ID:</strong> {disputeId}</Text>
                    <Text style={text}><strong>Transaction ID:</strong> {transactionId}</Text>
                    <Text style={text}><strong>Employee:</strong> {employeeName}</Text>
                    <Text style={text}><strong>Merchant:</strong> {merchantName}</Text>
                    <Text style={text}><strong>Description:</strong></Text>
                    <Text style={quote}>"{employeeDescription}"</Text>
                </Section>
                <Section style={btnContainer}>
                    <Button style={button} href={adminUrl}>
                        Review Dispute
                    </Button>
                </Section>
            </Container>
        </Body>
    </Html>
);

export default AdminDisputeNotificationEmail;

const main = {
    backgroundColor: "#ffffff",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: "0 auto",
    padding: "20px 0 48px",
    maxWidth: "560px",
};

const h1 = {
    fontSize: "24px",
    fontWeight: "bold",
    margin: "40px 0",
    padding: "0",
    color: "#333",
};

const text = {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#333",
};

const section = {
    padding: "24px",
    border: "1px solid #e6e6e6",
    borderRadius: "5px",
    margin: "20px 0",
};

const quote = {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#555",
    fontStyle: "italic",
    backgroundColor: "#f9f9f9",
    padding: "10px",
    borderRadius: "4px",
};

const btnContainer = {
    textAlign: "center" as const,
    margin: "20px 0",
};

const button = {
    backgroundColor: "#2563EB",
    borderRadius: "5px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "12px 20px",
};
