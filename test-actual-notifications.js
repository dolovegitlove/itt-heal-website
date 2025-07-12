#!/usr/bin/env node

/**
 * Test actual SMS and Email notifications
 * This test will trigger real SMS and email sends to verify functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testActualNotifications() {
    console.log('🔍 Testing ACTUAL SMS and Email notifications...\n');
    
    try {
        // 1. Test health status first
        console.log('1. Checking service health...');
        const healthResponse = await axios.get(`${BASE_URL}/api/health`);
        console.log('   Services status:', healthResponse.data.services);
        
        if (!healthResponse.data.services.twilio) {
            console.log('   ❌ Twilio not configured');
        } else {
            console.log('   ✅ Twilio configured');
        }
        
        if (!healthResponse.data.services.sendgrid) {
            console.log('   ❌ SendGrid not configured');
        } else {
            console.log('   ✅ SendGrid configured');
        }
        
        // 2. Test actual SMS sending (not just mock)
        console.log('\n2. Testing ACTUAL SMS sending...');
        try {
            const smsResponse = await axios.post(`${BASE_URL}/api/web-booking/test-sms`, {
                phone: '+14695251001'  // Test number from config
            });
            
            console.log('   SMS Test Response:', smsResponse.data);
            
            // Check if this is a real send or mock
            if (smsResponse.data.details && smsResponse.data.details.messageId) {
                console.log('   ✅ REAL SMS sent! Message ID:', smsResponse.data.details.messageId);
            } else if (smsResponse.data.message === 'SMS service is configured and ready') {
                console.log('   ⚠️  MOCK response - SMS not actually sent');
            }
        } catch (smsError) {
            console.log('   ❌ SMS test failed:', smsError.response?.data || smsError.message);
        }
        
        // 3. Test actual booking with real notifications
        console.log('\n3. Testing booking with REAL notifications...');
        try {
            const bookingResponse = await axios.post(`${BASE_URL}/api/web-booking/book`, {
                service_type: 'test',  // Use test service
                practitioner_id: 'a6c3d8f9-2b5e-4c7a-8f1e-3d5a7b9c1e4f',
                scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                client_name: 'REAL Test User',
                client_email: 'dolovedev@gmail.com',  // Test email from config
                client_phone: '+14695251001',  // Test phone from config
                special_requests: 'TESTING ACTUAL NOTIFICATIONS',
                create_account: false,
                payment_method: 'cash'  // Avoid real payment processing
            });
            
            console.log('   Booking Response:', {
                success: bookingResponse.data.success,
                session_id: bookingResponse.data.data?.session?.id,
                payment_status: bookingResponse.data.data?.payment?.status
            });
            
            if (bookingResponse.data.success) {
                console.log('   ✅ Booking created successfully');
                console.log('   📧 Email should be sent to: dolovedev@gmail.com');
                console.log('   📱 SMS should be sent to: +14695251001');
                
                // Check if we can get session details
                const sessionId = bookingResponse.data.data?.session?.id;
                if (sessionId) {
                    console.log(`   📋 Check booking status at: ${BASE_URL}/api/web-booking/booking/${sessionId}?email=dolovedev@gmail.com`);
                }
            }
        } catch (bookingError) {
            console.log('   ❌ Booking test failed:', bookingError.response?.data || bookingError.message);
        }
        
        // 4. Check backend logs for actual sending attempts
        console.log('\n4. Checking for actual notification sending in logs...');
        console.log('   → Check server logs for:');
        console.log('   → "SMS sent successfully" or Twilio errors');
        console.log('   → "Email sent" or SendGrid errors');
        console.log('   → Any authentication failures');
        
        console.log('\n🎯 SUMMARY:');
        console.log('==========================================');
        console.log('✅ Service health check completed');
        console.log('🔍 SMS service test executed');
        console.log('🔍 Email service test via booking executed');
        console.log('📋 Check your phone and email for actual messages');
        console.log('📋 Check server logs for detailed sending status');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Response data:', error.response.data);
            console.error('   Response status:', error.response.status);
        }
    }
}

// Run the test
testActualNotifications()
    .then(() => {
        console.log('\n✅ Notification test completed!');
        console.log('📋 Next steps:');
        console.log('1. Check your phone (+14695251001) for SMS');
        console.log('2. Check email (dolovedev@gmail.com) for booking confirmation');
        console.log('3. Review server logs for actual sending attempts');
        console.log('4. If no messages received, check API keys and service configurations');
    })
    .catch(error => {
        console.error('\n💥 Test suite failed:', error.message);
        process.exit(1);
    });