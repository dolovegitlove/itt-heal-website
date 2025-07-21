/**
 * 🚨 EVENT LISTENER DEBUG: BookingAvailability Event Listener Issue
 * Purpose: Debug why BookingAvailability is not responding to change events
 * Method: Step-by-step debugging of event listener attachment
 */

const { chromium } = require('playwright');

async function debugEventListener() {
    console.log('🚀 Debugging BookingAvailability event listener...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 800,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    let page;
    try {
        page = await browser.newPage();
        
        page.on('console', msg => {
            console.log(`💬 Console: ${msg.text()}`);
        });
        
        // Navigate and setup
        console.log('📍 Navigate and select service');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
        await page.waitForSelector('[data-service-type="90min_massage"]', { timeout: 15000 });
        await page.locator('[data-service-type="90min_massage"]').click();
        await page.waitForTimeout(3000);
        
        // Debug BookingAvailability state
        console.log('📍 Debugging BookingAvailability state');
        const bookingAvailabilityState = await page.evaluate(() => {
            const ba = window.BookingAvailability;
            const dateInput = document.getElementById('booking-date');
            
            return {
                bookingAvailabilityExists: !!ba,
                bookingAvailabilityMethods: ba ? Object.keys(ba).filter(key => typeof ba[key] === 'function') : [],
                dateInputExists: !!dateInput,
                dateInputType: dateInput?.type,
                dateInputValue: dateInput?.value,
                dateInputListeners: dateInput ? getEventListeners(dateInput) : 'N/A'
            };
        });
        
        console.log('🔍 BookingAvailability state:', bookingAvailabilityState);
        
        // Test manual event trigger with detailed logging
        console.log('📍 Testing manual event trigger with debugging');
        await page.evaluate(() => {
            const dateInput = document.getElementById('booking-date');
            const ba = window.BookingAvailability;
            
            console.log('🔧 Before trigger:', {
                dateInputValue: dateInput?.value,
                bookingAvailabilityExists: !!ba,
                hasHandleDateChange: !!(ba && ba.handleDateChange)
            });
            
            // Try to manually call handleDateChange
            if (ba && ba.handleDateChange) {
                console.log('🔧 Manually calling handleDateChange...');
                ba.handleDateChange();
            } else {
                console.log('❌ handleDateChange method not found');
            }
            
            // Try triggering various events
            if (dateInput) {
                console.log('🔧 Triggering change event...');
                dateInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                console.log('🔧 Triggering input event...');
                dateInput.dispatchEvent(new Event('input', { bubbles: true }));
                
                console.log('🔧 Triggering custom event...');
                dateInput.dispatchEvent(new CustomEvent('dateChanged', { 
                    bubbles: true, 
                    detail: { value: dateInput.value } 
                }));
            }
        });
        
        await page.waitForTimeout(3000);
        
        // Check if the issue is with the calendar replacing the input
        console.log('📍 Checking if calendar replaced the original input');
        const inputReplacementInfo = await page.evaluate(() => {
            const dateInput = document.getElementById('booking-date');
            const allInputs = document.querySelectorAll('input[id*="date"], input[name*="date"]');
            
            return {
                mainInputExists: !!dateInput,
                allDateInputs: Array.from(allInputs).map(input => ({
                    id: input.id,
                    name: input.name,
                    type: input.type,
                    value: input.value,
                    hidden: input.type === 'hidden'
                }))
            };
        });
        
        console.log('🔍 Input replacement info:', inputReplacementInfo);
        
        // Try re-initializing BookingAvailability
        console.log('📍 Attempting to re-initialize BookingAvailability');
        await page.evaluate(() => {
            const ba = window.BookingAvailability;
            if (ba && ba.init) {
                console.log('🔧 Re-initializing BookingAvailability...');
                ba.init();
            } else {
                console.log('❌ BookingAvailability.init not found');
            }
        });
        
        await page.waitForTimeout(2000);
        
        // Final test after re-initialization
        console.log('📍 Final test after re-initialization');
        await page.evaluate(() => {
            const dateInput = document.getElementById('booking-date');
            if (dateInput) {
                console.log('🔧 Final change event trigger...');
                dateInput.value = '2025-07-25'; // Friday
                dateInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        
        await page.waitForTimeout(3000);
        
        // Check final state
        const finalTimeOptions = await page.locator('#booking-time option').count();
        console.log(`🔍 Final time options: ${finalTimeOptions}`);
        
        return finalTimeOptions > 1;
        
    } catch (error) {
        console.error('\n❌ DEBUG FAILED:', error.message);
        return false;
        
    } finally {
        await browser.close();
    }
}

// Run debug
debugEventListener().then(success => {
    console.log(success ? '\n✅ Event listener working' : '\n❌ Event listener broken');
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 ERROR:', error);
    process.exit(1);
});