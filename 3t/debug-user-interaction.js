const { chromium } = require('playwright');

async function debugUserInteraction() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800, // Slower to mimic real user interaction
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('validation') || text.includes('Date/time') || text.includes('selectedIndex') || text.includes('currentStep')) {
        console.log(`[USER] ${text}`);
      }
    });
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🚨 DEBUGGING: Real user interaction flow...\n');
    
    // Step 1: Service selection like a real user
    console.log('👤 User clicks on 90-minute service...');
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(2000);
    
    // Check what date is pre-selected
    const preSelectedState = await page.evaluate(() => {
      const dateInput = document.getElementById('booking-date');
      return {
        dateValue: dateInput?.value || 'no value',
        dateType: dateInput?.type || 'no type'
      };
    });
    
    console.log('📅 Pre-selected date state:', preSelectedState);
    
    // Try clicking on a calendar cell like a real user would
    console.log('\n👤 User clicks on calendar cell...');
    
    const calendarClick = await page.evaluate(() => {
      const availableCells = document.querySelectorAll('[role="gridcell"]:not(.disabled)');
      console.log('📅 Available calendar cells found:', availableCells.length);
      
      if (availableCells.length > 0) {
        // Click on the first available cell
        const firstAvailable = availableCells[0];
        console.log('📅 Clicking on calendar cell:', firstAvailable.textContent);
        firstAvailable.click();
        return { clicked: true, cellText: firstAvailable.textContent };
      }
      return { clicked: false, reason: 'No available cells' };
    });
    
    console.log('Calendar click result:', calendarClick);
    await page.waitForTimeout(2000);
    
    // Check date after calendar click
    const afterCalendarState = await page.evaluate(() => {
      const dateInput = document.getElementById('booking-date');
      const timeSelect = document.getElementById('booking-time');
      
      return {
        dateValue: dateInput?.value || 'no value',
        timeOptionsCount: timeSelect?.options?.length || 0,
        timeValue: timeSelect?.value || 'no value',
        timeSelectedIndex: timeSelect?.selectedIndex || -1
      };
    });
    
    console.log('📊 After calendar click:', afterCalendarState);
    
    // Now user tries to select time
    console.log('\n👤 User tries to select time from dropdown...');
    
    if (afterCalendarState.timeOptionsCount > 1) {
      // Click on the time dropdown to open it (like a real user)
      await page.click('#booking-time');
      await page.waitForTimeout(500);
      
      // Select the first available time option
      await page.selectOption('#booking-time', { index: 1 });
      await page.waitForTimeout(500);
      
      const afterTimeSelect = await page.evaluate(() => {
        const timeSelect = document.getElementById('booking-time');
        return {
          selectedIndex: timeSelect?.selectedIndex || -1,
          selectedValue: timeSelect?.value || 'no value',
          selectedText: timeSelect?.options?.[timeSelect.selectedIndex]?.text || 'no text'
        };
      });
      
      console.log('⏰ After time selection:', afterTimeSelect);
      
      // Now user clicks Next button
      console.log('\n👤 User clicks Next button...');
      
      // Check validation state right before clicking
      const beforeNextState = await page.evaluate(() => {
        const dateInput = document.getElementById('booking-date');
        const timeSelect = document.getElementById('booking-time');
        const date = dateInput?.value;
        const time = timeSelect?.value;
        const isTimeSelected = time && time.trim() !== '' && timeSelect?.selectedIndex > 0;
        
        return {
          date: date,
          time: time,
          dateValid: !!date && date.length > 0,
          timeValid: !!time && time.length > 0,
          isTimeSelected: isTimeSelected,
          willPassValidation: !(!date || !time || date.trim() === '' || !isTimeSelected)
        };
      });
      
      console.log('📊 Validation state before Next click:', beforeNextState);
      
      await page.click('#next-btn');
      await page.waitForTimeout(3000);
      
      const afterNext = await page.evaluate(() => {
        const contactStep = document.getElementById('contact-info');
        const datetimeStep = document.getElementById('datetime-selection');
        
        return {
          currentStep: window.currentStep,
          onContactStep: contactStep && window.getComputedStyle(contactStep).display !== 'none',
          stillOnDatetime: datetimeStep && window.getComputedStyle(datetimeStep).display !== 'none'
        };
      });
      
      console.log('📊 After Next click:', afterNext);
      
      if (afterNext.stillOnDatetime) {
        console.log('❌ ISSUE: User stuck on datetime step!');
        console.log('This is what users are experiencing.');
        
        // Check if an alert was shown
        const alertCheck = await page.evaluate(() => {
          // Check for any visible error messages
          const errors = Array.from(document.querySelectorAll('.error, .validation-error, .alert'));
          return {
            errorCount: errors.length,
            errorMessages: errors.map(e => e.textContent)
          };
        });
        
        console.log('Error messages shown to user:', alertCheck);
      } else if (afterNext.onContactStep) {
        console.log('✅ SUCCESS: User progressed to contact step');
      }
    } else {
      console.log('❌ No time options available for user');
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ User interaction debug error:', error);
  } finally {
    await browser.close();
  }
}

debugUserInteraction().catch(console.error);