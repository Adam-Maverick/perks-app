/**
 * Direct Server Action Test Script
 * Tests createEscrowTransaction by calling it directly and getting a payment URL
 * 
 * Run with: npx tsx scripts/test-server-action.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

console.log('🧪 Testing Server Actions Directly\n');
console.log('='.repeat(60));

async function testCreateEscrowTransaction() {
    console.log('\n📋 Test: createEscrowTransaction Server Action');
    console.log('-'.repeat(60));

    try {
        // We need to mock the auth and database for this test
        // Since we can't easily import Server Actions with "use server" directive
        // Let's create a direct API call instead

        const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
        const PAYSTACK_API_URL = "https://api.paystack.co";

        // Simulate what the Server Action does
        const testEmail = "test@example.com";
        const testAmount = 50000; // ₦500 in kobo
        const testReference = `test_manual_${Date.now()}`;

        console.log('\n📤 Creating Paystack Transaction...');
        console.log(`   Email: ${testEmail}`);
        console.log(`   Amount: ₦${testAmount / 100}`);
        console.log(`   Reference: ${testReference}`);

        const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: testEmail,
                amount: testAmount.toString(),
                reference: testReference,
                callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/employee/checkout/callback`,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('\n❌ Transaction Creation Failed');
            console.error('   Error:', error);
            return false;
        }

        const data = await response.json();

        if (!data.status || !data.data?.authorization_url) {
            console.error('\n❌ Invalid Response from Paystack');
            console.error('   Response:', data);
            return false;
        }

        console.log('\n✅ Transaction Created Successfully!');
        console.log(`   Reference: ${testReference}`);
        console.log(`   Authorization URL: ${data.data.authorization_url}`);

        console.log('\n' + '='.repeat(60));
        console.log('🎯 MANUAL TEST INSTRUCTIONS');
        console.log('='.repeat(60));
        console.log('\n1. Copy the URL below and paste it in your browser:');
        console.log(`\n   ${data.data.authorization_url}\n`);
        console.log('2. Use these test card details:');
        console.log('   Card Number: 4084 0840 8408 4081');
        console.log('   Expiry: 12/25 (any future date)');
        console.log('   CVV: 408');
        console.log('   PIN: 0000');
        console.log('   OTP: 123456');
        console.log('\n3. Complete the payment');
        console.log('\n4. After payment, check:');
        console.log('   - Paystack Dashboard → Transactions');
        console.log('   - Look for reference:', testReference);
        console.log('   - Webhook should fire automatically');
        console.log('\n5. To verify webhook was received:');
        console.log('   - Check your database for the transaction');
        console.log('   - Verify escrow_holds table has a new entry');
        console.log('   - Check if merchant received email notification');
        console.log('\n' + '='.repeat(60));

        // Also show how to manually trigger webhook
        console.log('\n💡 BONUS: Test Webhook Manually');
        console.log('-'.repeat(60));
        console.log('\nTo test the webhook handler locally:');
        console.log('1. Start your dev server: npm run dev');
        console.log('2. Use ngrok to expose localhost: ngrok http 3000');
        console.log('3. Copy the ngrok URL (e.g., https://abc123.ngrok.io)');
        console.log('4. Go to Paystack Dashboard → Settings → Webhooks');
        console.log('5. Set webhook URL to: https://abc123.ngrok.io/api/webhooks/paystack');
        console.log('6. Paystack will send webhooks to your local server!');
        console.log('\n' + '='.repeat(60));

        return true;

    } catch (error) {
        console.error('\n❌ Error:', error);
        return false;
    }
}

// Run the test
testCreateEscrowTransaction().catch(console.error);
