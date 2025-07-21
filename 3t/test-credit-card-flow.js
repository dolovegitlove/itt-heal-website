const { chromium } = require('playwright');

async function testCreditCardFlow() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    // Add console log listener
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Payment confirmation') || text.includes('404') || text.includes('endpoint not found')) {
        console.log(`Browser: ${text}`);
      }
    });
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🎯 Testing credit card payment flow...\n');
    
    // Quick booking flow
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(1000);
    
    await page.click('[role="gridcell"]:not(.disabled)');
    await page.waitForTimeout(500);
    
    await page.evaluate(() => {
      const timeSelect = document.getElementById('booking-time');
      if (timeSelect && timeSelect.options.length > 1) {
        timeSelect.selectedIndex = 1;
        timeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('#next-btn');
    await page.waitForTimeout(500);
    
    await page.fill('#client-name', 'Test User');
    await page.fill('#client-email', 'test@example.com');
    await page.fill('#client-phone', '940-555-1234');
    await page.click('#next-btn');
    await page.waitForTimeout(500);
    
    // Keep credit card selected (it's the default)
    console.log('💳 Using credit card payment (default)...');
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    const atSummary = await page.evaluate(() => {
      const summary = document.getElementById('booking-summary');
      return summary && window.getComputedStyle(summary).display !== 'none';
    });
    
    if (atSummary) {
      console.log('✅ At booking summary\n');
      
      // For credit card, we need to fill card details
      console.log('Checking for Stripe elements...');
      const stripeExists = await page.evaluate(() => {
        return typeof Stripe !== 'undefined';
      });
      
      if (stripeExists) {
        console.log('Stripe loaded but skipping card entry for test\n');
      }
      
      // Check what happens with the current flow
      const result = await page.evaluate(() => {
        const btn = document.getElementById('confirm-booking-btn');
        const status = document.getElementById('booking-status');
        return {
          buttonEnabled: btn && !btn.disabled,
          statusText: status?.textContent || 'no status'
        };
      });
      
      console.log('Confirm button enabled:', result.buttonEnabled);
      console.log('Current status:', result.statusText);
      
      console.log('\n⚠️ Note: Credit card payment requires valid Stripe payment details');
      console.log('The thank you message will only show after successful payment processing');
      console.log('which requires the /api/web-booking/confirm-payment endpoint to exist');
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testCreditCardFlow().catch(console.error);