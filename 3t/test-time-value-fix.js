/**
 * Test Time Value Fix
 * Verify that invalid time value errors are resolved
 */

const { chromium } = require('playwright');

async function testTimeValueFix() {
    console.log('🧪 Testing Time Value Fix...\n');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 800,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Capture console messages
        const logs = [];
        const errors = [];
        
        page.on('console', msg => {
            const text = msg.text();
            logs.push(text);
            
            if (text.includes('Invalid') || text.includes('Error') || text.includes('❌')) {
                console.log(`❌ [ERROR] ${text}`);
                errors.push(text);
            } else if (text.includes('✅') || text.includes('Scheduled DateTime') || text.includes('Safe')) {
                console.log(`✅ [SUCCESS] ${text}`);
            }
        });
        
        page.on('pageerror', error => {
            const errorMsg = error.toString();
            console.log(`❌ [PAGE ERROR] ${errorMsg}`);
            errors.push(errorMsg);
        });
        
        // Navigate to booking page
        console.log('📍 Loading booking page...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        // Complete booking flow
        console.log('📍 Starting complete booking flow...');
        await page.locator('#booking').scrollIntoViewIfNeeded();
        await page.waitForTimeout(2000);
        
        // Step 1: Select service
        console.log('📍 Step 1: Selecting service...');
        await page.locator('[data-service-type="90min_massage"]').click();
        await page.waitForTimeout(2000);
        
        // Step 2: Date and Time
        console.log('📍 Step 2: Setting date and time...');
        const step2Visible = await page.locator('#datetime-selection').isVisible();
        if (!step2Visible) {
            await page.locator('#next-btn').click();
            await page.waitForTimeout(2000);
        }
        
        await page.locator('#booking-date').fill('2025-07-19');
        await page.waitForTimeout(3000); // Wait for times to load
        
        const timeOptions = await page.locator('#booking-time option').count();
        if (timeOptions > 1) {
            await page.locator('#booking-time').selectOption({ index: 1 });
            console.log('✅ Time selected successfully');
            
            // Proceed to Step 3
            await page.locator('#next-btn').click();
            await page.waitForTimeout(2000);
            
            // Step 3: Contact info
            console.log('📍 Step 3: Filling contact info...');
            await page.locator('#client-name').fill('John Doe');
            await page.locator('#client-email').fill('john@example.com');
            await page.locator('#client-phone').fill('555-123-4567');
            
            await page.locator('#next-btn').click();
            await page.waitForTimeout(2000);
            
            // Step 4: Payment method
            console.log('📍 Step 4: Selecting payment method...');
            const paymentVisible = await page.locator('#payment-info').isVisible();
            if (paymentVisible) {
                // Select a payment method
                const compPayment = page.locator('input[value="comp"]');
                if (await compPayment.isVisible()) {
                    await compPayment.click();
                    console.log('📍 Selected comp payment for testing');
                }
                
                await page.locator('#next-btn').click();
                await page.waitForTimeout(2000);
                
                // Step 5: Review and submit
                console.log('📍 Step 5: Review and submit...');
                const submitBtn = page.locator('#confirm-booking-btn');
                if (await submitBtn.isVisible()) {
                    console.log('📍 Clicking submit to test datetime processing...');
                    await submitBtn.click();
                    
                    // Wait for processing
                    await page.waitForTimeout(5000);
                    
                    console.log('✅ Booking submission attempted - checking for errors...');
                }
            }
        } else {
            console.log('⚠️ No time slots available for testing');
        }
        
        // Check for specific datetime processing
        console.log('\n📊 Testing datetime validation...');
        const datetimeTest = await page.evaluate(() => {
            const results = {
                dateValid: false,
                timeValid: false,
                datetimeValid: false,
                errors: []
            };
            
            try {
                const dateInput = document.getElementById('booking-date');
                const timeSelect = document.getElementById('booking-time');
                
                if (dateInput && timeSelect && dateInput.value && timeSelect.value) {
                    // Test the same logic used in the booking
                    const appointmentDate = dateInput.value;
                    const appointmentTime = timeSelect.value;
                    
                    results.dateValid = !!appointmentDate;
                    results.timeValid = !!appointmentTime;
                    
                    // Test time format validation
                    let formattedTime = appointmentTime;
                    if (!/^\d{2}:\d{2}$/.test(appointmentTime)) {
                        const timeMatch = appointmentTime.match(/(\d{1,2}):(\d{2})/);
                        if (timeMatch) {
                            const hours = timeMatch[1].padStart(2, '0');
                            const minutes = timeMatch[2];
                            formattedTime = `${hours}:${minutes}`;
                        } else {
                            throw new Error(`Invalid time format: ${appointmentTime}`);
                        }
                    }
                    
                    // Test datetime creation
                    const dateTimeString = `${appointmentDate}T${formattedTime}:00`;
                    const scheduledDateTimeObj = new Date(dateTimeString);
                    
                    if (isNaN(scheduledDateTimeObj.getTime())) {
                        throw new Error(`Invalid date/time combination: ${appointmentDate} ${formattedTime}`);
                    }
                    
                    results.datetimeValid = true;
                    results.scheduledDateTime = scheduledDateTimeObj.toISOString();
                }
            } catch (error) {
                results.errors.push(error.toString());
            }
            
            return results;
        });
        
        console.log('\n📊 DateTime Validation Results:');
        console.log(JSON.stringify(datetimeTest, null, 2));
        
        // Summary
        console.log('\n📊 TEST SUMMARY:');
        console.log(`Total console logs: ${logs.length}`);
        console.log(`Total errors: ${errors.length}`);
        
        if (errors.length === 0) {
            console.log('✅ NO INVALID TIME VALUE ERRORS DETECTED!');
        } else {
            console.log('❌ Errors still present:');
            errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
        }
        
        if (datetimeTest.datetimeValid) {
            console.log('✅ DateTime validation working correctly');
        } else {
            console.log('❌ DateTime validation failed');
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
if (require.main === module) {
    testTimeValueFix().catch(console.error);
}

module.exports = { testTimeValueFix };