import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register Roboto font which properly supports the Naira symbol (₦)
Font.register({
    family: 'Roboto',
    fonts: [
        {
            src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf',
            fontWeight: 'normal',
        },
        {
            src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf',
            fontWeight: 'bold',
        },
    ],
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Roboto',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#111',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        textAlign: 'center',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 5,
        color: '#666',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 10,
        alignItems: 'center',
    },
    label: {
        width: 120,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#444',
    },
    value: {
        flex: 1,
        fontSize: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingBottom: 2,
    },
    amountSection: {
        marginTop: 20,
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#F9F9F9',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    amountLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    amountValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginTop: 5,
    },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    currencySymbol: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginRight: 4,
    },
    footer: {
        marginTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: 200,
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 5,
        alignItems: 'center',
    },
    signatureText: {
        fontSize: 10,
        color: '#666',
    },
});

export interface RentReceiptProps {
    receiptNo: string;
    date: string;
    tenantName: string;
    amount: number;
    period: string;
    propertyAddress: string;
    landlordName: string;
}

export const RentReceipt = ({
    receiptNo,
    date,
    tenantName,
    amount,
    period,
    propertyAddress,
    landlordName
}: RentReceiptProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>Rent Receipt</Text>
                <Text style={styles.subtitle}>Official Payment Confirmation</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Receipt No:</Text>
                <Text style={styles.value}>{receiptNo}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Date Issued:</Text>
                <Text style={styles.value}>{date}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Received From:</Text>
                <Text style={styles.value}>{tenantName}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Property:</Text>
                <Text style={styles.value}>{propertyAddress}</Text>
            </View>

            <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Amount Received</Text>
                <View style={styles.amountRow}>
                    <Text style={styles.currencySymbol}>₦</Text>
                    <Text style={styles.amountValue}>{amount.toLocaleString()}</Text>
                </View>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Payment For:</Text>
                <Text style={styles.value}>Rent Payment ({period})</Text>
            </View>

            <View style={styles.footer}>
                <View style={styles.signatureBox}>
                    <Text style={styles.signatureText}>Landlord Signature</Text>
                </View>
                <View style={styles.signatureBox}>
                    <Text style={styles.signatureText}>Tenant Signature</Text>
                </View>
            </View>
        </Page>
    </Document>
);
