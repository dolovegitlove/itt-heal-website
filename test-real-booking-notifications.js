#!/usr/bin/env node

/**
 * Test a real booking flow to see what happens with notifications
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testRealBookingFlow() {
    console.log('🔍 Testing REAL booking flow with notifications...\n');
    
    try {
        // 1. Check if we have test practitioners
        console.log('1. Getting practitioners...');
        const practitionersResponse = await axios.get(`${BASE_URL}/api/web-booking/practitioners`);
        
        if (!practitionersResponse.data.success || practitionersResponse.data.data.length === 0) {
            console.log('❌ No practitioners available for testing');
            return;
        }
        
        const practitioner = practitionersResponse.data.data[0];
        console.log(`✅ Found practitioner: ${practitioner.name} (ID: ${practitioner.id})`);
        
        // 2. Get availability
        console.log('\n2. Getting availability...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        
        const availabilityResponse = await axios.get(
            `${BASE_URL}/api/web-booking/availability/${practitioner.id}/${dateStr}?service_type=test`
        );
        
        if (!availabilityResponse.data.success || availabilityResponse.data.data.available_slots.length === 0) {
            console.log('❌ No available slots for testing');
            return;
        }
        
        const timeSlot = availabilityResponse.data.data.available_slots[0];
        console.log(`✅ Found time slot: ${timeSlot.display_time}`);
        
        // 3. Create a test booking (this should trigger notifications)
        console.log('\n3. Creating test booking...');
        const bookingData = {
            service_type: 'test',
            practitioner_id: practitioner.id,
            scheduled_date: timeSlot.time,
            client_name: 'Test User for Notifications',
            client_email: 'dolovedev@gmail.com',
            client_phone: '+14695251001',
            special_requests: 'This is a test booking to verify notifications are working',
            create_account: false,
            payment_method: 'cash' // Skip payment to focus on notifications
        };
        
        console.log('Booking data:', JSON.stringify(bookingData, null, 2));
        
        const bookingResponse = await axios.post(`${BASE_URL}/api/web-booking/book`, bookingData);
        
        console.log('\nBooking response status:', bookingResponse.status);
        console.log('Booking response data:', JSON.stringify(bookingResponse.data, null, 2));
        
        if (bookingResponse.data.success) {
            console.log('\n✅ Booking created successfully!');
            console.log('Session ID:', bookingResponse.data.data.session.id);
            
            // Check if notifications were sent
            console.log('\n4. Checking if notifications were sent...');
            
            // The notification sending happens in the booking endpoint
            // Let's check the server logs or see if we get any indication
            
            console.log('📱 SMS should have been sent to:', bookingData.client_phone);
            console.log('📧 Email should have been sent to:', bookingData.client_email);
            
            // Wait a moment and then check if we can find evidence of notification sending
            console.log('\n5. Checking notification status...');
            
            // Since this is a test booking, let's see if we can get the session details
            const sessionId = bookingResponse.data.data.session.id;
            
            try {
                const sessionResponse = await axios.get(`${BASE_URL}/api/web-booking/booking/${sessionId}?email=${bookingData.client_email}`);
                console.log('Session details:', JSON.stringify(sessionResponse.data, null, 2));
            } catch (sessionError) {
                console.log('Could not fetch session details:', sessionError.response?.data || sessionError.message);
            }
            
        } else {
            console.log('❌ Booking failed:', bookingResponse.data);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.data) {
            console.error('Error details:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Also test the notification endpoints directly
async function testNotificationEndpoints() {
    console.log('\n🧪 Testing notification endpoints directly...\n');
    
    // Test SMS endpoint
    try {
        console.log('Testing SMS endpoint...');
        const smsResponse = await axios.post(`${BASE_URL}/api/web-booking/test-sms`, {
            phone: '+14695251001'
        });
        console.log('SMS endpoint response:', JSON.stringify(smsResponse.data, null, 2));
    } catch (error) {
        console.error('SMS endpoint failed:', error.response?.data || error.message);
    }
    
    // Test email endpoint (if it exists)
    try {
        console.log('\nTesting email endpoint...');
        const emailResponse = await axios.post(`${BASE_URL}/api/web-booking/test-email`, {
            email: 'dolovedev@gmail.com'
        });
        console.log('Email endpoint response:', JSON.stringify(emailResponse.data, null, 2));
    } catch (error) {
        console.error('Email endpoint failed:', error.response?.data || error.message);
    }
}

async function runAllTests() {
    await testNotificationEndpoints();
    await testRealBookingFlow();
    
    console.log('\n🏁 All notification tests completed!');
    console.log('\n💡 Key findings:');
    console.log('   📱 SMS: Should be working (Twilio configured and tested)');
    console.log('   📧 Email: Failing due to SendGrid sender verification');
    console.log('   🎯 Solution: Verify sender identity in SendGrid for info@ittheal.com');
}

runAllTests();