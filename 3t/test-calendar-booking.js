const { chromium } = require('playwright');

async function testCalendarBooking() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🗓️ Testing booking with custom calendar...');
    
    // Step 1: Select service
    console.log('📋 Step 1: Service selection...');
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(2000);
    
    // Step 2: Check calendar and select date
    console.log('📅 Step 2: Custom calendar interaction...');
    
    // Check if custom calendar loaded
    const calendarCheck = await page.evaluate(() => {
      const calendar = document.getElementById('custom-calendar-container');
      const hiddenInput = document.getElementById('booking-date');
      const dateButtons = document.querySelectorAll('[role="gridcell"]:not(.disabled)');
      
      return {
        calendarExists: !!calendar,
        calendarVisible: calendar && window.getComputedStyle(calendar).display !== 'none',
        hiddenInputExists: !!hiddenInput,
        hiddenInputValue: hiddenInput ? hiddenInput.value : null,
        availableDatesCount: dateButtons.length
      };
    });
    
    console.log('Calendar check:', calendarCheck);
    
    if (calendarCheck.calendarExists && calendarCheck.availableDatesCount > 0) {
      // Click the first available date
      console.log('Clicking first available date...');
      await page.click('[role="gridcell"]:not(.disabled)');
      await page.waitForTimeout(1000);
      
      // Check if date was selected
      const afterDateClick = await page.evaluate(() => {
        const hiddenInput = document.getElementById('booking-date');
        const selectedDisplay = document.getElementById('selected-date-display');
        
        return {
          hiddenInputValue: hiddenInput ? hiddenInput.value : null,
          selectedDisplayVisible: selectedDisplay && window.getComputedStyle(selectedDisplay).display !== 'none',
          selectedDisplayText: document.getElementById('selected-date-text')?.textContent || null
        };
      });
      
      console.log('After date selection:', afterDateClick);
      
      // Select time
      console.log('⏰ Selecting time...');
      const timeSelectStatus = await page.evaluate(() => {
        const timeSelect = document.getElementById('booking-time');
        if (timeSelect && timeSelect.options.length > 1) {
          timeSelect.selectedIndex = 1;
          timeSelect.dispatchEvent(new Event('change', { bubbles: true }));
          return {
            success: true,
            value: timeSelect.value,
            selectedText: timeSelect.options[timeSelect.selectedIndex].text
          };
        }
        return { success: false };
      });
      
      console.log('Time selection:', timeSelectStatus);
      
      // Try to proceed
      if (afterDateClick.hiddenInputValue && timeSelectStatus.success) {
        console.log('✅ Date and time selected, clicking next...');
        await page.click('#next-btn');
        await page.waitForTimeout(2000);
        
        // Check current step
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
        
        console.log('After clicking next, current step:', currentStep);
        
        if (currentStep === 'contact-info') {
          console.log('✅ SUCCESS: Progressed to contact info!');
          
          // Continue with the booking flow
          await page.fill('#client-name', 'Test User');
          await page.fill('#client-email', 'test@example.com');
          await page.fill('#client-phone', '555-123-4567');
          await page.click('#next-btn');
          await page.waitForTimeout(1000);
          
          // Select payment
          await page.evaluate(() => {
            const cashRadio = document.getElementById('payment-method-cash');
            if (cashRadio) {
              cashRadio.checked = true;
              cashRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
          await page.click('#next-btn');
          await page.waitForTimeout(1000);
          
          // Check if we reached summary
          const finalStep = await page.evaluate(() => {
            const steps = ['service-selection', 'datetime-selection', 'contact-info', 'payment-info', 'booking-summary'];
            for (let step of steps) {
              const el = document.getElementById(step);
              if (el && window.getComputedStyle(el).display !== 'none') {
                return step;
              }
            }
            return 'unknown';
          });
          
          console.log('Final step reached:', finalStep);
          
          if (finalStep === 'booking-summary') {
            console.log('🎯 At booking summary! Clicking confirm...');
            await page.click('#confirm-booking-btn');
            await page.waitForTimeout(8000);
            
            const thankYouCheck = await page.evaluate(() => {
              const thankYouContent = document.getElementById('thank-you-content');
              return !!thankYouContent;
            });
            
            console.log('Thank you message displayed:', thankYouCheck);
          }
        }
      } else {
        console.log('❌ Date/time selection failed');
      }
    } else {
      console.log('❌ Custom calendar not found or no available dates');
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testCalendarBooking().catch(console.error);