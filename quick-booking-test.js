#!/usr/bin/env node

/**
 * Quick Booking API Test
 */

const fetch = require('node-fetch');

const testBooking = {
    service_type: '60min',
    practitioner_id: '060863f2-0623-4785-b01a-f1760cfb8d14',
    scheduled_date: '2025-07-01T15:30:00.000Z',
    client_name: 'Test User API',
    client_email: `api.test.${Date.now()}@example.com`,
    client_phone: '555-9999',
    special_requests: 'API test booking',
    create_account: false
};

async function testBookingAPI() {
    console.log('🧪 Quick Booking API Test');
    console.log('========================');
    console.log(`📧 Test Email: ${testBooking.client_email}`);

    try {
        const response = await fetch('https://ittheal.com/api/web-booking/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testBooking)
        });

        const data = await response.json();

        console.log(`📊 Response Status: ${response.status}`);
        console.log(`✅ Response Data:`, data);

        if (response.ok && data.success) {
            console.log('\n🎉 BOOKING API WORKS!');
            console.log('✅ Website can now create bookings');
            console.log('✅ Bookings should appear in admin dashboard');
            console.log(`📧 Search admin for: ${testBooking.client_email}`);
        } else {
            console.log('\n❌ Booking failed');
            console.log('📋 Error details:', data);
        }

    } catch (error) {
        console.error('❌ API test failed:', error.message);
    }
}

testBookingAPI().catch(console.error);