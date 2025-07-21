/**
 * Test Time Loading Fix
 * Verifies that time slots load properly after fixes
 */

const { chromium } = require('playwright');

async function testTimeLoadingFix() {
    console.log('🧪 Testing Time Loading Fix...\n');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 800,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Capture console logs
        const logs = [];
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('📍') || text.includes('🔍') || text.includes('📅') || 
                text.includes('⏰') || text.includes('📋') || text.includes('✅')) {
                logs.push(text);
                console.log(`[Console] ${text}`);
            }
        });
        
        // Navigate to the booking page
        console.log('📍 Step 1: Loading booking page...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        // Scroll to booking section
        await page.locator('#booking').scrollIntoViewIfNeeded();
        await page.waitForTimeout(2000);
        
        // Select 90-minute service
        console.log('📍 Step 2: Selecting 90-minute service...');
        const serviceCard = page.locator('[data-service-type="90min_massage"]');
        await serviceCard.click();
        await page.waitForTimeout(2000);
        
        // Check if Step 2 is visible
        const step2Visible = await page.locator('#datetime-selection').isVisible();
        console.log(`📍 Step 2 visible: ${step2Visible}`);
        
        if (!step2Visible) {
            // Try to proceed to Step 2
            const nextBtn = page.locator('#next-btn');
            if (await nextBtn.isVisible()) {
                console.log('📍 Clicking Next to show Step 2...');
                await nextBtn.click();
                await page.waitForTimeout(2000);
            }
        }
        
        // Now test date selection and time loading
        console.log('\n📍 Step 3: Testing date selection and time loading...');
        
        const dateInput = page.locator('#booking-date');
        const timeSelect = page.locator('#booking-time');
        
        // Set date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        console.log(`📍 Setting date to: ${tomorrowStr}`);
        await dateInput.fill(tomorrowStr);
        
        // Wait for time loading
        console.log('📍 Waiting for time slots to load...');
        await page.waitForTimeout(3000);
        
        // Check if times loaded
        const timeOptions = await timeSelect.locator('option').count();
        console.log(`📍 Time options available: ${timeOptions}`);
        
        const timeOptionsText = [];
        for (let i = 0; i < timeOptions; i++) {
            const optionText = await timeSelect.locator('option').nth(i).textContent();
            timeOptionsText.push(optionText);
        }
        
        console.log('📍 Available time slots:', timeOptionsText);
        
        if (timeOptions > 1) {
            console.log('✅ SUCCESS: Time slots loaded!');
            
            // Select first available time
            await timeSelect.selectOption({ index: 1 });
            const selectedTime = await timeSelect.inputValue();
            console.log(`✅ Selected time: ${selectedTime}`);
        } else {
            console.log('❌ FAIL: No time slots loaded');
            
            // Check for error messages
            const loadingDiv = page.locator('#time-loading');
            if (await loadingDiv.isVisible()) {
                const loadingText = await loadingDiv.textContent();
                console.log(`Loading div text: ${loadingText}`);
            }
        }
        
        // Test date change persistence
        console.log('\n📍 Step 4: Testing date change...');
        
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);
        const dayAfterStr = dayAfter.toISOString().split('T')[0];
        
        await dateInput.fill(dayAfterStr);
        await page.waitForTimeout(3000);
        
        const newTimeOptions = await timeSelect.locator('option').count();
        console.log(`📍 Time options after date change: ${newTimeOptions}`);
        
        // Summary
        console.log('\n📊 TEST SUMMARY:');
        console.log(`Module logs captured: ${logs.length}`);
        console.log(`Time loading working: ${timeOptions > 1 ? 'YES' : 'NO'}`);
        console.log(`Date change working: ${newTimeOptions > 1 ? 'YES' : 'NO'}`);
        
        if (logs.length > 0) {
            console.log('\n📋 Key logs:');
            logs.slice(-10).forEach(log => console.log(`  - ${log}`));
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
if (require.main === module) {
    testTimeLoadingFix().catch(console.error);
}

module.exports = { testTimeLoadingFix };