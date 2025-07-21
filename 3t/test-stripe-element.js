const { chromium } = require('playwright');

async function testStripeElement() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🎯 Debugging Stripe element visibility...\n');
    
    // Navigate to payment step
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
    
    await page.fill('#client-name', 'Stripe Test');
    await page.fill('#client-email', 'stripe@test.com');
    await page.fill('#client-phone', '940-555-7777');
    await page.click('#next-btn');
    await page.waitForTimeout(500);
    
    console.log('📋 At payment step - checking Stripe element...');
    
    const paymentStepState = await page.evaluate(() => {
      const creditCardRadio = document.getElementById('payment-method-card');
      const creditCardSection = document.getElementById('credit-card-section');
      const stripeElement = document.getElementById('stripe-card-element');
      
      return {
        creditCardChecked: creditCardRadio?.checked || false,
        creditCardSectionDisplay: creditCardSection ? window.getComputedStyle(creditCardSection).display : 'not found',
        creditCardSectionVisible: creditCardSection ? window.getComputedStyle(creditCardSection).visibility : 'not found',
        stripeElementExists: !!stripeElement,
        stripeElementDisplay: stripeElement ? window.getComputedStyle(stripeElement).display : 'not found',
        stripeElementVisible: stripeElement ? window.getComputedStyle(stripeElement).visibility : 'not found',
        stripeElementHTML: stripeElement?.innerHTML?.substring(0, 200) || 'no HTML',
        stripeLoaded: typeof Stripe !== 'undefined',
        cardElementMounted: !!window.cardElement
      };
    });
    
    console.log('📊 PAYMENT STEP STATE:');
    console.log('Credit card radio checked:', paymentStepState.creditCardChecked);
    console.log('Credit card section display:', paymentStepState.creditCardSectionDisplay);
    console.log('Stripe element exists:', paymentStepState.stripeElementExists);
    console.log('Stripe element display:', paymentStepState.stripeElementDisplay);
    console.log('Stripe element visible:', paymentStepState.stripeElementVisible);
    console.log('Stripe loaded:', paymentStepState.stripeLoaded);
    console.log('Card element mounted:', paymentStepState.cardElementMounted);
    console.log('Stripe element HTML:', paymentStepState.stripeElementHTML);
    
    // Go to summary step to see what happens
    await page.click('#next-btn');
    await page.waitForTimeout(2000);
    
    console.log('\n📋 At summary step - final check...');
    
    const summaryState = await page.evaluate(() => {
      const creditCardSection = document.getElementById('credit-card-section');
      const stripeElement = document.getElementById('stripe-card-element');
      
      return {
        creditCardSectionDisplay: creditCardSection ? window.getComputedStyle(creditCardSection).display : 'not found',
        stripeElementExists: !!stripeElement,
        stripeElementDisplay: stripeElement ? window.getComputedStyle(stripeElement).display : 'not found',
        stripeElementHTML: stripeElement?.innerHTML?.substring(0, 200) || 'no HTML',
        cardElementMounted: !!window.cardElement,
        cardElementValid: window.cardElement && typeof window.cardElement.mount === 'function'
      };
    });
    
    console.log('📊 SUMMARY STEP STATE:');
    console.log('Credit card section display:', summaryState.creditCardSectionDisplay);
    console.log('Stripe element exists:', summaryState.stripeElementExists);
    console.log('Stripe element display:', summaryState.stripeElementDisplay);
    console.log('Card element mounted:', summaryState.cardElementMounted);
    console.log('Card element valid:', summaryState.cardElementValid);
    console.log('Stripe element HTML:', summaryState.stripeElementHTML);
    
    // Try to manually show the Stripe element if it's hidden
    const manualFix = await page.evaluate(() => {
      const creditCardSection = document.getElementById('credit-card-section');
      const stripeElement = document.getElementById('stripe-card-element');
      
      if (creditCardSection) {
        creditCardSection.style.display = 'block';
        creditCardSection.style.visibility = 'visible';
      }
      
      if (stripeElement) {
        stripeElement.style.display = 'block';
        stripeElement.style.visibility = 'visible';
        stripeElement.style.opacity = '1';
      }
      
      // Force call the payment method selection
      if (typeof selectPaymentMethod === 'function') {
        selectPaymentMethod('credit_card');
        return { manualFixApplied: true };
      }
      
      return { manualFixApplied: false };
    });
    
    console.log('\n📋 Applied manual fix:', manualFix.manualFixApplied);
    
    await page.waitForTimeout(3000);
    
    const finalCheck = await page.evaluate(() => {
      const stripeElement = document.getElementById('stripe-card-element');
      return {
        stripeElementDisplay: stripeElement ? window.getComputedStyle(stripeElement).display : 'not found',
        stripeElementVisible: stripeElement ? window.getComputedStyle(stripeElement).visibility : 'not found',
        stripeElementHTML: stripeElement?.innerHTML?.substring(0, 200) || 'no HTML'
      };
    });
    
    console.log('\n📊 AFTER MANUAL FIX:');
    console.log('Stripe element display:', finalCheck.stripeElementDisplay);
    console.log('Stripe element visible:', finalCheck.stripeElementVisible);
    console.log('Stripe element HTML:', finalCheck.stripeElementHTML);
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Stripe test error:', error);
  } finally {
    await browser.close();
  }
}

testStripeElement().catch(console.error);