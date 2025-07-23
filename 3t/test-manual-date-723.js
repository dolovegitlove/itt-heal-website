const { chromium } = require('playwright');

(async () => {
    console.log('🔧 Testing Manual Date Setting for 7/23');
    console.log('========================================');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Monitor API calls
    const apiCalls = [];
    page.on('request', request => {
        if (request.url().includes('availability')) {
            apiCalls.push({
                url: request.url(),
                method: request.method(),
                serviceType: request.url().match(/service_type=([^&]+)/)?.[1]
            });
        }
    });

    const apiResponses = [];
    page.on('response', async response => {
        if (response.url().includes('availability')) {
            try {
                const responseBody = await response.json();
                apiResponses.push({
                    url: response.url(),
                    status: response.status(),
                    success: responseBody.success,
                    availableSlots: responseBody.data?.available_slots?.length || 0
                });
            } catch (e) {
                apiResponses.push({
                    url: response.url(),
                    status: response.status(),
                    error: 'Could not parse JSON'
                });
            }
        }
    });
    
    try {
        await page.goto('https://ittheal.com/3t/');
        await page.waitForTimeout(2000);

        console.log('📍 Select FasciaFlow and proceed to calendar...');
        await page.locator('[data-service="fasciaflow"]').click();
        await page.waitForTimeout(2000);

        const step2Visible = await page.locator('#datetime-selection').isVisible();
        if (!step2Visible) {
            await page.locator('#next-btn').click();
            await page.waitForTimeout(2000);
        }

        console.log('🔧 Setting date to 2025-07-23 manually...');
        
        // Set the date input directly and trigger the loadTimeSlots function
        await page.evaluate(() => {
            const dateInput = document.getElementById('booking-date');
            if (dateInput) {
                dateInput.value = '2025-07-23';
                
                // Trigger the change event to load time slots
                const changeEvent = new Event('change', { bubbles: true });
                dateInput.dispatchEvent(changeEvent);
                
                // Also try to call the booking availability function directly
                if (window.bookingAvailabilityInstance && window.bookingAvailabilityInstance.loadTimeSlots) {
                    console.log('📍 Calling loadTimeSlots directly...');
                    window.bookingAvailabilityInstance.loadTimeSlots('2025-07-23', 'fasciaflow');
                }
            }
        });

        // Wait for API call and response
        await page.waitForTimeout(5000);

        console.log('\n📡 API Calls Made:');
        apiCalls.forEach((call, index) => {
            console.log(`  ${index + 1}. ${call.method} - Service: ${call.serviceType}`);
            console.log(`     URL: ${call.url}`);
        });

        console.log('\n📥 API Responses:');
        apiResponses.forEach((resp, index) => {
            console.log(`  ${index + 1}. Status: ${resp.status} - Success: ${resp.success}`);
            console.log(`     Available slots: ${resp.availableSlots}`);
            console.log(`     URL: ${resp.url}`);
        });

        // Check time slots
        const timeOptions = await page.locator('#booking-time option').count();
        console.log(`\n⏰ Time options loaded: ${timeOptions - 1}`); // -1 for placeholder

        if (timeOptions > 1) {
            const times = await page.locator('#booking-time option:not([value=""])').allTextContents();
            console.log(`✅ Available times: ${times.slice(0, 5).join(', ')}${times.length > 5 ? '...' : ''}`);
            console.log(`📊 Total available times: ${times.length}`);
        } else {
            console.log('❌ No time slots loaded');
            
            // Check what the time select shows
            const timeSelectText = await page.locator('#booking-time option').first().textContent();
            console.log(`📋 Time select placeholder: "${timeSelectText}"`);
        }

        // Verify the service type is correctly set
        const serviceDebug = await page.evaluate(() => {
            return {
                selectedService: window.selectedService,
                currentStep: window.currentStep,
                dateInputValue: document.getElementById('booking-date')?.value
            };
        });

        console.log('\n🔍 Service Debug:');
        console.log(`  Selected Service: ${serviceDebug.selectedService}`);
        console.log(`  Current Step: ${serviceDebug.currentStep}`);
        console.log(`  Date Input Value: ${serviceDebug.dateInputValue}`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
})();