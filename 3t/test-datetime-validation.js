const { chromium } = require('playwright');

async function testDateTimeValidation() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    // Capture ALL console logs to see validation errors
    page.on('console', msg => {
      const text = msg.text();
      console.log(`[LOG] ${text}`);
    });
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🎯 Testing date/time validation issue...\n');
    
    // Start booking flow
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(1000);
    
    console.log('📅 At date/time selection step...');
    
    // Check current state of date/time elements
    const dateTimeState = await page.evaluate(() => {
      const dateInput = document.getElementById('booking-date');
      const timeSelect = document.getElementById('booking-time');
      const nextBtn = document.getElementById('next-btn');
      
      return {
        dateInput: {
          exists: !!dateInput,
          type: dateInput?.type || 'not found',
          value: dateInput?.value || 'no value',
          visible: dateInput && window.getComputedStyle(dateInput).display !== 'none'
        },
        timeSelect: {
          exists: !!timeSelect,
          value: timeSelect?.value || 'no value',
          selectedIndex: timeSelect?.selectedIndex || -1,
          optionsCount: timeSelect?.options?.length || 0,
          visible: timeSelect && window.getComputedStyle(timeSelect).display !== 'none'
        },
        nextBtn: {
          exists: !!nextBtn,
          disabled: nextBtn?.disabled || false,
          text: nextBtn?.textContent?.trim() || 'no text'
        }
      };
    });
    
    console.log('📊 INITIAL STATE:');
    console.log('Date input:', JSON.stringify(dateTimeState.dateInput, null, 2));
    console.log('Time select:', JSON.stringify(dateTimeState.timeSelect, null, 2));
    console.log('Next button:', JSON.stringify(dateTimeState.nextBtn, null, 2));
    
    // Try to select a date
    console.log('\n📅 Attempting to select date...');
    
    const dateSelection = await page.evaluate(() => {
      // Try clicking on a calendar cell
      const availableCells = document.querySelectorAll('[role="gridcell"]:not(.disabled)');
      console.log('🔍 Available calendar cells:', availableCells.length);
      
      if (availableCells.length > 0) {
        const firstCell = availableCells[0];
        console.log('📅 Clicking first available date cell');
        firstCell.click();
        return { clicked: true, cellText: firstCell.textContent };
      }
      
      return { clicked: false, reason: 'No available cells found' };
    });
    
    console.log('Date selection result:', dateSelection);
    await page.waitForTimeout(1000);
    
    // Check state after date click
    const afterDateState = await page.evaluate(() => {
      const dateInput = document.getElementById('booking-date');
      const timeSelect = document.getElementById('booking-time');
      
      return {
        dateValue: dateInput?.value || 'no value',
        timeOptionsCount: timeSelect?.options?.length || 0,
        timeOptionsAvailable: Array.from(timeSelect?.options || []).map(opt => opt.text)
      };
    });
    
    console.log('\n📊 AFTER DATE SELECTION:');
    console.log('Date value:', afterDateState.dateValue);
    console.log('Time options count:', afterDateState.timeOptionsCount);
    console.log('Time options:', afterDateState.timeOptionsAvailable);
    
    // Try to select time
    console.log('\n⏰ Attempting to select time...');
    
    const timeSelection = await page.evaluate(() => {
      const timeSelect = document.getElementById('booking-time');
      if (timeSelect && timeSelect.options.length > 1) {
        console.log('⏰ Selecting time option 1');
        timeSelect.selectedIndex = 1;
        timeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        return { 
          selected: true, 
          selectedValue: timeSelect.value,
          selectedText: timeSelect.options[timeSelect.selectedIndex].text
        };
      }
      return { selected: false, reason: 'No time options available' };
    });
    
    console.log('Time selection result:', timeSelection);
    await page.waitForTimeout(1000);
    
    // Check validation before clicking next
    console.log('\n🔍 Checking validation before next...');
    
    const validationCheck = await page.evaluate(() => {
      const dateInput = document.getElementById('booking-date');
      const timeSelect = document.getElementById('booking-time');
      const nextBtn = document.getElementById('next-btn');
      
      const validation = {
        dateValue: dateInput?.value || 'no value',
        dateValid: !!(dateInput?.value && dateInput.value.trim() !== ''),
        timeValue: timeSelect?.value || 'no value', 
        timeValid: !!(timeSelect?.value && timeSelect.value !== '' && timeSelect.selectedIndex > 0),
        nextBtnDisabled: nextBtn?.disabled || false
      };
      
      console.log('🔍 Validation check:', validation);
      return validation;
    });
    
    console.log('📊 VALIDATION STATE:');
    console.log('Date valid:', validationCheck.dateValid, '(value:', validationCheck.dateValue, ')');
    console.log('Time valid:', validationCheck.timeValid, '(value:', validationCheck.timeValue, ')');
    console.log('Next button disabled:', validationCheck.nextBtnDisabled);
    
    // Try clicking next
    console.log('\n➡️ Attempting to click next...');
    
    await page.click('#next-btn');
    await page.waitForTimeout(2000);
    
    // Check if we progressed or got validation error
    const afterClickState = await page.evaluate(() => {
      const contactStep = document.getElementById('contact-info');
      const dateTimeStep = document.getElementById('datetime-selection');
      
      return {
        onContactStep: contactStep && window.getComputedStyle(contactStep).display !== 'none',
        stillOnDateTime: dateTimeStep && window.getComputedStyle(dateTimeStep).display !== 'none',
        currentStepVisible: document.querySelector('.step-content:not([style*="display: none"])')?.id || 'unknown'
      };
    });
    
    console.log('\n📊 AFTER NEXT CLICK:');
    console.log('On contact step:', afterClickState.onContactStep);
    console.log('Still on date/time:', afterClickState.stillOnDateTime);
    console.log('Current step:', afterClickState.currentStepVisible);
    
    if (afterClickState.stillOnDateTime) {
      console.log('\n❌ VALIDATION ISSUE: Still stuck on date/time step');
      console.log('This indicates date/time validation is failing');
    } else if (afterClickState.onContactStep) {
      console.log('\n✅ SUCCESS: Progressed to contact step');
    }
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ DateTime test error:', error);
  } finally {
    await browser.close();
  }
}

testDateTimeValidation().catch(console.error);