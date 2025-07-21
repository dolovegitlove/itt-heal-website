/**
 * 🚨 CRITICAL VALIDATION: /3t Times Loading Fix
 * Purpose: Validate with 100% certainty that times are loading on live /3t site
 * Method: Real browser automation testing actual user workflow
 * Compliance: No shortcuts, no compromises, complete validation
 */

const { chromium } = require('playwright');

async function validateTimesLoading() {
    console.log('🚀 Starting comprehensive /3t times loading validation...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Step 1: Navigate to live /3t site
        console.log('📍 Step 1: Navigating to live /3t site...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
        
        // Step 2: Verify booking form is present
        console.log('📍 Step 2: Verifying booking form elements...');
        await page.waitForSelector('#booking-date', { timeout: 10000 });
        await page.waitForSelector('#booking-time', { timeout: 10000 });
        
        const dateInput = await page.locator('#booking-date');
        const timeSelect = await page.locator('#booking-time');
        
        if (!dateInput || !timeSelect) {
            throw new Error('❌ VALIDATION FAILED: Booking form elements not found');
        }
        console.log('✅ Booking form elements found');
        
        // Step 3: Select a valid business day (Wednesday)
        console.log('📍 Step 3: Selecting valid business day (Wednesday 2025-07-23)...');
        await dateInput.click();
        await page.keyboard.type('2025-07-23'); // Wednesday
        await page.keyboard.press('Tab');
        
        // Step 4: Wait for JavaScript to load times
        console.log('📍 Step 4: Waiting for times to load via JavaScript...');
        await page.waitForTimeout(3000); // Allow time for API call
        
        // Step 5: Verify times are populated
        console.log('📍 Step 5: Verifying time options are populated...');
        const timeOptions = await page.locator('#booking-time option').count();
        
        if (timeOptions <= 1) {
            // Check if there's an error message
            const errorText = await timeSelect.textContent();
            throw new Error(`❌ VALIDATION FAILED: No times loaded. Error: ${errorText}`);
        }
        
        console.log(`✅ Found ${timeOptions} time options including default`);
        
        // Step 6: Verify real time values exist
        console.log('📍 Step 6: Verifying actual time values...');
        const firstTimeOption = await page.locator('#booking-time option:nth-child(2)'); // Skip "Select time"
        const timeValue = await firstTimeOption.getAttribute('value');
        const timeText = await firstTimeOption.textContent();
        
        if (!timeValue || timeValue === '') {
            throw new Error('❌ VALIDATION FAILED: Time options have no values');
        }
        
        console.log(`✅ First time option: value="${timeValue}", text="${timeText}"`);
        
        // Step 7: Test actual time selection
        console.log('📍 Step 7: Testing actual time selection...');
        await timeSelect.click();
        await page.waitForTimeout(500);
        await firstTimeOption.click();
        
        const selectedValue = await timeSelect.inputValue();
        if (selectedValue !== timeValue) {
            throw new Error(`❌ VALIDATION FAILED: Time selection failed. Expected: ${timeValue}, Got: ${selectedValue}`);
        }
        
        console.log(`✅ Time selection successful: ${selectedValue}`);
        
        // Step 8: Test different business day
        console.log('📍 Step 8: Testing different business day (Friday 2025-07-25)...');
        await dateInput.click();
        await page.keyboard.selectAll();
        await page.keyboard.type('2025-07-25'); // Friday
        await page.keyboard.press('Tab');
        
        await page.waitForTimeout(3000); // Allow API call
        
        const fridayTimeOptions = await page.locator('#booking-time option').count();
        if (fridayTimeOptions <= 1) {
            throw new Error('❌ VALIDATION FAILED: No times loaded for Friday');
        }
        
        console.log(`✅ Friday times loaded: ${fridayTimeOptions} options`);
        
        // Step 9: Test closed day (Tuesday)
        console.log('📍 Step 9: Testing closed day validation (Tuesday 2025-07-22)...');
        await dateInput.click();
        await page.keyboard.selectAll();
        await page.keyboard.type('2025-07-22'); // Tuesday (closed)
        await page.keyboard.press('Tab');
        
        await page.waitForTimeout(3000); // Allow API call
        
        const tuesdayTimeOptions = await page.locator('#booking-time option').count();
        const tuesdayText = await timeSelect.textContent();
        
        if (tuesdayTimeOptions > 1) {
            throw new Error('❌ VALIDATION FAILED: Closed day showing times when it should not');
        }
        
        if (!tuesdayText.includes('business day') && !tuesdayText.includes('closed') && !tuesdayText.includes('Please select')) {
            console.log(`⚠️ Warning: Unexpected closed day message: "${tuesdayText}"`);
        }
        
        console.log(`✅ Closed day properly blocked: "${tuesdayText}"`);
        
        // Step 10: Final validation - return to working day
        console.log('📍 Step 10: Final validation - return to working day...');
        await dateInput.click();
        await page.keyboard.selectAll();
        await page.keyboard.type('2025-07-23'); // Wednesday again
        await page.keyboard.press('Tab');
        
        await page.waitForTimeout(3000);
        
        const finalTimeOptions = await page.locator('#booking-time option').count();
        if (finalTimeOptions <= 1) {
            throw new Error('❌ VALIDATION FAILED: Times not loading consistently');
        }
        
        console.log(`✅ Final validation passed: ${finalTimeOptions} options loaded`);
        
        // SUCCESS
        console.log('\n🎉 VALIDATION COMPLETE - 100% SUCCESS!');
        console.log('✅ Times are loading correctly on live /3t site');
        console.log('✅ Business day validation working');
        console.log('✅ Closed day blocking working');
        console.log('✅ Time selection working');
        console.log('✅ API integration working');
        console.log('\n🚨 NO SHORTCUTS. NO COMPROMISES. 100% VALIDATION ACHIEVED! 🚨');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ VALIDATION FAILED:', error.message);
        
        // Take screenshot for debugging
        try {
            await page.screenshot({ path: '/home/ittz/projects/itt/site/3t/validation-failure-screenshot.png' });
            console.log('📸 Screenshot saved: validation-failure-screenshot.png');
        } catch (screenshotError) {
            console.log('📸 Could not take screenshot:', screenshotError.message);
        }
        
        return false;
        
    } finally {
        await browser.close();
    }
}

// Run validation
validateTimesLoading().then(success => {
    if (success) {
        console.log('\n🎯 MISSION ACCOMPLISHED: Times loading validation PASSED');
        process.exit(0);
    } else {
        console.log('\n💥 MISSION FAILED: Times loading validation FAILED');
        process.exit(1);
    }
}).catch(error => {
    console.error('\n💥 CRITICAL ERROR:', error);
    process.exit(1);
});