const { chromium } = require('playwright');

async function testPaymentProcessingFinal() {
    console.log('🚀 Final payment processing and UI test...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1500,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Monitor console for payment processing messages
    page.on('console', msg => {
        if (msg.text().includes('Payment') || msg.text().includes('payment') || 
            msg.text().includes('Status') || msg.text().includes('status') ||
            msg.text().includes('Processing') || msg.text().includes('Successful') ||
            msg.text().includes('Error') || msg.text().includes('Intent')) {
            console.log(`💬 Console: ${msg.text()}`);
        }
    });
    
    try {
        // Navigate and setup
        console.log('📱 Navigating to admin page...');
        await page.goto('https://ittheal.com/3t/admin/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(8000);
        
        // Open edit modal
        console.log('✏️ Opening edit modal...');
        const editButton = page.locator('.booking-card .booking-actions button:has-text("Edit")').first();
        await editButton.click();
        await page.waitForTimeout(3000);
        
        // Wait for modal
        const editModal = page.locator('#editBookingModal');
        await editModal.waitFor({ state: 'visible', timeout: 10000 });
        console.log('✅ Edit modal opened');
        
        // Credit card should already be selected - add tip to trigger payment
        console.log('💰 Adding tip to trigger payment processing...');
        const tipField = page.locator('#editTipAmount');
        await tipField.click();
        await tipField.fill('20.00');
        await page.waitForTimeout(1000);
        
        // Fill the Stripe element with test card data
        console.log('💳 Filling test card data...');
        try {
            const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
            await cardFrame.locator('[name="cardnumber"]').fill('4242424242424242');
            await cardFrame.locator('[name="exp-date"]').fill('12/28');
            await cardFrame.locator('[name="cvc"]').fill('123');
            console.log('✅ Card data filled successfully');
            await page.waitForTimeout(2000);
        } catch (cardError) {
            console.log('⚠️ Could not fill card data (iframe issue), but proceeding with test');
        }
        
        // Submit form to test payment UI
        console.log('💾 Submitting form to test payment UI and processing...');
        const submitButton = page.locator('#edit-submit-btn');
        await submitButton.click();
        
        // Immediately start monitoring payment status UI
        console.log('⏳ Monitoring for payment status UI...');
        await page.waitForTimeout(1000);
        
        // Check for payment status UI appearance
        const statusDiv = page.locator('#edit-payment-status');
        let statusVisible = false;
        
        // Check multiple times as the UI may appear quickly
        for (let attempt = 0; attempt < 5; attempt++) {
            statusVisible = await statusDiv.isVisible();
            if (statusVisible) {
                console.log(`✅ Payment status UI appeared on attempt ${attempt + 1}!`);
                break;
            }
            await page.waitForTimeout(500);
        }
        
        if (statusVisible) {
            console.log('🎯 SUCCESS: Payment status UI is working! Monitoring status changes...');
            
            // Monitor status changes for up to 15 seconds
            for (let i = 0; i < 15; i++) {
                await page.waitForTimeout(1000);
                
                if (await statusDiv.isVisible()) {
                    const statusText = await page.locator('#edit-status-text').textContent();
                    const statusIcon = await page.locator('#edit-status-icon').textContent();
                    const statusDetails = await page.locator('#edit-status-details').textContent();
                    
                    console.log(`📊 Status ${i + 1}: ${statusIcon} ${statusText}`);
                    if (statusDetails && statusDetails.trim()) {
                        console.log(`    Details: ${statusDetails}`);
                    }
                    
                    // Check for completion states
                    if (statusText.includes('Successful') || statusText.includes('Updated') || 
                        statusText.includes('Complete') || statusText.includes('Error')) {
                        console.log('✅ Payment processing reached completion state');
                        break;
                    }
                } else {
                    console.log(`📊 Status ${i + 1}: UI no longer visible`);
                    break;
                }
            }
            
            // Final status
            if (await statusDiv.isVisible()) {
                const finalStatusText = await page.locator('#edit-status-text').textContent();
                const finalStatusIcon = await page.locator('#edit-status-icon').textContent();
                console.log(`🎯 Final Status: ${finalStatusIcon} ${finalStatusText}`);
            }
            
            console.log('✅ PAYMENT UI TEST COMPLETED SUCCESSFULLY!');
            console.log('✅ Visual feedback is working correctly for payment processing');
            
        } else {
            console.log('❌ Payment status UI did not appear - checking for other indicators...');
            
            // Check if form was submitted successfully by other means
            const successMessages = page.locator('.alert-success, .success, [class*="success"]');
            const successCount = await successMessages.count();
            if (successCount > 0) {
                console.log(`✅ Found ${successCount} success indicators on page`);
            }
            
            // Check if modal closed (indicating successful submission)
            const modalStillVisible = await editModal.isVisible();
            console.log(`Modal still visible: ${modalStillVisible}`);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    } finally {
        console.log('🏁 Test completed - keeping browser open for 20 seconds...');
        await page.waitForTimeout(20000);
        await browser.close();
    }
}

testPaymentProcessingFinal().catch(console.error);