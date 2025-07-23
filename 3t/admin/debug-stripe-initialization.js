const { chromium } = require('playwright');

async function debugStripeInitialization() {
    console.log('🔧 Debugging Stripe initialization in edit modal...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Capture console logs
    page.on('console', msg => {
        if (msg.text().includes('Stripe') || msg.text().includes('stripe') || 
            msg.text().includes('Edit') || msg.text().includes('edit') ||
            msg.text().includes('element') || msg.text().includes('Error') || msg.text().includes('payment')) {
            console.log(`💬 Console: ${msg.text()}`);
        }
    });
    
    // Capture errors
    page.on('pageerror', error => {
        console.log(`❌ Page Error: ${error.message}`);
    });
    
    try {
        // Navigate to admin page
        console.log('📱 Navigating to admin page...');
        await page.goto('https://ittheal.com/3t/admin/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(8000);
        
        // Click edit button
        console.log('✏️ Clicking edit button...');
        const editButton = page.locator('.booking-card .booking-actions button:has-text("Edit")').first();
        await editButton.click();
        await page.waitForTimeout(3000);
        
        // Wait for edit modal
        const editModal = page.locator('#editBookingModal');
        await editModal.waitFor({ state: 'visible', timeout: 10000 });
        console.log('✅ Edit modal visible');
        
        // Check initial payment method
        const initialPaymentMethod = await page.locator('#editBookingModal input[name="payment-method"]:checked').getAttribute('value');
        console.log(`🔍 Initial payment method: ${initialPaymentMethod}`);
        
        // Check if credit card option exists
        const creditCardOption = page.locator('#editBookingModal input[name="payment-method"][value="credit_card"]');
        const ccExists = await creditCardOption.count();
        console.log(`💳 Credit card option exists: ${ccExists > 0}`);
        
        // Select credit card and monitor console
        console.log('💳 Selecting credit card payment method...');
        await creditCardOption.click();
        await page.waitForTimeout(5000); // Wait longer to see console messages
        
        // Check Stripe element visibility
        const stripeElement = page.locator('#stripe-card-element');
        const stripeVisible = await stripeElement.isVisible();
        console.log(`💳 Stripe element visible after selection: ${stripeVisible}`);
        
        // Check if stripe element exists in DOM even if not visible
        const stripeExists = await stripeElement.count();
        console.log(`💳 Stripe element exists in DOM: ${stripeExists > 0}`);
        
        if (stripeExists > 0) {
            const stripeDisplay = await stripeElement.evaluate(el => window.getComputedStyle(el).display);
            const stripeOpacity = await stripeElement.evaluate(el => window.getComputedStyle(el).opacity);
            console.log(`💳 Stripe element display: ${stripeDisplay}, opacity: ${stripeOpacity}`);
        }
        
        // Check for any error messages
        const errorElements = page.locator('.error, .alert-error, [class*="error"]');
        const errorCount = await errorElements.count();
        if (errorCount > 0) {
            console.log(`⚠️ Found ${errorCount} potential error elements`);
            for (let i = 0; i < Math.min(errorCount, 3); i++) {
                const errorText = await errorElements.nth(i).textContent();
                if (errorText && errorText.trim()) {
                    console.log(`❌ Error ${i + 1}: ${errorText.trim()}`);
                }
            }
        }
        
        // Wait a bit more to capture any delayed console messages
        await page.waitForTimeout(5000);
        
        console.log('🔧 Debug session completed');
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    } finally {
        console.log('🏁 Keeping browser open for 15 seconds...');
        await page.waitForTimeout(15000);
        await browser.close();
    }
}

debugStripeInitialization().catch(console.error);