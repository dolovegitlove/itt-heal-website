/**
 * 🚨 URGENT DEBUG: Live Calendar Empty Issue
 * Purpose: Debug why calendar is empty on live site
 * Method: Step-by-step calendar initialization debugging
 */

const { chromium } = require('playwright');

async function debugLiveCalendar() {
    console.log('🚀 Debugging live calendar...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    let page;
    try {
        page = await browser.newPage();
        
        // Track all console messages and errors
        page.on('console', msg => {
            console.log(`💬 Console [${msg.type()}]: ${msg.text()}`);
        });
        
        page.on('pageerror', error => {
            console.log(`❌ Page Error: ${error.message}`);
        });
        
        // Navigate to live site
        console.log('📍 Step 1: Navigating to https://ittheal.com/3t/...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
        
        // Check if custom calendar script loaded
        console.log('📍 Step 2: Checking if CustomCalendar is available...');
        const customCalendarExists = await page.evaluate(() => {
            return typeof window.CustomCalendar !== 'undefined';
        });
        console.log(`🔍 CustomCalendar exists: ${customCalendarExists}`);
        
        // Select service to trigger calendar
        console.log('📍 Step 3: Selecting 90min service...');
        await page.waitForSelector('[data-service-type="90min_massage"]', { timeout: 10000 });
        await page.locator('[data-service-type="90min_massage"]').click();
        
        await page.waitForTimeout(3000);
        
        // Check calendar elements step by step
        console.log('📍 Step 4: Checking calendar elements...');
        
        const calendarContainer = await page.locator('#custom-calendar-container').count();
        console.log(`🔍 Calendar container count: ${calendarContainer}`);
        
        if (calendarContainer > 0) {
            const containerHTML = await page.locator('#custom-calendar-container').innerHTML();
            console.log(`🔍 Calendar container HTML length: ${containerHTML.length}`);
            
            // Check calendar grid
            const calendarGrid = await page.locator('#calendar-grid').count();
            console.log(`🔍 Calendar grid count: ${calendarGrid}`);
            
            if (calendarGrid > 0) {
                const gridHTML = await page.locator('#calendar-grid').innerHTML();
                console.log(`🔍 Calendar grid HTML length: ${gridHTML.length}`);
                console.log(`🔍 Calendar grid HTML preview: ${gridHTML.substring(0, 200)}...`);
            }
            
            // Check calendar dates
            const calendarDates = await page.locator('.calendar-date').count();
            console.log(`🔍 Calendar dates count: ${calendarDates}`);
            
            if (calendarDates > 0) {
                const dateTexts = await page.locator('.calendar-date').allTextContents();
                const nonEmptyDates = dateTexts.filter(t => t.trim() !== '');
                console.log(`🔍 Non-empty dates count: ${nonEmptyDates.length}`);
                console.log(`🔍 First 10 dates: ${nonEmptyDates.slice(0, 10)}`);
            } else {
                console.log('❌ No calendar dates found!');
            }
        } else {
            console.log('❌ No calendar container found!');
        }
        
        // Debug API calls
        console.log('📍 Step 5: Checking API calls...');
        const apiCalled = await page.evaluate(() => {
            // Try to manually call fetchBusinessRules if available
            if (window.CustomCalendar && window.CustomCalendar.fetchBusinessRules) {
                console.log('🔍 Manually calling fetchBusinessRules...');
                return window.CustomCalendar.fetchBusinessRules().then(() => {
                    console.log('🔍 fetchBusinessRules completed');
                    console.log('🔍 closedDates:', window.CustomCalendar.closedDates);
                    return true;
                }).catch(error => {
                    console.log('❌ fetchBusinessRules error:', error);
                    return false;
                });
            }
            return false;
        });
        
        await page.waitForTimeout(2000);
        
        // Final check after manual API call
        console.log('📍 Step 6: Final calendar check...');
        const finalCalendarDates = await page.locator('.calendar-date').count();
        console.log(`🔍 Final calendar dates count: ${finalCalendarDates}`);
        
        // Take screenshot for analysis
        await page.screenshot({ 
            path: '/home/ittz/projects/itt/site/3t/live-calendar-debug.png',
            fullPage: true 
        });
        console.log('📸 Screenshot saved: live-calendar-debug.png');
        
        return finalCalendarDates > 0;
        
    } catch (error) {
        console.error('\n❌ DEBUG FAILED:', error.message);
        return false;
        
    } finally {
        await browser.close();
    }
}

// Run debug
debugLiveCalendar().then(hasCalendar => {
    if (hasCalendar) {
        console.log('\n✅ Calendar found on live site');
    } else {
        console.log('\n❌ Calendar is empty on live site');
    }
    process.exit(hasCalendar ? 0 : 1);
}).catch(error => {
    console.error('\n💥 CRITICAL ERROR:', error);
    process.exit(1);
});