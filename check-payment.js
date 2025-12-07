// Quick check of Paystack transaction
const https = require('https');

const reference = 'stipend_org_35peFVXpZZ0QdeZj0n57KzRyqyu_1765136113075_er8whs';
const key = process.env.PAYSTACK_SECRET_KEY?.trim();

if (!key) {
    console.error('PAYSTACK_SECRET_KEY not set');
    process.exit(1);
}

const options = {
    hostname: 'api.paystack.co',
    path: `/transaction/verify/${reference}`,
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${key}`,
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const parsed = JSON.parse(data);
        console.log(JSON.stringify(parsed, null, 2));
    });
});

req.on('error', (e) => console.error(e));
req.end();
