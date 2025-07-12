#!/usr/bin/env node

/**
 * Direct Notification Function Test - Test the actual notification functions
 */

require('dotenv').config({ path: '/home/ittz/projects/itt/shared/.env.production' });

const https = require('https');

async function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, 'https://ittheal.com');
        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Direct-Notification-Test/1.0'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ 
                        status: res.statusCode, 
                        data: parsed,
                        headers: res.headers 
                    });
                } catch (e) {
                    resolve({ 
                        status: res.statusCode, 
                        data: body,
                        headers: res.headers 
                    });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function testNotificationEndpoints() {
    console.log('🧪 Testing Direct Notification Endpoints');
    console.log('=======================================');

    // Test email endpoint
    console.log('\n📧 Testing Email Notification Endpoint...');
    try {
        const emailResult = await makeRequest('/api/web-booking/test-email', 'POST', {
            email: 'dolovedev@gmail.com'
        });
        
        console.log(`Status: ${emailResult.status}`);
        console.log(`Response: ${JSON.stringify(emailResult.data, null, 2)}`);
        
        if (emailResult.data.success) {
            console.log('✅ Email endpoint responds correctly');
        } else {
            console.log('❌ Email endpoint failed');
        }
    } catch (error) {
        console.log('❌ Email endpoint error:', error.message);
    }

    // Test SMS endpoint
    console.log('\n📱 Testing SMS Notification Endpoint...');
    try {
        const smsResult = await makeRequest('/api/web-booking/test-sms', 'POST', {
            phone: '+14695251001'
        });
        
        console.log(`Status: ${smsResult.status}`);
        console.log(`Response: ${JSON.stringify(smsResult.data, null, 2)}`);
        
        if (smsResult.data.success) {
            console.log('✅ SMS endpoint responds correctly');
        } else {
            console.log('❌ SMS endpoint failed');
        }
    } catch (error) {
        console.log('❌ SMS endpoint error:', error.message);
    }

    // Test environment check
    console.log('\n🔍 Testing Environment Configuration...');
    try {
        const healthResult = await makeRequest('/api/health');
        
        console.log(`Status: ${healthResult.status}`);
        
        if (healthResult.data.services) {
            console.log('Service Configuration:');
            console.log(`  - SendGrid: ${healthResult.data.services.sendgrid ? '✅' : '❌'}`);
            console.log(`  - Twilio: ${healthResult.data.services.twilio ? '✅' : '❌'}`);
            console.log(`  - Stripe: ${healthResult.data.services.stripe ? '✅' : '❌'}`);
        }
    } catch (error) {
        console.log('❌ Health check error:', error.message);
    }

    console.log('\n🎯 Test Complete - Check results above');
}

testNotificationEndpoints().catch(console.error);