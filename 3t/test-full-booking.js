const { chromium } = require('playwright');

async function testFullBooking() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🚀 Testing complete booking flow...');
    
    // Step 1: Select service
    console.log('📋 Step 1: Selecting service...');
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(1000);
    
    // Check if we moved to step 2
    let currentStep = await page.evaluate(() => {
      const steps = ['service-selection', 'datetime-selection', 'contact-info', 'payment-info', 'booking-summary'];
      for (let step of steps) {
        const el = document.getElementById(step);
        if (el && window.getComputedStyle(el).display !== 'none') {
          return step;
        }
      }
      return 'unknown';
    });
    console.log('After service selection, current step:', currentStep);
    
    if (currentStep === 'datetime-selection') {
      console.log('📅 Step 2: Selecting date and time...');
      
      // Try to find and fill date input
      const dateInput = await page.locator('#date-input');
      if (await dateInput.isVisible()) {
        await dateInput.click();
        await page.keyboard.type('2025-07-25');
        await page.waitForTimeout(500);
      }
      
      // Try to select a time slot
      const timeSlots = await page.locator('.time-slot').first();
      if (await timeSlots.isVisible()) {
        await timeSlots.click();
        await page.waitForTimeout(1000);
      }
      
      // Click next button
      const nextBtn = await page.locator('#next-btn');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Check current step again
    currentStep = await page.evaluate(() => {
      const steps = ['service-selection', 'datetime-selection', 'contact-info', 'payment-info', 'booking-summary'];
      for (let step of steps) {
        const el = document.getElementById(step);
        if (el && window.getComputedStyle(el).display !== 'none') {
          return step;
        }
      }
      return 'unknown';
    });
    console.log('Current step after datetime:', currentStep);
    
    if (currentStep === 'contact-info') {
      console.log('👤 Step 3: Filling contact info...');
      
      await page.fill('#client-name', 'Test User');
      await page.fill('#client-email', 'test@example.com');
      await page.fill('#client-phone', '555-123-4567');
      
      const nextBtn = await page.locator('#next-btn');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Continue to payment step
    currentStep = await page.evaluate(() => {
      const steps = ['service-selection', 'datetime-selection', 'contact-info', 'payment-info', 'booking-summary'];
      for (let step of steps) {
        const el = document.getElementById(step);
        if (el && window.getComputedStyle(el).display !== 'none') {
          return step;
        }
      }
      return 'unknown';
    });
    console.log('Current step after contact info:', currentStep);
    
    if (currentStep === 'payment-info') {
      console.log('💳 Step 4: Selecting payment method...');
      
      // Select cash payment method
      const cashRadio = await page.locator('input[value="cash"]');
      if (await cashRadio.isVisible()) {
        await cashRadio.click();
        await page.waitForTimeout(500);
      }
      
      const nextBtn = await page.locator('#next-btn');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Check if we reached step 5
    currentStep = await page.evaluate(() => {
      const steps = ['service-selection', 'datetime-selection', 'contact-info', 'payment-info', 'booking-summary'];
      for (let step of steps) {
        const el = document.getElementById(step);
        if (el && window.getComputedStyle(el).display !== 'none') {
          return step;
        }
      }
      return 'unknown';
    });
    console.log('Final step:', currentStep);
    
    if (currentStep === 'booking-summary') {
      console.log('✅ Reached booking summary! Testing confirm button...');
      
      const confirmBtn = await page.locator('#confirm-booking-btn');
      if (await confirmBtn.isVisible()) {
        console.log('🎯 Clicking confirm booking button...');
        await confirmBtn.click();
        
        // Wait for response
        await page.waitForTimeout(5000);
        
        // Check what happened
        const result = await page.evaluate(() => {
          const thankYouContent = document.getElementById('thank-you-content');
          const bookingStatus = document.getElementById('booking-status');
          const confirmBtn = document.getElementById('confirm-booking-btn');
          
          return {
            thankYouExists: !!thankYouContent,
            thankYouVisible: thankYouContent && window.getComputedStyle(thankYouContent).display !== 'none',
            statusText: bookingStatus ? bookingStatus.textContent : 'none',
            buttonText: confirmBtn ? confirmBtn.textContent : 'none',
            buttonDisabled: confirmBtn ? confirmBtn.disabled : false
          };
        });
        
        console.log('After confirm click:', result);
        
        if (!result.thankYouExists) {
          console.log('❌ Thank you content not created - checking for errors...');
          
          // Check console logs
          const logs = await page.evaluate(() => {
            return window.consoleLog || 'No console logs captured';
          });
          console.log('Console logs:', logs);
        }
      }
    }
    
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testFullBooking().catch(console.error);