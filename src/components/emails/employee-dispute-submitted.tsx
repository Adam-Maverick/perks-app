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
    Button,
} from "@react-email/components";
import * as React from "react";

interface EmployeeDisputeSubmittedEmailProps {
    employeeName: string;
    transactionId: string;
    disputeId: string;
    merchantName: string;
    disputeUrl: string;
}

export const EmployeeDisputeSubmittedEmail = ({
    employeeName,
    transactionId,
    disputeId,
    merchantName,
    disputeUrl,
}: EmployeeDisputeSubmittedEmailProps) => (
    <Html>
        <Head />
        <Preview>Your dispute has been submitted</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>Dispute Submitted</Heading>
                <Text style={text}>Hi {employeeName},</Text>
                <Text style={text}>
                    We have received your dispute for transaction <strong>{transactionId}</strong> with <strong>{merchantName}</strong>.
                </Text>
                <Section style={section}>
                    <Text style={text}>
                        <strong>Dispute ID:</strong> {disputeId}
                    </Text>
                    <Text style={text}>
                        Our team will review your dispute within 3 business days. The funds will remain held in escrow until the dispute is resolved.
                    </Text>
                </Section>
                <Section style={btnContainer}>
                    <Button style={button} href={disputeUrl}>
                        View Dispute Status
                    </Button>
                </Section>
                <Text style={footer}>
                    If you have any questions, please reply to this email.
                </Text>
            </Container>
        </Body>
    </Html>
);

export default EmployeeDisputeSubmittedEmail;

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

const btnContainer = {
    textAlign: "center" as const,
    margin: "20px 0",
};

const button = {
    backgroundColor: "#FA7921",
    borderRadius: "5px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "12px 20px",
};

const footer = {
    color: "#898989",
    fontSize: "14px",
    marginTop: "20px",
};
