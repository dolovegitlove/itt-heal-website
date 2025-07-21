/**
 * Test Time Value Error Investigation
 */

const { chromium } = require('playwright');

async function testTimeValueError() {
    console.log('🧪 Investigating Invalid Time Value Error...\n');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 800,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Capture all console messages and errors
        const logs = [];
        const errors = [];
        
        page.on('console', msg => {
            const text = msg.text();
            logs.push(text);
            
            if (text.includes('Invalid time') || text.includes('time value') || text.includes('Error')) {
                console.log(`❌ [ERROR] ${text}`);
                errors.push(text);
            } else if (text.includes('🔍') || text.includes('📍') || text.includes('✅')) {
                console.log(`[Console] ${text}`);
            }
        });
        
        page.on('pageerror', error => {
            const errorMsg = error.toString();
            console.log(`❌ [PAGE ERROR] ${errorMsg}`);
            errors.push(errorMsg);
        });
        
        // Navigate to booking page
        console.log('📍 Loading booking page...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        // Go through booking flow to trigger the error
        console.log('📍 Starting booking flow...');
        await page.locator('#booking').scrollIntoViewIfNeeded();
        await page.waitForTimeout(2000);
        
        // Select service
        await page.locator('[data-service-type="90min_massage"]').click();
        await page.waitForTimeout(2000);
        
        // Proceed to Step 2 if needed
        const step2Visible = await page.locator('#datetime-selection').isVisible();
        if (!step2Visible) {
            const nextBtn = page.locator('#next-btn');
            if (await nextBtn.isVisible()) {
                await nextBtn.click();
                await page.waitForTimeout(2000);
            }
        }
        
        // Set date
        console.log('📍 Setting date...');
        await page.locator('#booking-date').fill('2025-07-19');
        await page.waitForTimeout(3000);
        
        // Try to select time
        console.log('📍 Selecting time...');
        const timeSelect = page.locator('#booking-time');
        const timeOptions = await timeSelect.locator('option').count();
        
        if (timeOptions > 1) {
            await timeSelect.selectOption({ index: 1 });
            console.log('✅ Time selected successfully');
            
            // Try to proceed to next step
            console.log('📍 Clicking Next...');
            const nextBtn = page.locator('#next-btn');
            await nextBtn.click();
            await page.waitForTimeout(2000);
            
            // Fill contact info
            const step3Visible = await page.locator('#contact-info').isVisible();
            if (step3Visible) {
                console.log('📍 Filling contact information...');
                await page.locator('#client-name').fill('John Doe');
                await page.locator('#client-email').fill('john@example.com');
                await page.locator('#client-phone').fill('555-123-4567');
                
                // Click Next again
                await nextBtn.click();
                await page.waitForTimeout(2000);
                
                // Continue through the flow to see where error occurs
                console.log('📍 Continuing through booking flow...');
                
                // Check if payment step is visible
                const paymentVisible = await page.locator('#payment-info').isVisible();
                if (paymentVisible) {
                    console.log('📍 Payment step visible');
                    
                    // Try to continue
                    if (await nextBtn.isVisible()) {
                        await nextBtn.click();
                        await page.waitForTimeout(3000);
                    }
                }
            }
        } else {
            console.log('⚠️ No time slots available');
        }
        
        // Wait for any async errors
        await page.waitForTimeout(3000);
        
        // Check for specific time-related elements
        console.log('\n📊 Checking time-related elements...');
        
        const timeValue = await page.evaluate(() => {
            const timeSelect = document.getElementById('booking-time');
            return {
                value: timeSelect?.value,
                selectedIndex: timeSelect?.selectedIndex,
                optionsCount: timeSelect?.options?.length,
                firstOptionText: timeSelect?.options[0]?.textContent,
                selectedOptionText: timeSelect?.options[timeSelect?.selectedIndex]?.textContent
            };
        });
        
        console.log('Time select state:', timeValue);
        
        // Check date/time combination
        const dateTimeCheck = await page.evaluate(() => {
            const date = document.getElementById('booking-date')?.value;
            const time = document.getElementById('booking-time')?.value;
            
            if (date && time) {
                try {
                    const combinedDateTime = new Date(`${date}T${time}`);
                    return {
                        date: date,
                        time: time,
                        combined: combinedDateTime.toString(),
                        isValid: !isNaN(combinedDateTime.getTime())
                    };
                } catch (error) {
                    return {
                        date: date,
                        time: time,
                        error: error.toString()
                    };
                }
            }
            return { date, time, note: 'No date/time selected' };
        });
        
        console.log('Date/Time combination:', dateTimeCheck);
        
        // Summary
        console.log('\n📊 ERROR INVESTIGATION SUMMARY:');
        console.log(`Total console logs: ${logs.length}`);
        console.log(`Total errors: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log('\n❌ Errors found:');
            errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
        } else {
            console.log('✅ No time value errors detected in this test run');
        }
        
        // Show relevant logs
        const timeRelatedLogs = logs.filter(log => 
            log.toLowerCase().includes('time') || 
            log.toLowerCase().includes('date') ||
            log.toLowerCase().includes('invalid')
        );
        
        if (timeRelatedLogs.length > 0) {
            console.log('\n📋 Time-related logs:');
            timeRelatedLogs.slice(-10).forEach(log => console.log(`  - ${log}`));
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
if (require.main === module) {
    testTimeValueError().catch(console.error);
}

module.exports = { testTimeValueError };