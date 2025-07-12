#!/usr/bin/env node

const http = require('http');

// Test data for a guest booking
const testBooking = {
  service_type: 'test_purchase',
  practitioner_id: '060863f2-0623-4785-b01a-f1760cfb8d14', // Dr. Shiffer's ID
  scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  client_name: 'Test Client Johnson',
  client_email: 'testclient.johnson@example.com',
  client_phone: '555-987-6543',
  special_requests: 'Test booking to verify guest_name field',
  create_account: false // This makes it a guest booking
};

const postData = JSON.stringify(testBooking);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/web-booking/book',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🧪 Testing guest booking submission...');
console.log('📝 Test client name:', testBooking.client_name);

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📤 Response status:', res.statusCode);
    console.log('📋 Response data:', data);
    
    try {
      const response = JSON.parse(data);
      
      if (response.success && response.data.session) {
        const sessionId = response.data.session.id;
        console.log('✅ Booking created successfully!');
        console.log('🆔 Session ID:', sessionId);
        
        // Now check admin API to verify guest_name was saved
        checkAdminAPI(sessionId);
      } else {
        console.log('❌ Booking failed:', response.error || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(postData);
req.end();

function checkAdminAPI(sessionId) {
  console.log('🔍 Checking admin API for guest_name...');
  
  const adminOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/massage-sessions',
    method: 'GET',
    headers: {
      'X-Admin-Access': 'dr-shiffer-emergency-access'
    }
  };
  
  const adminReq = http.request(adminOptions, (res) => {
    let adminData = '';
    
    res.on('data', (chunk) => {
      adminData += chunk;
    });
    
    res.on('end', () => {
      try {
        const adminResponse = JSON.parse(adminData);
        
        if (adminResponse.success) {
          // Find the session we just created
          const session = adminResponse.sessions.find(s => s.id === sessionId);
          
          if (session) {
            console.log('📊 Found booking in admin API:');
            console.log('👤 Client name:', session.guest_name || 'NULL');
            console.log('📧 Client email:', session.guest_email || 'NULL');
            console.log('📞 Client phone:', session.guest_phone || 'NULL');
            
            if (session.guest_name === testBooking.client_name) {
              console.log('✅ SUCCESS: guest_name field is working correctly!');
              console.log('🎉 Client name was properly captured and stored');
            } else {
              console.log('❌ FAILED: guest_name mismatch');
              console.log('Expected:', testBooking.client_name);
              console.log('Got:', session.guest_name);
            }
          } else {
            console.log('❌ Session not found in admin response');
          }
        } else {
          console.log('❌ Admin API error:', adminResponse.error || 'Unknown error');
        }
      } catch (error) {
        console.error('❌ Failed to parse admin response:', error.message);
        console.log('Raw admin response:', adminData);
      }
    });
  });
  
  adminReq.on('error', (error) => {
    console.error('❌ Admin request failed:', error.message);
  });
  
  adminReq.end();
}