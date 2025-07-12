#\!/usr/bin/env node

/**
 * Test booking API directly to see if it saves to database
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
                'User-Agent': 'ITT-Test-Client'
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

async function testBookingAPI() {
    console.log('🔍 TESTING BOOKING API DIRECTLY');
    console.log('===============================');
    
    try {
        console.log('\n📍 Step 1: Testing API Connection');
        const healthCheck = await makeAPIRequest('/api/health-check');
        console.log(`✅ Health check: ${healthCheck.status}`);
        
        console.log('\n📍 Step 2: Getting Practitioners');
        const practitioners = await makeAPIRequest('/api/web-booking/practitioners');
        console.log(`✅ Practitioners: ${practitioners.status}`);
        
        if (practitioners.data && practitioners.data.data) {
            const practitioner = practitioners.data.data[0];
            console.log(`👨‍⚕️ Using practitioner: ${practitioner.name} (ID: ${practitioner.id})`);
            
            console.log('\n📍 Step 3: Creating Test Booking');
            
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(10, 0, 0, 0);
            
            const bookingData = {
                service_type: 'test',
                practitioner_id: practitioner.id,
                scheduled_date: tomorrow.toISOString(),
                client_name: 'John Smith',
                client_email: 'dolovedev@gmail.com',
                client_phone: '4695251001',
                special_requests: 'API test booking - should appear in admin',
                create_account: true,
                payment_intent_id: null
            };
            
            const bookingResult = await makeAPIRequest('/api/web-booking/book', 'POST', bookingData);
            console.log(`\n📊 Booking Result: ${bookingResult.status}`);
            
            if (bookingResult.status === 201 && bookingResult.data.success) {
                console.log('\n🎉 SUCCESS\! Booking created via API');
                const sessionId = bookingResult.data.data.session.id;
                console.log(`📋 Session ID: ${sessionId}`);
                console.log('📧 Email should be sent to: dolovedev@gmail.com');
                console.log('📱 SMS should be sent to: 4695251001');
                
                return sessionId;
            } else {
                console.log('\n❌ Booking creation failed');
                console.log('📋 Response:', JSON.stringify(bookingResult.data, null, 2));
                return false;
            }
        } else {
            console.log('❌ Could not get practitioners');
            return false;
        }
        
    } catch (error) {
        console.log('\n❌ API test error:', error.message);
        return false;
    }
}

testBookingAPI().then(result => {
    if (result) {
        console.log('\n✅ BOOKING API TEST PASSED');
        console.log(`📋 Session ID: ${result}`);
        console.log('📋 Booking should now appear in admin dashboard');
        console.log('📧 Check dolovedev@gmail.com for confirmation email');
        console.log('📱 Check 4695251001 for SMS confirmation');
    } else {
        console.log('\n❌ BOOKING API TEST FAILED');
    }
}).catch(console.error);
EOF < /dev/null
