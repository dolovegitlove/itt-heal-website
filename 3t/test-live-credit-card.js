const { chromium } = require('playwright');

async function testLiveCreditCard() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    // Capture console logs and network requests
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('API') || text.includes('confirm-payment') || text.includes('Thank') || text.includes('ERROR') || text.includes('FAILED')) {
        console.log(`[LIVE] ${text}`);
      }
    });
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('confirm-payment') || url.includes('web-booking')) {
        console.log(`[API] ${response.status()} ${url}`);
      }
    });
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🎯 Testing LIVE credit card payment flow...\n');
    
    // Complete booking flow
    await page.click('[data-service="60min"]');
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
    
    await page.fill('#client-name', 'Credit Test User');
    await page.fill('#client-email', 'creditest@example.com');
    await page.fill('#client-phone', '940-555-8888');
    await page.click('#next-btn');
    await page.waitForTimeout(500);
    
    // Keep credit card selected (default)
    console.log('💳 Using credit card payment (default)...');
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    console.log('✅ At booking summary');
    
    // Check what happens when we click confirm
    const beforeClick = await page.evaluate(() => {
      const btn = document.getElementById('confirm-booking-btn');
      const stripeExists = typeof Stripe !== 'undefined';
      const cardElement = document.querySelector('#card-element');
      
      return {
        buttonEnabled: btn && !btn.disabled,
        buttonText: btn?.textContent || 'no button',
        stripeLoaded: stripeExists,
        cardElementExists: !!cardElement,
        cardElementVisible: cardElement && window.getComputedStyle(cardElement).display !== 'none'
      };
    });
    
    console.log('Pre-click state:', beforeClick);
    
    if (!beforeClick.cardElementVisible) {
      console.log('⚠️ Card element not visible - this may prevent payment');
    }
    
    console.log('🎯 Clicking confirm booking for credit card...');
    await page.click('#confirm-booking-btn');
    
    // Wait for processing
    await page.waitForTimeout(10000);
    
    const afterClick = await page.evaluate(() => {
      const status = document.getElementById('booking-status');
      const thankYouContent = document.getElementById('thank-you-content');
      
      return {
        statusText: status?.textContent || 'no status',
        statusHTML: status?.innerHTML || 'no HTML',
        thankYouExists: !!thankYouContent,
        thankYouVisible: thankYouContent && window.getComputedStyle(thankYouContent).display !== 'none'
      };
    });
    
    console.log('\n📊 CREDIT CARD RESULTS:');
    console.log('Status text:', afterClick.statusText);
    console.log('Thank you exists:', afterClick.thankYouExists);
    console.log('Thank you visible:', afterClick.thankYouVisible);
    console.log('Status HTML preview:', afterClick.statusHTML.substring(0, 300));
    
    if (afterClick.statusText.includes('card details') || afterClick.statusText.includes('payment information')) {
      console.log('\n💡 EXPECTED: Credit card requires valid card details to complete');
      console.log('This is normal behavior - credit cards need Stripe payment processing');
    } else if (afterClick.thankYouExists && afterClick.thankYouVisible) {
      console.log('\n✅ SUCCESS: Credit card thank you message working');
    } else {
      console.log('\n❌ Issue with credit card flow');
    }
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Live credit card test error:', error);
  } finally {
    await browser.close();
  }
}

testLiveCreditCard().catch(console.error);