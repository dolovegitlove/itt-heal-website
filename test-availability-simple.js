#!/usr/bin/env node

const https = require('https');

function testAvailability() {
    const data = JSON.stringify({
        date: '2025-07-01',
        start_time: '14:00',
        end_time: '15:00',
        availability_type: 'available',
        recurring_pattern: 'none'
    });

    const options = {
        hostname: 'ittheal.com',
        port: 443,
        path: '/api/admin/availability',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Access': 'dr-shiffer-emergency-access',
            'Content-Length': data.length
        },
        rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
        let body = '';
        
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        
        res.on('data', (chunk) => {
            body += chunk;
        });
        
        res.on('end', () => {
            console.log(`Response: ${body}`);
            try {
                const parsed = JSON.parse(body);
                console.log('Parsed:', JSON.stringify(parsed, null, 2));
            } catch (e) {
                console.log('Not JSON response');
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Request error: ${e.message}`);
    });

    req.write(data);
    req.end();
}

testAvailability();