#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testClientNameCapture() {
  console.log('🧪 Testing client name capture in booking flow...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Navigate to booking page
    console.log('📱 Navigating to ittheal.com...');
    await page.goto('https://ittheal.com', { waitUntil: 'networkidle2' });
    
    // Click "Book Now" or equivalent
    await page.click('button[onclick="showBookingForm()"]');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fill out booking form with test client name
    const testClientName = 'Test Client Smith';
    const testEmail = 'testclient@example.com';
    const testPhone = '555-123-4567';
    
    console.log(`📝 Filling form with client name: ${testClientName}`);
    
    // Fill client name field
    await page.type('input[name="client_name"]', testClientName);
    await page.type('input[name="client_email"]', testEmail);
    await page.type('input[name="client_phone"]', testPhone);
    
    // Select test purchase option
    await page.click('input[value="test_purchase"]');
    
    // Submit booking form
    console.log('📤 Submitting booking...');
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await page.waitForSelector('.success-message, .booking-success', { timeout: 10000 });
    console.log('✅ Booking submitted successfully');
    
    // Now check admin dashboard for the booking
    console.log('🔍 Checking admin dashboard...');
    
    const adminResponse = await page.evaluate(async () => {
      const response = await fetch('/admin/massage-sessions', {
        headers: {
          'X-Admin-Access': 'dr-shiffer-emergency-access'
        }
      });
      return await response.json();
    });
    
    console.log('📊 Admin response:', JSON.stringify(adminResponse, null, 2));
    
    // Find the most recent booking
    const recentBooking = adminResponse.sessions?.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )[0];
    
    if (recentBooking?.guest_name) {
      console.log(`✅ SUCCESS: Client name captured: "${recentBooking.guest_name}"`);
      console.log(`📧 Email: ${recentBooking.guest_email}`);
      console.log(`📞 Phone: ${recentBooking.guest_phone}`);
      return true;
    } else {
      console.log('❌ FAILED: Client name not found in booking record');
      console.log('Recent booking:', recentBooking);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testClientNameCapture().then(success => {
  process.exit(success ? 0 : 1);
});