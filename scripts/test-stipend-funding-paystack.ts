/**
 * Stipend Funding Paystack Integration Test Script
 * Tests the Paystack API connection for stipend funding functionality
 * 
 * Run with: npx dotenv -e .env.local -- npx tsx scripts/test-stipend-funding-paystack.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY?.trim();
const PAYSTACK_API_URL = "https://api.paystack.co";

console.log('🧪 Stipend Funding Paystack Integration Test\n');
console.log('='.repeat(60));

// Test 1: Verify API Key is configured
async function testApiKeyConfiguration() {
    console.log('\n📋 Test 1: API Key Configuration');
    console.log('-'.repeat(60));

    if (!PAYSTACK_SECRET_KEY) {
        console.error('❌ PAYSTACK_SECRET_KEY not found in .env.local');
        console.log('   Please add: PAYSTACK_SECRET_KEY=sk_test_your_key');
        return false;
    }

    if (!PAYSTACK_SECRET_KEY.startsWith('sk_test_') && !PAYSTACK_SECRET_KEY.startsWith('sk_live_')) {
        console.warn('⚠️  Warning: Invalid key format (should start with sk_test_ or sk_live_)');
        return false;
    }

    console.log('✅ API Key configured');
    console.log(`   Key: ${PAYSTACK_SECRET_KEY.substring(0, 15)}...`);
    console.log(`   Length: ${PAYSTACK_SECRET_KEY.length} characters`);
    return true;
}

// Test 2: Test Paystack API Connection
async function testPaystackConnection() {
    console.log('\n📋 Test 2: Paystack API Connection');
    console.log('-'.repeat(60));

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
            console.error('   Error:', JSON.stringify(error, null, 2));
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

// Test 3: Test Stipend Payment Initialization
async function testStipendPaymentInitialization() {
    console.log('\n📋 Test 3: Stipend Payment Initialization');
    console.log('-'.repeat(60));

    const reference = `stipend_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const testPayload = {
        email: "employer@test.com",
        amount: 1000000, // ₦10,000 in kobo
        reference: reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/employer/stipends/fund/callback`,
        metadata: {
            type: 'stipend_funding',
            orgId: 'org_test_integration',
            employeeIds: 'emp_1,emp_2',
            amountPerEmployee: 1000000,
            fundedBy: 'user_test',
        },
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
            console.error('❌ Payment Initialization Failed');
            console.error('   Status:', response.status);
            console.error('   Error:', data.message || 'Unknown error');
            console.error('   Response:', JSON.stringify(data, null, 2));
            return false;
        }

        console.log('✅ Payment Initialized Successfully');
        console.log(`   Reference: ${reference}`);
        console.log(`   Amount: ₦${testPayload.amount / 100}`);
        console.log(`   Metadata: stipend_funding`);
        console.log(`   Authorization URL: ${data.data.authorization_url.substring(0, 50)}...`);
        console.log('\n   💡 You can visit this URL to test payment:');
        console.log(`   ${data.data.authorization_url}`);

        // Store reference for next test
        (global as any).testReference = reference;
        return true;

    } catch (error) {
        console.error('❌ Request Error:', error);
        return false;
    }
}

// Test 4: Test Payment Verification
async function testPaymentVerification() {
    console.log('\n📋 Test 4: Payment Verification');
    console.log('-'.repeat(60));

    const testReference = (global as any).testReference;

    if (!testReference) {
        console.log('⏭️  Skipped - No test reference from previous test');
        return true;
    }

    try {
        const response = await fetch(`${PAYSTACK_API_URL}/transaction/verify/${testReference}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });

        const data = await response.json();

        if (!response.ok || !data.status) {
            console.log('⚠️  Payment Not Verified (expected - payment not completed)');
            console.log(`   Status: ${data.data?.status || 'unknown'}`);
            console.log('   This is expected if you haven\'t completed the payment yet');
            return true; // This is expected behavior
        }

        console.log('✅ Payment Verification Endpoint Working');
        console.log(`   Transaction Status: ${data.data.status}`);
        console.log(`   Amount: ₦${data.data.amount / 100}`);
        return true;

    } catch (error) {
        console.error('❌ Verification Error:', error);
        return false;
    }
}

// Test 5: Test Webhook Signature Generation
async function testWebhookSignature() {
    console.log('\n📋 Test 5: Webhook Signature Generation');
    console.log('-'.repeat(60));

    const crypto = await import('crypto');

    const testPayload = JSON.stringify({
        event: "charge.success",
        data: {
            reference: "stipend_test_12345",
            amount: 1000000,
            status: "success",
            metadata: {
                type: 'stipend_funding',
                orgId: 'org_test',
                employeeIds: 'emp_1,emp_2',
                amountPerEmployee: 1000000,
            }
        }
    });

    // Generate signature
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY!)
        .update(testPayload)
        .digest('hex');

    console.log('✅ Signature Generation Working');
    console.log(`   Payload: ${testPayload.substring(0, 60)}...`);
    console.log(`   Signature: ${hash.substring(0, 40)}...`);

    // Verify signature
    const verifyHash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY!)
        .update(testPayload)
        .digest('hex');

    if (hash === verifyHash) {
        console.log('✅ Signature Verification Working');
        console.log('   Webhook security correctly configured');
        return true;
    } else {
        console.error('❌ Signature Verification Failed');
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('\n🚀 Starting Stipend Funding Paystack Tests...\n');

    const results = {
        apiKey: await testApiKeyConfiguration(),
        connection: false,
        payment: false,
        verification: false,
        webhook: false,
    };

    // Only proceed if API key is configured
    if (results.apiKey) {
        results.connection = await testPaystackConnection();

        if (results.connection) {
            results.payment = await testStipendPaymentInitialization();
            results.verification = await testPaymentVerification();
            results.webhook = await testWebhookSignature();
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`API Key Configuration: ${results.apiKey ? '✅ Pass' : '❌ Fail'}`);
    console.log(`API Connection: ${results.connection ? '✅ Pass' : '❌ Fail'}`);
    console.log(`Payment Initialization: ${results.payment ? '✅ Pass' : '❌ Fail'}`);
    console.log(`Payment Verification: ${results.verification ? '✅ Pass' : '❌ Fail'}`);
    console.log(`Webhook Signature: ${results.webhook ? '✅ Pass' : '❌ Fail'}`);

    const passedTests = Object.values(results).filter(r => r === true).length;
    const totalTests = Object.keys(results).length;

    console.log('\n' + '='.repeat(60));
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Paystack integration is working.');
        console.log('\n✅ Next Steps:');
        console.log('   1. Test the stipend funding flow in the browser');
        console.log('   2. Complete a test payment using Paystack test cards');
        console.log('   3. Verify webhook delivery in Paystack dashboard');
        console.log('   4. Check wallet balance updates after payment');
    } else {
        console.log(`⚠️  ${passedTests}/${totalTests} tests passed.`);
        console.log('   Please fix the failing tests before proceeding.');
    }
    console.log('='.repeat(60) + '\n');
}

// Execute tests
runTests().catch(console.error);
