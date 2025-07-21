const { chromium } = require('playwright');

async function debugDateTime() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🔍 Debugging datetime selection...');
    
    // Step 1: Select service to get to datetime step
    console.log('📋 Selecting service...');
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(2000);
    
    // Check datetime elements
    const datetimeCheck = await page.evaluate(() => {
      const dateInput = document.getElementById('booking-date');
      const timeSelect = document.getElementById('booking-time');
      
      return {
        dateInput: {
          exists: !!dateInput,
          value: dateInput ? dateInput.value : null,
          min: dateInput ? dateInput.min : null
        },
        timeSelect: {
          exists: !!timeSelect,
          optionsCount: timeSelect ? timeSelect.options.length : 0,
          selectedIndex: timeSelect ? timeSelect.selectedIndex : -1,
          firstOptionText: timeSelect && timeSelect.options.length > 0 ? timeSelect.options[0].text : null,
          allOptions: timeSelect ? Array.from(timeSelect.options).map(opt => opt.text) : []
        }
      };
    });
    
    console.log('Datetime elements:', JSON.stringify(datetimeCheck, null, 2));
    
    // Try to fill date
    console.log('📅 Filling date...');
    await page.fill('#booking-date', '2025-07-25');
    await page.waitForTimeout(1000);
    
    // Check if time options are loaded after date selection
    const afterDateCheck = await page.evaluate(() => {
      const timeSelect = document.getElementById('booking-time');
      return {
        optionsCount: timeSelect ? timeSelect.options.length : 0,
        selectedIndex: timeSelect ? timeSelect.selectedIndex : -1,
        allOptions: timeSelect ? Array.from(timeSelect.options).map(opt => opt.text) : []
      };
    });
    
    console.log('After date selection:', JSON.stringify(afterDateCheck, null, 2));
    
    // Try to select a time
    if (afterDateCheck.optionsCount > 1) {
      console.log('⏰ Selecting time...');
      await page.selectOption('#booking-time', { index: 1 }); // Select first non-default option
      await page.waitForTimeout(1000);
      
      const afterTimeCheck = await page.evaluate(() => {
        const timeSelect = document.getElementById('booking-time');
        const dateInput = document.getElementById('booking-date');
        
        return {
          dateValue: dateInput ? dateInput.value : null,
          timeValue: timeSelect ? timeSelect.value : null,
          selectedIndex: timeSelect ? timeSelect.selectedIndex : -1,
          selectedText: timeSelect && timeSelect.selectedIndex >= 0 ? timeSelect.options[timeSelect.selectedIndex].text : null
        };
      });
      
      console.log('After time selection:', JSON.stringify(afterTimeCheck, null, 2));
      
      // Test validation
      console.log('🧪 Testing validation...');
      const validationTest = await page.evaluate(() => {
        const date = document.getElementById('booking-date').value.trim();
        const time = document.getElementById('booking-time').value.trim();
        const timeSelect = document.getElementById('booking-time');
        const isTimeSelected = time && time.trim() !== '' && timeSelect?.selectedIndex > 0;
        
        return {
          date: date,
          time: time,
          selectedIndex: timeSelect?.selectedIndex,
          isTimeSelected: isTimeSelected,
          wouldPassValidation: !!(date && time && date.trim() !== '' && isTimeSelected)
        };
      });
      
      console.log('Validation test:', JSON.stringify(validationTest, null, 2));
      
      if (validationTest.wouldPassValidation) {
        console.log('✅ Should pass validation, testing next button...');
        await page.click('#next-btn');
        await page.waitForTimeout(2000);
        
        const finalCheck = await page.evaluate(() => {
          const steps = ['service-selection', 'datetime-selection', 'contact-info', 'payment-info', 'booking-summary'];
          for (let step of steps) {
            const el = document.getElementById(step);
            if (el && window.getComputedStyle(el).display !== 'none') {
              return step;
            }
          }
          return 'unknown';
        });
        
        console.log('Final step after next button:', finalCheck);
      } else {
        console.log('❌ Would fail validation');
      }
      
    } else {
      console.log('❌ No time options available');
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await browser.close();
  }
}

debugDateTime().catch(console.error);