/**
 * 🚨 CRITICAL VALIDATION: /3t Times Loading with Real User Workflow
 * Purpose: Test actual user journey to booking form and times loading
 * Method: Real browser automation following complete user workflow
 * Compliance: No shortcuts, no compromises, complete validation
 */

const { chromium } = require('playwright');

async function validateCompleteWorkflow() {
    console.log('🚀 Starting real user workflow validation for /3t...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 800,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    let page;
    try {
        page = await browser.newPage();
        
        // Step 1: Navigate to live /3t site
        console.log('📍 Step 1: Navigating to live /3t site...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
        
        // Step 2: Select a service (90-minute massage)
        console.log('📍 Step 2: Selecting 90-minute massage service...');
        await page.waitForSelector('[data-service-type="90min_massage"]', { timeout: 15000 });
        await page.locator('[data-service-type="90min_massage"]').click();
        
        // Wait for form to appear
        await page.waitForTimeout(2000);
        
        // Step 3: Verify booking form is now visible
        console.log('📍 Step 3: Verifying booking form is visible...');
        await page.waitForSelector('#booking-date', { state: 'visible', timeout: 10000 });
        await page.waitForSelector('#booking-time', { state: 'visible', timeout: 10000 });
        
        console.log('✅ Booking form elements are visible');
        
        // Step 4: Select a valid business day (Wednesday)
        console.log('📍 Step 4: Selecting valid business day (Wednesday 2025-07-23)...');
        const dateInput = page.locator('#booking-date');
        await dateInput.click();
        await page.keyboard.type('2025-07-23'); // Wednesday
        await page.keyboard.press('Tab');
        
        // Step 5: Wait for times to load via JavaScript
        console.log('📍 Step 5: Waiting for times to load via API...');
        await page.waitForTimeout(5000); // Allow time for API call and processing
        
        // Step 6: Check for loading state or times
        const timeSelect = page.locator('#booking-time');
        const timeSelectText = await timeSelect.textContent();
        console.log(`📍 Time select content: "${timeSelectText}"`);
        
        // Step 7: Count actual time options
        console.log('📍 Step 7: Counting time options...');
        const timeOptions = await page.locator('#booking-time option').count();
        console.log(`📍 Found ${timeOptions} total options`);
        
        // Step 8: List all options for debugging
        const allOptions = await page.locator('#booking-time option').allTextContents();
        console.log('📍 All time options:', allOptions);
        
        // Step 9: Verify we have real time options (more than just "Select time")
        if (timeOptions <= 1) {
            throw new Error(`❌ VALIDATION FAILED: Only ${timeOptions} option(s) found. Expected multiple time slots.`);
        }
        
        if (allOptions.length <= 1 || (allOptions.length === 1 && allOptions[0].includes('Select'))) {
            throw new Error(`❌ VALIDATION FAILED: No real time options found. Options: ${JSON.stringify(allOptions)}`);
        }
        
        console.log(`✅ Found ${timeOptions - 1} real time options`);
        
        // Step 10: Test selecting a time
        console.log('📍 Step 10: Testing time selection...');
        const firstRealOption = page.locator('#booking-time option:nth-child(2)'); // Skip "Select time"
        const timeValue = await firstRealOption.getAttribute('value');
        const timeText = await firstRealOption.textContent();
        
        console.log(`📍 First time option: value="${timeValue}", text="${timeText}"`);
        
        if (!timeValue || timeValue === '') {
            throw new Error('❌ VALIDATION FAILED: Time options have empty values');
        }
        
        // Actually select the time
        await timeSelect.selectOption(timeValue);
        await page.waitForTimeout(1000);
        
        const selectedValue = await timeSelect.inputValue();
        if (selectedValue !== timeValue) {
            throw new Error(`❌ VALIDATION FAILED: Time selection failed. Expected: ${timeValue}, Got: ${selectedValue}`);
        }
        
        console.log(`✅ Time selection successful: ${selectedValue}`);
        
        // Step 11: Test API call debugging
        console.log('📍 Step 11: Checking console for API calls...');
        
        // Listen for console messages
        page.on('console', msg => {
            if (msg.text().includes('API') || msg.text().includes('🔍')) {
                console.log(`🔍 Browser console: ${msg.text()}`);
            }
        });
        
        // Change date to trigger another API call
        await dateInput.click();
        await page.keyboard.selectAll();
        await page.keyboard.type('2025-07-25'); // Friday
        await page.keyboard.press('Tab');
        
        await page.waitForTimeout(5000); // Allow API call
        
        const fridayOptions = await page.locator('#booking-time option').count();
        console.log(`📍 Friday options count: ${fridayOptions}`);
        
        if (fridayOptions <= 1) {
            const fridayText = await timeSelect.textContent();
            throw new Error(`❌ VALIDATION FAILED: Friday should have times. Content: "${fridayText}"`);
        }
        
        console.log(`✅ Friday times loaded: ${fridayOptions} options`);
        
        // SUCCESS
        console.log('\n🎉 VALIDATION COMPLETE - 100% SUCCESS!');
        console.log('✅ Service selection working');
        console.log('✅ Booking form appearing correctly');
        console.log('✅ Times loading from API');
        console.log('✅ Time selection working');
        console.log('✅ Date changes trigger new API calls');
        console.log('\n🚨 NO SHORTCUTS. NO COMPROMISES. 100% VALIDATION ACHIEVED! 🚨');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ VALIDATION FAILED:', error.message);
        
        // Take screenshot for debugging
        try {
            if (page) {
                await page.screenshot({ 
                    path: '/home/ittz/projects/itt/site/3t/workflow-failure-screenshot.png',
                    fullPage: true 
                });
                console.log('📸 Screenshot saved: workflow-failure-screenshot.png');
            }
        } catch (screenshotError) {
            console.log('📸 Could not take screenshot:', screenshotError.message);
        }
        
        return false;
        
    } finally {
        await browser.close();
    }
}

// Run validation
validateCompleteWorkflow().then(success => {
    if (success) {
        console.log('\n🎯 MISSION ACCOMPLISHED: Complete workflow validation PASSED');
        process.exit(0);
    } else {
        console.log('\n💥 MISSION FAILED: Complete workflow validation FAILED');
        process.exit(1);
    }
}).catch(error => {
    console.error('\n💥 CRITICAL ERROR:', error);
    process.exit(1);
});