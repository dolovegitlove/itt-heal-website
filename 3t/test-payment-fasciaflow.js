const { chromium } = require('playwright');

(async () => {
    console.log('💳 Testing FasciaFlow Payment Fix');
    console.log('==================================');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Capture network requests to see what's being sent
    const requests = [];
    page.on('request', request => {
        if (request.url().includes('create-payment-intent')) {
            requests.push({
                url: request.url(),
                method: request.method(),
                postData: request.postData(),
                headers: request.headers()
            });
        }
    });

    const responses = [];
    page.on('response', response => {
        if (response.url().includes('create-payment-intent')) {
            responses.push({
                url: response.url(),
                status: response.status(),
                statusText: response.statusText()
            });
        }
    });

    try {
        // Navigate to booking page
        await page.goto('https://ittheal.com/3t/');
        await page.waitForTimeout(2000);

        console.log('📍 Step 1: Select FasciaFlow service...');
        await page.locator('[data-service="fasciaflow"]').click();
        await page.waitForTimeout(2000);

        // Progress to step 2
        const step2Visible = await page.locator('#datetime-selection').isVisible();
        if (!step2Visible) {
            await page.locator('#next-btn').click();
            await page.waitForTimeout(2000);
        }

        console.log('📍 Step 2: Select date and time...');
        // Use tomorrow's date to avoid timezone issues
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toISOString().split('T')[0];

        // Click on tomorrow's date in calendar
        try {
            const tomorrowButton = page.locator(`.calendar-day[data-date="${tomorrowString}"]`);
            if (await tomorrowButton.isVisible()) {
                await tomorrowButton.click();
                await page.waitForTimeout(2000);
            }
        } catch (e) {
            console.log('📅 Calendar click failed, trying direct date input...');
        }

        // Wait for time slots to load
        await page.waitForTimeout(3000);
        
        // Select first available time
        const timeOptions = await page.locator('#booking-time option').count();
        if (timeOptions > 1) {
            await page.locator('#booking-time').selectOption({ index: 1 });
            await page.waitForTimeout(1000);
        }

        // Proceed to step 3
        await page.locator('#next-btn').click();
        await page.waitForTimeout(2000);

        console.log('📍 Step 3: Fill contact info...');
        await page.locator('#client-name').fill('Test User');
        await page.locator('#client-email').fill('test@example.com');
        await page.locator('#client-phone').fill('555-123-4567');

        // Proceed to step 4 (payment)
        await page.locator('#next-btn').click();
        await page.waitForTimeout(2000);

        console.log('📍 Step 4: Test payment selection...');
        
        // Select credit card payment
        const creditCardRadio = page.locator('input[name="payment-method"][value="credit_card"]');
        if (await creditCardRadio.isVisible()) {
            await creditCardRadio.click();
            await page.waitForTimeout(1000);

            console.log('📍 Triggering payment setup...');
            
            // Click next to trigger payment intent creation
            await page.locator('#next-btn').click();
            await page.waitForTimeout(5000);

            // Check what was actually sent
            if (requests.length > 0) {
                console.log('\n📤 Payment Request Sent:');
                requests.forEach(req => {
                    console.log(`Method: ${req.method}`);
                    console.log(`URL: ${req.url}`);
                    console.log(`Post Data: ${req.postData}`);
                    
                    if (req.postData) {
                        try {
                            const data = JSON.parse(req.postData);
                            console.log('🔍 Parsed Request Data:', JSON.stringify(data, null, 2));
                        } catch (e) {
                            console.log('📄 Raw Post Data:', req.postData);
                        }
                    }
                });
            }

            if (responses.length > 0) {
                console.log('\n📥 Payment Response Received:');
                responses.forEach(resp => {
                    console.log(`Status: ${resp.status} ${resp.statusText}`);
                    console.log(`URL: ${resp.url}`);
                });
            }

            // Check for any alerts or errors
            const pageContent = await page.content();
            if (pageContent.includes('Payment setup failed')) {
                console.log('❌ Payment setup failed detected on page');
            }

            // Check the current selected service info
            const serviceInfo = await page.evaluate(() => {
                const activeOption = document.querySelector('.service-option.active');
                return {
                    dataService: activeOption?.getAttribute('data-service'),
                    dataServiceType: activeOption?.getAttribute('data-service-type'),
                    selectedServiceVar: window.selectedService || 'not set'
                };
            });

            console.log('\n🔍 Service Selection Debug:');
            console.log(`data-service: ${serviceInfo.dataService}`);
            console.log(`data-service-type: ${serviceInfo.dataServiceType}`);
            console.log(`selectedService variable: ${serviceInfo.selectedServiceVar}`);

        } else {
            console.log('❌ Credit card payment option not found');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
})();