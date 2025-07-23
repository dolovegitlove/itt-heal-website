const { chromium } = require('playwright');

(async () => {
    console.log('🔧 Testing FasciaFlow Timezone Fix');
    console.log('=====================================');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        // Navigate to booking page
        await page.goto('https://ittheal.com/3t/');
        await page.waitForTimeout(2000);

        console.log('📍 Testing FasciaFlow service selection...');
        
        // Select FasciaFlow service
        await page.locator('[data-service="fasciaflow"]').click();
        await page.waitForTimeout(2000);

        // Check if we advanced to step 2
        const step2Visible = await page.locator('#datetime-selection').isVisible();
        console.log(`📊 Step 2 visible after FasciaFlow selection: ${step2Visible}`);
        
        if (!step2Visible) {
            const nextBtn = page.locator('#next-btn');
            if (await nextBtn.isVisible()) {
                console.log('📍 Clicking Next to proceed to Step 2...');
                await nextBtn.click();
                await page.waitForTimeout(2000);
            }
        }

        // Verify step 2 is now active
        const step2Active = await page.locator('#datetime-selection').isVisible();
        console.log(`📊 Step 2 active: ${step2Active}`);

        if (step2Active) {
            console.log('📅 Testing today\'s date selection...');
            
            // Set today's date
            const today = new Date();
            const todayString = today.toISOString().split('T')[0];
            console.log(`📅 Setting date to today: ${todayString}`);
            
            await page.locator('#booking-date').fill(todayString);
            await page.waitForTimeout(1000);

            // Check for any validation errors
            const alerts = [];
            page.on('dialog', dialog => {
                alerts.push(dialog.message());
                dialog.accept();
            });

            // Wait for time slots to load
            await page.waitForTimeout(3000);
            
            // Check if time slots are available
            const timeOptions = await page.locator('#booking-time option').count();
            console.log(`📊 Available time slots: ${timeOptions}`);

            if (timeOptions > 1) {
                // Select first available time
                await page.locator('#booking-time').selectOption({ index: 1 });
                await page.waitForTimeout(1000);

                // Try to proceed to next step
                const nextBtn = page.locator('#next-btn');
                if (await nextBtn.isVisible()) {
                    console.log('📍 Testing step validation with today\'s date...');
                    await nextBtn.click();
                    await page.waitForTimeout(2000);

                    // Check if we successfully moved to step 3
                    const step3Visible = await page.locator('#contact-info').isVisible();
                    console.log(`📊 Step 3 visible: ${step3Visible}`);
                    
                    if (step3Visible) {
                        console.log('✅ SUCCESS: FasciaFlow with today\'s date works correctly!');
                    } else {
                        console.log('❌ Still stuck on Step 2 - checking for alerts...');
                    }
                }
            } else {
                console.log('⚠️ No time slots available for today');
            }

            if (alerts.length > 0) {
                console.log('🚨 Validation alerts received:', alerts);
            } else {
                console.log('✅ No validation alerts - timezone fix successful!');
            }
        }

        // Test date validation debug info
        const debugInfo = await page.evaluate(() => {
            const date = document.getElementById('booking-date')?.value;
            if (date) {
                const selectedDateObj = new Date(date + 'T00:00:00');
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                return {
                    inputDate: date,
                    selectedDateObj: selectedDateObj.toISOString(),
                    todayMidnight: today.toISOString(),
                    comparison: selectedDateObj >= today,
                    timezoneOffset: new Date().getTimezoneOffset()
                };
            }
            return null;
        });

        if (debugInfo) {
            console.log('🔍 Date validation debug:', debugInfo);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
})();