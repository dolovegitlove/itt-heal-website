const { chromium } = require('playwright');

async function testCustomCalendar() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
    args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log('Browser:', msg.text());
    });
    
    console.log('1. Navigating to 3t page...');
    await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
    
    console.log('2. Selecting a service to advance to calendar...');
    // Wait for service options to load then click one
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(2000);
    
    console.log('3. Waiting for custom calendar to load...');
    await page.waitForSelector('#custom-calendar-container', { timeout: 10000 });
    
    console.log('4. Navigating to July 2025...');
    let attempts = 0;
    while (attempts < 12) {
      const monthText = await page.textContent('#current-month-year');
      console.log('Current month:', monthText);
      if (monthText.includes('July 2025')) break;
      await page.click('#next-month');
      await page.waitForTimeout(500);
      attempts++;
    }
    
    console.log('5. Checking July dates...');
    
    // Get all calendar date buttons
    const dateButtons = await page.locator('button.calendar-date').all();
    
    // Check July 20th
    let july20Found = false;
    for (const button of dateButtons) {
      const text = await button.textContent();
      if (text === '20' || text.includes('20')) {
        july20Found = true;
        const isDisabled = await button.isDisabled();
        const style = await button.getAttribute('style');
        
        console.log('\nJuly 20th found!');
        console.log('- Text content:', text);
        console.log('- Disabled:', isDisabled);
        console.log('- Style contains grey background:', style.includes('#f3f4f6'));
        console.log('- Style contains not-allowed cursor:', style.includes('not-allowed'));
        
        // Try to click it
        try {
          await button.click({ timeout: 1000 });
          console.log('⚠️ WARNING: July 20th was clickable!');
        } catch (error) {
          console.log('✅ Good: July 20th is not clickable - ' + error.message);
        }
        break;
      }
    }
    
    if (!july20Found) {
      console.log('❌ July 20th not found in calendar!');
    }
    
    // Check July 4th (Independence Day - should be closed)
    console.log('\n6. Checking July 4th (Independence Day)...');
    for (const button of dateButtons) {
      const text = await button.textContent();
      if (text === '4' || text.includes('4')) {
        const isDisabled = await button.isDisabled();
        const style = await button.getAttribute('style');
        const innerHTML = await button.innerHTML();
        
        console.log('July 4th found!');
        console.log('- Content:', innerHTML);
        console.log('- Disabled:', isDisabled);
        console.log('- Has holiday indicator (🚫):', innerHTML.includes('🚫'));
        console.log('- Style contains grey background:', style.includes('#f3f4f6'));
        
        try {
          await button.click({ timeout: 1000 });
          console.log('⚠️ WARNING: July 4th was clickable!');
        } catch (error) {
          console.log('✅ Good: July 4th is not clickable - ' + error.message);
        }
        break;
      }
    }
    
    // Test selecting an available date
    console.log('\n7. Testing selection of an available date...');
    for (const button of dateButtons) {
      const text = await button.textContent();
      const isDisabled = await button.isDisabled();
      
      if (!isDisabled && text.match(/^\d+$/)) {
        console.log(`Attempting to select date: ${text}`);
        await button.click();
        
        // Check if date was selected
        const selectedDisplay = await page.locator('#selected-date-display').isVisible();
        console.log('Selected date display visible:', selectedDisplay);
        
        if (selectedDisplay) {
          const selectedText = await page.textContent('#selected-date-text');
          console.log('Selected date text:', selectedText);
        }
        
        // Check hidden input
        const hiddenInputValue = await page.inputValue('#booking-date');
        console.log('Hidden input value:', hiddenInputValue);
        
        break;
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'custom-calendar-july.png', fullPage: false });
    console.log('\nScreenshot saved as custom-calendar-july.png');
    
    // Check calendar functionality
    console.log('\n8. Checking calendar navigation...');
    await page.click('#prev-month');
    await page.waitForTimeout(500);
    const prevMonth = await page.textContent('#current-month-year');
    console.log('Previous month:', prevMonth);
    
    await page.click('#next-month');
    await page.waitForTimeout(500);
    const backToJuly = await page.textContent('#current-month-year');
    console.log('Back to:', backToJuly);
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    console.log('\nTest completed. Press Ctrl+C to close browser...');
    await page.waitForTimeout(10000); // Keep browser open for manual inspection
    await browser.close();
  }
}

testCustomCalendar().catch(console.error);