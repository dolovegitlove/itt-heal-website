/**
 * Debug 3t Page Structure - Understand booking interface layout
 * Find out why booking elements are not visible
 */

const { chromium } = require('playwright');

async function debug3tPageStructure() {
    console.log('🔍 DEBUGGING 3t Page Structure');
    console.log('=============================');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 2000,
        args: ['--window-size=1920,1080', '--no-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        // Navigate to 3t interface
        console.log('🌐 Navigating to https://ittheal.com/3t/...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(5000);
        
        // Check page title
        const title = await page.title();
        console.log(`📋 Page title: ${title}`);
        
        // Check if booking section exists
        const bookingSection = await page.locator('#booking').count();
        console.log(`📍 Booking section count: ${bookingSection}`);
        
        if (bookingSection > 0) {
            const bookingVisible = await page.locator('#booking').isVisible();
            console.log(`👁️  Booking section visible: ${bookingVisible}`);
            
            // Check if we need to scroll to it
            if (!bookingVisible) {
                console.log('📜 Scrolling to booking section...');
                await page.locator('#booking').scrollIntoViewIfNeeded();
                await page.waitForTimeout(2000);
                
                const bookingVisibleAfterScroll = await page.locator('#booking').isVisible();
                console.log(`👁️  Booking section visible after scroll: ${bookingVisibleAfterScroll}`);
            }
        }
        
        // Check for service options
        const serviceOptions = await page.locator('.service-option').count();
        console.log(`🎯 Service options count: ${serviceOptions}`);
        
        if (serviceOptions > 0) {
            console.log('📋 Service options found:');
            for (let i = 0; i < serviceOptions; i++) {
                const option = page.locator('.service-option').nth(i);
                const isVisible = await option.isVisible();
                const dataService = await option.getAttribute('data-service-type');
                const text = await option.textContent();
                console.log(`  ${i + 1}. ${dataService} - Visible: ${isVisible} - Text: "${text?.trim().substring(0, 50)}..."`);
            }
        }
        
        // Check for Next button
        const nextButton = await page.locator('#next-btn').count();
        console.log(`➡️  Next button count: ${nextButton}`);
        
        if (nextButton > 0) {
            const nextVisible = await page.locator('#next-btn').isVisible();
            console.log(`👁️  Next button visible: ${nextVisible}`);
        }
        
        // Check if there's a modal or expandable section that needs to be opened
        const bookingModal = await page.locator('.booking-modal, .booking-popup, .booking-form').count();
        console.log(`📱 Booking modal/popup count: ${bookingModal}`);
        
        // Check for "Book Now" or similar buttons that might open the booking interface
        const bookingTriggers = await page.locator('button:has-text("Book"), button:has-text("Schedule"), button:has-text("Appointment")').count();
        console.log(`🎯 Booking trigger buttons count: ${bookingTriggers}`);
        
        if (bookingTriggers > 0) {
            console.log('📋 Booking trigger buttons found:');
            for (let i = 0; i < bookingTriggers; i++) {
                const trigger = page.locator('button:has-text("Book"), button:has-text("Schedule"), button:has-text("Appointment")').nth(i);
                const isVisible = await trigger.isVisible();
                const text = await trigger.textContent();
                console.log(`  ${i + 1}. Visible: ${isVisible} - Text: "${text?.trim()}"`);
                
                if (isVisible) {
                    console.log(`🎯 Clicking booking trigger: "${text?.trim()}"`);
                    await trigger.click();
                    await page.waitForTimeout(3000);
                    
                    // Check if booking form appeared
                    const serviceOptionsAfterClick = await page.locator('.service-option').count();
                    const serviceOptionsVisible = await page.locator('.service-option').first().isVisible();
                    console.log(`📋 Service options after click: ${serviceOptionsAfterClick} (visible: ${serviceOptionsVisible})`);
                    
                    break;
                }
            }
        }
        
        // Take a screenshot for debugging
        await page.screenshot({ path: 'debug-3t-page-structure.png', fullPage: true });
        console.log('📸 Screenshot saved: debug-3t-page-structure.png');
        
        // Check current URL
        const currentUrl = page.url();
        console.log(`🌐 Current URL: ${currentUrl}`);
        
        // Check for any error messages
        const errorMessages = await page.locator('.error, .alert, .warning').count();
        console.log(`⚠️  Error messages count: ${errorMessages}`);
        
        if (errorMessages > 0) {
            for (let i = 0; i < errorMessages; i++) {
                const error = page.locator('.error, .alert, .warning').nth(i);
                const text = await error.textContent();
                console.log(`  Error ${i + 1}: "${text?.trim()}"`);
            }
        }
        
        console.log('\n✅ Debug complete - check screenshot and console output');
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        await page.screenshot({ path: 'debug-3t-error.png', fullPage: true });
        console.log('📸 Error screenshot saved: debug-3t-error.png');
    } finally {
        await browser.close();
    }
}

// Execute the debug
if (require.main === module) {
    debug3tPageStructure().catch(console.error);
}

module.exports = debug3tPageStructure;