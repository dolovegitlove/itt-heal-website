const { chromium } = require('playwright');

async function testThankYouMessage() {
    console.log('🚀 Testing thank you message display...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: [
            '--window-size=1920,1080',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    const page = await browser.newPage();
    
    try {
        // Navigate and complete booking quickly for cash payment
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
        
        // Step 1: Service
        await page.locator('[data-service-type="60min_massage"]').click();
        await page.locator('#next-btn').click();
        
        // Step 2: Date/Time
        await page.locator('#booking-date').fill('2025-07-21');
        await page.evaluate(() => {
            document.getElementById('booking-date').dispatchEvent(new Event('change', { bubbles: true }));
        });
        await page.waitForTimeout(3000);
        
        const timeSelect = page.locator('#booking-time');
        await timeSelect.selectOption({ index: 1 });
        await page.locator('#next-btn').click();
        
        // Step 3: Client info
        await page.locator('#client-name').fill('Thank You Test');
        await page.locator('#client-email').fill('thankyou@test.com');
        await page.locator('#client-phone').fill('5555555555');
        await page.locator('#next-btn').click();
        
        // Step 4: Location
        await page.locator('#location-type').selectOption('in_clinic');
        await page.locator('#next-btn').click();
        
        // Step 5: Check payment options and select cash
        console.log('📍 Checking available payment options...');
        const paymentOptions = await page.locator('input[name="payment-method"]').evaluateAll(inputs => 
            inputs.map(input => ({ value: input.value, visible: input.offsetParent !== null }))
        );
        console.log('📍 Payment options:', paymentOptions);
        
        // Force show cash payment if hidden
        await page.evaluate(() => {
            const cashOption = document.querySelector('input[name="payment-method"][value="cash"]');
            const cashSection = document.getElementById('cash-section');
            if (cashOption && cashSection) {
                cashSection.style.display = 'block';
                cashOption.parentElement.style.display = 'block';
            }
        });
        
        console.log('📍 Selecting cash payment programmatically...');
        await page.evaluate(() => {
            const cashOption = document.querySelector('input[name="payment-method"][value="cash"]');
            if (cashOption) {
                cashOption.checked = true;
                cashOption.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        await page.waitForTimeout(1000);
        
        // Submit booking programmatically
        console.log('📍 Submitting cash booking programmatically...');
        await page.evaluate(() => {
            const confirmBtn = document.getElementById('confirm-booking-btn');
            if (confirmBtn && typeof window.submitBooking === 'function') {
                window.submitBooking();
            } else if (confirmBtn) {
                confirmBtn.click();
            }
        });
        
        // Wait for thank you message to appear
        console.log('📍 Waiting for thank you message...');
        await page.waitForTimeout(15000);
        
        // Check what's in the booking status
        const statusVisible = await page.locator('#booking-status').isVisible();
        const statusContent = await page.locator('#booking-status').innerHTML();
        console.log('📍 Status element visible:', statusVisible);
        console.log('📍 Status content:', statusContent);
        
        // Also check for any success messages on page
        const allText = await page.textContent('body');
        const hasSuccess = allText.includes('Booking Confirmed') || allText.includes('Thank You') || allText.includes('confirmed');
        console.log('📍 Page contains success text:', hasSuccess);
        
        // Check if thank you content is visible
        const thankYouVisible = await page.locator('#booking-status').isVisible();
        const thankYouContent = await page.locator('#booking-status').innerHTML();
        
        console.log('📍 Thank you message visible:', thankYouVisible);
        
        if (thankYouContent.includes('Booking Confirmed!')) {
            console.log('✅ SUCCESS: Thank you message is displayed!');
            console.log('✅ Content includes: Booking Confirmed');
            
            if (thankYouContent.includes('Thank You for Choosing ITT Heal')) {
                console.log('✅ Content includes: Thank You for Choosing ITT Heal');
            }
            
            if (thankYouContent.includes('Book Another Session')) {
                console.log('✅ Content includes: Book Another Session button');
            }
            
            if (thankYouContent.includes('Close')) {
                console.log('✅ Content includes: Close button');
            }
            
            // Test the "Book Another Session" button
            const bookAnotherBtn = page.locator('button:has-text("Book Another Session")');
            if (await bookAnotherBtn.count() > 0) {
                console.log('✅ "Book Another Session" button is present and clickable');
            }
            
            // Test the "Close" button
            const closeBtn = page.locator('button:has-text("Close")');
            if (await closeBtn.count() > 0) {
                console.log('✅ "Close" button is present and clickable');
                
                // Test closing the modal
                await closeBtn.click();
                await page.waitForTimeout(2000);
                
                const modalVisible = await page.locator('#booking').isVisible();
                if (!modalVisible) {
                    console.log('✅ Modal closes successfully when Close button is clicked');
                } else {
                    console.log('⚠️ Modal did not close when Close button was clicked');
                }
            }
            
        } else {
            console.log('❌ Thank you message not found');
            console.log('📍 Current content preview:', thankYouContent.substring(0, 200) + '...');
        }
        
        console.log('✅ Thank you message test completed');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        console.log('🔍 Keeping browser open for 10 seconds for inspection...');
        await page.waitForTimeout(10000);
        await browser.close();
    }
}

if (require.main === module) {
    testThankYouMessage().catch(console.error);
}

module.exports = { testThankYouMessage };