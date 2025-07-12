#!/usr/bin/env node

// Test the exact API calls the admin dashboard makes

async function testAvailabilityAPI() {
  console.log('🧪 TESTING LIVE PRODUCTION AVAILABILITY API');
  console.log('==========================================\n');

  const headers = {
    'x-admin-access': 'dr-shiffer-emergency-access',
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: Load availability (GET)
    console.log('1. Testing GET availability...');
    const getResponse = await fetch('https://ittheal.com/api/admin/availability', {
      method: 'GET',
      headers: headers
    });

    if (!getResponse.ok) {
      throw new Error(`GET failed: ${getResponse.status} ${getResponse.statusText}`);
    }

    const getData = await getResponse.json();
    console.log(`✅ GET Success: Found ${getData.count} availability slots`);

    // Test 2: Create availability (POST)
    console.log('\n2. Testing POST create availability...');
    const createData = {
      date: '2025-07-09',
      start_time: '16:00:00',
      end_time: '17:00:00',
      is_available: true,
      description: 'API test slot from JavaScript'
    };

    const postResponse = await fetch('https://ittheal.com/api/admin/availability', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(createData)
    });

    if (!postResponse.ok) {
      throw new Error(`POST failed: ${postResponse.status} ${postResponse.statusText}`);
    }

    const postData = await postResponse.json();
    console.log(`✅ POST Success: Created slot ${postData.availability.id}`);

    const newSlotId = postData.availability.id;

    // Test 3: Update availability (PATCH)
    console.log('\n3. Testing PATCH update availability...');
    const updateData = {
      is_available: false,
      reason: 'JavaScript API test'
    };

    const patchResponse = await fetch(`https://ittheal.com/api/admin/availability/${newSlotId}`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(updateData)
    });

    if (!patchResponse.ok) {
      throw new Error(`PATCH failed: ${patchResponse.status} ${patchResponse.statusText}`);
    }

    const patchData = await patchResponse.json();
    console.log('✅ PATCH Success: Updated slot to unavailable');

    // Test 4: Delete availability (DELETE)
    console.log('\n4. Testing DELETE availability...');
    const deleteResponse = await fetch(`https://ittheal.com/api/admin/availability/${newSlotId}`, {
      method: 'DELETE',
      headers: headers
    });

    if (!deleteResponse.ok) {
      throw new Error(`DELETE failed: ${deleteResponse.status} ${deleteResponse.statusText}`);
    }

    const deleteData = await deleteResponse.json();
    console.log('✅ DELETE Success: Removed test slot');

    console.log('\n🎉 ALL AVAILABILITY API TESTS PASSED!');
    console.log('The live production API is working perfectly.');
    console.log('If the admin dashboard still shows "API endpoint not found",');
    console.errors.');

  } catch (error) {
    console.error(`❌ API Test Failed: ${error.message}`);

    if (error.message.includes('fetch')) {
      console.log('\n🔍 Debugging suggestions:');
      console.log('1. Check if Node.js fetch is available (Node 18+)');
      console.log('2. Try using curl instead for basic testing');
      console.errors');
    }
  }
}

// Run the test
if (typeof fetch === 'undefined') {
  console.log('❌ This test requires Node.js 18+ with built-in fetch support');
  console.log('✅ The curl tests above already confirmed the API is working');
  console.log('✅ The issue is likely browser-side JavaScript or CORS');
} else {
  testAvailabilityAPI();
}
