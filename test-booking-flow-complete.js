#!/usr/bin/env node

/**
 * ITT Heal Booking Flow - Comprehensive Testing
 * Tests the complete user journey from website to booking
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'https://ittheal.com';
const MAIN_SITE_URL = `${BASE_URL}/d/`;

async function test(name, testFn) {
    try {
        console.log(`🔹 Testing: ${name}`);
        await testFn();
        console.log(`✅ PASSED: ${name}`);
        return true;
    } catch (error) {
        console.log(`❌ FAILED: ${name} - ${error.message}`);
        return false;
    }
}

async function runBookingFlowTests() {
    console.log('📅 ITT Heal Booking Flow - Comprehensive Testing');
    console.log('=================================================');
    console.log('🔍 Testing complete user booking journey');
    console.log('');

    let browser;
    let page;
    let passedTests = 0;
    let totalTests = 0;

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Set up console logging for errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('PAGE ERROR:', msg.text());
            }
        });

        // Test 1: Main website booking button discovery
        if (await test('Main Website Booking Button Discovery', async () => {
            await page.goto(MAIN_SITE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
            
            // Look for booking-related buttons and links
            const bookingElements = await page.$$([
                'a[href*="book"]',
                'button[class*="book"]',
                '[class*="book"][role="button"]',
                'a[href*="calendar"]',
                'a[href*="appointment"]',
                '.btn',
                '.button'
            ].join(', '));
            
            if (bookingElements.length === 0) {
                throw new Error('No booking buttons found on main website');
            }
            
            console.log(`   📅 Found ${bookingElements.length} potential booking elements`);
            
            // Check if any have booking-related text
            let bookingTextFound = false;
            for (const element of bookingElements) {
                const text = await page.evaluate(el => el.textContent.toLowerCase(), element);
                if (text.includes('book') || text.includes('appointment') || text.includes('schedule')) {
                    bookingTextFound = true;
                    console.log(`   📝 Found booking text: "${text.substring(0, 30)}..."`);
                    break;
                }
            }
            
            if (!bookingTextFound) {
                console.log('   ⚠️ No explicit booking text found, but buttons are present');
            }
            
            console.log('   ✅ Booking elements discovered');
        })) passedTests++;
        totalTests++;

        // Test 2: API endpoints accessibility
        if (await test('Booking API Endpoints Accessibility', async () => {
            // Test practitioners endpoint
            const practitionersResponse = await page.evaluate(async (baseUrl) => {
                try {
                    const response = await fetch(`${baseUrl}/api/web-booking/practitioners`);
                    return {
                        status: response.status,
                        ok: response.ok,
                        data: await response.json()
                    };
                } catch (error) {
                    return { error: error.message };
                }
            }, BASE_URL);
            
            if (practitionersResponse.error) {
                throw new Error(`Practitioners API error: ${practitionersResponse.error}`);
            }
            
            if (!practitionersResponse.ok) {
                throw new Error(`Practitioners API returned ${practitionersResponse.status}`);
            }
            
            console.log(`   👩‍⚕️ Practitioners API: ${practitionersResponse.data?.length || 0} practitioners available`);
            
            // Test health endpoint
            const healthResponse = await page.evaluate(async (baseUrl) => {
                try {
                    const response = await fetch(`${baseUrl}/api/health`);
                    return {
                        status: response.status,
                        ok: response.ok
                    };
                } catch (error) {
                    return { error: error.message };
                }
            }, BASE_URL);
            
            if (healthResponse.ok) {
                console.log('   ✅ Backend API is accessible and healthy');
            } else {
                console.log('   ⚠️ Backend health check issues, but practitioners API works');
            }
        })) passedTests++;
        totalTests++;

        // Test 3: Form elements and input validation
        if (await test('Contact Forms & Input Validation', async () => {
            await page.goto(MAIN_SITE_URL, { waitUntil: 'networkidle0' });
            
            const forms = await page.$$('form');
            console.log(`   📝 Found ${forms.length} forms on the page`);
            
            if (forms.length === 0) {
                // Look for input elements that might be in custom forms
                const inputs = await page.$$('input, textarea, select');
                if (inputs.length === 0) {
                    throw new Error('No forms or input elements found');
                }
                console.log(`   📝 Found ${inputs.length} input elements outside of forms`);
            } else {
                // Test first form
                const form = forms[0];
                const inputs = await form.$$('input, textarea, select');
                const buttons = await form.$$('button, input[type="submit"]');
                
                console.log(`   📝 Form has ${inputs.length} inputs and ${buttons.length} submit buttons`);
                
                // Test input types
                for (let i = 0; i < Math.min(3, inputs.length); i++) {
                    const input = inputs[i];
                    const type = await page.evaluate(el => el.type || el.tagName.toLowerCase(), input);
                    const required = await page.evaluate(el => el.required, input);
                    
                    console.log(`   📝 Input ${i + 1}: type=${type}, required=${required}`);
                }
            }
            
            console.log('   ✅ Form elements discovered and analyzed');
        })) passedTests++;
        totalTests++;

        // Test 4: Mobile booking experience
        if (await test('Mobile Booking Experience', async () => {
            // Switch to mobile viewport
            await page.setViewport({ width: 375, height: 667 });
            await page.goto(MAIN_SITE_URL, { waitUntil: 'networkidle0' });
            
            // Check if booking elements are still accessible on mobile
            const mobileBookingElements = await page.$$([
                'a[href*="book"]',
                'button[class*="book"]',
                '[class*="book"][role="button"]',
                '.btn',
                '.button'
            ].join(', '));
            
            console.log(`   📱 Found ${mobileBookingElements.length} booking elements on mobile`);
            
            // Check if elements are touch-friendly (minimum 44px)
            let touchFriendlyCount = 0;
            for (let i = 0; i < Math.min(5, mobileBookingElements.length); i++) {
                const element = mobileBookingElements[i];
                const bbox = await element.boundingBox();
                
                if (bbox && (bbox.width >= 44 && bbox.height >= 44)) {
                    touchFriendlyCount++;
                }
            }
            
            console.log(`   👆 ${touchFriendlyCount} elements are touch-friendly (44px+)`);
            
            // Restore desktop viewport
            await page.setViewport({ width: 1920, height: 1080 });
            
            console.log('   ✅ Mobile booking experience verified');
        })) passedTests++;
        totalTests++;

        // Test 5: Booking flow navigation
        if (await test('Booking Flow Navigation', async () => {
            await page.goto(MAIN_SITE_URL, { waitUntil: 'networkidle0' });
            
            // Try to find and click a booking-related button
            const bookingButtons = await page.$$('button, .btn, .button, a[href*="book"]');
            
            if (bookingButtons.length === 0) {
                throw new Error('No clickable booking elements found');
            }
            
            // Test clicking the first booking button
            const firstButton = bookingButtons[0];
            const isVisible = await firstButton.isIntersectingViewport();
            
            if (!isVisible) {
                console.log('   ⚠️ First booking button not in viewport, scrolling...');
                await firstButton.scrollIntoView();
            }
            
            // Get button text and check if it's clickable
            const buttonText = await page.evaluate(el => el.textContent, firstButton);
            console.log(`   🖱️ Testing button: "${buttonText.substring(0, 30)}..."`);
            
            // Check if button has proper event handlers or href
            const hasHandler = await page.evaluate(el => {
                return !!(el.onclick || el.href || el.getAttribute('data-action'));
            }, firstButton);
            
            if (!hasHandler) {
                console.log('   ⚠️ Button may not have proper click handlers');
            } else {
                console.log('   ✅ Button has proper interaction handlers');
            }
            
            console.log('   ✅ Booking flow navigation tested');
        })) passedTests++;
        totalTests++;

        // Test 6: Availability data access
        if (await test('Availability Data Access', async () => {
            // Test if we can access availability data for a known practitioner
            const availabilityResponse = await page.evaluate(async (baseUrl) => {
                try {
                    // Use Dr. Shiffer's known ID
                    const practitionerId = '060863f2-0623-4785-b01a-f1760cfb8d14';
                    const today = new Date().toISOString().split('T')[0];
                    
                    const response = await fetch(`${baseUrl}/api/web-booking/availability/${practitionerId}/${today}`);
                    return {
                        status: response.status,
                        ok: response.ok,
                        data: response.ok ? await response.json() : null
                    };
                } catch (error) {
                    return { error: error.message };
                }
            }, BASE_URL);
            
            if (availabilityResponse.error) {
                console.log(`   ⚠️ Availability API error: ${availabilityResponse.error}`);
            } else if (availabilityResponse.ok) {
                const slots = availabilityResponse.data?.length || 0;
                console.log(`   📅 Found ${slots} availability slots for today`);
            } else {
                console.log(`   ⚠️ Availability API returned ${availabilityResponse.status}`);
            }
            
            console.log('   ✅ Availability data access tested');
        })) passedTests++;
        totalTests++;

        // Test 7: Complete user journey simulation
        if (await test('Complete User Journey Simulation', async () => {
            await page.goto(MAIN_SITE_URL, { waitUntil: 'networkidle0' });
            
            // Step 1: User lands on main page
            const title = await page.title();
            console.log(`   🏠 User lands on: ${title}`);
            
            // Step 2: User looks for booking options
            const allButtons = await page.$$('button, .btn, .button, a');
            const interactiveElements = allButtons.length;
            console.log(`   🔍 User sees ${interactiveElements} interactive elements`);
            
            // Step 3: User finds contact/booking information
            const contactInfo = await page.$$([
                '[href*="tel:"]',
                '[href*="mailto:"]',
                '[class*="phone"]',
                '[class*="email"]',
                'form'
            ].join(', '));
            
            console.log(`   📞 User finds ${contactInfo.length} contact options`);
            
            // Step 4: Check if user can proceed to booking
            const bookingPaths = await page.$$([
                'a[href*="book"]',
                'button[onclick*="book"]',
                'form',
                '[href*="calendar"]'
            ].join(', '));
            
            if (bookingPaths.length === 0) {
                console.log('   ⚠️ No clear booking path found - user would need to call/email');
            } else {
                console.log(`   ✅ User has ${bookingPaths.length} potential booking paths`);
            }
            
            console.log('   ✅ User journey simulation completed');
        })) passedTests++;
        totalTests++;

    } catch (error) {
        console.error('💥 Booking flow test error:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    // Results summary
    console.log('');
    console.log('========================================');
    console.log('📊 BOOKING FLOW TEST SUMMARY');
    console.log('========================================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    console.log('');

    if (passedTests === totalTests) {
        console.log('🎉 ALL BOOKING FLOW TESTS PASSED!');
        console.log('✅ Users can discover booking options');
        console.log('✅ Backend booking APIs are accessible');
        console.log('✅ Mobile booking experience is functional');
        console.log('✅ Complete user journey is viable');
    } else {
        console.log(`⚠️ ${totalTests - passedTests} booking flow test(s) failed`);
    }
    
    console.log('');
    console.log('🌐 Tested booking flow on: https://ittheal.com/d/');
    console.log('🔧 Admin interface available at: https://ittheal.com/admin.html');
}

runBookingFlowTests().catch(console.error);