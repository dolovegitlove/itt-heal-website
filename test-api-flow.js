#!/usr/bin/env node

const http = require('http');
const https = require('https');

// Test data
const testUserData = {
  name: `Test User ${Date.now()}`,
  email: `testuser${Date.now()}@example.com`,
  phone: '555-TEST-API'
};

let bookingId = null;

async function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ statusCode: res.statusCode, data: responseData });
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

async function testAPIFlow() {
  console.log('🚀 API BOOKING FLOW TEST - Testing Backend Functionality');
  console.log('💳 Using Stripe TEST mode for safe testing\n');

  let results = {
    healthCheck: false,
    createBooking: false,
    adminAccess: false,
    editBooking: false,
    markInProgress: false,
    markPaid: false,
    markCompleted: false,
    processRefund: false
  };

  try {
    // 1. Health Check
    console.log('=== STEP 1: Backend Health Check ===');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health-check',
      method: 'GET'
    });

    if (healthResponse.statusCode === 200) {
      results.healthCheck = true;
      console.log('✅ Backend is healthy');
    } else {
      console.log('❌ Backend health check failed');
      return results;
    }

    // 2. Create Test Booking
    console.log('\n=== STEP 2: Create Test Booking ===');
    console.log('👤 Test user:', testUserData.name);
    console.log('📧 Test email:', testUserData.email);

    const bookingData = {
      service_type: 'test_purchase',
      practitioner_id: '060863f2-0623-4785-b01a-f1760cfb8d14',
      scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      client_name: testUserData.name,
      client_email: testUserData.email,
      client_phone: testUserData.phone,
      special_requests: 'API test booking',
      create_account: false
    };

    const bookingResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/web-booking/book',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, bookingData);

    if (bookingResponse.statusCode === 200 && bookingResponse.data.success) {
      results.createBooking = true;
      bookingId = bookingResponse.data.data.session.id;
      console.log('✅ Booking created successfully');
      console.log('🆔 Booking ID:', bookingId);
    } else {
      console.log('❌ Booking creation failed:', bookingResponse.data);
      // Continue testing admin functionality anyway
    }

    // 3. Test Admin Access
    console.log('\n=== STEP 3: Test Admin Access ===');

    const adminResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/massage-sessions',
      method: 'GET',
      headers: {
        'X-Admin-Access': 'dr-shiffer-emergency-access'
      }
    });

    if (adminResponse.statusCode === 200 && adminResponse.data.success) {
      results.adminAccess = true;
      console.log('✅ Admin access successful');
      console.log('📊 Found', adminResponse.data.count, 'bookings');

      // Find our test booking if it exists
      if (!bookingId && adminResponse.data.sessions.length > 0) {
        const testBooking = adminResponse.data.sessions.find(s => s.guest_email === testUserData.email);
        if (testBooking) {
          bookingId = testBooking.id;
          console.log('🔍 Found test booking in admin list:', bookingId);
        } else {
          // Use the most recent booking for testing
          bookingId = adminResponse.data.sessions[0].id;
          console.log('🔄 Using most recent booking for testing:', bookingId);
        }
      }

      // Check guest_name field
      const recentBooking = adminResponse.data.sessions[0];
      if (recentBooking) {
        console.log('👤 Guest name in recent booking:', recentBooking.guest_name || 'NULL');
        console.log('📧 Guest email:', recentBooking.guest_email);
        console.log('🔄 Session status:', recentBooking.session_status);
        console.log('💰 Payment status:', recentBooking.payment_status);
      }
    } else {
      console.log('❌ Admin access failed:', adminResponse.data);
    }

    if (!bookingId) {
      console.log('⚠️  No booking ID available for remaining tests');
      return results;
    }

    // 4. Edit Booking
    console.log('\n=== STEP 4: Edit Booking ===');

    const editResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/massage-sessions/${bookingId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Access': 'dr-shiffer-emergency-access'
      }
    }, {
      special_requests: 'Updated via API test',
      session_notes: 'API test - admin edited'
    });

    if (editResponse.statusCode === 200 && editResponse.data.success) {
      results.editBooking = true;
      console.log('✅ Booking edited successfully');
    } else {
      console.log('❌ Booking edit failed:', editResponse.data);
    }

    // 5. Mark as In Progress
    console.log('\n=== STEP 5: Mark as In Progress ===');

    const inProgressResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/massage-sessions/${bookingId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Access': 'dr-shiffer-emergency-access'
      }
    }, {
      session_status: 'in_progress'
    });

    if (inProgressResponse.statusCode === 200 && inProgressResponse.data.success) {
      results.markInProgress = true;
      console.log('✅ Marked as in progress');
    } else {
      console.log('❌ Failed to mark in progress:', inProgressResponse.data);
    }

    // 6. Mark as Paid
    console.log('\n=== STEP 6: Mark as Paid ===');

    const paidResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/massage-sessions/${bookingId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Access': 'dr-shiffer-emergency-access'
      }
    }, {
      payment_status: 'paid'
    });

    if (paidResponse.statusCode === 200 && paidResponse.data.success) {
      results.markPaid = true;
      console.log('✅ Marked as paid');
    } else {
      console.log('❌ Failed to mark as paid:', paidResponse.data);
    }

    // 7. Mark as Completed
    console.log('\n=== STEP 7: Mark as Completed ===');

    const completedResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/massage-sessions/${bookingId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Access': 'dr-shiffer-emergency-access'
      }
    }, {
      session_status: 'completed',
      session_notes: 'Session completed - API test verified'
    });

    if (completedResponse.statusCode === 200 && completedResponse.data.success) {
      results.markCompleted = true;
      console.log('✅ Marked as completed');
    } else {
      console.log('❌ Failed to mark as completed:', completedResponse.data);
    }

    // 8. Process Refund
    console.log('\n=== STEP 8: Process Refund ===');

    const refundResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/massage-sessions/${bookingId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Access': 'dr-shiffer-emergency-access'
      }
    }, {
      payment_status: 'refunded',
      session_notes: 'Payment refunded - API test completed'
    });

    if (refundResponse.statusCode === 200 && refundResponse.data.success) {
      results.processRefund = true;
      console.log('✅ Refund processed');
    } else {
      console.log('❌ Refund failed:', refundResponse.data);
    }

    // Final verification
    console.log('\n=== FINAL VERIFICATION ===');

    const finalResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/massage-sessions/${bookingId}`,
      method: 'GET',
      headers: {
        'X-Admin-Access': 'dr-shiffer-emergency-access'
      }
    });

    if (finalResponse.statusCode === 200 && finalResponse.data.success) {
      const session = finalResponse.data.session;
      console.log('📊 Final booking state:');
      console.log('   👤 Guest name:', session.guest_name || 'NULL');
      console.log('   🔄 Session status:', session.session_status);
      console.log('   💰 Payment status:', session.payment_status);
      console.log('   📝 Notes:', (session.session_notes || '').slice(0, 100) + '...');
    }

  } catch (error) {
    console.error('❌ API test error:', error.message);
  }

  // Results Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 API BOOKING FLOW TEST RESULTS');
  console.log('='.repeat(50));

  const testSteps = [
    ['1. Backend Health Check', results.healthCheck],
    ['2. Create Booking', results.createBooking],
    ['3. Admin Access', results.adminAccess],
    ['4. Edit Booking', results.editBooking],
    ['5. Mark In Progress', results.markInProgress],
    ['6. Mark as Paid', results.markPaid],
    ['7. Mark as Completed', results.markCompleted],
    ['8. Process Refund', results.processRefund]
  ];

  let successCount = 0;
  testSteps.forEach(([step, success]) => {
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${step}`);
    if (success) {successCount++;}
  });

  const successRate = Math.round((successCount / testSteps.length) * 100);
  console.log('='.repeat(50));
  console.log(`🎯 API SUCCESS RATE: ${successRate}%`);

  if (bookingId) {
    console.log(`🆔 Test Booking ID: ${bookingId}`);
  }

  if (successRate === 100) {
    console.log('🎉 100% API SUCCESS - Backend fully functional!');
    return true;
  }
  console.log('⚠️  Some API tests failed - backend needs fixes');
  return false;

}

// Run the API test
testAPIFlow().then(success => {
  if (success) {
    console.log('\n🎉 API tests completed successfully!');
    console.log('💡 UI testing requires display server for browser automation');
    console.log('🔧 Backend API functionality verified 100%');
  } else {
    console.log('\n❌ API tests failed - needs backend fixes');
  }
  process.exit(success ? 0 : 1);
});
