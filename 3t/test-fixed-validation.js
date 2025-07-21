const { chromium } = require('playwright');

async function testFixedValidation() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    // Listen for API-related logs
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('closed dates') || text.includes('validation') || text.includes('API') || text.includes('Error')) {
        console.log(`[LOG] ${text}`);
      }
    });
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🎯 Testing fixed date validation...\n');
    
    // Start booking flow
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(3000); // Give time for closed dates to load
    
    console.log('📅 Checking closed dates loading...');
    
    const closedDatesCheck = await page.evaluate(() => {
      return {
        closedDatesLoaded: !!window.closedDates,
        closedDatesCount: window.closedDates?.length || 0,
        sampleClosedDates: window.closedDates?.slice(0, 5) || []
      };
    });
    
    console.log('📊 CLOSED DATES STATUS:');
    console.log('Loaded:', closedDatesCheck.closedDatesLoaded);
    console.log('Count:', closedDatesCheck.closedDatesCount);
    console.log('Sample dates:', closedDatesCheck.sampleClosedDates);
    
    // Try to find an available date (not in closed dates)
    console.log('\n📅 Finding available date...');
    
    const availableDateSearch = await page.evaluate(() => {
      const today = new Date();
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 30); // Look ahead 30 days
      
      const closedDates = window.closedDates || [];
      
      for (let d = new Date(today); d <= maxDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay();
        
        // Skip weekends and closed dates
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !closedDates.includes(dateStr)) {
          return {
            found: true,
            date: dateStr,
            dayName: d.toLocaleDateString('en-US', { weekday: 'long' })
          };
        }
      }
      
      return { found: false };
    });
    
    console.log('Available date search:', availableDateSearch);
    
    if (!availableDateSearch.found) {
      console.log('❌ No available dates found in next 30 days');
      return;
    }
    
    // Select the available date directly
    console.log(`\n📅 Selecting available date: ${availableDateSearch.date} (${availableDateSearch.dayName})`);
    
    const dateSelection = await page.evaluate((targetDate) => {
      const dateInput = document.getElementById('booking-date');
      if (dateInput) {
        dateInput.value = targetDate;
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
        return { success: true, selectedDate: dateInput.value };
      }
      return { success: false };
    }, availableDateSearch.date);
    
    console.log('Date selection result:', dateSelection);
    await page.waitForTimeout(2000);
    
    // Check if time options loaded
    const timeOptionsCheck = await page.evaluate(() => {
      const timeSelect = document.getElementById('booking-time');
      return {
        exists: !!timeSelect,
        optionsCount: timeSelect?.options?.length || 0,
        firstFewOptions: Array.from(timeSelect?.options || []).slice(0, 3).map(opt => opt.text)
      };
    });
    
    console.log('\n⏰ TIME OPTIONS:');
    console.log('Time select exists:', timeOptionsCheck.exists);
    console.log('Options count:', timeOptionsCheck.optionsCount);
    console.log('First options:', timeOptionsCheck.firstFewOptions);
    
    if (timeOptionsCheck.optionsCount > 1) {
      // Select a time
      console.log('\n⏰ Selecting time...');
      
      const timeSelection = await page.evaluate(() => {
        const timeSelect = document.getElementById('booking-time');
        if (timeSelect && timeSelect.options.length > 1) {
          timeSelect.selectedIndex = 1;
          timeSelect.dispatchEvent(new Event('change', { bubbles: true }));
          return {
            success: true,
            selectedValue: timeSelect.value,
            selectedText: timeSelect.options[timeSelect.selectedIndex].text
          };
        }
        return { success: false };
      });
      
      console.log('Time selection:', timeSelection);
      await page.waitForTimeout(3000); // Wait for validation
      
      // Check final validation state
      const finalValidation = await page.evaluate(() => {
        const dateInput = document.getElementById('booking-date');
        const timeSelect = document.getElementById('booking-time');
        const nextBtn = document.getElementById('next-btn');
        
        return {
          dateValue: dateInput?.value || 'no date',
          timeValue: timeSelect?.value || 'no time',
          nextButtonDisabled: nextBtn?.disabled || false,
          validationErrors: document.querySelectorAll('.validation-error').length
        };
      });
      
      console.log('\n📊 FINAL VALIDATION STATE:');
      console.log('Date:', finalValidation.dateValue);
      console.log('Time:', finalValidation.timeValue);
      console.log('Next button disabled:', finalValidation.nextButtonDisabled);
      console.log('Validation errors:', finalValidation.validationErrors);
      
      // Try clicking next
      console.log('\n➡️ Testing next button...');
      await page.click('#next-btn');
      await page.waitForTimeout(2000);
      
      const progressCheck = await page.evaluate(() => {
        const contactStep = document.getElementById('contact-info');
        return {
          onContactStep: contactStep && window.getComputedStyle(contactStep).display !== 'none'
        };
      });
      
      if (progressCheck.onContactStep) {
        console.log('✅ SUCCESS: Date/time validation fixed! Progressed to contact step.');
      } else {
        console.log('❌ Still stuck on date/time step');
      }
    }
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Fixed validation test error:', error);
  } finally {
    await browser.close();
  }
}

testFixedValidation().catch(console.error);