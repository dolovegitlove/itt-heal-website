/**
 * Headless Browser UI Testing for ITT Heal
 * Tests real UI interactions without X11 display
 */

const puppeteer = require('puppeteer');

async function runHeadlessUITest() {
    console.log('🚀 Starting Headless UI Test...');
    
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        // Navigate to the site
        console.log('📍 Navigating to https://ittheal.com...');
        await page.goto('https://ittheal.com', { waitUntil: 'networkidle2' });
        
        // Test 1: Check if menu button exists and is clickable
        console.log('🔍 Testing hamburger menu button...');
        const menuButton = await page.$('#hamburger-btn');
        if (menuButton) {
            console.log('✅ Menu button found');
            
            // Test clicking the menu button
            await page.click('#hamburger-btn');
            console.log('🎯 Menu button clicked');
            
            // Wait for menu to appear
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check if mobile menu is visible
            const mobileMenu = await page.$('#mobile-menu');
            const menuVisible = await page.evaluate(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none';
            }, mobileMenu);
            
            if (menuVisible) {
                console.log('✅ Mobile menu opened successfully');
            } else {
                console.log('❌ Mobile menu did not open');
            }
        } else {
            console.log('❌ Menu button not found');
        }
        
        // Test 2: Check header height
        console.log('🔍 Testing header height...');
        const headerHeight = await page.evaluate(() => {
            const header = document.querySelector('.itt-header');
            return header ? header.offsetHeight : 0;
        });
        console.log('📏 Header height:', headerHeight + 'px');
        
        // Test 3: Check hero section
        console.log('🔍 Testing hero section...');
        const heroSection = await page.$('#hero');
        if (heroSection) {
            const heroHeight = await page.evaluate(el => el.offsetHeight, heroSection);
            console.log('📏 Hero section height:', heroHeight + 'px');
            console.log('✅ Hero section found');
        } else {
            console.log('❌ Hero section not found');
        }
        
        // Test 4: Check for booking elements
        console.log('🔍 Testing booking elements...');
        const bookingSection = await page.$('#booking');
        if (bookingSection) {
            console.log('✅ Booking section found');
            
            // Check for booking buttons
            const bookingButtons = await page.$$('.book-now-btn, .booking-btn, [href*="book"]');
            console.log('📊 Found', bookingButtons.length, 'booking-related buttons');
        } else {
            console.log('❌ Booking section not found');
        }
        
        // Test 5: Check CSS loading
        console.log('🔍 Testing CSS loading...');
        const cssLoaded = await page.evaluate(() => {
            const header = document.querySelector('.itt-header');
            if (!header) return false;
            
            const styles = window.getComputedStyle(header);
            return styles.position === 'sticky' || styles.position === 'fixed';
        });
        
        if (cssLoaded) {
            console.log('✅ CSS loaded correctly - header has proper positioning');
        } else {
            console.log('❌ CSS not loaded correctly');
        }
        
        // Test 6: Check JavaScript loading
        console.log('🔍 Testing JavaScript loading...');
        const jsLoaded = await page.evaluate(() => {
            return typeof toggleMobileMenu === 'function';
        });
        
        if (jsLoaded) {
            console.log('✅ JavaScript loaded correctly');
        } else {
            console.log('❌ JavaScript not loaded correctly');
        }
        
        console.log('\n🎉 Headless UI Test Complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
runHeadlessUITest().catch(console.error);