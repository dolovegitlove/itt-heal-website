const { chromium } = require('playwright');

(async () => {
    console.log('📅 Testing Available Calendar Dates');
    console.log('==================================');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 300,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        await page.goto('https://ittheal.com/3t/');
        await page.waitForTimeout(2000);

        console.log('📍 Select FasciaFlow and go to calendar...');
        await page.locator('[data-service="fasciaflow"]').click();
        await page.waitForTimeout(2000);

        const step2Visible = await page.locator('#datetime-selection').isVisible();
        if (!step2Visible) {
            await page.locator('#next-btn').click();
            await page.waitForTimeout(2000);
        }

        // Wait for calendar to load
        await page.waitForTimeout(3000);

        // Get all available calendar dates
        const availableDates = await page.evaluate(() => {
            const calendarDays = document.querySelectorAll('.calendar-day');
            const dates = [];
            
            calendarDays.forEach(day => {
                const dataDate = day.getAttribute('data-date');
                const isAvailable = !day.classList.contains('disabled') && !day.classList.contains('closed');
                const dayText = day.textContent.trim();
                
                dates.push({
                    date: dataDate,
                    dayText: dayText,
                    available: isAvailable,
                    classes: day.className
                });
            });
            
            return dates;
        });

        console.log('\n📅 Calendar Analysis:');
        console.log(`Total calendar days found: ${availableDates.length}`);

        const availableOnly = availableDates.filter(d => d.available);
        console.log(`Available dates: ${availableOnly.length}`);

        if (availableOnly.length > 0) {
            console.log('\n✅ Available dates:');
            availableOnly.slice(0, 10).forEach(date => {
                console.log(`  ${date.date} (${date.dayText})`);
            });
        }

        // Check specifically for 7/23
        const july23 = availableDates.find(d => d.date === '2025-07-23');
        if (july23) {
            console.log(`\n🔍 July 23, 2025 status:`);
            console.log(`  Available: ${july23.available}`);
            console.log(`  Classes: ${july23.classes}`);
            console.log(`  Day text: ${july23.dayText}`);
        } else {
            console.log('\n❌ July 23, 2025 not found in calendar');
        }

        // Try to click on the first available date to test the API call
        if (availableOnly.length > 0) {
            const firstAvailable = availableOnly[0];
            console.log(`\n📍 Testing API call with first available date: ${firstAvailable.date}`);
            
            const apiCalls = [];
            page.on('request', request => {
                if (request.url().includes('availability')) {
                    apiCalls.push({
                        url: request.url(),
                        serviceType: request.url().match(/service_type=([^&]+)/)?.[1]
                    });
                }
            });

            try {
                await page.locator(`.calendar-day[data-date="${firstAvailable.date}"]`).click();
                await page.waitForTimeout(3000);

                if (apiCalls.length > 0) {
                    console.log('📡 API Call Made:');
                    apiCalls.forEach(call => {
                        console.log(`  Service Type: ${call.serviceType}`);
                        console.log(`  URL: ${call.url}`);
                    });
                } else {
                    console.log('❌ No API calls detected');
                }

                const timeOptions = await page.locator('#booking-time option').count();
                console.log(`⏰ Time slots loaded: ${timeOptions - 1}`);

            } catch (clickError) {
                console.log('❌ Error clicking date:', clickError.message);
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
})();