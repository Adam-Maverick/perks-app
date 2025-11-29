import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";

interface MerchantDisputeNotificationEmailProps {
    merchantName: string;
    transactionId: string;
    disputeId: string;
    employeeDescription: string;
}

export const MerchantDisputeNotificationEmail = ({
    merchantName,
    transactionId,
    disputeId,
    employeeDescription,
}: MerchantDisputeNotificationEmailProps) => (
    <Html>
        <Head />
        <Preview>Dispute filed for transaction {transactionId}</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>Dispute Filed</Heading>
                <Text style={text}>Hi {merchantName},</Text>
                <Text style={text}>
                    A dispute has been filed for transaction <strong>{transactionId}</strong>.
                </Text>
                <Section style={section}>
                    <Text style={text}>
                        <strong>Dispute ID:</strong> {disputeId}
                    </Text>
                    <Text style={text}>
                        <strong>Customer's Description:</strong>
                    </Text>
                    <Text style={quote}>
                        "{employeeDescription}"
                    </Text>
                </Section>
                <Text style={text}>
                    Please note that the funds for this transaction are currently held in escrow. Our admin team will review the dispute and may contact you for further information.
                </Text>
            </Container>
        </Body>
    </Html>
);

export default MerchantDisputeNotificationEmail;

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
