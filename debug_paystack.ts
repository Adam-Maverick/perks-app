
import fetch from 'node-fetch';

async function main() {
    console.log('--- Debugging Paystack Key ---');

    // Check if key is present
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) {
        console.error('ERROR: PAYSTACK_SECRET_KEY is NOT defined in environment!');
        process.exit(1);
    }

    console.log(`Key found (length: ${key.length})`);
    console.log(`Key preview: ${key.substring(0, 8)}...`);

    // Check format
    if (!key.startsWith('sk_test_') && !key.startsWith('sk_live_')) {
        console.warn('WARNING: Key does not start with sk_test_ or sk_live_');
    }

    // Test API
    console.log('Testing connectivity to Paystack API...');
    try {
        const response = await fetch('https://api.paystack.co/bank', {
            headers: {
                Authorization: `Bearer ${key}`
            }
        });

        const data = await response.json();

        if (response.ok && data.status) {
            console.log('SUCCESS: API Call Successful!');
            console.log(`Message: ${data.message}`);
        } else {
            console.error('FAILURE: API Call Failed');
            console.error(`Status: ${response.status}`);
            console.error('Response:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('EXCEPTION: Network request failed', error);
    }
}

main();
