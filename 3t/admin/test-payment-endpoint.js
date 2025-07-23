const { chromium } = require('playwright');

async function testPaymentEndpoint() {
    console.log('🚀 Testing payment endpoint fix...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Capture console messages for API errors
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('404') || text.includes('Payment intent creation failed') || text.includes('POST https://ittheal.com/api/')) {
            console.log('🔍 API LOG:', text);
        }
    });
    
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
        
        // Add a tip to ensure there's a payment to process
        console.log('💰 Adding tip amount...');
        const tipField = page.locator('#editTipAmount');
        await tipField.click();
        await tipField.fill('5.00');
        await page.waitForTimeout(1000);
        
        // Try to submit the form (this will test the payment endpoint)
        console.log('💾 Testing payment endpoint by submitting form...');
        const saveButton = page.locator('#editBookingForm button[type="submit"]:has-text("Update Booking")');
        await saveButton.click();
        
        // Wait to see the results
        console.log('⏳ Waiting for API response...');
        await page.waitForTimeout(10000);
        
        // Check for success or error messages
        const successMessage = await page.locator('.alert-success, .success-message').count();
        const errorMessage = await page.locator('.alert-error, .error-message').count();
        
        if (successMessage > 0) {
            console.log('✅ Payment endpoint working - form submitted successfully');
        } else if (errorMessage > 0) {
            const errorText = await page.locator('.alert-error, .error-message').first().textContent();
            console.log('⚠️ Form submission error (may not be payment-related):', errorText);
        } else {
            console.log('ℹ️ No clear success/error message - check console logs above');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        console.log('🏁 Closing browser...');
        await browser.close();
    }
}

testPaymentEndpoint().catch(console.error);