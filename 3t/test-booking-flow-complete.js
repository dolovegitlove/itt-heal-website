/**
 * Complete Booking Flow Test with Console Monitoring
 * Track exactly where the booking flow stops
 */

const { chromium } = require('playwright');

async function testBookingFlowComplete() {
    console.log('🧪 Complete Booking Flow Test with Console Monitoring...\n');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Enhanced console monitoring
        const logs = [];
        page.on('console', msg => {
            const text = msg.text();
            logs.push({ text, type: msg.type(), timestamp: new Date().toISOString() });
            
            // Show important messages immediately
            if (text.includes('🎉') || text.includes('✅') || text.includes('❌') || 
                text.includes('showThankYou') || text.includes('confirmationData') ||
                text.includes('Booking API result') || text.includes('Payment confirmation') ||
                text.includes('transitionStep') || text.includes('Elements found') ||
                text.includes('Transitioning to payment') || text.includes('validation') ||
                text.includes('error') || text.includes('Error')) {
                console.log(`[${msg.type().toUpperCase()}] ${text}`);
            }
        });
        
        // Track network requests
        page.on('response', response => {
            if (response.url().includes('/api/web-booking/') && response.status() !== 200) {
                console.log(`[NETWORK] ${response.status()} ${response.url()}`);
            }
        });
        
        page.on('pageerror', error => {
            console.log(`[PAGE ERROR] ${error.toString()}`);
        });
        
        // Navigate to booking page
        console.log('📍 Loading booking page...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(5000); // Wait longer for everything to initialize
        
        // Start booking flow
        console.log('📍 Starting booking flow...');
        await page.locator('#booking').scrollIntoViewIfNeeded();
        await page.waitForTimeout(2000);
        
        // Use a simpler approach - try to complete with minimal time slots
        console.log('📍 Step 1: Selecting service...');
        await page.locator('[data-service-type="90min_massage"]').click();
        await page.waitForTimeout(3000);
        
        // Check if auto-advanced
        const step2Visible = await page.locator('#datetime-selection').isVisible();
        if (!step2Visible) {
            console.log('📍 Manually advancing to Step 2...');
            await page.locator('#next-btn').click();
            await page.waitForTimeout(2000);
        }
        
        // Try different dates to avoid rate limiting
        const testDates = ['2025-07-21', '2025-07-22', '2025-07-23']; // Monday, Tuesday, Wednesday
        let timeSlotFound = false;
        
        for (const testDate of testDates) {
            console.log(`📍 Step 2: Trying date ${testDate}...`);
            await page.locator('#booking-date').fill(testDate);
            await page.waitForTimeout(5000); // Wait longer for API
            
            const timeOptions = await page.locator('#booking-time option').count();
            console.log(`📍 Found ${timeOptions} time options for ${testDate}`);
            
            if (timeOptions > 1) {
                await page.locator('#booking-time').selectOption({ index: 1 });
                timeSlotFound = true;
                console.log('✅ Time slot selected successfully');
                break;
            }
        }
        
        if (!timeSlotFound) {
            console.log('❌ No time slots available on any test date - cannot complete flow');
            console.log('📊 This explains why the thank you modal never appears - booking never completes');
            
            // Show recent logs anyway
            console.log('\n📋 Recent Console Logs:');
            logs.slice(-10).forEach(log => {
                if (log.text.includes('Error') || log.text.includes('429') || log.text.includes('slots')) {
                    console.log(`  ${log.text}`);
                }
            });
            
            return;
        }
        
        // Continue with booking
        console.log('📍 Step 3: Contact info...');
        await page.locator('#next-btn').click();
        await page.waitForTimeout(2000);
        
        await page.locator('#client-name').fill('Test User Complete');
        await page.locator('#client-email').fill('complete@test.com');
        await page.locator('#client-phone').fill('555-COMPLETE');
        
        console.log('📍 Step 4: Payment method...');
        await page.locator('#next-btn').click();
        await page.waitForTimeout(3000); // Wait longer
        
        // Check if payment section is visible first
        const paymentSectionVisible = await page.locator('#payment-info').isVisible();
        const paymentSectionDisplay = await page.locator('#payment-info').evaluate(el => 
            window.getComputedStyle(el).display
        );
        
        console.log(`📍 Payment section visible: ${paymentSectionVisible}`);
        console.log(`📍 Payment section display style: ${paymentSectionDisplay}`);
        
        // Check for any JavaScript errors in console
        console.log('📍 Checking for step transition errors...');
        
        // Try to find any available payment method
        const paymentOptions = await page.locator('input[name="payment-method"]').evaluateAll(inputs => 
            inputs.map(input => ({ 
                value: input.value, 
                visible: input.offsetParent !== null,
                checked: input.checked,
                display: window.getComputedStyle(input).display,
                parentVisible: input.parentElement ? input.parentElement.offsetParent !== null : false
            }))
        );
        
        console.log('📍 Available payment methods:', paymentOptions);
        
        let paymentSelected = false;
        for (const option of paymentOptions) {
            if (option.visible && ['other', 'cash', 'comp'].includes(option.value)) {
                await page.locator(`input[value="${option.value}"]`).click();
                console.log(`📍 Selected payment method: ${option.value}`);
                paymentSelected = true;
                break;
            }
        }
        
        if (!paymentSelected && paymentOptions.length > 0) {
            // Just select the first visible one
            const firstVisible = paymentOptions.find(opt => opt.visible);
            if (firstVisible) {
                await page.locator(`input[value="${firstVisible.value}"]`).click();
                console.log(`📍 Selected payment method: ${firstVisible.value}`);
                paymentSelected = true;
            }
        }
        
        if (paymentSelected) {
            console.log('📍 Step 5: Review and submit...');
            await page.locator('#next-btn').click();
            await page.waitForTimeout(2000);
            
            const submitBtn = page.locator('#confirm-booking-btn');
            if (await submitBtn.isVisible()) {
                console.log('📍 SUBMITTING BOOKING - WATCH FOR THANK YOU MODAL...');
                console.log('📍 Looking for debug messages about showThankYouInModal...');
                
                await submitBtn.click();
                
                // Wait longer for booking to complete
                console.log('📍 Waiting for booking completion...');
                await page.waitForTimeout(15000);
                
                // Check final state
                const thankYouVisible = await page.locator('#thank-you-content').isVisible();
                console.log(`\n📊 FINAL RESULT: Thank you modal visible = ${thankYouVisible}`);
                
                if (thankYouVisible) {
                    console.log('🎉 SUCCESS: Thank you modal appeared!');
                } else {
                    console.log('❌ FAILED: Thank you modal did not appear');
                    
                    // Check if still processing
                    const submitBtnText = await submitBtn.textContent();
                    console.log(`Submit button text: "${submitBtnText}"`);
                    
                    const currentUrl = page.url();
                    console.log(`Current URL: ${currentUrl}`);
                }
                
                // Show relevant logs
                console.log('\n📋 Booking-Related Console Logs:');
                const bookingLogs = logs.filter(log => 
                    log.text.includes('Booking API') || 
                    log.text.includes('confirmationData') ||
                    log.text.includes('showThankYou') ||
                    log.text.includes('Payment confirmation') ||
                    log.text.includes('error') ||
                    log.text.includes('failed')
                );
                
                bookingLogs.forEach(log => {
                    console.log(`  [${log.type}] ${log.text}`);
                });
                
            } else {
                console.log('❌ Submit button not visible');
            }
        } else {
            console.log('❌ No payment method could be selected');
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
if (require.main === module) {
    testBookingFlowComplete().catch(console.error);
}

module.exports = { testBookingFlowComplete };