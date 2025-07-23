const { chromium } = require('playwright');

(async () => {
    console.log('📅 Testing FasciaFlow Availability Fix for 7/23');
    console.log('===============================================');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Monitor network requests
    const apiCalls = [];
    page.on('request', request => {
        if (request.url().includes('availability')) {
            apiCalls.push({
                url: request.url(),
                method: request.method()
            });
        }
    });

    const apiResponses = [];
    page.on('response', response => {
        if (response.url().includes('availability')) {
            apiResponses.push({
                url: response.url(),
                status: response.status()
            });
        }
    });
    
    try {
        await page.goto('https://ittheal.com/3t/');
        await page.waitForTimeout(2000);

        console.log('📍 Step 1: Select FasciaFlow service...');
        await page.locator('[data-service="fasciaflow"]').click();
        await page.waitForTimeout(2000);

        // Check if we advanced to step 2
        const step2Visible = await page.locator('#datetime-selection').isVisible();
        console.log(`📊 Step 2 visible: ${step2Visible}`);
        
        if (!step2Visible) {
            const nextBtn = page.locator('#next-btn');
            if (await nextBtn.isVisible()) {
                console.log('📍 Clicking Next to proceed to Step 2...');
                await nextBtn.click();
                await page.waitForTimeout(2000);
            }
        }

        console.log('📍 Step 2: Testing date 2025-07-23 availability...');
        
        // Click on 7/23 date if visible in calendar
        try {
            const targetDate = '2025-07-23';
            const dateButton = page.locator(`.calendar-day[data-date="${targetDate}"]`);
            
            if (await dateButton.isVisible()) {
                console.log(`📅 Clicking on ${targetDate}...`);
                await dateButton.click();
                await page.waitForTimeout(3000); // Wait for time slots to load
                
                // Check the API calls made
                console.log('\n📡 API Calls Made:');
                apiCalls.forEach(call => {
                    console.log(`  ${call.method} ${call.url}`);
                    
                    // Extract service_type from URL
                    const serviceTypeMatch = call.url.match(/service_type=([^&]+)/);
                    if (serviceTypeMatch) {
                        console.log(`    Service Type: ${serviceTypeMatch[1]}`);
                    }
                });

                console.log('\n📥 API Responses:');
                apiResponses.forEach(resp => {
                    console.log(`  Status: ${resp.status} - ${resp.url}`);
                });

                // Check if time slots are loaded
                await page.waitForTimeout(2000);
                const timeOptions = await page.locator('#booking-time option').count();
                console.log(`\n⏰ Time slots available: ${timeOptions - 1}`); // -1 for placeholder option

                if (timeOptions > 1) {
                    console.log('✅ SUCCESS: FasciaFlow availability is working for 7/23!');
                    
                    // Show first few available times
                    const availableTimes = await page.locator('#booking-time option:not([value=""])').allTextContents();
                    console.log(`📋 Available times: ${availableTimes.slice(0, 5).join(', ')}${availableTimes.length > 5 ? '...' : ''}`);
                } else {
                    console.log('❌ ISSUE: No time slots loaded for FasciaFlow on 7/23');
                    
                    // Check for error messages
                    const timeSelectText = await page.locator('#booking-time option').first().textContent();
                    console.log(`📋 Time select shows: "${timeSelectText}"`);
                }

                // Check the service mapping debug info
                const debugInfo = await page.evaluate(() => {
                    // Access the booking availability module if available
                    return {
                        selectedService: window.selectedService || 'not set',
                        currentTimestamp: new Date().toISOString()
                    };
                });

                console.log('\n🔍 Debug Info:');
                console.log(`  Selected Service: ${debugInfo.selectedService}`);
                console.log(`  Timestamp: ${debugInfo.currentTimestamp}`);

            } else {
                console.log('❌ Date 2025-07-23 not found in calendar');
            }
        } catch (dateError) {
            console.log('📅 Date selection error:', dateError.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
})();