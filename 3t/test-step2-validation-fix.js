/**
 * Test Step 2 Date/Time Validation Fix
 * Verify that the enhanced validation correctly checks for actual selections
 */

const { chromium } = require('playwright');

async function testStep2ValidationFix() {
    console.log('🧪 Testing Step 2 Date/Time Validation Fix...\n');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 800,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Capture console logs to see validation debug info
        const logs = [];
        page.on('console', msg => {
            const text = msg.text();
            logs.push(text);
            if (text.includes('🔍') || text.includes('❌') || text.includes('validation')) {
                console.log(`[Console] ${text}`);
            }
        });
        
        // Navigate to booking page
        console.log('📍 Loading booking page...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        // Start booking flow
        await page.locator('#booking').scrollIntoViewIfNeeded();
        await page.waitForTimeout(2000);
        
        // Step 1: Select service
        console.log('📍 Step 1: Selecting service...');
        await page.locator('[data-service-type="90min_massage"]').click();
        await page.waitForTimeout(2000);
        
        // Proceed to Step 2
        const step2Visible = await page.locator('#datetime-selection').isVisible();
        if (!step2Visible) {
            await page.locator('#next-btn').click();
            await page.waitForTimeout(2000);
        }
        
        console.log('\n📍 Testing validation scenarios...');
        
        // Scenario 1: Try to proceed without selecting anything
        console.log('\n1️⃣ Test: No date or time selected');
        let alertShown = false;
        page.on('dialog', async dialog => {
            alertShown = true;
            console.log(`📝 Alert shown: "${dialog.message()}"`);
            await dialog.accept();
        });
        
        await page.locator('#next-btn').click();
        await page.waitForTimeout(1000);
        
        if (alertShown) {
            console.log('✅ Correctly blocked progression - no selections');
        } else {
            console.log('❌ Failed to block progression - no selections');
        }
        
        // Scenario 2: Select date only, no time
        console.log('\n2️⃣ Test: Date selected, no time');
        await page.locator('#booking-date').fill('2025-07-19');
        await page.waitForTimeout(3000); // Wait for times to load
        
        alertShown = false;
        await page.locator('#next-btn').click();
        await page.waitForTimeout(1000);
        
        if (alertShown) {
            console.log('✅ Correctly blocked progression - date only');
        } else {
            console.log('❌ Failed to block progression - date only');
        }
        
        // Scenario 3: Select time (valid selection)
        console.log('\n3️⃣ Test: Date and time both selected');
        const timeSelect = page.locator('#booking-time');
        const timeOptions = await timeSelect.locator('option').count();
        
        if (timeOptions > 1) {
            console.log(`📍 Found ${timeOptions} time options, selecting option 1...`);
            await timeSelect.selectOption({ index: 1 });
            await page.waitForTimeout(1000);
            
            // Get selected values
            const selectedDate = await page.locator('#booking-date').inputValue();
            const selectedTime = await page.locator('#booking-time').inputValue();
            const selectedIndex = await page.evaluate(() => {
                const select = document.getElementById('booking-time');
                return select ? select.selectedIndex : -1;
            });
            
            console.log(`📊 Selected: date=${selectedDate}, time=${selectedTime}, index=${selectedIndex}`);
            
            alertShown = false;
            await page.locator('#next-btn').click();
            await page.waitForTimeout(2000);
            
            if (!alertShown) {
                // Check if we moved to Step 3
                const step3Visible = await page.locator('#contact-info').isVisible();
                if (step3Visible) {
                    console.log('✅ Successfully proceeded to Step 3 - valid selections');
                } else {
                    console.log('❌ Failed to proceed to Step 3 despite valid selections');
                }
            } else {
                console.log('❌ Incorrectly blocked progression - valid selections');
            }
        } else {
            console.log('⚠️ No time slots available for testing');
        }
        
        // Check validation logs
        const validationLogs = logs.filter(log => 
            log.includes('Step 2 validation') || 
            log.includes('validation failed')
        );
        
        console.log('\n📊 VALIDATION TEST SUMMARY:');
        console.log(`Total validation logs: ${validationLogs.length}`);
        
        if (validationLogs.length > 0) {
            console.log('\n📋 Validation debug logs:');
            validationLogs.forEach(log => console.log(`  - ${log}`));
        }
        
        console.log('\n✅ Step 2 validation fix has been tested');
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
if (require.main === module) {
    testStep2ValidationFix().catch(console.error);
}

module.exports = { testStep2ValidationFix };