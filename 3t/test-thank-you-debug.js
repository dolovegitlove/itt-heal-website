/**
 * Debug Thank You Modal - Actual Booking Flow
 * Test the full booking flow to see where thank you modal fails
 */

const { chromium } = require('playwright');

async function testThankYouDebug() {
    console.log('🧪 Debugging Thank You Modal - Full Booking Flow...\n');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Capture ALL console logs for debugging
        page.on('console', msg => {
            const text = msg.text();
            console.log(`[Browser] ${text}`);
        });
        
        // Capture page errors
        page.on('pageerror', error => {
            console.log(`[Page Error] ${error.toString()}`);
        });
        
        // Navigate to booking page
        console.log('📍 Loading booking page...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        // Start booking flow
        await page.locator('#booking').scrollIntoViewIfNeeded();
        await page.waitForTimeout(2000);
        
        console.log('📍 Starting complete booking flow...');
        
        // Step 1: Select service
        console.log('📍 Step 1: Selecting 90min service...');
        await page.locator('[data-service-type="90min_massage"]').click();
        await page.waitForTimeout(3000);
        
        // Check if auto-advanced or need manual next
        const step2Visible = await page.locator('#datetime-selection').isVisible();
        if (!step2Visible) {
            console.log('📍 Clicking Next to go to Step 2...');
            await page.locator('#next-btn').click();
            await page.waitForTimeout(2000);
        }
        
        // Step 2: Set date and time
        console.log('📍 Step 2: Setting date and time...');
        await page.locator('#booking-date').fill('2025-07-19');
        await page.waitForTimeout(4000); // Wait for times to load
        
        const timeOptions = await page.locator('#booking-time option').count();
        console.log(`📍 Found ${timeOptions} time options`);
        
        if (timeOptions > 1) {
            await page.locator('#booking-time').selectOption({ index: 1 });
            await page.waitForTimeout(1000);
            
            // Step 3: Contact info
            console.log('📍 Step 3: Going to contact info...');
            await page.locator('#next-btn').click();
            await page.waitForTimeout(2000);
            
            await page.locator('#client-name').fill('Debug Test User');
            await page.locator('#client-email').fill('debug@test.com');
            await page.locator('#client-phone').fill('555-DEBUG-01');
            
            // Step 4: Payment method
            console.log('📍 Step 4: Going to payment...');
            await page.locator('#next-btn').click();
            await page.waitForTimeout(2000);
            
            // Check available payment methods
            const paymentMethods = await page.locator('input[name="payment-method"]').count();
            console.log(`📍 Found ${paymentMethods} payment methods`);
            
            // Try comp first, then other options
            let paymentSelected = false;
            const compPayment = page.locator('input[value="comp"]');
            if (await compPayment.isVisible()) {
                await compPayment.click();
                console.log('📍 Selected comp payment');
                paymentSelected = true;
            } else {
                // Try other payment options
                const otherPayment = page.locator('input[value="other"]');
                if (await otherPayment.isVisible()) {
                    await otherPayment.click();
                    console.log('📍 Selected other payment');
                    paymentSelected = true;
                } else {
                    // List available payment options
                    const availableOptions = await page.locator('input[name="payment-method"]').evaluateAll(inputs => 
                        inputs.map(input => ({ value: input.value, visible: input.offsetParent !== null }))
                    );
                    console.log('📍 Available payment options:', availableOptions);
                    
                    // Select first visible option
                    const firstVisible = availableOptions.find(opt => opt.visible);
                    if (firstVisible) {
                        await page.locator(`input[value="${firstVisible.value}"]`).click();
                        console.log(`📍 Selected payment: ${firstVisible.value}`);
                        paymentSelected = true;
                    }
                }
            }
            
            if (paymentSelected) {
                await page.waitForTimeout(1000);
                
                // Step 5: Review and submit
                console.log('📍 Step 5: Going to review...');
                await page.locator('#next-btn').click();
                await page.waitForTimeout(2000);
                
                console.log('📍 About to submit booking...');
                console.log('📍 WATCH CONSOLE FOR DEBUG MESSAGES...');
                
                const submitBtn = page.locator('#confirm-booking-btn');
                if (await submitBtn.isVisible()) {
                    await submitBtn.click();
                    console.log('📍 Booking submission clicked - waiting for response...');
                    
                    // Wait longer for booking completion
                    await page.waitForTimeout(10000);
                    
                    // Check if thank you content appeared
                    const thankYouContent = page.locator('#thank-you-content');
                    const isVisible = await thankYouContent.isVisible();
                    
                    console.log(`\n📊 RESULT: Thank you content visible = ${isVisible}`);
                    
                    if (isVisible) {
                        console.log('🎉 SUCCESS: Thank you modal appeared!');
                    } else {
                        console.log('❌ FAILED: Thank you modal did not appear');
                        
                        // Check current page state
                        const currentUrl = page.url();
                        console.log(`Current URL: ${currentUrl}`);
                        
                        // Check if still on booking page
                        const bookingVisible = await page.locator('#booking').isVisible();
                        console.log(`Booking section still visible: ${bookingVisible}`);
                        
                        // Check if any error messages are shown
                        const errorElements = await page.locator('[style*="color: red"], [style*="color: #ef4444"], .error').count();
                        console.log(`Error elements found: ${errorElements}`);
                    }
                } else {
                    console.log('❌ Submit button not found or not visible');
                }
            } else {
                console.log('❌ No payment method could be selected');
            }
        } else {
            console.log('❌ No time slots available - cannot complete test');
        }
        
        console.log('\n📊 DEBUG SESSION COMPLETE');
        console.log('Check the browser console logs above for the booking flow debug messages');
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
if (require.main === module) {
    testThankYouDebug().catch(console.error);
}

module.exports = { testThankYouDebug };