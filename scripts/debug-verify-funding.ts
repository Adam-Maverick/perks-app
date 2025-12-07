/**
 * Debug script to test verifyAndFundStipends function
 * This will help us understand why the callback didn't fund wallets
 * 
 * Run with: npx dotenv -e .env.local -- npx tsx scripts/debug-verify-funding.ts <PAYSTACK_REFERENCE>
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const reference = process.argv[2];

if (!reference) {
    console.error('❌ Usage: npx tsx scripts/debug-verify-funding.ts <PAYSTACK_REFERENCE>');
    console.error('   Get the reference from the Paystack dashboard or callback URL');
    process.exit(1);
}

console.log('🔍 Testing verifyAndFundStipends\n');
console.log('='.repeat(60));
console.log(`Reference: ${reference}`);
console.log('='.repeat(60));

async function debugVerifyAndFund() {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY?.trim();
    const PAYSTACK_API_URL = "https://api.paystack.co";

    // Step 1: Verify payment with Paystack
    console.log('\n📋 Step 1: Verifying with Paystack API');
    console.log('-'.repeat(60));

    try {
        const response = await fetch(`${PAYSTACK_API_URL}/transaction/verify/${reference}`, {
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });

        const data = await response.json();

        if (!response.ok || !data.status) {
            console.error('❌ Paystack Verification Failed');
            console.error('   Response:', JSON.stringify(data, null, 2));
            return;
        }

        console.log('✅ Paystack Verification Successful');
        console.log(`   Transaction Status: ${data.data.status}`);
        console.log(`   Amount: ₦${data.data.amount / 100}`);
        console.log(`   Reference: ${data.data.reference}`);

        // Check metadata
        if (data.data.metadata) {
            console.log('\n📦 Metadata:');
            console.log(`   Type: ${data.data.metadata.type}`);
            console.log(`   Org ID: ${data.data.metadata.orgId}`);
            console.log(`   Employee IDs: ${data.data.metadata.employeeIds}`);
            console.log(`   Amount Per Employee: ₦${data.data.metadata.amountPerEmployee / 100}`);
        }

        // Step 2: Check what would happen in fundStipends
        console.log('\n📋 Step 2: Simulating fundStipends logic');
        console.log('-'.repeat(60));

        if (data.data.status !== 'success') {
            console.error('❌ Payment status is not "success"');
            console.error(`   Current status: ${data.data.status}`);
            return;
        }

        if (!data.data.metadata || data.data.metadata.type !== 'stipend_funding') {
            console.error('❌ Invalid or missing metadata');
            return;
        }

        const employeeIds = data.data.metadata.employeeIds.split(',');
        const amountPerEmployee = data.data.metadata.amountPerEmployee;

        console.log('✅ Would fund wallets:');
        console.log(`   Number of employees: ${employeeIds.length}`);
        console.log(`   Amount per employee: ₦${amountPerEmployee / 100}`);
        console.log(`   Total amount: ₦${(employeeIds.length * amountPerEmployee) / 100}`);

        console.log('\n💡 Next Steps:');
        console.log('   1. Check if employees exist in database');
        console.log('   2. Verify employees have linked user accounts');
        console.log('   3. Check wallet_transactions table for this reference');
        console.log(`   4. Search for reference: ${reference}`);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

debugVerifyAndFund().catch(console.error);
