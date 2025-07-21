const { chromium } = require('playwright');

async function debugPaymentStep() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    page.on('console', msg => {
      const text = msg.text();
      console.log(`[DEBUG] ${text}`);
    });
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🚨 DEBUGGING: Why payment step not progressing...\n');
    
    // Complete flow to payment step
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(2000);
    
    // Select available date
    await page.evaluate(() => {
      const today = new Date();
      const closedDates = window.closedDates || [];
      
      for (let i = 1; i <= 30; i++) {
        const testDate = new Date(today);
        testDate.setDate(testDate.getDate() + i);
        const dateStr = testDate.toISOString().split('T')[0];
        const dayOfWeek = testDate.getDay();
        
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !closedDates.includes(dateStr)) {
          const dateInput = document.getElementById('booking-date');
          if (dateInput) {
            dateInput.value = dateStr;
            dateInput.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
      }
    });
    await page.waitForTimeout(1000);
    
    await page.evaluate(() => {
      const timeSelect = document.getElementById('booking-time');
      if (timeSelect && timeSelect.options.length > 1) {
        timeSelect.selectedIndex = 1;
        timeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    await page.fill('#client-name', 'Debug Test');
    await page.fill('#client-email', 'debug@test.com');
    await page.fill('#client-phone', '940-555-0000');
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    console.log('📋 At payment step - checking state...');
    
    const paymentStepState = await page.evaluate(() => {
      const paymentStep = document.getElementById('payment-info');
      const summaryStep = document.getElementById('booking-summary');
      const nextBtn = document.getElementById('next-btn');
      const confirmBtn = document.getElementById('confirm-booking-btn');
      const cashRadio = document.getElementById('payment-method-cash');
      
      return {
        paymentStepVisible: paymentStep && window.getComputedStyle(paymentStep).display !== 'none',
        summaryStepVisible: summaryStep && window.getComputedStyle(summaryStep).display !== 'none',
        nextBtnExists: !!nextBtn,
        nextBtnVisible: nextBtn && window.getComputedStyle(nextBtn).display !== 'none',
        nextBtnDisabled: nextBtn?.disabled || false,
        confirmBtnExists: !!confirmBtn,
        confirmBtnVisible: confirmBtn && window.getComputedStyle(confirmBtn).display !== 'none',
        cashRadioExists: !!cashRadio,
        cashRadioChecked: cashRadio?.checked || false
      };
    });
    
    console.log('📊 PAYMENT STEP STATE:');
    console.log('Payment step visible:', paymentStepState.paymentStepVisible);
    console.log('Summary step visible:', paymentStepState.summaryStepVisible);
    console.log('Next button exists:', paymentStepState.nextBtnExists);
    console.log('Next button visible:', paymentStepState.nextBtnVisible);
    console.log('Next button disabled:', paymentStepState.nextBtnDisabled);
    console.log('Confirm button exists:', paymentStepState.confirmBtnExists);
    console.log('Confirm button visible:', paymentStepState.confirmBtnVisible);
    console.log('Cash radio exists:', paymentStepState.cashRadioExists);
    console.log('Cash radio checked:', paymentStepState.cashRadioChecked);
    
    // Select cash payment
    console.log('\n💵 Selecting cash payment...');
    await page.evaluate(() => {
      const cashRadio = document.getElementById('payment-method-cash');
      if (cashRadio) {
        cashRadio.checked = true;
        cashRadio.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('💵 Cash radio clicked and changed');
      }
    });
    await page.waitForTimeout(1000);
    
    const afterCashState = await page.evaluate(() => {
      const cashRadio = document.getElementById('payment-method-cash');
      const nextBtn = document.getElementById('next-btn');
      
      return {
        cashChecked: cashRadio?.checked || false,
        nextBtnDisabled: nextBtn?.disabled || false,
        nextBtnText: nextBtn?.textContent?.trim() || 'no text'
      };
    });
    
    console.log('📊 AFTER CASH SELECTION:');
    console.log('Cash checked:', afterCashState.cashChecked);
    console.log('Next button disabled:', afterCashState.nextBtnDisabled);
    console.log('Next button text:', afterCashState.nextBtnText);
    
    // Try clicking next
    console.log('\n➡️ Attempting to click next button...');
    
    try {
      await page.click('#next-btn', { timeout: 5000 });
      console.log('✅ Next button clicked successfully');
      await page.waitForTimeout(2000);
      
      const afterNextState = await page.evaluate(() => {
        const paymentStep = document.getElementById('payment-info');
        const summaryStep = document.getElementById('booking-summary');
        const confirmBtn = document.getElementById('confirm-booking-btn');
        
        return {
          paymentStepVisible: paymentStep && window.getComputedStyle(paymentStep).display !== 'none',
          summaryStepVisible: summaryStep && window.getComputedStyle(summaryStep).display !== 'none',
          confirmBtnVisible: confirmBtn && window.getComputedStyle(confirmBtn).display !== 'none'
        };
      });
      
      console.log('📊 AFTER NEXT CLICK:');
      console.log('Payment step visible:', afterNextState.paymentStepVisible);
      console.log('Summary step visible:', afterNextState.summaryStepVisible);
      console.log('Confirm button visible:', afterNextState.confirmBtnVisible);
      
      if (afterNextState.summaryStepVisible && afterNextState.confirmBtnVisible) {
        console.log('✅ SUCCESS: Reached summary step with confirm button');
      } else {
        console.log('❌ FAILED: Did not reach summary step');
      }
      
    } catch (error) {
      console.log('❌ FAILED to click next button:', error.message);
      
      // Check for validation errors
      const validationCheck = await page.evaluate(() => {
        const errors = Array.from(document.querySelectorAll('.validation-error, .error'));
        const cashRadio = document.getElementById('payment-method-cash');
        const ccRadio = document.getElementById('payment-method-card');
        
        return {
          validationErrors: errors.map(e => e.textContent),
          cashChecked: cashRadio?.checked || false,
          ccChecked: ccRadio?.checked || false,
          activePaymentMethod: document.querySelector('input[name="payment-method"]:checked')?.value || 'none'
        };
      });
      
      console.log('📊 VALIDATION CHECK:');
      console.log('Validation errors:', validationCheck.validationErrors);
      console.log('Active payment method:', validationCheck.activePaymentMethod);
      console.log('Cash checked:', validationCheck.cashChecked);
      console.log('CC checked:', validationCheck.ccChecked);
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Payment step debug error:', error);
  } finally {
    await browser.close();
  }
}

debugPaymentStep().catch(console.error);