const { chromium } = require('playwright');

async function testFinalBooking() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 200,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🎯 Final booking flow test...');
    
    // Step 1: Select service
    console.log('📋 Step 1: Service selection...');
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(1500);
    
    // Step 2: Force date/time selection programmatically (since UI is complex)
    console.log('📅 Step 2: Date/time selection...');
    await page.evaluate(() => {
      // Set date
      const dateInput = document.getElementById('booking-date');
      if (dateInput) {
        dateInput.value = '2025-07-25';
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      // Select time
      const timeSelect = document.getElementById('booking-time');
      if (timeSelect && timeSelect.options.length > 1) {
        timeSelect.selectedIndex = 1;
        timeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    
    await page.waitForTimeout(500);
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    // Step 3: Contact info
    console.log('👤 Step 3: Contact information...');
    await page.fill('#client-name', 'Test User');
    await page.fill('#client-email', 'test@example.com');
    await page.fill('#client-phone', '555-123-4567');
    
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    // Step 4: Payment - use JavaScript to select payment method
    console.log('💳 Step 4: Payment selection...');
    await page.evaluate(() => {
      const cashRadio = document.getElementById('payment-method-cash');
      if (cashRadio) {
        cashRadio.checked = true;
        cashRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    
    await page.waitForTimeout(500);
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    // Step 5: Booking summary and confirmation
    console.log('✅ Step 5: Booking confirmation...');
    
    const currentStep = await page.evaluate(() => {
      const steps = ['service-selection', 'datetime-selection', 'contact-info', 'payment-info', 'booking-summary'];
      for (let step of steps) {
        const el = document.getElementById(step);
        if (el && window.getComputedStyle(el).display !== 'none') {
          return step;
        }
      }
      return 'unknown';
    });
    
    console.log('Current step:', currentStep);
    
    if (currentStep === 'booking-summary') {
      console.log('🎯 On booking summary! Testing confirm button...');
      
      // Check confirm button status
      const buttonStatus = await page.evaluate(() => {
        const btn = document.getElementById('confirm-booking-btn');
        return {
          exists: !!btn,
          visible: btn && window.getComputedStyle(btn).display !== 'none',
          disabled: btn ? btn.disabled : false,
          text: btn ? btn.textContent.trim() : 'not found'
        };
      });
      
      console.log('Confirm button status:', buttonStatus);
      
      if (buttonStatus.exists && buttonStatus.visible && !buttonStatus.disabled) {
        console.log('🎉 Clicking confirm booking...');
        await page.click('#confirm-booking-btn');
        
        console.log('⏳ Waiting for thank you message (up to 10 seconds)...');
        await page.waitForTimeout(10000);
        
        // Check final result
        const finalResult = await page.evaluate(() => {
          const thankYouContent = document.getElementById('thank-you-content');
          const bookingStatus = document.getElementById('booking-status');
          const modalContent = document.querySelector('#booking .embedded-booking-container');
          
          return {
            thankYouExists: !!thankYouContent,
            thankYouVisible: thankYouContent && window.getComputedStyle(thankYouContent).display !== 'none',
            statusText: bookingStatus ? bookingStatus.textContent.trim() : 'none',
            modalContentChanged: modalContent ? modalContent.innerHTML.includes('Thank You') : false,
            modalContentPreview: modalContent ? modalContent.innerHTML.substring(0, 300) : 'no modal content'
          };
        });
        
        console.log('\n🎯 FINAL RESULT:');
        console.log('Thank you content exists:', finalResult.thankYouExists);
        console.log('Thank you content visible:', finalResult.thankYouVisible);
        console.log('Status text:', finalResult.statusText);
        console.log('Modal content changed:', finalResult.modalContentChanged);
        console.log('Modal preview:', finalResult.modalContentPreview);
        
        if (finalResult.thankYouExists || finalResult.modalContentChanged) {
          console.log('\n✅ SUCCESS: Thank you message is displaying!');
        } else {
          console.log('\n❌ FAILED: Thank you message not showing');
        }
      } else {
        console.log('❌ Confirm button not ready:', buttonStatus);
      }
    } else {
      console.log('❌ Never reached booking summary step');
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testFinalBooking().catch(console.error);