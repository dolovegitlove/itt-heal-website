const { chromium } = require('playwright');

async function debugLiveDatetime() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    // Capture ALL validation related logs
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('validation') || text.includes('Date/time') || text.includes('date') || text.includes('time') || text.includes('selectedIndex') || text.includes('currentStep')) {
        console.log(`[LIVE] ${text}`);
      }
    });
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🚨 URGENT: Debugging live date/time validation issue...\n');
    
    // Step 1: Service selection
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(2000);
    
    // Check initial state of datetime elements
    const initialState = await page.evaluate(() => {
      const dateInput = document.getElementById('booking-date');
      const timeSelect = document.getElementById('booking-time');
      const closedDates = window.closedDates || [];
      
      return {
        dateInputExists: !!dateInput,
        dateValue: dateInput?.value || 'no value',
        timeSelectExists: !!timeSelect,
        timeValue: timeSelect?.value || 'no value',
        timeSelectedIndex: timeSelect?.selectedIndex || -1,
        timeOptionsCount: timeSelect?.options?.length || 0,
        closedDatesCount: closedDates.length,
        sampleClosedDates: closedDates.slice(0, 5)
      };
    });
    
    console.log('📊 INITIAL DATETIME STATE:');
    console.log('Date input exists:', initialState.dateInputExists);
    console.log('Date value:', initialState.dateValue);
    console.log('Time select exists:', initialState.timeSelectExists);
    console.log('Time value:', initialState.timeValue);
    console.log('Time selected index:', initialState.timeSelectedIndex);
    console.log('Time options count:', initialState.timeOptionsCount);
    console.log('Closed dates count:', initialState.closedDatesCount);
    console.log('Sample closed dates:', initialState.sampleClosedDates);
    
    // Try to select a date manually like a real user would
    console.log('\n📅 Attempting to select date like a real user...');
    
    const dateSelectionResult = await page.evaluate(() => {
      const dateInput = document.getElementById('booking-date');
      const today = new Date();
      const closedDates = window.closedDates || [];
      let selectedDate = null;
      
      // Try to find an available date
      for (let i = 1; i <= 30; i++) {
        const testDate = new Date(today);
        testDate.setDate(testDate.getDate() + i);
        const dateStr = testDate.toISOString().split('T')[0];
        const dayOfWeek = testDate.getDay();
        
        // Skip weekends and closed dates
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !closedDates.includes(dateStr)) {
          selectedDate = dateStr;
          break;
        }
      }
      
      if (selectedDate && dateInput) {
        console.log('📅 Setting date to:', selectedDate);
        dateInput.value = selectedDate;
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        return {
          success: true,
          selectedDate: selectedDate,
          finalValue: dateInput.value
        };
      }
      
      return { success: false, reason: 'No available date found or no date input' };
    });
    
    console.log('Date selection result:', dateSelectionResult);
    await page.waitForTimeout(2000);
    
    // Check time options after date selection
    const timeOptionsAfterDate = await page.evaluate(() => {
      const timeSelect = document.getElementById('booking-time');
      return {
        optionsCount: timeSelect?.options?.length || 0,
        currentValue: timeSelect?.value || 'no value',
        currentIndex: timeSelect?.selectedIndex || -1,
        options: Array.from(timeSelect?.options || []).map((opt, i) => ({
          index: i,
          value: opt.value,
          text: opt.text
        }))
      };
    });
    
    console.log('\n⏰ TIME OPTIONS AFTER DATE SELECTION:');
    console.log('Options count:', timeOptionsAfterDate.optionsCount);
    console.log('Current value:', timeOptionsAfterDate.currentValue);
    console.log('Current index:', timeOptionsAfterDate.currentIndex);
    console.log('Available options:', timeOptionsAfterDate.options);
    
    if (timeOptionsAfterDate.optionsCount > 1) {
      console.log('\n⏰ Selecting time option...');
      
      const timeSelectionResult = await page.evaluate(() => {
        const timeSelect = document.getElementById('booking-time');
        if (timeSelect && timeSelect.options.length > 1) {
          console.log('⏰ Before selection - selectedIndex:', timeSelect.selectedIndex, 'value:', timeSelect.value);
          
          // Select the first real time option (index 1)
          timeSelect.selectedIndex = 1;
          timeSelect.dispatchEvent(new Event('change', { bubbles: true }));
          
          console.log('⏰ After selection - selectedIndex:', timeSelect.selectedIndex, 'value:', timeSelect.value);
          
          return {
            success: true,
            selectedIndex: timeSelect.selectedIndex,
            selectedValue: timeSelect.value,
            selectedText: timeSelect.options[timeSelect.selectedIndex].text
          };
        }
        return { success: false, reason: 'No time select or no options' };
      });
      
      console.log('Time selection result:', timeSelectionResult);
      await page.waitForTimeout(1000);
      
      // Now check the validation state before clicking next
      const validationState = await page.evaluate(() => {
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
          timeSelectIndex: timeSelect?.selectedIndex,
          isTimeSelected: isTimeSelected,
          willPassValidation: !(!date || !time || date.trim() === '' || !isTimeSelected),
          currentStep: window.currentStep
        };
      });
      
      console.log('\n📊 VALIDATION STATE BEFORE CLICKING NEXT:');
      console.log('Date:', validationState.date);
      console.log('Time:', validationState.time);
      console.log('Date valid:', validationState.dateValid);
      console.log('Time valid:', validationState.timeValid);
      console.log('Time selected index:', validationState.timeSelectIndex);
      console.log('Is time selected:', validationState.isTimeSelected);
      console.log('Will pass validation:', validationState.willPassValidation);
      console.log('Current step:', validationState.currentStep);
      
      // Try clicking next
      console.log('\n➡️ Attempting to click next button...');
      
      await page.click('#next-btn');
      await page.waitForTimeout(3000);
      
      const afterClickState = await page.evaluate(() => {
        const contactStep = document.getElementById('contact-info');
        const datetimeStep = document.getElementById('datetime-selection');
        
        return {
          currentStep: window.currentStep,
          onContactStep: contactStep && window.getComputedStyle(contactStep).display !== 'none',
          stillOnDatetime: datetimeStep && window.getComputedStyle(datetimeStep).display !== 'none'
        };
      });
      
      console.log('\n📊 AFTER CLICKING NEXT:');
      console.log('Current step:', afterClickState.currentStep);
      console.log('On contact step:', afterClickState.onContactStep);
      console.log('Still on datetime:', afterClickState.stillOnDatetime);
      
      if (afterClickState.onContactStep && afterClickState.currentStep === 3) {
        console.log('✅ SUCCESS: Date/time validation passed and progressed!');
      } else if (afterClickState.stillOnDatetime) {
        console.log('❌ FAILED: Still stuck on datetime step - validation failed');
      } else {
        console.log('❓ UNKNOWN: Unexpected state');
      }
    } else {
      console.log('❌ No time options available');
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Live datetime debug error:', error);
  } finally {
    await browser.close();
  }
}

debugLiveDatetime().catch(console.error);