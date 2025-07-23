const { chromium } = require('playwright');

async function testExistingBookingPayment() {
    console.log('🚀 Testing payment UI with existing booking...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        // Navigate to admin page
        console.log('📱 Navigating to admin page...');
        await page.goto('https://ittheal.com/3t/admin/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(5000);
        
        // Look for any bookings in all possible sections
        console.log('🔍 Searching for bookings in all sections...');
        
        // Check different possible selectors for booking cards
        const possibleSelectors = [
            '.booking-card',
            '.booking-item', 
            '.appointment-card',
            '.appointment-item',
            '[class*="booking"]',
            '[class*="appointment"]'
        ];
        
        let bookingFound = false;
        let editButtonSelector = null;
        
        for (const selector of possibleSelectors) {
            const elements = page.locator(selector);
            const count = await elements.count();
            if (count > 0) {
                console.log(`✅ Found ${count} bookings with selector: ${selector}`);
                
                // Look for edit buttons within these elements
                const editButtons = page.locator(`${selector} button:has-text("Edit")`);
                const editButtonsGeneric = page.locator(`${selector} button`);
                
                const editCount = await editButtons.count();
                const genericButtonCount = await editButtonsGeneric.count();
                
                if (editCount > 0) {
                    console.log(`✅ Found ${editCount} Edit buttons in ${selector}`);
                    editButtonSelector = `${selector} button:has-text("Edit")`;
                    bookingFound = true;
                    break;
                } else if (genericButtonCount > 0) {
                    console.log(`⚠️ Found ${genericButtonCount} generic buttons in ${selector}, will check text`);
                    const firstButton = editButtonsGeneric.first();
                    const buttonText = await firstButton.textContent();
                    console.log(`First button text: "${buttonText}"`);
                    if (buttonText.toLowerCase().includes('edit')) {
                        editButtonSelector = `${selector} button`;
                        bookingFound = true;
                        break;
                    }
                }
            }
        }
        
        if (!bookingFound) {
            // Try to find any table rows or list items that might contain bookings
            console.log('🔍 Searching for booking data in tables/lists...');
            const tables = page.locator('table tbody tr, ul li, .list-item');
            const rowCount = await tables.count();
            console.log(`Found ${rowCount} potential data rows/items`);
            
            if (rowCount > 0) {
                // Look for buttons within these rows
                const rowButtons = page.locator('table tbody tr button, ul li button, .list-item button');
                const rowButtonCount = await rowButtons.count();
                console.log(`Found ${rowButtonCount} buttons in data rows`);
                
                if (rowButtonCount > 0) {
                    const firstRowButton = rowButtons.first();
                    const buttonText = await firstRowButton.textContent();
                    console.log(`First row button text: "${buttonText}"`);
                }
            }
        }
        
        if (bookingFound && editButtonSelector) {
            console.log(`✅ Proceeding with edit button: ${editButtonSelector}`);
            
            // Click the edit button
            const editButton = page.locator(editButtonSelector).first();
            await editButton.click();
            await page.waitForTimeout(3000);
            
            // Check if modal opened
            const modal = page.locator('#editBookingModal, .modal, [class*="modal"]');
            const modalVisible = await modal.isVisible();
            console.log(`Edit modal visible: ${modalVisible}`);
            
            if (modalVisible) {
                // Test payment method selection
                console.log('💳 Testing payment method selection...');
                const creditCardRadio = page.locator('input[name="payment-method"][value="credit_card"]');
                const creditCardExists = await creditCardRadio.count() > 0;
                
                if (creditCardExists) {
                    await creditCardRadio.click();
                    await page.waitForTimeout(2000);
                    
                    // Check if Stripe element appears
                    const stripeElement = page.locator('#stripe-card-element');
                    const stripeVisible = await stripeElement.isVisible();
                    console.log(`Stripe element visible: ${stripeVisible}`);
                    
                    if (stripeVisible) {
                        // Add tip to trigger payment processing
                        console.log('💰 Adding tip to trigger payment...');
                        const tipField = page.locator('#editTipAmount');
                        const tipExists = await tipField.count() > 0;
                        
                        if (tipExists) {
                            await tipField.click();
                            await tipField.fill('10.00');
                            await page.waitForTimeout(1000);
                            
                            // Test form submission to see payment UI
                            console.log('💾 Testing form submission to see payment UI...');
                            const submitButton = page.locator('#edit-submit-btn, button[type="submit"]');
                            await submitButton.click();
                            
                            // Monitor for payment status UI
                            console.log('⏳ Monitoring for payment status UI...');
                            await page.waitForTimeout(3000);
                            
                            const statusDiv = page.locator('#edit-payment-status');
                            const statusVisible = await statusDiv.isVisible();
                            console.log(`Payment status UI visible: ${statusVisible}`);
                            
                            if (statusVisible) {
                                // Monitor status changes
                                for (let i = 0; i < 8; i++) {
                                    await page.waitForTimeout(1000);
                                    if (await statusDiv.isVisible()) {
                                        const statusText = await page.locator('#edit-status-text').textContent();
                                        const statusIcon = await page.locator('#edit-status-icon').textContent();
                                        console.log(`Status ${i + 1}: ${statusIcon} ${statusText}`);
                                    }
                                }
                                console.log('✅ Payment UI flow test completed successfully');
                            } else {
                                console.log('❌ Payment status UI did not appear');
                            }
                        } else {
                            console.log('❌ Tip field not found');
                        }
                    } else {
                        console.log('❌ Stripe element not visible');
                    }
                } else {
                    console.log('❌ Credit card payment option not found');
                }
            } else {
                console.log('❌ Edit modal did not open');
            }
        } else {
            console.log('❌ No bookings with edit buttons found');
            
            // Show page content for debugging
            const pageTitle = await page.title();
            console.log(`Page title: ${pageTitle}`);
            
            // Look for any text content that mentions bookings
            const pageContent = await page.content();
            const bookingMentions = (pageContent.match(/booking/gi) || []).length;
            console.log(`Found ${bookingMentions} mentions of "booking" on page`);
        }
        
        console.log('🎯 Payment UI test completed');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        console.log('🏁 Keeping browser open for 15 seconds...');
        await page.waitForTimeout(15000);
        await browser.close();
    }
}

testExistingBookingPayment().catch(console.error);