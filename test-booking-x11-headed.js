/**
 * X11 Headed Browser Test - Real Booking Appointment Test
 * Uses full browser with X11 display for real user interactions
 */

const puppeteer = require('puppeteer');

async function testBookingX11() {
    console.log('🚀 Starting X11 Headed Browser Booking Test...');
    
    const browser = await puppeteer.launch({ 
        headless: false,  // HEADED MODE - real browser window
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--display=:99',
            '--window-size=1920,1080'
        ],
        defaultViewport: null,
        slowMo: 1000  // Slow down actions for visibility
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('📍 Navigating to https://ittheal.com...');
        await page.goto('https://ittheal.com', { waitUntil: 'networkidle2' });
        
        console.log('⏱️ Waiting 3 seconds for page to fully load...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test 1: Real click on hamburger menu to test navigation
        console.log('🔍 Testing hamburger menu with real clicks...');
        
        const menuButton = await page.$('#hamburger-btn');
        if (menuButton) {
            console.log('✅ Menu button found - clicking...');
            await menuButton.click();
            console.log('🎯 REAL CLICK: Hamburger menu button clicked');
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check if menu opened
            const mobileMenu = await page.$('#mobile-menu');
            const menuVisible = await page.evaluate(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden';
            }, mobileMenu);
            
            if (menuVisible) {
                console.log('✅ Mobile menu opened successfully');
                
                // Click on "Book Session" in menu
                const bookSessionLink = await page.$('#mobile-menu a[href="#booking"]');
                if (bookSessionLink) {
                    console.log('🎯 REAL CLICK: Book Session menu item');
                    await bookSessionLink.click();
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
                // Close menu
                try {
                    const closeButton = await page.$('#close-menu-btn');
                    if (closeButton) {
                        console.log('🎯 REAL CLICK: Close menu button');
                        await closeButton.click();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (error) {
                    console.log('⚠️ Close button click failed:', error.message);
                }
            }
        }
        
        // Test 2: Scroll to booking section
        console.log('📍 Scrolling to booking section...');
        await page.evaluate(() => {
            const bookingSection = document.querySelector('#booking');
            if (bookingSection) {
                bookingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test 3: Look for and click booking buttons
        console.log('🔍 Looking for booking buttons with real clicks...');
        
        const bookingButtons = await page.$$('button, a, .btn, .cta-button');
        
        for (let i = 0; i < bookingButtons.length; i++) {
            const button = bookingButtons[i];
            
            const buttonInfo = await page.evaluate(el => {
                const text = el.textContent?.trim() || '';
                const classes = el.className || '';
                const id = el.id || '';
                const href = el.href || '';
                
                return {
                    text: text.substring(0, 50),
                    classes,
                    id,
                    href,
                    isBookingRelated: text.toLowerCase().includes('book') || 
                                     text.toLowerCase().includes('appointment') ||
                                     text.toLowerCase().includes('schedule') ||
                                     classes.toLowerCase().includes('book') ||
                                     id.toLowerCase().includes('book') ||
                                     href.toLowerCase().includes('book')
                };
            }, button);
            
            if (buttonInfo.isBookingRelated) {
                console.log(`📍 Found booking button: "${buttonInfo.text}"`);
                console.log(`   Classes: ${buttonInfo.classes}`);
                console.log(`   ID: ${buttonInfo.id}`);
                console.log(`   Href: ${buttonInfo.href}`);
                
                try {
                    // Scroll to button
                    await page.evaluate(el => {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, button);
                    
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    console.log('🎯 REAL CLICK: Booking button');
                    await button.click();
                    
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    // Check for changes
                    const currentUrl = page.url();
                    const modals = await page.$$('.modal, .overlay, .popup, .booking-modal');
                    
                    if (currentUrl !== 'https://ittheal.com/') {
                        console.log('📍 Navigation occurred to:', currentUrl);
                    }
                    
                    if (modals.length > 0) {
                        console.log('✅ Modal/overlay opened');
                        
                        // Look for booking form elements
                        const formElements = await page.$$('input, select, textarea');
                        console.log(`📊 Found ${formElements.length} form elements`);
                        
                        for (let j = 0; j < Math.min(formElements.length, 5); j++) {
                            const element = formElements[j];
                            const elementInfo = await page.evaluate(el => ({
                                type: el.type,
                                name: el.name,
                                id: el.id,
                                placeholder: el.placeholder
                            }), element);
                            
                            console.log(`   Form element: ${elementInfo.type} - ${elementInfo.name || elementInfo.id}`);
                            
                            // Try to interact with form elements
                            if (elementInfo.type === 'text' || elementInfo.type === 'email') {
                                console.log('🎯 REAL TYPE: Typing test data');
                                await element.type('Test User');
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            } else if (elementInfo.type === 'date') {
                                console.log('🎯 REAL CLICK: Date picker');
                                await element.click();
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            }
                        }
                    }
                    
                    // Only test the first booking button found
                    break;
                    
                } catch (error) {
                    console.log(`❌ Error clicking button: ${error.message}`);
                }
            }
        }
        
        // Test 4: Check for external booking integrations
        console.log('🔍 Checking for external booking integrations...');
        
        const iframes = await page.$$('iframe');
        console.log(`📊 Found ${iframes.length} iframes`);
        
        for (let i = 0; i < iframes.length; i++) {
            const iframe = iframes[i];
            const src = await page.evaluate(el => el.src, iframe);
            console.log(`   iframe ${i + 1}: ${src}`);
            
            if (src.includes('calendly') || src.includes('acuity') || src.includes('square')) {
                console.log('✅ External booking integration found');
                
                // Try to click on iframe
                try {
                    console.log('🎯 REAL CLICK: External booking iframe');
                    await iframe.click();
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (error) {
                    console.log(`❌ Error clicking iframe: ${error.message}`);
                }
            }
        }
        
        // Test 5: Test payment integration
        console.log('🔍 Testing payment integration...');
        
        const stripeElements = await page.$$('[class*="stripe"], [id*="stripe"]');
        if (stripeElements.length > 0) {
            console.log('✅ Stripe elements found');
            
            // Try to interact with first stripe element
            try {
                console.log('🎯 REAL CLICK: Stripe payment element');
                await stripeElements[0].click();
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.log(`❌ Error with Stripe element: ${error.message}`);
            }
        }
        
        console.log('\n🎉 X11 Headed Browser Booking Test Complete!');
        console.log('📍 Browser window will remain open for 10 seconds for manual inspection...');
        
        // Keep browser open for manual inspection
        await new Promise(resolve => setTimeout(resolve, 10000));
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
testBookingX11().catch(console.error);