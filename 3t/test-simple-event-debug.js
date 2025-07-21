/**
 * 🚨 SIMPLE EVENT DEBUG: Direct Method Testing
 * Purpose: Directly test BookingAvailability methods and event handling
 */

const { chromium } = require('playwright');

async function simpleEventDebug() {
    console.log('🚀 Simple event debugging...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    let page;
    try {
        page = await browser.newPage();
        
        let apiRequests = [];
        page.on('request', request => {
            if (request.url().includes('/api/web-booking/availability/')) {
                apiRequests.push(request.url());
                console.log(`🌐 API: ${request.url()}`);
            }
        });
        
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('📅') || text.includes('⏰') || text.includes('API') || text.includes('Debug') || text.includes('🔧')) {
                console.log(`💬 ${text}`);
            }
        });
        
        // Navigate and setup
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
        await page.waitForSelector('[data-service-type="90min_massage"]', { timeout: 15000 });
        await page.locator('[data-service-type="90min_massage"]').click();
        await page.waitForTimeout(3000);
        
        // Direct method testing
        console.log('📍 Testing BookingAvailability methods directly');
        const directMethodResult = await page.evaluate(() => {
            const ba = window.BookingAvailability;
            const dateInput = document.getElementById('booking-date');
            
            if (!ba) return { error: 'BookingAvailability not found' };
            if (!dateInput) return { error: 'Date input not found' };
            
            // Test direct method calls
            console.log('🔧 Testing direct refresh() call...');
            try {
                ba.refresh();
                return { success: true, method: 'refresh' };
            } catch (error) {
                console.log('❌ refresh() failed:', error.message);
                
                // Try loadTimeSlots directly
                console.log('🔧 Testing direct loadTimeSlots() call...');
                try {
                    ba.loadTimeSlots();
                    return { success: true, method: 'loadTimeSlots' };
                } catch (error2) {
                    return { error: 'Both methods failed', refreshError: error.message, loadError: error2.message };
                }
            }
        });
        
        console.log('🔍 Direct method result:', directMethodResult);
        
        await page.waitForTimeout(5000);
        console.log(`🔍 API requests after direct call: ${apiRequests.length}`);
        
        // If direct methods didn't work, check the calendar connection
        if (apiRequests.length === 0) {
            console.log('📍 Testing calendar date selection trigger');
            await page.evaluate(() => {
                // Find a calendar date and click it programmatically
                const calendarDates = document.querySelectorAll('.calendar-date');
                for (let date of calendarDates) {
                    if (date.textContent && date.textContent.trim() && !date.disabled) {
                        console.log('🔧 Found valid calendar date:', date.textContent.trim());
                        console.log('🔧 data-date:', date.getAttribute('data-date'));
                        
                        // Simulate the calendar's selectDate function
                        const dateString = date.getAttribute('data-date');
                        if (dateString) {
                            const hiddenInput = document.getElementById('booking-date');
                            if (hiddenInput) {
                                console.log('🔧 Setting hidden input value to:', dateString);
                                hiddenInput.value = dateString;
                                
                                console.log('🔧 Triggering change event...');
                                hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
                                
                                // Also trigger input event
                                hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        }
                        break;
                    }
                }
            });
            
            await page.waitForTimeout(5000);
            console.log(`🔍 API requests after calendar simulation: ${apiRequests.length}`);
        }
        
        // Check final state
        const timeOptions = await page.locator('#booking-time option').count();
        const timeSelectContent = await page.locator('#booking-time').textContent();
        
        console.log(`🔍 Final state:`);
        console.log(`   Time options: ${timeOptions}`);
        console.log(`   Time select content: "${timeSelectContent?.substring(0, 100)}..."`);
        console.log(`   Total API requests: ${apiRequests.length}`);
        
        const success = apiRequests.length > 0 && timeOptions > 1;
        console.log(success ? '\n✅ TIMES LOADING WORKING' : '\n❌ TIMES LOADING BROKEN');
        
        return success;
        
    } catch (error) {
        console.error('\n❌ DEBUG FAILED:', error.message);
        return false;
        
    } finally {
        await browser.close();
    }
}

// Run debug
simpleEventDebug().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 ERROR:', error);
    process.exit(1);
});