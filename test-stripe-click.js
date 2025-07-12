#!/usr/bin/env node

/**
 * Simple real browser test for Stripe button click
 */

const { exec } = require('child_process');
const fs = require('fs');

async function testStripeClick() {
  console.log('🚀 Testing Stripe button click in real browser...');

  // Create a simple HTML test page that will open admin and test the button
  const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Stripe Button Test</title>
</head>
<body>
    <h1>Testing Stripe Button</h1>
    <p>Opening admin panel...</p>
    
    <script>
        // Open admin panel
        window.open('https://ittheal.com/admin', '_blank');
        
        // Wait and then run test
        setTimeout(() => {
            console.log('Test completed - check browser console for results');
        }, 5000);
    </script>
    
    <iframe src="https://ittheal.com/admin" width="100%" height="800px"></iframe>
</body>
</html>`;

  // Write test file
  fs.writeFileSync('/tmp/stripe-test.html', testHTML);
  
  console.log('📱 Opening browser test...');
  
  // Open in default browser
  exec('xdg-open /tmp/stripe-test.html', (error) => {
    if (error) {
      console.log('⚠️ Could not open browser automatically');
      console.log('📂 Manual test file created at: /tmp/stripe-test.html');
      console.log('🌐 Or navigate directly to: https://ittheal.com/admin');
    } else {
      console.log('✅ Browser opened with test page');
    }
  });

  console.log('\n🎯 Manual Test Steps:');
  console.log('1. Go to Bookings tab');
  console.log('2. Click Edit on any booking');
  console.log('3. Select Credit Card payment');
  console.log('4. Enter amount (e.g., 100)');
  console.log('5. Click "Process Stripe Payment" button');
  console.log('6. Check browser console for errors');
  
  console.log('\n✅ Expected: No "toFixed" or "undefined" errors');
  console.log('❌ Report any JavaScript errors that appear');
}

testStripeClick();