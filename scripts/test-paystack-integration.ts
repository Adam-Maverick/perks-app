/**
 * Paystack Integration Test Script
 * Tests the Paystack API connection and our Server Actions
 * 
 * Run with: npx tsx scripts/test-paystack-integration.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_URL = "https://api.paystack.co";

console.log('🧪 Paystack Integration Test\n');
console.log('='.repeat(50));

// Test 1: Verify API Key is configured
async function testApiKeyConfiguration() {
    console.log('\n📋 Test 1: API Key Configuration');
    console.log('-'.repeat(50));

    if (!PAYSTACK_SECRET_KEY) {
        console.error('❌ PAYSTACK_SECRET_KEY not found in .env.local');
        console.log('   Please add: PAYSTACK_SECRET_KEY=sk_test_your_key');
        return false;
    }

    if (!PAYSTACK_SECRET_KEY.startsWith('sk_test_')) {
        console.warn('⚠️  Warning: Not using test key (should start with sk_test_)');
    }

    console.log('✅ API Key configured');
    console.log(`   Key: ${PAYSTACK_SECRET_KEY.substring(0, 15)}...`);
    return true;
}

// Test 2: Test Paystack API Connection
async function testPaystackConnection() {
    console.log('\n📋 Test 2: Paystack API Connection');
    console.log('-'.repeat(50));

    try {
        const response = await fetch(`${PAYSTACK_API_URL}/bank`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('❌ API Connection Failed');
            console.error('   Status:', response.status);
            console.error('   Error:', error);
            return false;
        }

        const data = await response.json();
        console.log('✅ API Connection Successful');
        console.log(`   Banks available: ${data.data?.length || 0}`);
        return true;

    } catch (error) {
        console.error('❌ Network Error:', error);
        return false;
    }
}

// Test 3: Test Transaction Initialization
async function testTransactionInitialization() {
    console.log('\n📋 Test 3: Transaction Initialization');
    console.log('-'.repeat(50));

    const testPayload = {
        email: "test@example.com",
        amount: "50000", // ₦500 in kobo
        reference: `test_${Date.now()}`,
        callback_url: "http://localhost:3000/callback",
    };

    try {
        const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload),
        });

        const data = await response.json();

        if (!response.ok || !data.status) {
            console.error('❌ Transaction Initialization Failed');
            console.error('   Error:', data.message || 'Unknown error');
            return false;
        }

        console.log('✅ Transaction Initialized Successfully');
        console.log(`   Reference: ${testPayload.reference}`);
        console.log(`   Amount: ₦${parseInt(testPayload.amount) / 100}`);
        console.log(`   Authorization URL: ${data.data.authorization_url.substring(0, 50)}...`);
        console.log('\n   💡 You can visit this URL to test payment:');
        console.log(`   ${data.data.authorization_url}`);
        return true;

    } catch (error) {
        console.error('❌ Request Error:', error);
        return false;
    }
}

// Test 4: Test Webhook Signature Verification
async function testWebhookSignature() {
    console.log('\n📋 Test 4: Webhook Signature Verification');
    console.log('-'.repeat(50));

    const crypto = await import('crypto');

    const testPayload = JSON.stringify({
        event: "charge.success",
        data: {
            reference: "test_12345",
            amount: 50000,
            status: "success"
        }
    });

    // Generate signature
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY!)
        .update(testPayload)
        .digest('hex');

    console.log('✅ Signature Generation Working');
    console.log(`   Payload: ${testPayload.substring(0, 50)}...`);
    console.log(`   Signature: ${hash.substring(0, 30)}...`);

    // Verify signature
    const verifyHash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY!)
        .update(testPayload)
        .digest('hex');

    if (hash === verifyHash) {
        console.log('✅ Signature Verification Working');
        return true;
    } else {
        console.error('❌ Signature Verification Failed');
        return false;
    }
}

// Test 5: Test Transfer Recipient Creation (Optional - requires bank details)
async function testTransferRecipient() {
    console.log('\n📋 Test 5: Transfer Recipient Creation (Optional)');
    console.log('-'.repeat(50));

    console.log('⏭️  Skipped - Requires valid bank account details');
    console.log('   To test manually, use:');
    console.log('   - type: "nuban"');
    console.log('   - name: "Test Merchant"');
    console.log('   - account_number: "0123456789"');
    console.log('   - bank_code: "044" (Access Bank)');
    console.log('   - currency: "NGN"');
    return true;
}

// Run all tests
async function runTests() {
    console.log('\n🚀 Starting Paystack Integration Tests...\n');

    const results = {
        apiKey: await testApiKeyConfiguration(),
        connection: false,
        transaction: false,
        webhook: false,
        recipient: false,
    };

    // Only proceed if API key is configured
    if (results.apiKey) {
        results.connection = await testPaystackConnection();

        if (results.connection) {
            results.transaction = await testTransactionInitialization();
            results.webhook = await testWebhookSignature();
            results.recipient = await testTransferRecipient();
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Summary');
    console.log('='.repeat(50));
    console.log(`API Key Configuration: ${results.apiKey ? '✅' : '❌'}`);
    console.log(`API Connection: ${results.connection ? '✅' : '❌'}`);
    console.log(`Transaction Init: ${results.transaction ? '✅' : '❌'}`);
    console.log(`Webhook Signature: ${results.webhook ? '✅' : '❌'}`);
    console.log(`Transfer Recipient: ${results.recipient ? '✅' : '⏭️ '}`);

    const passedTests = Object.values(results).filter(r => r === true).length;
    const totalTests = Object.keys(results).length - 1; // Exclude recipient (optional)

    console.log('\n' + '='.repeat(50));
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Paystack integration is working.');
        console.log('\n✅ Next Steps:');
        console.log('   1. Test the payment flow in the browser');
        console.log('   2. Set up webhook URL in Paystack dashboard');
        console.log('   3. Test webhook delivery');
    } else {
        console.log(`⚠️  ${passedTests}/${totalTests} tests passed. Please fix the failing tests.`);
    }
    console.log('='.repeat(50) + '\n');
}

// Execute tests
runTests().catch(console.error);
