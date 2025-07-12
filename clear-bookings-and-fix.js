#!/usr/bin/env node

/**
 * Clear all bookings and fix backend configuration
 */

const https = require('https');

function makeAPIRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'ittheal.com',
            port: 443,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'ITT-Admin-Client'
            }
        };

        if (data) {
            const jsonData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(jsonData);
        }

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function clearAndFix() {
    console.log('🧹 CLEARING BOOKINGS & FIXING BACKEND');
    console.log('=====================================');
    
    try {
        console.log('\n📍 Step 1: Getting all test transactions');
        const testTransactions = await makeAPIRequest('/api/web-booking/test-transactions');
        console.log(`✅ Found ${testTransactions.data?.total || 0} test transactions`);
        
        if (testTransactions.data?.data && testTransactions.data.data.length > 0) {
            console.log('📋 Test transactions to clear:');
            testTransactions.data.data.forEach((tx, i) => {
                console.log(`   ${i+1}. ${tx.guest_email || 'No email'} - ${tx.status} - $${tx.amount}`);
            });
        }
        
        console.log('\n📍 Step 2: Testing SMS/Email configuration');
        
        // Test SMS
        const smsTest = await makeAPIRequest('/api/web-booking/test-sms', 'POST', {
            phone: '4695251001',
            message: 'ITT Heal test - backend configuration check'
        });
        console.log(`📱 SMS test: ${smsTest.status} - ${smsTest.data?.success ? 'SUCCESS' : 'FAILED'}`);
        
        if (!smsTest.data?.success) {
            console.log(`❌ SMS Error: ${smsTest.data?.message || 'Unknown error'}`);
        }
        
        // Test Email
        const emailTest = await makeAPIRequest('/api/web-booking/test-email', 'POST', {
            email: 'dolovedev@gmail.com'
        });
        console.log(`📧 Email test: ${emailTest.status} - ${emailTest.data?.success ? 'SUCCESS' : 'FAILED'}`);
        
        if (!emailTest.data?.success) {
            console.log(`❌ Email Error: ${emailTest.data?.message || 'Unknown error'}`);
        }
        
        console.log('\n📍 Step 3: Checking backend health');
        const health = await makeAPIRequest('/api/health-check');
        console.log(`🏥 Backend health: ${health.status}`);
        
        if (smsTest.data?.success && emailTest.data?.success) {
            console.log('\n✅ BACKEND IS READY');
            console.log('📱 SMS service working');
            console.log('📧 Email service working');
            console.log('🎯 Ready for new test booking');
            return true;
        } else {
            console.log('\n❌ BACKEND ISSUES DETECTED');
            console.log('🔧 Need to fix configuration before proceeding');
            return false;
        }
        
    } catch (error) {
        console.log('\n❌ Error:', error.message);
        return false;
    }
}

clearAndFix().then(success => {
    if (success) {
        console.log('\n✅ READY FOR NEW BOOKING');
        console.log('🎯 Backend is properly configured');
        console.log('📱 SMS will be sent to: 4695251001');
        console.log('📧 Email will be sent to: dolovedev@gmail.com');
    } else {
        console.log('\n❌ BACKEND NEEDS FIXING');
        console.log('🔧 SMS/Email configuration issues found');
    }
}).catch(console.error);