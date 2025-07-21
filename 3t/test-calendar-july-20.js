const { chromium } = require('playwright');

async function testJuly20Booking() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
    args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('Closed dates') || msg.text().includes('calendar')) {
        console.log('Browser console:', msg.text());
      }
    });
    
    console.log('1. Navigating to 3t page...');
    await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
    
    console.log('2. Selecting a service to advance to calendar...');
    // Click on 60 minute service
    await page.click('[data-service="60min_massage"]');
    await page.waitForTimeout(1000);
    
    console.log('3. Waiting for calendar to load...');
    await page.waitForSelector('#calendar-grid', { timeout: 10000 });
    
    console.log('4. Navigating to July 2025...');
    // Keep clicking next month until we reach July 2025
    let attempts = 0;
    while (attempts < 12) {
      const monthText = await page.textContent('#current-month');
      console.log('Current month:', monthText);
      if (monthText.includes('July 2025')) break;
      await page.click('#next-month');
      await page.waitForTimeout(500);
      attempts++;
    }
    
    console.log('5. Finding July dates...');
    
    // Get all calendar date buttons
    const dateButtons = await page.locator('button.calendar-date').all();
    
    // Find July 20th
    let july20Found = false;
    let july20Clickable = false;
    for (const button of dateButtons) {
      const text = await button.textContent();
      if (text === '20') {
        july20Found = true;
        const isDisabled = await button.isDisabled();
        const style = await button.getAttribute('style');
        
        console.log('\nJuly 20th found!');
        console.log('- Disabled:', isDisabled);
        console.log('- Style:', style);
        console.log('- Has grey background:', style.includes('#f8f9fa'));
        
        // Try to click it
        try {
          await button.click({ timeout: 1000 });
          july20Clickable = true;
          console.log('⚠️ WARNING: July 20th was clickable!');
        } catch (error) {
          console.log('✅ Good: July 20th is not clickable');
        }
        break;
      }
    }
    
    if (!july20Found) {
      console.log('❌ July 20th button not found!');
    }
    
    // Also check July 4th (Independence Day)
    console.log('\n6. Checking July 4th (Independence Day)...');
    for (const button of dateButtons) {
      const text = await button.textContent();
      if (text === '4') {
        const isDisabled = await button.isDisabled();
        const style = await button.getAttribute('style');
        
        console.log('July 4th found!');
        console.log('- Disabled:', isDisabled);
        console.log('- Style:', style);
        
        try {
          await button.click({ timeout: 1000 });
          console.log('⚠️ WARNING: July 4th (Independence Day) was clickable!');
        } catch (error) {
          console.log('✅ Good: July 4th is not clickable');
        }
        break;
      }
    }
    
    // Check what the browser thinks about closed dates
    console.log('\n7. Checking CalendarBooking.closedDates in browser...');
    const closedDates = await page.evaluate(() => {
      if (window.CalendarBooking) {
        return window.CalendarBooking.closedDates;
      }
      return null;
    });
    
    console.log('Closed dates in browser:', closedDates);
    if (closedDates) {
      console.log('- Includes July 4th:', closedDates.includes('2025-07-04'));
      console.log('- Includes July 20th:', closedDates.includes('2025-07-20'));
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'july-calendar.png', fullPage: false });
    console.log('\nScreenshot saved as july-calendar.png');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    console.log('\nPress Ctrl+C to close the browser...');
    await page.waitForTimeout(30000); // Keep browser open for manual inspection
    await browser.close();
  }
}

testJuly20Booking().catch(console.error);