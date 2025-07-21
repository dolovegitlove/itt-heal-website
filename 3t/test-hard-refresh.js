const { chromium } = require('playwright');

async function testHardRefresh() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    args: ['--window-size=1200,900', '--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--disable-features=VizDisplayCompositor']
  });

  try {
    const context = await browser.newContext({
      // Disable cache
      httpCredentials: undefined,
      offline: false,
      extraHTTPHeaders: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    const page = await context.newPage();
    
    // Clear all caches
    await context.clearCookies();
    await context.clearPermissions();
    
    console.log('🔍 Testing with hard refresh and cache clearing...');
    
    // Go to page with no cache
    await page.goto('https://ittheal.com/3t/', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Force reload
    await page.reload({ waitUntil: 'networkidle' });
    
    // Wait a bit more
    await page.waitForTimeout(3000);
    
    // Check elements now
    const elementsExist = await page.evaluate(() => {
      const step6 = document.getElementById('payment-confirmation');
      const step7 = document.getElementById('thank-you-page');
      const functions = {
        showPaymentConfirmation: typeof showPaymentConfirmation === 'function',
        showThankYouPage: typeof showThankYouPage === 'function'
      };
      
      return {
        step6Exists: !!step6,
        step7Exists: !!step7,
        functionsExist: functions,
        documentLength: document.documentElement.innerHTML.length,
        hasPaymentConfirmationText: document.documentElement.innerHTML.includes('payment-confirmation'),
        hasThankYouPageText: document.documentElement.innerHTML.includes('thank-you-page'),
        hasShowPaymentConfirmationFunction: document.documentElement.innerHTML.includes('showPaymentConfirmation'),
        bodyChildrenCount: document.body.children.length
      };
    });
    
    console.log('\n🔍 Hard Refresh Test Results:');
    console.log('Step 6 exists:', elementsExist.step6Exists);
    console.log('Step 7 exists:', elementsExist.step7Exists);
    console.log('Functions exist:', elementsExist.functionsExist);
    console.log('Document length:', elementsExist.documentLength);
    console.log('Has payment-confirmation text:', elementsExist.hasPaymentConfirmationText);
    console.log('Has thank-you-page text:', elementsExist.hasThankYouPageText);
    console.log('Has showPaymentConfirmation function:', elementsExist.hasShowPaymentConfirmationFunction);
    console.log('Body children count:', elementsExist.bodyChildrenCount);
    
    // Check if there's a specific section that might be missing
    const bookingSection = await page.evaluate(() => {
      const bookingEl = document.getElementById('booking');
      if (!bookingEl) return { found: false };
      
      const childrenIds = Array.from(bookingEl.querySelectorAll('[id]')).map(el => el.id);
      
      return {
        found: true,
        childrenCount: bookingEl.children.length,
        childrenIds: childrenIds,
        hasPaymentConfirmation: childrenIds.includes('payment-confirmation'),
        hasThankYouPage: childrenIds.includes('thank-you-page'),
        innerHTML: bookingEl.innerHTML.substring(bookingEl.innerHTML.length - 500) // Last 500 chars
      };
    });
    
    console.log('\n📋 Booking Section Analysis:');
    console.log('Found booking section:', bookingSection.found);
    if (bookingSection.found) {
      console.log('Children count:', bookingSection.childrenCount);
      console.log('Has payment-confirmation:', bookingSection.hasPaymentConfirmation);
      console.log('Has thank-you-page:', bookingSection.hasThankYouPage);
      console.log('Last 500 chars of booking section:', bookingSection.innerHTML);
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testHardRefresh().catch(console.error);