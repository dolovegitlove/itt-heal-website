/**
 * Test for JavaScript errors preventing module loading
 */

const { chromium } = require('playwright');

async function testModuleErrors() {
    console.log('🧪 Testing for JavaScript errors...\n');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Capture ALL console messages including errors
        const logs = [];
        const errors = [];
        
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            logs.push(`[${type}] ${text}`);
            
            if (type === 'error') {
                errors.push(text);
                console.log(`❌ [ERROR] ${text}`);
            } else if (type === 'warning') {
                console.log(`⚠️ [WARNING] ${text}`);
            } else if (text.includes('BookingAvailability') || text.includes('🔧')) {
                console.log(`📍 [${type}] ${text}`);
            }
        });
        
        page.on('pageerror', error => {
            errors.push(error.toString());
            console.log(`❌ [PAGE ERROR] ${error}`);
        });
        
        // Navigate to the booking page
        console.log('📍 Loading booking page...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        // Check what scripts loaded
        const scriptsInfo = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script[src]'));
            return scripts.map(script => ({
                src: script.src,
                loaded: script.complete !== false
            }));
        });
        
        console.log('\n📋 Scripts on page:');
        scriptsInfo.forEach(script => {
            if (script.src.includes('booking-availability')) {
                console.log(`  ✓ ${script.src} (loaded: ${script.loaded})`);
            }
        });
        
        // Check if module exists and why it might not be working
        const moduleCheck = await page.evaluate(() => {
            const results = {
                bookingAvailabilityExists: typeof window.BookingAvailability !== 'undefined',
                loadTimeSlotsExists: typeof window.loadTimeSlots !== 'undefined',
                refreshTimeSlotsExists: typeof window.refreshTimeSlots !== 'undefined',
                dateInputExists: !!document.getElementById('booking-date'),
                timeSelectExists: !!document.getElementById('booking-time'),
                documentReady: document.readyState
            };
            
            // Try to access the module
            if (window.BookingAvailability) {
                results.moduleProperties = Object.keys(window.BookingAvailability);
            }
            
            return results;
        });
        
        console.log('\n📊 Module Check Results:');
        console.log(JSON.stringify(moduleCheck, null, 2));
        
        // Try to manually load the script
        console.log('\n📍 Attempting manual script load...');
        const scriptLoaded = await page.evaluate(async () => {
            return new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = './js/booking-availability.js?v=' + Date.now();
                script.onload = () => resolve(true);
                script.onerror = () => resolve(false);
                document.body.appendChild(script);
            });
        });
        
        console.log(`Script manual load: ${scriptLoaded ? 'SUCCESS' : 'FAILED'}`);
        
        // Wait and check again
        await page.waitForTimeout(2000);
        
        const finalCheck = await page.evaluate(() => {
            return {
                bookingAvailabilityExists: typeof window.BookingAvailability !== 'undefined',
                loadTimeSlotsExists: typeof window.loadTimeSlots !== 'undefined'
            };
        });
        
        console.log('\n📊 Final Check:');
        console.log(JSON.stringify(finalCheck, null, 2));
        
        // Summary
        console.log('\n📊 ERROR SUMMARY:');
        console.log(`Total errors: ${errors.length}`);
        if (errors.length > 0) {
            console.log('Errors found:');
            errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
        } else {
            console.log('No JavaScript errors detected');
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
if (require.main === module) {
    testModuleErrors().catch(console.error);
}

module.exports = { testModuleErrors };