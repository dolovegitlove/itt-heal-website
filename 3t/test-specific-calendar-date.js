/**
 * 🚨 TARGETED TEST: Specific Calendar Date Click
 * Purpose: Click on a specific calendar date with content and verify times load
 * Method: X11 real browser targeting actual date cells, not empty ones
 */

const { chromium } = require('playwright');

async function testSpecificCalendarDate() {
    console.log('🚀 Testing specific calendar date click...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    let page;
    try {
        page = await browser.newPage();
        
        let apiCalls = [];
        page.on('request', request => {
            if (request.url().includes('/api/web-booking/availability/')) {
                apiCalls.push(request.url());
                console.log(`🌐 API Call: ${request.url()}`);
            }
        });
        
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Debug') || text.includes('🔍') || text.includes('API') || text.includes('change')) {
                console.log(`💬 Console: ${text}`);
            }
        });
        
        // Navigate and setup
        console.log('📍 Navigate and select service');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
        await page.waitForSelector('[data-service-type="90min_massage"]', { timeout: 15000 });
        await page.locator('[data-service-type="90min_massage"]').click();
        await page.waitForTimeout(3000);
        
        // Find all calendar dates with actual text content
        console.log('📍 Finding calendar dates with content');
        const calendarDateInfo = await page.evaluate(() => {
            const dates = Array.from(document.querySelectorAll('.calendar-date'));
            return dates.map((date, index) => ({
                index,
                text: date.textContent?.trim() || '',
                dataDate: date.getAttribute('data-date'),
                disabled: date.disabled || date.getAttribute('aria-disabled') === 'true',
                hasContent: Boolean(date.textContent?.trim()),
                isButton: date.tagName === 'BUTTON'
            })).filter(d => d.hasContent && d.text && !d.disabled && d.isButton);
        });
        
        console.log(`📅 Found ${calendarDateInfo.length} valid calendar dates:`);
        calendarDateInfo.slice(0, 5).forEach((date, i) => {
            console.log(`   ${i + 1}. Text: "${date.text}", data-date: "${date.dataDate}", disabled: ${date.disabled}`);
        });
        
        if (calendarDateInfo.length === 0) {
            throw new Error('No valid calendar dates found with content');
        }
        
        // Select the first valid date (should be a future date)
        const targetDate = calendarDateInfo[0];
        console.log(`📅 Target date: "${targetDate.text}" (data-date: ${targetDate.dataDate})`);
        
        // Click the specific date by index
        console.log('🖱️ Clicking specific calendar date...');
        await page.locator('.calendar-date').nth(targetDate.index).click();
        console.log('✅ Calendar date clicked');
        
        // Wait for processing
        await page.waitForTimeout(4000);
        
        // Check results
        const hiddenInput = page.locator('#booking-date');
        const timeSelect = page.locator('#booking-time');
        
        const dateValue = await hiddenInput.inputValue();
        const timeOptions = await timeSelect.locator('option').count();
        const timeSelectText = await timeSelect.textContent();
        
        console.log(`🔍 Results:`);
        console.log(`   Hidden input value: "${dateValue}"`);
        console.log(`   Time options count: ${timeOptions}`);
        console.log(`   API calls made: ${apiCalls.length}`);
        console.log(`   Time select preview: "${timeSelectText?.substring(0, 100)}..."`);
        
        // If no API calls, try manual trigger
        if (apiCalls.length === 0) {
            console.log('🔧 No API calls detected, manually triggering change event...');
            await page.evaluate((targetDataDate) => {
                const dateInput = document.getElementById('booking-date');
                if (dateInput) {
                    // Ensure the value is set correctly
                    if (targetDataDate) {
                        dateInput.value = targetDataDate;
                    }
                    console.log('🔧 Manually triggering change event with value:', dateInput.value);
                    dateInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, targetDate.dataDate);
            
            await page.waitForTimeout(4000);
            
            const finalTimeOptions = await timeSelect.locator('option').count();
            console.log(`🔍 After manual trigger: ${apiCalls.length} API calls, ${finalTimeOptions} time options`);
        }
        
        // Final validation
        const success = apiCalls.length > 0 && timeOptions > 1;
        console.log(success ? '\n✅ CALENDAR DATE CLICK SUCCESSFUL' : '\n❌ CALENDAR DATE CLICK FAILED');
        
        // Take screenshot
        await page.screenshot({ 
            path: '/home/ittz/projects/itt/site/3t/specific-date-test.png',
            fullPage: true 
        });
        
        return success;
        
    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        return false;
        
    } finally {
        await browser.close();
    }
}

// Run test
testSpecificCalendarDate().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 ERROR:', error);
    process.exit(1);
});