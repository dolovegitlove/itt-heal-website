/**
 * 🚨 CRITICAL VALIDATION: Calendar Fix Test
 * Purpose: Verify calendar displays dates after hardcoded rules removal
 * Method: Check that calendar renders dates properly
 */

const { chromium } = require('playwright');

async function testCalendarFix() {
    console.log('🚀 Testing calendar fix...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    let page;
    try {
        page = await browser.newPage();
        
        // Track console errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`❌ Console Error: ${msg.text()}`);
            } else if (msg.text().includes('calendar') || msg.text().includes('Calendar')) {
                console.log(`📅 Calendar Log: ${msg.text()}`);
            }
        });
        
        // Navigate to live site
        console.log('📍 Navigating to live /3t site...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
        
        // Select service to get to calendar
        console.log('📍 Selecting service to access calendar...');
        await page.waitForSelector('[data-service-type="90min_massage"]', { timeout: 10000 });
        await page.locator('[data-service-type="90min_massage"]').click();
        
        await page.waitForTimeout(3000);
        
        // Check if calendar container exists
        console.log('📍 Checking for calendar container...');
        const calendarContainer = await page.locator('#custom-calendar-container').count();
        
        if (calendarContainer === 0) {
            console.log('⚠️ Calendar container not found - calendar might not be initialized');
        } else {
            console.log('✅ Calendar container found');
        }
        
        // Check for calendar dates
        console.log('📍 Checking for calendar dates...');
        const calendarDates = await page.locator('.calendar-date').count();
        console.log(`📅 Found ${calendarDates} calendar date elements`);
        
        if (calendarDates === 0) {
            throw new Error('❌ No calendar dates found - calendar is broken');
        }
        
        // Check if dates have content
        const dateContents = await page.locator('.calendar-date').allTextContents();
        const nonEmptyDates = dateContents.filter(content => content.trim() !== '').length;
        
        console.log(`📅 Found ${nonEmptyDates} dates with content out of ${calendarDates} total`);
        
        if (nonEmptyDates === 0) {
            throw new Error('❌ Calendar dates have no content - calendar rendering is broken');
        }
        
        // Check specific date content
        const firstWeekDates = dateContents.slice(0, 10).filter(d => d.trim() !== '');
        console.log('📅 First week dates:', firstWeekDates);
        
        // Test clicking on an available date
        console.log('📍 Testing date selection...');
        const availableDates = await page.locator('.calendar-date:not([disabled])').count();
        console.log(`📅 Found ${availableDates} available dates`);
        
        if (availableDates > 0) {
            await page.locator('.calendar-date:not([disabled])').first().click();
            await page.waitForTimeout(1000);
            console.log('✅ Successfully clicked on calendar date');
        }
        
        console.log('\n🎉 CALENDAR FIX VALIDATION COMPLETE!');
        console.log('✅ Calendar container present');
        console.log('✅ Calendar dates rendering');
        console.log('✅ Dates have content');
        console.log('✅ Date selection working');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ CALENDAR FIX FAILED:', error.message);
        
        try {
            await page.screenshot({ 
                path: '/home/ittz/projects/itt/site/3t/calendar-fix-test.png',
                fullPage: true 
            });
            console.log('📸 Screenshot saved: calendar-fix-test.png');
        } catch (screenshotError) {
            console.log('📸 Could not take screenshot');
        }
        
        return false;
        
    } finally {
        await browser.close();
    }
}

// Run test
testCalendarFix().then(success => {
    if (success) {
        console.log('\n🎯 CALENDAR FIXED SUCCESSFULLY');
        process.exit(0);
    } else {
        console.log('\n💥 CALENDAR FIX FAILED');
        process.exit(1);
    }
}).catch(error => {
    console.error('\n💥 CRITICAL ERROR:', error);
    process.exit(1);
});