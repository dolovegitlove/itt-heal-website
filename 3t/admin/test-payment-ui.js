const { chromium } = require('playwright');

async function testPaymentUI() {
    console.log('🚀 Testing new payment UI flow...');
    
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
        await page.waitForTimeout(3000);
        
        // Open edit modal
        console.log('✏️ Opening edit modal...');
        const editButton = page.locator('#recentBookingsTable .booking-card .booking-actions button:has-text("Edit")').first();
        await editButton.click();
        await page.waitForTimeout(3000);
        
        // Select credit card payment method
        console.log('💳 Selecting credit card payment method...');
        const creditCardRadio = page.locator('#editBookingModal input[name="payment-method"][value="credit_card"]');
        await creditCardRadio.click();
        await page.waitForTimeout(2000);
        
        // Add a tip to ensure payment processing occurs
        console.log('💰 Adding tip amount...');
        const tipField = page.locator('#editTipAmount');
        await tipField.click();
        await tipField.fill('10.00');
        await page.waitForTimeout(1000);
        
        // Submit the form to see the payment UI flow
        console.log('💾 Submitting form to see payment UI flow...');
        const saveButton = page.locator('#edit-submit-btn');
        await saveButton.click();
        
        // Wait to see the payment processing steps
        console.log('⏳ Observing payment processing UI...');
        await page.waitForTimeout(3000);
        
        // Check if payment status div is visible
        const statusDiv = page.locator('#edit-payment-status');
        const isStatusVisible = await statusDiv.isVisible();
        console.log(`📋 Payment status UI visible: ${isStatusVisible}`);
        
        if (isStatusVisible) {
            const statusText = await page.locator('#edit-status-text').textContent();
            const statusDetails = await page.locator('#edit-status-details').textContent();
            console.log(`📊 Status: ${statusText}`);
            console.log(`📝 Details: ${statusDetails}`);
        }
        
        // Wait to see the full flow
        await page.waitForTimeout(10000);
        
        // Check final status
        if (await statusDiv.isVisible()) {
            const finalStatusText = await page.locator('#edit-status-text').textContent();
            const finalStatusDetails = await page.locator('#edit-status-details').textContent();
            console.log(`✅ Final Status: ${finalStatusText}`);
            console.log(`📝 Final Details: ${finalStatusDetails}`);
        }
        
        console.log('🎯 Payment UI flow test completed');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        console.log('🏁 Keeping browser open for 10 seconds for review...');
        await page.waitForTimeout(10000);
        await browser.close();
    }
}

testPaymentUI().catch(console.error);