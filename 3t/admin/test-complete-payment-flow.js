const { chromium } = require('playwright');

async function testCompletePaymentFlow() {
    console.log('🚀 Testing complete payment flow from booking creation to payment UI...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1500,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        // Step 1: Create a booking on the main site first
        console.log('📝 Step 1: Creating a booking on main site...');
        await page.goto('https://ittheal.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(3000);
        
        // Click book appointment
        const bookButton = page.locator('button:has-text("Book Appointment"), a:has-text("Book Appointment")');
        await bookButton.click();
        await page.waitForTimeout(2000);
        
        // Select service (60min massage)
        console.log('🏥 Selecting service...');
        const serviceButton = page.locator('[data-service="60min"]');
        await serviceButton.click();
        await page.waitForTimeout(1000);
        
        // Next step
        const nextBtn = page.locator('#next-btn');
        await nextBtn.click();
        await page.waitForTimeout(2000);
        
        // Fill date (tomorrow)
        console.log('📅 Setting date...');
        const dateInput = page.locator('#date-input');
        await dateInput.click();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        await page.keyboard.type(tomorrowStr);
        await page.waitForTimeout(1000);
        
        // Select time
        console.log('⏰ Selecting time...');
        const timeDropdown = page.locator('#time-dropdown');
        await timeDropdown.click();
        await page.waitForTimeout(1000);
        const timeOption = page.locator('#time-dropdown option').first();
        await timeOption.click();
        await page.waitForTimeout(1000);
        
        // Next step
        await nextBtn.click();
        await page.waitForTimeout(2000);
        
        // Fill contact info
        console.log('📞 Filling contact info...');
        await page.locator('#client-name').click();
        await page.keyboard.type('Test Payment User');
        await page.locator('#client-email').click();
        await page.keyboard.type('testpayment@example.com');
        await page.locator('#client-phone').click();
        await page.keyboard.type('555-0123');
        await page.waitForTimeout(1000);
        
        // Next step
        await nextBtn.click();
        await page.waitForTimeout(2000);
        
        // Select cash payment method to create booking without processing payment
        console.log('💰 Selecting cash payment...');
        const cashRadio = page.locator('input[name="payment-method"][value="cash"]');
        await cashRadio.click();
        await page.waitForTimeout(1000);
        
        // Submit booking
        console.log('✅ Submitting booking...');
        const submitBtn = page.locator('#submit-btn');
        await submitBtn.click();
        await page.waitForTimeout(5000);
        
        // Step 2: Navigate to admin panel
        console.log('🔧 Step 2: Navigating to admin panel...');
        await page.goto('https://ittheal.com/3t/admin/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(5000);
        
        // Step 3: Find and edit the booking
        console.log('✏️ Step 3: Finding the booking to edit...');
        const bookingCards = page.locator('.booking-card');
        const cardCount = await bookingCards.count();
        console.log(`Found ${cardCount} booking cards`);
        
        if (cardCount > 0) {
            // Click edit on the first booking
            const editButton = page.locator('.booking-card .booking-actions button:has-text("Edit")').first();
            await editButton.click();
            await page.waitForTimeout(3000);
            
            // Step 4: Test payment method switching and UI
            console.log('💳 Step 4: Testing payment method switching...');
            
            // Select credit card payment method
            const creditCardRadio = page.locator('#editBookingModal input[name="payment-method"][value="credit_card"]');
            await creditCardRadio.click();
            await page.waitForTimeout(2000);
            
            // Verify Stripe element appears
            const stripeElement = page.locator('#stripe-card-element');
            const stripeVisible = await stripeElement.isVisible();
            console.log(`Stripe card element visible: ${stripeVisible}`);
            
            if (stripeVisible) {
                // Add a tip to ensure payment processing
                console.log('💰 Adding tip amount...');
                const tipField = page.locator('#editTipAmount');
                await tipField.click();
                await tipField.fill('5.00');
                await page.waitForTimeout(1000);
                
                // Fill test credit card (Stripe test card)
                console.log('💳 Filling test credit card...');
                const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
                await cardFrame.locator('[name="cardnumber"]').fill('4242424242424242');
                await cardFrame.locator('[name="exp-date"]').fill('12/28');
                await cardFrame.locator('[name="cvc"]').fill('123');
                await page.waitForTimeout(2000);
                
                // Step 5: Submit and observe payment UI
                console.log('💾 Step 5: Submitting to test payment UI flow...');
                const saveButton = page.locator('#edit-submit-btn');
                await saveButton.click();
                
                // Monitor payment status UI
                console.log('⏳ Monitoring payment processing UI...');
                await page.waitForTimeout(2000);
                
                const statusDiv = page.locator('#edit-payment-status');
                let statusVisible = await statusDiv.isVisible();
                console.log(`Initial payment status UI visible: ${statusVisible}`);
                
                if (statusVisible) {
                    // Monitor status changes for 10 seconds
                    for (let i = 0; i < 10; i++) {
                        await page.waitForTimeout(1000);
                        
                        if (await statusDiv.isVisible()) {
                            const statusText = await page.locator('#edit-status-text').textContent();
                            const statusIcon = await page.locator('#edit-status-icon').textContent();
                            console.log(`Status update ${i + 1}: ${statusIcon} ${statusText}`);
                        }
                    }
                    
                    // Check final status
                    const finalStatusText = await page.locator('#edit-status-text').textContent();
                    const finalStatusIcon = await page.locator('#edit-status-icon').textContent();
                    console.log(`✅ Final payment status: ${finalStatusIcon} ${finalStatusText}`);
                } else {
                    console.log('❌ Payment status UI did not appear');
                }
            } else {
                console.log('❌ Stripe element not visible after selecting credit card');
            }
        } else {
            console.log('❌ No bookings found to test payment on');
        }
        
        console.log('🎯 Complete payment flow test completed');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        console.log('🏁 Keeping browser open for 20 seconds for review...');
        await page.waitForTimeout(20000);
        await browser.close();
    }
}

testCompletePaymentFlow().catch(console.error);