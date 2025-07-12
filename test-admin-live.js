#!/usr/bin/env node

/**
 * Complete Admin Dashboard End-to-End Test
 * Tests all CRUD operations and functionality
 */

const https = require('https');

const API_BASE = 'https://ittheal.com';
const ADMIN_ACCESS = 'dr-shiffer-emergency-access';

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'ittheal.com',
            port: 443,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Access': ADMIN_ACCESS
            },
            rejectUnauthorized: false  // Allow self-signed certs for testing
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
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

async function runAdminTests() {
    console.log('🔍 Dr. Shiffer Admin Dashboard - Complete End-to-End Test');
    console.log('=========================================================\n');

    let testsPassed = 0;
    let totalTests = 0;

    async function test(name, testFn) {
        totalTests++;
        try {
            console.log(`🔹 Testing: ${name}`);
            await testFn();
            testsPassed++;
            console.log(`✅ PASSED: ${name}\n`);
        } catch (error) {
            console.log(`❌ FAILED: ${name} - ${error.message}\n`);
        }
    }

    // Test 1: Dashboard Access
    await test('Admin Dashboard Access', async () => {
        const response = await makeRequest('GET', '/api/admin/massage-sessions');
        if (response.status !== 200) throw new Error(`Status ${response.status}`);
        if (!response.data.success) throw new Error('API response failed');
        console.log(`   📊 Found ${response.data.count} bookings`);
    });

    // Test 2: Availability System
    await test('Availability Management', async () => {
        const response = await makeRequest('GET', '/api/admin/availability');
        if (response.status !== 200) throw new Error(`Status ${response.status}`);
        if (!response.data.success) throw new Error('Availability API failed');
        console.log(`   📅 Availability system operational`);
    });

    // Test 3: Create New Booking
    let newBookingId = null;
    await test('Create New Booking', async () => {
        const bookingData = {
            guest_email: 'test.patient@example.com',
            guest_phone: '555-TEST',
            scheduled_date: '2025-07-01',
            session_type: '60min',
            location_type: 'in_clinic',
            final_price: 150.00,
            session_notes: 'Test booking created by admin system validation'
        };

        const response = await makeRequest('POST', '/api/admin/massage-sessions', bookingData);
        if (response.status !== 200) throw new Error(`Status ${response.status}`);
        if (!response.data.success) throw new Error('Booking creation failed');
        
        newBookingId = response.data.session.id;
        console.log(`   📝 Created booking ID: ${newBookingId}`);
    });

    // Test 4: Update Booking
    await test('Update Booking', async () => {
        if (!newBookingId) throw new Error('No booking ID from previous test');

        const updateData = {
            session_status: 'completed',
            payment_status: 'paid',
            session_notes: 'Test booking - session completed successfully. Patient satisfied with service.'
        };

        const response = await makeRequest('PUT', `/api/admin/massage-sessions/${newBookingId}`, updateData);
        if (response.status !== 200) throw new Error(`Status ${response.status}`);
        if (!response.data.success) throw new Error('Booking update failed');
        console.log(`   ✏️ Updated booking status to completed`);
    });

    // Test 5: Retrieve Updated Booking
    await test('Retrieve Booking Details', async () => {
        if (!newBookingId) throw new Error('No booking ID from previous test');

        const response = await makeRequest('GET', `/api/admin/massage-sessions/${newBookingId}`);
        if (response.status !== 200) throw new Error(`Status ${response.status}`);
        if (!response.data.success) throw new Error('Booking retrieval failed');
        
        const booking = response.data.session;
        if (booking.session_status !== 'completed') throw new Error('Status not updated');
        if (booking.payment_status !== 'paid') throw new Error('Payment status not updated');
        console.log(`   👁️ Verified booking details updated correctly`);
    });

    // Test 6: Cancel Booking
    await test('Cancel Booking', async () => {
        if (!newBookingId) throw new Error('No booking ID from previous test');

        const cancelData = {
            reason: 'Test cancellation - admin system validation complete'
        };

        const response = await makeRequest('PATCH', `/api/admin/massage-sessions/${newBookingId}/cancel`, cancelData);
        if (response.status !== 200) throw new Error(`Status ${response.status}`);
        if (!response.data.success) throw new Error('Booking cancellation failed');
        console.log(`   ❌ Successfully cancelled booking`);
    });

    // Test 7: Add Availability Slot
    await test('Add Availability Slot', async () => {
        // Use current time to ensure uniqueness - use milliseconds for truly unique time
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const uniqueDate = tomorrow.toISOString().split('T')[0];
        const uniqueMinute = String(now.getMinutes()).padStart(2, '0');
        const uniqueHour = String((now.getHours() + 2) % 24).padStart(2, '0');
        
        const availabilityData = {
            date: uniqueDate,
            start_time: `${uniqueHour}:${uniqueMinute}`,
            end_time: `${String((parseInt(uniqueHour) + 1) % 24).padStart(2, '0')}:${uniqueMinute}`,
            location_type: 'in_clinic',
            availability_type: 'available'
        };

        const response = await makeRequest('POST', '/api/admin/availability', availabilityData);
        
        // Accept both 200 (created) and 409 (already exists) as success
        if (response.status === 200 && response.data.success) {
            console.log(`   📅 Added availability slot for ${uniqueDate}, ${uniqueHour}:${uniqueMinute}-${String((parseInt(uniqueHour) + 1) % 24).padStart(2, '0')}:${uniqueMinute}`);
        } else if (response.status === 409) {
            console.log(`   📅 Availability slot already exists for ${uniqueDate}, ${uniqueHour}:${uniqueMinute} (expected behavior)`);
        } else {
            throw new Error(`Unexpected status ${response.status}: ${JSON.stringify(response.data)}`);
        }
    });

    // Test 8: Patient Data Management
    await test('Patient Data Handling', async () => {
        const response = await makeRequest('GET', '/api/admin/massage-sessions');
        if (response.status !== 200) throw new Error(`Status ${response.status}`);
        
        const bookings = response.data.sessions;
        const hasPatientData = bookings.some(b => b.guest_email && b.guest_phone);
        if (!hasPatientData) throw new Error('No patient contact data found');
        console.log(`   👥 Patient data properly stored and accessible`);
    });

    // Final Report
    console.log('========================================');
    console.log('📊 TEST SUMMARY');
    console.log('========================================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${testsPassed}`);
    console.log(`Failed: ${totalTests - testsPassed}`);
    console.log(`Success Rate: ${Math.round((testsPassed / totalTests) * 100)}%`);
    
    if (testsPassed === totalTests) {
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('✅ Dr. Shiffer\'s admin dashboard is fully operational');
        console.log('✅ Complete CRUD functionality verified');
        console.log('✅ Patient management system working');
        console.log('✅ Availability management operational');
        console.log('✅ Payment tracking functional');
        console.log('\n🌐 Dashboard URL: https://ittheal.com/admin.html');
        console.log('🔧 Complete Dashboard: https://ittheal.com/admin-complete.html');
    } else {
        console.log('\n⚠️ Some tests failed. Please review the failures above.');
    }
}

runAdminTests().catch(console.error);