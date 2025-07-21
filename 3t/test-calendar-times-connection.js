/**
 * 🚨 CRITICAL DEBUG: Calendar to Times Connection Test
 * Purpose: Debug calendar date selection triggering times loading
 * Method: X11 real browser with step-by-step debugging
 * Focus: Calendar click -> hidden input -> change event -> times API call
 */

const { chromium } = require('playwright');

async function testCalendarTimesConnection() {
    console.log('🚀 Testing calendar-to-times connection...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1500, // Slower for debugging
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    let page;
    try {
        page = await browser.newPage();
        
        // Track EVERYTHING
        let eventsTriggered = [];
        let apiCalls = [];
        
        page.on('console', msg => {
            const text = msg.text();
            console.log(`💬 Console: ${text}`);
            
            if (text.includes('handleDateChange') || text.includes('change')) {
                eventsTriggered.push(text);
            }
        });
        
        page.on('request', request => {
            if (request.url().includes('/api/web-booking/availability/')) {
                apiCalls.push(request.url());
                console.log(`🌐 API Call: ${request.url()}`);
            }
        });
        
        // Navigate and setup
        console.log('📍 Step 1: Navigate to site');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
        
        console.log('📍 Step 2: Select service');
        await page.waitForSelector('[data-service-type="90min_massage"]', { timeout: 15000 });
        await page.locator('[data-service-type="90min_massage"]').click();
        await page.waitForTimeout(3000);
        
        // Check initial state
        console.log('📍 Step 3: Check initial state');
        const hiddenInput = page.locator('#booking-date');
        const timeSelect = page.locator('#booking-time');
        
        const initialDateValue = await hiddenInput.inputValue();
        const initialTimeOptions = await timeSelect.locator('option').count();
        console.log(`🔍 Initial state: date="${initialDateValue}", timeOptions=${initialTimeOptions}`);
        
        // Test calendar click
        console.log('📍 Step 4: Test calendar date click');
        const availableCalendarDates = await page.locator('.calendar-date:not([disabled]):not([aria-disabled="true"])').count();
        console.log(`📅 Found ${availableCalendarDates} available calendar dates`);
        
        if (availableCalendarDates === 0) {
            throw new Error('No available calendar dates found');
        }
        
        // Get the date value of the first available calendar date
        const firstAvailableDate = page.locator('.calendar-date:not([disabled]):not([aria-disabled="true"])').first();
        const calendarDateValue = await firstAvailableDate.getAttribute('data-date');
        const calendarDateText = await firstAvailableDate.textContent();
        console.log(`📅 Will click calendar date: value="${calendarDateValue}", text="${calendarDateText}"`);
        
        // Clear any previous events
        eventsTriggered = [];
        apiCalls = [];
        
        // REAL calendar click
        console.log('🖱️ Performing REAL calendar click...');
        await firstAvailableDate.click();
        console.log('✅ Calendar click performed');
        
        // Wait and check what happened
        await page.waitForTimeout(3000);
        
        // Check if hidden input was updated
        const newDateValue = await hiddenInput.inputValue();
        console.log(`🔍 After click: date value changed from "${initialDateValue}" to "${newDateValue}"`);
        
        if (newDateValue === initialDateValue) {
            console.log('⚠️ WARNING: Hidden input value did not change');
        } else {
            console.log('✅ Hidden input value updated correctly');
        }
        
        // Check if change events were triggered
        console.log(`🔍 Events triggered: ${eventsTriggered.length}`);
        eventsTriggered.forEach((event, i) => {
            console.log(`   ${i + 1}. ${event}`);
        });
        
        // Check if API calls were made
        console.log(`🔍 API calls made: ${apiCalls.length}`);
        apiCalls.forEach((call, i) => {
            console.log(`   ${i + 1}. ${call}`);
        });
        
        // Check if times were loaded
        const newTimeOptions = await timeSelect.locator('option').count();
        const timeSelectText = await timeSelect.textContent();
        console.log(`🔍 Time options: ${initialTimeOptions} -> ${newTimeOptions}`);
        console.log(`🔍 Time select content: "${timeSelectText.substring(0, 100)}..."`);
        
        // Manually trigger change event for debugging
        console.log('📍 Step 5: Manually trigger change event for comparison');
        const manualApiCount = apiCalls.length;
        
        await page.evaluate(() => {
            const dateInput = document.getElementById('booking-date');
            if (dateInput) {
                console.log('🔧 Manually triggering change event');
                dateInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        
        await page.waitForTimeout(3000);
        
        const manualApiCalls = apiCalls.length - manualApiCount;
        console.log(`🔍 Manual trigger resulted in ${manualApiCalls} additional API calls`);
        
        // Final state check
        const finalTimeOptions = await timeSelect.locator('option').count();
        console.log(`🔍 Final time options: ${finalTimeOptions}`);
        
        // Take debug screenshot
        await page.screenshot({ 
            path: '/home/ittz/projects/itt/site/3t/calendar-times-debug.png',
            fullPage: true 
        });
        console.log('📸 Debug screenshot saved');
        
        // Determine success
        const success = apiCalls.length > 0 && finalTimeOptions > 1;
        
        if (success) {
            console.log('\n✅ CALENDAR-TIMES CONNECTION WORKING');
        } else {
            console.log('\n❌ CALENDAR-TIMES CONNECTION BROKEN');
            console.log(`   - API calls made: ${apiCalls.length}`);
            console.log(`   - Time options loaded: ${finalTimeOptions}`);
        }
        
        return success;
        
    } catch (error) {
        console.error('\n❌ CONNECTION TEST FAILED:', error.message);
        return false;
        
    } finally {
        await browser.close();
    }
}

// Run test
testCalendarTimesConnection().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 CRITICAL ERROR:', error);
    process.exit(1);
});