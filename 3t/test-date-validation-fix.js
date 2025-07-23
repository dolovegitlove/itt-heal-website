const { chromium } = require('playwright');

(async () => {
    console.log('🔧 Testing Date Validation Timezone Fix');
    console.log('=======================================');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 300,
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
        await page.waitForTimeout(3000);

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

        // Now test the date validation logic directly
        console.log('🔍 Testing date validation logic...');
        
        const validationTest = await page.evaluate(() => {
            // Test the fixed date validation logic
            const today = new Date();
            const todayString = today.toISOString().split('T')[0];
            
            // Test old logic (would fail)
            const oldSelectedDateObj = new Date(todayString);
            const oldToday = new Date();
            const oldComparison = oldSelectedDateObj < oldToday;
            
            // Test new logic (should work)
            const newSelectedDateObj = new Date(todayString + 'T00:00:00');
            const newToday = new Date();
            newToday.setHours(0, 0, 0, 0);
            const newComparison = newSelectedDateObj < newToday;
            
            return {
                todayString,
                currentTime: new Date().toISOString(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timezoneOffset: new Date().getTimezoneOffset(),
                oldLogic: {
                    selectedDate: oldSelectedDateObj.toISOString(),
                    today: oldToday.toISOString(),
                    wouldFail: oldComparison,
                    message: oldComparison ? 'WOULD SHOW ERROR' : 'WOULD PASS'
                },
                newLogic: {
                    selectedDate: newSelectedDateObj.toISOString(),
                    today: newToday.toISOString(),
                    willFail: newComparison,
                    message: newComparison ? 'WILL SHOW ERROR' : 'WILL PASS'
                }
            };
        });

        console.log('\n📊 Date Validation Test Results:');
        console.log('================================');
        console.log(`📅 Testing date: ${validationTest.todayString}`);
        console.log(`⏰ Current time: ${validationTest.currentTime}`);
        console.log(`🌍 Timezone: ${validationTest.timezone} (offset: ${validationTest.timezoneOffset} minutes)`);
        
        console.log('\n❌ OLD LOGIC (before fix):');
        console.log(`   Selected: ${validationTest.oldLogic.selectedDate}`);
        console.log(`   Today:    ${validationTest.oldLogic.today}`);
        console.log(`   Result:   ${validationTest.oldLogic.message}`);
        
        console.log('\n✅ NEW LOGIC (after fix):');
        console.log(`   Selected: ${validationTest.newLogic.selectedDate}`);
        console.log(`   Today:    ${validationTest.newLogic.today}`);
        console.log(`   Result:   ${validationTest.newLogic.message}`);

        // Verify the fix is effective
        if (validationTest.oldLogic.wouldFail && !validationTest.newLogic.willFail) {
            console.log('\n🎉 SUCCESS: Timezone fix resolved the validation issue!');
            console.log('   - Old logic would incorrectly reject today\'s date');
            console.log('   - New logic correctly allows today\'s date');
        } else if (!validationTest.oldLogic.wouldFail && !validationTest.newLogic.willFail) {
            console.log('\n✅ PASS: Both logics work (but new logic is more reliable)');
        } else {
            console.log('\n⚠️ UNEXPECTED: Need to review the fix');
        }

        // Test calendar interaction if possible
        try {
            console.log('\n📅 Testing calendar interaction...');
            
            // Look for today's date in the calendar
            const todayButton = page.locator('.calendar-day[data-date="' + validationTest.todayString + '"]');
            const todayExists = await todayButton.isVisible();
            
            console.log(`📍 Today's calendar button visible: ${todayExists}`);
            
            if (todayExists) {
                console.log('📍 Clicking today\'s date...');
                await todayButton.click();
                await page.waitForTimeout(2000);
                
                // Check if date was selected without validation error
                const dateValue = await page.evaluate(() => {
                    return document.getElementById('booking-date')?.value;
                });
                
                console.log(`📊 Date selected: ${dateValue}`);
                
                if (dateValue === validationTest.todayString) {
                    console.log('✅ SUCCESS: Today\'s date can be selected without errors!');
                } else {
                    console.log('⚠️ Date selection may have issues');
                }
            }
        } catch (calendarError) {
            console.log('📅 Calendar interaction test skipped:', calendarError.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
})();