const { chromium } = require('playwright');

(async () => {
    console.log('🔍 Calendar Debug Test');
    console.log('=====================');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Log all console messages and errors
    page.on('console', msg => {
        console.log(`🖥️  BROWSER: ${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', error => {
        console.log(`❌ PAGE ERROR: ${error.message}`);
    });
    
    try {
        await page.goto('https://ittheal.com/3t/');
        await page.waitForTimeout(3000);

        console.log('📍 Select FasciaFlow service...');
        await page.locator('[data-service="fasciaflow"]').click();
        await page.waitForTimeout(2000);

        // Check if we're on step 2
        const step2Visible = await page.locator('#datetime-selection').isVisible();
        console.log(`📊 Step 2 visible: ${step2Visible}`);
        
        if (!step2Visible) {
            await page.locator('#next-btn').click();
            await page.waitForTimeout(3000);
        }

        // Check DOM elements
        const calendarInfo = await page.evaluate(() => {
            const calendarContainer = document.querySelector('.calendar-container');
            const calendarGrid = document.querySelector('.calendar-grid');
            const calendarDays = document.querySelectorAll('.calendar-day');
            const dateInput = document.getElementById('booking-date');
            const timeInput = document.getElementById('booking-time');
            
            return {
                calendarContainerExists: !!calendarContainer,
                calendarGridExists: !!calendarGrid,
                calendarDaysCount: calendarDays.length,
                dateInputExists: !!dateInput,
                dateInputValue: dateInput?.value,
                timeInputExists: !!timeInput,
                timeOptionsCount: timeInput?.options?.length || 0,
                customCalendarInitialized: window.customCalendarInitialized || false,
                selectedService: window.selectedService || 'not set'
            };
        });

        console.log('\n🔍 Calendar Debug Info:');
        Object.entries(calendarInfo).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
        });

        // Wait longer for calendar to initialize
        console.log('\n⏳ Waiting for calendar initialization...');
        await page.waitForTimeout(5000);

        // Check again
        const calendarInfo2 = await page.evaluate(() => {
            const calendarDays = document.querySelectorAll('.calendar-day');
            const customCalendar = document.querySelector('#custom-calendar');
            
            return {
                calendarDaysCount: calendarDays.length,
                customCalendarExists: !!customCalendar,
                customCalendarHTML: customCalendar?.innerHTML?.slice(0, 200) || 'not found'
            };
        });

        console.log('\n🔍 After Wait:');
        Object.entries(calendarInfo2).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
        });

        // Try to manually trigger date selection if calendar is not working
        if (calendarInfo2.calendarDaysCount === 0) {
            console.log('\n🔧 Manual date input test...');
            
            // Set date directly
            await page.evaluate(() => {
                const dateInput = document.getElementById('booking-date');
                if (dateInput) {
                    dateInput.value = '2025-07-23';
                    // Trigger change event
                    dateInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
            
            await page.waitForTimeout(3000);
            
            const timeOptions = await page.locator('#booking-time option').count();
            console.log(`⏰ Time options after manual date: ${timeOptions}`);
            
            if (timeOptions > 1) {
                const times = await page.locator('#booking-time option:not([value=""])').allTextContents();
                console.log(`✅ Times loaded: ${times.slice(0, 3).join(', ')}...`);
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
})();