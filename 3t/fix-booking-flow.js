const { chromium } = require('playwright');

async function fixBookingFlow() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🔧 Fixing booking flow...');
    
    // Step 1: Select service
    console.log('📋 Step 1: Selecting service...');
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(2000);
    
    // Force fix the date input if it's hidden
    await page.evaluate(() => {
      const dateInput = document.getElementById('booking-date');
      if (dateInput && dateInput.type === 'hidden') {
        console.log('🔧 Fixing hidden date input...');
        dateInput.type = 'date';
        dateInput.style.display = 'block';
        dateInput.style.visibility = 'visible';
      }
    });
    
    // Set date directly
    await page.evaluate(() => {
      const dateInput = document.getElementById('booking-date');
      if (dateInput) {
        dateInput.value = '2025-07-25';
        // Trigger change event
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Select time
    console.log('⏰ Selecting time...');
    await page.evaluate(() => {
      const timeSelect = document.getElementById('booking-time');
      if (timeSelect && timeSelect.options.length > 1) {
        timeSelect.selectedIndex = 1; // Select first available time
        timeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Test validation
    const validation = await page.evaluate(() => {
      const date = document.getElementById('booking-date').value.trim();
      const time = document.getElementById('booking-time').value.trim();
      const timeSelect = document.getElementById('booking-time');
      const isTimeSelected = time && time.trim() !== '' && timeSelect?.selectedIndex > 0;
      
      return {
        date, time, selectedIndex: timeSelect?.selectedIndex, isTimeSelected,
        wouldPass: !!(date && time && date.trim() !== '' && isTimeSelected)
      };
    });
    
    console.log('Validation:', validation);
    
    if (validation.wouldPass) {
      console.log('✅ Should pass validation, clicking next...');
      await page.click('#next-btn');
      await page.waitForTimeout(2000);
      
      // Step 3: Contact info
      console.log('👤 Step 3: Filling contact info...');
      await page.fill('#client-name', 'Test User');
      await page.fill('#client-email', 'test@example.com'); 
      await page.fill('#client-phone', '555-123-4567');
      
      await page.click('#next-btn');
      await page.waitForTimeout(1000);
      
      // Step 4: Payment
      console.log('💳 Step 4: Selecting cash payment...');
      await page.click('input[value="cash"]');
      await page.click('#next-btn');
      await page.waitForTimeout(1000);
      
      // Step 5: Confirmation
      console.log('✅ Step 5: Confirming booking...');
      
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
        console.log('🎯 On booking summary! Clicking confirm...');
        
        // Click confirm booking
        await page.click('#confirm-booking-btn');
        
        console.log('⏳ Waiting for thank you message...');
        await page.waitForTimeout(5000);
        
        // Check if thank you content appeared
        const thankYouCheck = await page.evaluate(() => {
          const thankYouContent = document.getElementById('thank-you-content');
          const bookingStatus = document.getElementById('booking-status');
          
          return {
            thankYouExists: !!thankYouContent,
            thankYouVisible: thankYouContent && window.getComputedStyle(thankYouContent).display !== 'none',
            statusText: bookingStatus ? bookingStatus.textContent.trim() : 'none',
            modalContent: document.querySelector('#booking .embedded-booking-container')?.innerHTML?.substring(0, 200) || 'no content'
          };
        });
        
        console.log('Thank you check:', thankYouCheck);
        
        if (thankYouCheck.thankYouExists) {
          console.log('✅ SUCCESS: Thank you message displayed!');
        } else {
          console.log('❌ FAILED: Thank you message not showing');
          console.log('Status text:', thankYouCheck.statusText);
        }
      }
    } else {
      console.log('❌ Validation failed, cannot proceed');
    }
    
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Fix error:', error);
  } finally {
    await browser.close();
  }
}

fixBookingFlow().catch(console.error);