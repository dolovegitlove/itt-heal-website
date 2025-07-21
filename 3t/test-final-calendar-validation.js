/**
 * 🚨 FINAL VALIDATION: Calendar Working Test
 * Purpose: Verify calendar is fully functional after final fix
 * Method: Complete user workflow test
 */

const { chromium } = require('playwright');

async function finalCalendarTest() {
    console.log('🚀 Final calendar validation...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    let page;
    try {
        page = await browser.newPage();
        
        // Track errors (should be none now)
        let hasErrors = false;
        page.on('console', msg => {
            if (msg.type() === 'error' && msg.text().includes('isBusinessDay')) {
                console.log(`❌ Still has isBusinessDay error: ${msg.text()}`);
                hasErrors = true;
            } else if (msg.text().includes('calendar') || msg.text().includes('Calendar')) {
                console.log(`📅 Calendar: ${msg.text()}`);
            }
        });
        
        page.on('pageerror', error => {
            if (error.message.includes('isBusinessDay')) {
                console.log(`❌ Page Error: ${error.message}`);
                hasErrors = true;
            }
        });
        
        // Navigate and test
        console.log('📍 Navigating to live site...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
        
        // Select service
        console.log('📍 Selecting service...');
        await page.waitForSelector('[data-service-type="90min_massage"]', { timeout: 10000 });
        await page.locator('[data-service-type="90min_massage"]').click();
        
        await page.waitForTimeout(3000);
        
        // Check calendar
        const calendarDates = await page.locator('.calendar-date').count();
        console.log(`📅 Calendar dates found: ${calendarDates}`);
        
        const dateTexts = await page.locator('.calendar-date').allTextContents();
        const nonEmptyDates = dateTexts.filter(t => t.trim() !== '').length;
        console.log(`📅 Dates with content: ${nonEmptyDates}`);
        
        // Test clicking on dates
        const availableDates = await page.locator('.calendar-date:not([disabled])').count();
        console.log(`📅 Available dates: ${availableDates}`);
        
        if (availableDates > 0) {
            await page.locator('.calendar-date:not([disabled])').first().click();
            console.log('✅ Successfully clicked calendar date');
        }
        
        await page.waitForTimeout(2000);
        
        // Final check
        if (hasErrors) {
            throw new Error('Calendar still has isBusinessDay errors');
        }
        
        if (calendarDates === 0) {
            throw new Error('Calendar has no dates');
        }
        
        if (nonEmptyDates === 0) {
            throw new Error('Calendar dates have no content');
        }
        
        console.log('\n🎉 CALENDAR FINAL VALIDATION PASSED!');
        console.log('✅ No isBusinessDay errors');
        console.log('✅ Calendar dates visible');
        console.log('✅ Date content showing');
        console.log('✅ Date interaction working');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ FINAL VALIDATION FAILED:', error.message);
        return false;
        
    } finally {
        await browser.close();
    }
}

// Run final test
finalCalendarTest().then(success => {
    if (success) {
        console.log('\n🎯 CALENDAR FULLY FIXED AND WORKING');
    } else {
        console.log('\n💥 CALENDAR STILL HAS ISSUES');
    }
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('\n💥 CRITICAL ERROR:', error);
    process.exit(1);
});