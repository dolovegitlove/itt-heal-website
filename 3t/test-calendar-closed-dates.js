const { chromium } = require('playwright');

async function testClosedDates() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
    args: [
      '--window-size=1920,1080',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  try {
    const page = await browser.newPage();
    
    console.log('1. Navigating to 3t page...');
    await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
    
    // Wait for calendar to load
    await page.waitForSelector('#calendar-grid', { timeout: 10000 });
    
    console.log('2. Checking if closed dates are fetched...');
    
    // Check console logs for closed dates
    page.on('console', msg => {
      if (msg.text().includes('Closed dates loaded:')) {
        console.log('Console:', msg.text());
      }
    });
    
    // Wait a bit for the fetch to complete
    await page.waitForTimeout(3000);
    
    console.log('3. Checking July calendar...');
    
    // Navigate to July 2025
    const currentMonth = await page.textContent('#current-month');
    console.log('Current month:', currentMonth);
    
    // Click next month until we reach July 2025
    while (!currentMonth.includes('July 2025')) {
      await page.click('#next-month');
      await page.waitForTimeout(500);
      const newMonth = await page.textContent('#current-month');
      console.log('Navigated to:', newMonth);
      if (newMonth.includes('July 2025')) break;
    }
    
    console.log('4. Checking July 20th (Sunday) status...');
    
    // Find July 20th button
    const july20Button = await page.locator('button.calendar-date:has-text("20")').first();
    
    // Check if it's disabled
    const isDisabled = await july20Button.isDisabled();
    console.log('July 20th is disabled:', isDisabled);
    
    // Check the style
    const style = await july20Button.getAttribute('style');
    console.log('July 20th style:', style);
    
    // Check if it has the grey background
    const hasGreyBackground = style.includes('background: #f8f9fa') || style.includes('background: rgb(248, 249, 250)');
    console.log('July 20th has grey background:', hasGreyBackground);
    
    // Try to click it
    console.log('5. Attempting to click July 20th...');
    try {
      await july20Button.click();
      console.log('⚠️ WARNING: July 20th was clickable!');
      
      // Check if date was selected
      const selectedDateDisplay = await page.textContent('#selected-date-display');
      console.log('Selected date display:', selectedDateDisplay);
    } catch (error) {
      console.log('✅ Good: July 20th is not clickable');
    }
    
    // Also check July 4th (Independence Day - Friday)
    console.log('\n6. Checking July 4th (Independence Day) status...');
    const july4Button = await page.locator('button.calendar-date:has-text("4")').first();
    const july4Disabled = await july4Button.isDisabled();
    const july4Style = await july4Button.getAttribute('style');
    console.log('July 4th is disabled:', july4Disabled);
    console.log('July 4th style:', july4Style);
    
    // Check a regular closed day (Tuesday)
    console.log('\n7. Checking a Tuesday (e.g., July 1st)...');
    const july1Button = await page.locator('button.calendar-date:has-text("1")').first();
    const july1Disabled = await july1Button.isDisabled();
    const july1Style = await july1Button.getAttribute('style');
    console.log('July 1st (Tuesday) is disabled:', july1Disabled);
    console.log('July 1st style:', july1Style);
    
    console.log('\n8. Checking API response in browser console...');
    const apiResponse = await page.evaluate(async () => {
      const response = await fetch('https://ittheal.com/api/web-booking/closed-dates?start_date=2025-07-01&end_date=2025-07-31');
      return await response.json();
    });
    
    console.log('API closed dates for July:', apiResponse.data.closed_dates);
    console.log('Does API include July 4th?', apiResponse.data.closed_dates.includes('2025-07-04'));
    console.log('Does API include July 20th?', apiResponse.data.closed_dates.includes('2025-07-20'));
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testClosedDates().catch(console.error);