const { chromium } = require('playwright');

async function testAPIValidation() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🎯 Testing API validation calls...\n');
    
    // Navigate to date/time step
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(2000);
    
    // Check what API calls are being made
    const apiDebug = await page.evaluate(async () => {
      const dateInput = document.getElementById('booking-date');
      const selectedDate = dateInput?.value;
      const practitionerId = '060863f2-0623-4785-b01a-f1760cfb8d14';
      const serviceType = '90min_massage';
      
      console.log('📋 API Debug - Testing availability endpoint');
      console.log('Selected date:', selectedDate);
      console.log('Practitioner ID:', practitionerId);
      console.log('Service type:', serviceType);
      
      if (!selectedDate) {
        return { error: 'No date selected' };
      }
      
      const apiUrl = `https://ittheal.com/api/web-booking/availability/${practitionerId}/${selectedDate}?service_type=${serviceType}`;
      console.log('📋 Testing API URL:', apiUrl);
      
      try {
        const response = await fetch(apiUrl);
        console.log('📋 API Response status:', response.status);
        console.log('📋 API Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          const data = await response.json();
          console.log('📋 API Response data:', data);
          return { 
            success: true, 
            status: response.status,
            data: data,
            url: apiUrl
          };
        } else {
          const errorText = await response.text();
          console.log('📋 API Error response:', errorText);
          return { 
            success: false, 
            status: response.status,
            error: errorText,
            url: apiUrl
          };
        }
      } catch (error) {
        console.error('📋 API call failed:', error);
        return { 
          success: false, 
          error: error.message,
          url: apiUrl
        };
      }
    });
    
    console.log('📊 API VALIDATION RESULTS:');
    console.log('Success:', apiDebug.success);
    console.log('Status:', apiDebug.status);
    console.log('URL:', apiDebug.url);
    
    if (apiDebug.success) {
      console.log('Available times:', apiDebug.data?.available_times?.length || 0);
      console.log('Times:', apiDebug.data?.available_times);
    } else {
      console.log('Error:', apiDebug.error);
    }
    
    // Now let's see what happens when we select a time
    console.log('\n⏰ Testing time selection with API validation...');
    
    const timeSelection = await page.evaluate(async () => {
      const timeSelect = document.getElementById('booking-time');
      if (timeSelect && timeSelect.options.length > 1) {
        // Select the first available time
        timeSelect.selectedIndex = 1;
        const selectedTime = timeSelect.value;
        const selectedText = timeSelect.options[timeSelect.selectedIndex].text;
        
        console.log('⏰ Selected time:', selectedTime, '(' + selectedText + ')');
        
        // Trigger the change event to invoke validateTimeSelection
        timeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        
        return {
          success: true,
          selectedTime: selectedTime,
          selectedText: selectedText
        };
      }
      return { success: false, error: 'No time options available' };
    });
    
    console.log('Time selection:', timeSelection);
    
    // Wait for the API validation to complete
    await page.waitForTimeout(3000);
    
    // Check if there were any errors
    const finalCheck = await page.evaluate(() => {
      const nextBtn = document.getElementById('next-btn');
      return {
        nextButtonDisabled: nextBtn?.disabled || false,
        lastConsoleError: window.lastError || 'none'
      };
    });
    
    console.log('\n📊 FINAL STATE:');
    console.log('Next button disabled:', finalCheck.nextButtonDisabled);
    
    if (apiDebug.status === 400) {
      console.log('\n❌ ISSUE IDENTIFIED: API returns 400 error');
      console.log('This causes validateTimeSelection to fail');
      console.log('The function throws an error but doesn\'t block the UI');
      console.log('Date/time selection still works, but validation fails in background');
    }
    
    await page.waitForTimeout(2000);
    
  } catch (error) {
    console.error('❌ API validation test error:', error);
  } finally {
    await browser.close();
  }
}

testAPIValidation().catch(console.error);