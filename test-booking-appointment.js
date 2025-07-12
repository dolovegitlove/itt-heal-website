/**
 * Booking Appointment Test - Real Browser Testing
 * Tests the complete booking flow from start to finish
 */

const puppeteer = require('puppeteer');

async function testBookingAppointment() {
    console.log('🚀 Starting Booking Appointment Test...');
    
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        // Navigate to the site
        console.log('📍 Navigating to https://ittheal.com...');
        await page.goto('https://ittheal.com', { waitUntil: 'networkidle2' });
        
        // Test 1: Find and click a booking button
        console.log('🔍 Looking for booking buttons...');
        
        // Try different booking button selectors
        const bookingSelectors = [
            'a[href*="book"]',
            '.book-now-btn',
            '.booking-btn',
            'button[onclick*="book"]',
            '#book-session-btn',
            '.cta-button'
        ];
        
        let bookingButton = null;
        let usedSelector = '';
        
        for (const selector of bookingSelectors) {
            bookingButton = await page.$(selector);
            if (bookingButton) {
                usedSelector = selector;
                console.log(`✅ Found booking button with selector: ${selector}`);
                break;
            }
        }
        
        if (!bookingButton) {
            console.log('❌ No booking button found, checking for booking section...');
            
            // Scroll to booking section
            await page.evaluate(() => {
                const bookingSection = document.querySelector('#booking');
                if (bookingSection) {
                    bookingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try to find booking elements within the booking section
            const bookingElements = await page.$$eval('#booking *', elements => {
                return elements.map(el => ({
                    tag: el.tagName,
                    id: el.id,
                    classes: el.className,
                    text: el.textContent ? el.textContent.trim().substring(0, 50) : '',
                    type: el.type || 'N/A'
                })).filter(el => 
                    el.text.toLowerCase().includes('book') || 
                    el.classes.toLowerCase().includes('book') ||
                    el.id.toLowerCase().includes('book')
                );
            });
            
            console.log('📊 Booking elements found:', bookingElements.length);
            bookingElements.forEach(el => {
                console.log(`   - ${el.tag}: "${el.text}" (${el.classes})`);
            });
        }
        
        // Test 2: Check for booking form elements
        console.log('🔍 Checking for booking form elements...');
        
        const formElements = await page.evaluate(() => {
            const elements = {
                dateInputs: document.querySelectorAll('input[type="date"], #booking-date, .date-picker').length,
                timeInputs: document.querySelectorAll('input[type="time"], #booking-time, .time-picker').length,
                nameInputs: document.querySelectorAll('input[name*="name"], #client-name, .name-input').length,
                emailInputs: document.querySelectorAll('input[type="email"], #client-email, .email-input').length,
                phoneInputs: document.querySelectorAll('input[type="tel"], #client-phone, .phone-input').length,
                submitButtons: document.querySelectorAll('button[type="submit"], .submit-btn, .book-submit').length
            };
            
            return elements;
        });
        
        console.log('📊 Form elements found:');
        Object.entries(formElements).forEach(([key, count]) => {
            console.log(`   ${key}: ${count}`);
        });
        
        // Test 3: Check for external booking integrations
        console.log('🔍 Checking for external booking integrations...');
        
        const externalBooking = await page.evaluate(() => {
            const integrations = {
                calendly: document.querySelector('[src*="calendly"]') !== null,
                acuity: document.querySelector('[src*="acuity"]') !== null,
                square: document.querySelector('[src*="square"]') !== null,
                stripe: document.querySelector('[src*="stripe"]') !== null,
                iframes: document.querySelectorAll('iframe').length
            };
            
            return integrations;
        });
        
        console.log('📊 External integrations:');
        Object.entries(externalBooking).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
        });
        
        // Test 4: Try to interact with booking elements
        console.log('🔍 Testing booking interaction...');
        
        // Look for any clickable booking elements
        const clickableElements = await page.$$eval('*', elements => {
            return elements
                .filter(el => {
                    const text = el.textContent?.toLowerCase() || '';
                    const classes = el.className?.toLowerCase() || '';
                    const id = el.id?.toLowerCase() || '';
                    
                    return (text.includes('book') || text.includes('appointment') || 
                            classes.includes('book') || id.includes('book')) &&
                           (el.tagName === 'BUTTON' || el.tagName === 'A' || 
                            el.onclick || el.addEventListener);
                })
                .map(el => ({
                    tag: el.tagName,
                    text: el.textContent?.trim().substring(0, 50),
                    href: el.href || 'N/A',
                    onclick: el.onclick ? 'has onclick' : 'no onclick'
                }));
        });
        
        console.log('📊 Clickable booking elements:');
        clickableElements.forEach(el => {
            console.log(`   - ${el.tag}: "${el.text}" (${el.onclick})`);
        });
        
        // Test 5: Check for booking API endpoints
        console.log('🔍 Checking for booking API endpoints...');
        
        const apiCheck = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            const scriptText = scripts.map(s => s.textContent || '').join(' ');
            
            return {
                hasBookingAPI: scriptText.includes('/api/booking') || scriptText.includes('/api/web-booking'),
                hasStripeAPI: scriptText.includes('stripe') || scriptText.includes('Stripe'),
                hasCalendlyAPI: scriptText.includes('calendly'),
                hasAjaxCalls: scriptText.includes('fetch(') || scriptText.includes('XMLHttpRequest')
            };
        });
        
        console.log('📊 API endpoints:');
        Object.entries(apiCheck).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
        });
        
        // Test 6: Try to trigger a booking action
        console.log('🔍 Attempting to trigger booking action...');
        
        // Look for booking button in the hero section
        const heroBookingBtn = await page.$('#hero .cta-button, #hero .book-now, #hero a[href*="book"]');
        if (heroBookingBtn) {
            console.log('✅ Found hero booking button');
            
            try {
                await heroBookingBtn.click();
                console.log('🎯 Clicked hero booking button');
                
                // Wait for any response
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Check if anything changed
                const currentUrl = page.url();
                const modalOpened = await page.$('.modal, .overlay, .booking-modal');
                
                if (currentUrl !== 'https://ittheal.com/') {
                    console.log('📍 Navigated to:', currentUrl);
                } else if (modalOpened) {
                    console.log('✅ Modal/overlay opened');
                } else {
                    console.log('⚠️ No visible change after click');
                }
                
            } catch (error) {
                console.log('❌ Error clicking booking button:', error.message);
            }
        }
        
        console.log('\n🎉 Booking Appointment Test Complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
testBookingAppointment().catch(console.error);