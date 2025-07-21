const { chromium } = require('playwright');

async function testStripeVisibility() {
    console.log('🚀 Testing Stripe Elements visibility fix...');
    
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
        // Navigate to booking page
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
        
        // Fast booking setup to reach payment step
        await page.locator('[data-service-type="90min_massage"]').click();
        await page.locator('#next-btn').click();
        
        // Quick date/time selection
        await page.locator('#booking-date').fill('2025-07-21');
        await page.evaluate(() => {
            const input = document.getElementById('booking-date');
            if (input) input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await page.waitForTimeout(2000);
        
        const timeSelect = page.locator('#booking-time');
        await timeSelect.selectOption({ index: 1 });
        await page.locator('#next-btn').click();
        
        // Fill client info
        await page.locator('#client-name').fill('Stripe Test');
        await page.locator('#client-email').fill('stripe@test.com');
        await page.locator('#client-phone').fill('5555555555');
        await page.locator('#next-btn').click();
        
        // Select location
        await page.locator('#location-type').selectOption('in_clinic');
        await page.locator('#next-btn').click();
        
        // NOW TEST STRIPE VISIBILITY
        console.log('📍 Reached payment step - testing Stripe visibility...');
        
        // Check payment method selection
        const paymentMethod = await page.locator('input[name="payment-method"]:checked').getAttribute('value');
        console.log('📍 Selected payment method:', paymentMethod);
        
        // Check if Stripe is loaded
        const stripeStatus = await page.evaluate(() => {
            return {
                stripeLoaded: typeof window.Stripe !== 'undefined',
                elementsCreated: typeof window.elements !== 'undefined',
                cardElementExists: !!window.cardElement,
                initFunctionExists: typeof window.initializeStripeElementsSafely === 'function',
                containerExists: !!document.getElementById('stripe-card-element')
            };
        });
        console.log('📍 Stripe status:', stripeStatus);
        
        // Force initialization if not done
        if (!stripeStatus.cardElementExists) {
            console.log('📍 Forcing Stripe initialization...');
            await page.evaluate(() => {
                if (typeof window.initializeStripeElementsSafely === 'function') {
                    window.initializeStripeElementsSafely();
                }
            });
            await page.waitForTimeout(3000);
        }
        
        if (paymentMethod === 'credit_card') {
            console.log('✅ Credit card is selected by default');
            
            // Wait for Stripe to initialize
            await page.waitForTimeout(5000);
            
            // Check Stripe container visibility
            const containerVisible = await page.locator('#stripe-card-element').isVisible();
            console.log('📍 Stripe container visible:', containerVisible);
            
            // Check for iframe presence and dimensions
            const iframeInfo = await page.evaluate(() => {
                const container = document.getElementById('stripe-card-element');
                const iframe = container?.querySelector('iframe[title*="Secure card payment"]');
                
                if (iframe) {
                    const rect = iframe.getBoundingClientRect();
                    const styles = window.getComputedStyle(iframe);
                    
                    return {
                        exists: true,
                        visible: styles.display !== 'none' && styles.visibility !== 'hidden',
                        opacity: styles.opacity,
                        width: rect.width,
                        height: rect.height,
                        top: rect.top,
                        left: rect.left,
                        src: iframe.src.substring(0, 100) + '...'
                    };
                } else {
                    return { exists: false };
                }
            });
            
            console.log('📍 Stripe iframe status:', iframeInfo);
            
            if (iframeInfo.exists && iframeInfo.visible && iframeInfo.height > 0) {
                console.log('✅ SUCCESS: Stripe Elements are properly visible!');
                console.log(`✅ iframe dimensions: ${iframeInfo.width}x${iframeInfo.height}`);
                console.log(`✅ iframe opacity: ${iframeInfo.opacity}`);
                
                // Try to interact with Stripe iframe
                try {
                    const stripeFrame = page.frameLocator('#stripe-card-element iframe[title*="Secure card payment"]');
                    const cardInput = stripeFrame.locator('[placeholder*="number"], [name="cardnumber"], input').first();
                    
                    // Try to focus the card input
                    await cardInput.click();
                    console.log('✅ Successfully clicked Stripe card input field');
                    
                    // Try to enter test card number
                    await cardInput.fill('4242424242424242');
                    console.log('✅ Successfully entered test card number');
                    
                    // Try to fill expiry
                    const expiryInput = stripeFrame.locator('[placeholder*="MM"], [name="exp-date"], input').nth(1);
                    await expiryInput.fill('12/28');
                    console.log('✅ Successfully entered expiry date');
                    
                    // Try to fill CVC
                    const cvcInput = stripeFrame.locator('[placeholder*="CVC"], [name="cvc"], input').nth(2);
                    await cvcInput.fill('123');
                    console.log('✅ Successfully entered CVC');
                    
                    console.log('🎉 COMPLETE SUCCESS: Stripe Elements are fully functional!');
                    
                } catch (error) {
                    console.log('⚠️ Input interaction failed, but iframe is visible:', error.message);
                    
                    // Try alternative approach
                    try {
                        const allFrames = await page.frames();
                        console.log('📍 Found', allFrames.length, 'frames total');
                        
                        for (let i = 0; i < allFrames.length; i++) {
                            const frame = allFrames[i];
                            const url = frame.url();
                            if (url.includes('stripe.com') && url.includes('card')) {
                                console.log('📍 Found Stripe card frame:', url.substring(0, 100) + '...');
                                
                                try {
                                    const inputs = await frame.locator('input').count();
                                    console.log('📍 Stripe frame has', inputs, 'input fields');
                                    
                                    if (inputs > 0) {
                                        await frame.locator('input').first().fill('4242424242424242');
                                        console.log('✅ Alternative method: Successfully filled card number');
                                    }
                                } catch (frameError) {
                                    console.log('📍 Frame interaction failed:', frameError.message);
                                }
                                break;
                            }
                        }
                    } catch (altError) {
                        console.log('📍 Alternative frame method failed:', altError.message);
                    }
                }
                
            } else {
                console.log('❌ Stripe Elements are not properly visible');
                console.log('❌ iframe info:', iframeInfo);
            }
            
        } else {
            console.log('❌ Credit card is not selected by default');
        }
        
        console.log('✅ Stripe visibility test completed');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        console.log('🔍 Keeping browser open for 15 seconds for inspection...');
        await page.waitForTimeout(15000);
        await browser.close();
    }
}

if (require.main === module) {
    testStripeVisibility().catch(console.error);
}

module.exports = { testStripeVisibility };