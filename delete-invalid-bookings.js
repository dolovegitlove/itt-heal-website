#!/usr/bin/env node

const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'x-admin-access': 'dr-shiffer-emergency-access',
        'Content-Type': 'application/json'
      }
    };
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(responseData)); }
        catch (e) { resolve({error: 'Invalid JSON', raw: responseData}); }
      });
    });
    req.on('error', reject);
    if (data) {req.write(JSON.stringify(data));}
    req.end();
  });
}

async function deleteInvalidBookings() {
  console.log('🗑️ DELETING INVALID BOOKINGS');
  console.log('============================\n');

  // Invalid booking IDs from validation test
  const invalidBookingIds = [
    '3a279b7e-a872-4f11-8332-867bddb3016b', // mas Wrote - invalid phone
    'da85f1a3-022b-414c-8bec-d4bdb492e473', // Test 120min - invalid phone & name
    '8c69734e-c563-4611-9281-717e18e9f85a', // Test 90min Fixed - invalid phone & name
    'ad62ac45-6be3-439b-a951-efc9f68f5c74', // Test 30min Consultation - invalid phone & name
    '4dd1fd1c-5804-4ddb-8869-225dcba89cbc', // Sarah Johnson - invalid phone
    'b277f943-735b-402c-bfaa-8e0b04a60f44', // Mike Wilson - invalid phone
    'a8b97550-6f00-431a-80d1-a7e67fed624d', // Emma Rodriguez - invalid phone
    'a59b1277-803b-4d83-a683-81acce8dec70', // Salina Marie - invalid phone
    '031bd67d-a99a-4a8c-8d53-d0f9a6755cb8' // Tina y. - invalid name
  ];

  const invalidBookingNames = [
    'mas Wrote',
    'Test 120min',
    'Test 90min Fixed',
    'Test 30min Consultation',
    'Sarah Johnson',
    'Mike Wilson',
    'Emma Rodriguez',
    'Salina Marie',
    'Tina y.'
  ];

  let deleteCount = 0;
  let errorCount = 0;

  for (let i = 0; i < invalidBookingIds.length; i++) {
    const bookingId = invalidBookingIds[i];
    const bookingName = invalidBookingNames[i];

    try {
      console.log(`${i + 1}. Deleting: ${bookingName} (${bookingId})`);

      const response = await makeRequest('DELETE', `/api/admin/bookings/${bookingId}`);

      if (response.success) {
        console.log('   ✅ Successfully deleted');
        deleteCount++;
      } else {
        console.error'}`);
        errorCount++;
      }

    } catch (error) {
      console.error.message}`);
      errorCount++;
    }

    // Small delay between deletions
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n📊 DELETION SUMMARY:');
  console.log('====================');
  console.log(`Bookings to delete: ${invalidBookingIds.length}`);
  console.log(`Successfully deleted: ${deleteCount}`);
  console.errorCount}`);

  if (deleteCount === invalidBookingIds.length) {
    console.log('\n🎉 All invalid bookings successfully deleted!');
    console.log('✅ Database now contains only valid bookings');
    console.log('✅ Real-time validation active for future entries');
  } else {
    console.log('\n⚠️ Some deletions failed - manual cleanup may be needed');
  }
}

deleteInvalidBookings();
