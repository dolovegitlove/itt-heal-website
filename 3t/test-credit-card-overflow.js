const { chromium } = require('playwright');

async function testCreditCardOverflow() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    args: ['--window-size=375,812', '--no-sandbox', '--disable-setuid-sandbox'] // iPhone size
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 812 }); // Mobile viewport
    
    console.log('🔍 Testing credit card overflow on mobile viewport...');
    await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
    
    // Open modal
    console.log('\n📅 Opening booking modal...');
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(3000);
    
    // Skip to step 5 quickly
    console.log('\n⚡ Fast-forwarding to payment step...');
    for (let i = 0; i < 4; i++) {
      try {
        await page.click('#next-btn', { timeout: 2000 });
        await page.waitForTimeout(500);
      } catch (e) {
        console.log(`Step ${i + 2}: Next button not available`);
      }
    }
    
    // Check if we're at payment step
    const paymentStep = await page.evaluate(() => {
      const step5 = document.getElementById('step-5');
      const creditCard = document.getElementById('credit-card-section');
      const stripeElement = document.getElementById('stripe-card-element');
      const modal = document.getElementById('booking');
      
      return {
        step5Visible: step5 ? step5.style.display !== 'none' : false,
        creditCardExists: !!creditCard,
        creditCardDisplay: creditCard ? creditCard.style.display : 'not found',
        stripeElementExists: !!stripeElement,
        modalWidth: modal ? modal.offsetWidth : 0,
        modalScrollWidth: modal ? modal.scrollWidth : 0,
        hasHorizontalOverflow: modal ? modal.scrollWidth > modal.offsetWidth : false,
        bodyOverflow: document.body.scrollWidth > window.innerWidth
      };
    });
    
    console.log('\n📊 Credit Card Overflow Analysis:');
    console.log('Step 5 visible:', paymentStep.step5Visible);
    console.log('Credit card section exists:', paymentStep.creditCardExists);
    console.log('Credit card display:', paymentStep.creditCardDisplay);
    console.log('Stripe element exists:', paymentStep.stripeElementExists);
    console.log('Modal width:', paymentStep.modalWidth);
    console.log('Modal scroll width:', paymentStep.modalScrollWidth);
    console.log('Has horizontal overflow:', paymentStep.hasHorizontalOverflow);
    console.log('Body has overflow:', paymentStep.bodyOverflow);
    
    // Check CSS styles
    const cssAnalysis = await page.evaluate(() => {
      const modal = document.getElementById('booking');
      const creditCard = document.getElementById('credit-card-section');
      const stripeElement = document.getElementById('stripe-card-element');
      const mobileContainer = document.querySelector('#booking .mobile-container');
      
      if (!modal || !creditCard || !stripeElement) {
        return { error: 'Required elements not found' };
      }
      
      const modalStyle = window.getComputedStyle(modal);
      const creditCardStyle = window.getComputedStyle(creditCard);
      const stripeStyle = window.getComputedStyle(stripeElement);
      const containerStyle = mobileContainer ? window.getComputedStyle(mobileContainer) : null;
      
      return {
        modal: {
          width: modalStyle.width,
          maxWidth: modalStyle.maxWidth,
          boxSizing: modalStyle.boxSizing,
          overflow: modalStyle.overflow,
          overflowX: modalStyle.overflowX
        },
        creditCard: {
          width: creditCardStyle.width,
          maxWidth: creditCardStyle.maxWidth,
          boxSizing: creditCardStyle.boxSizing,
          overflow: creditCardStyle.overflow
        },
        stripeElement: {
          width: stripeStyle.width,
          maxWidth: stripeStyle.maxWidth,
          boxSizing: stripeStyle.boxSizing,
          overflow: stripeStyle.overflow
        },
        mobileContainer: containerStyle ? {
          width: containerStyle.width,
          maxWidth: containerStyle.maxWidth,
          boxSizing: containerStyle.boxSizing,
          overflow: containerStyle.overflow
        } : null
      };
    });
    
    console.log('\n🎨 CSS Styles Analysis:');
    console.log('Modal styles:', cssAnalysis.modal);
    console.log('Credit card styles:', cssAnalysis.creditCard);
    console.log('Stripe element styles:', cssAnalysis.stripeElement);
    console.log('Mobile container styles:', cssAnalysis.mobileContainer);
    
    // Take screenshot
    await page.screenshot({ path: 'credit-card-overflow-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved: credit-card-overflow-test.png');
    
    // Test result
    if (!paymentStep.hasHorizontalOverflow && !paymentStep.bodyOverflow) {
      console.log('\n✅ SUCCESS: No horizontal overflow detected!');
    } else {
      console.log('\n❌ ISSUE: Horizontal overflow still present');
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testCreditCardOverflow().catch(console.error);