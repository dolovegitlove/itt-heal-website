const { chromium } = require('playwright');

async function testPaymentUIFinal() {
    console.log('🚀 Final payment UI test...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1500,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        // Navigate to admin page
        console.log('📱 Navigating to admin page...');
        await page.goto('https://ittheal.com/3t/admin/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(8000); // Wait longer for data to load
        
        // Find the booking card and click edit
        console.log('✏️ Looking for booking card with edit button...');
        const editButton = page.locator('.booking-card .booking-actions button:has-text("Edit")').first();
        const editButtonExists = await editButton.count() > 0;
        
        if (editButtonExists) {
            console.log('✅ Found edit button, clicking...');
            await editButton.click();
            await page.waitForTimeout(3000);
            
            // Wait specifically for the edit booking modal
            console.log('⏳ Waiting for edit booking modal...');
            const editModal = page.locator('#editBookingModal');
            await editModal.waitFor({ state: 'visible', timeout: 10000 });
            console.log('✅ Edit modal is visible');
            
            // Select credit card payment method
            console.log('💳 Selecting credit card payment method...');
            const creditCardRadio = page.locator('#editBookingModal input[name="payment-method"][value="credit_card"]');
            await creditCardRadio.click();
            await page.waitForTimeout(3000);
            
            // Check if Stripe element appears
            const stripeElement = page.locator('#stripe-card-element');
            const stripeVisible = await stripeElement.isVisible();
            console.log(`💳 Stripe element visible: ${stripeVisible}`);
            
            if (stripeVisible) {
                // Add tip to trigger payment processing
                console.log('💰 Adding tip amount...');
                const tipField = page.locator('#editTipAmount');
                await tipField.click();
                await tipField.fill('15.00');
                await page.waitForTimeout(1000);
                
                // Fill test card data in Stripe element
                console.log('💳 Filling test card data...');
                const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
                await cardFrame.locator('[name="cardnumber"]').fill('4242424242424242');
                await cardFrame.locator('[name="exp-date"]').fill('12/28'); 
                await cardFrame.locator('[name="cvc"]').fill('123');
                await page.waitForTimeout(2000);
                
                // Submit the form to see payment UI
                console.log('💾 Submitting form to test payment UI...');
                const submitButton = page.locator('#edit-submit-btn');
                await submitButton.click();
                
                // Monitor payment status UI
                console.log('⏳ Monitoring payment status UI...');
                await page.waitForTimeout(2000);
                
                const statusDiv = page.locator('#edit-payment-status');
                const statusVisible = await statusDiv.isVisible();
                console.log(`📊 Payment status UI visible: ${statusVisible}`);
                
                if (statusVisible) {
                    console.log('✅ Payment status UI appeared! Monitoring status changes...');
                    
                    // Monitor status changes for 12 seconds
                    for (let i = 0; i < 12; i++) {
                        await page.waitForTimeout(1000);
                        
                        if (await statusDiv.isVisible()) {
                            const statusText = await page.locator('#edit-status-text').textContent();
                            const statusIcon = await page.locator('#edit-status-icon').textContent();
                            const statusDetails = await page.locator('#edit-status-details').textContent();
                            
                            console.log(`Status ${i + 1}: ${statusIcon} ${statusText}`);
                            if (statusDetails) {
                                console.log(`  Details: ${statusDetails}`);
                            }
                            
                            // If we see success or error, we can break early
                            if (statusText.includes('Successful') || statusText.includes('Error')) {
                                console.log('✅ Payment processing completed (success or error)');
                                break;
                            }
                        }
                    }
                    
                    // Final status check
                    if (await statusDiv.isVisible()) {
                        const finalStatusText = await page.locator('#edit-status-text').textContent();
                        const finalStatusIcon = await page.locator('#edit-status-icon').textContent();
                        console.log(`🎯 Final Status: ${finalStatusIcon} ${finalStatusText}`);
                    }
                    
                    console.log('✅ Payment UI test completed successfully - visual feedback is working!');
                } else {
                    console.log('❌ Payment status UI did not appear');
                }
            } else {
                console.log('❌ Stripe element not visible after selecting credit card');
            }
        } else {
            console.log('❌ No edit button found in booking cards');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        console.log('🏁 Keeping browser open for 20 seconds to review results...');
        await page.waitForTimeout(20000);
        await browser.close();
    }
}

testPaymentUIFinal().catch(console.error);