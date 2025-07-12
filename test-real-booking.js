#!/usr/bin/env node

/**
 * Test the real booking form functionality
 */

const puppeteer = require('puppeteer');

async function testRealBooking() {
    console.log('🧪 Testing Real Booking Form');
    console.log('============================');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    try {
        // Navigate to the booking section
        await page.goto('https://ittheal.com/d/#booking', { waitUntil: 'networkidle0', timeout: 30000 });
        console.log('✅ Navigated to booking section');

        // Wait a moment for everything to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check if the new booking form elements exist
        const formElements = await page.evaluate(() => {
            return {
                serviceOptions: document.querySelectorAll('.service-option').length,
                dateTimeSection: document.getElementById('datetime-selection') ? true : false,
                contactSection: document.getElementById('contact-info') ? true : false,
                summarySection: document.getElementById('booking-summary') ? true : false,
                selectServiceFunction: typeof window.selectService === 'function',
                nextStepFunction: typeof window.nextStep === 'function',
                submitBookingFunction: typeof window.submitBooking === 'function'
            };
        });

        console.log('📋 Form Elements Check:');
        console.log(`   Service options: ${formElements.serviceOptions}`);
        console.log(`   Date/time section: ${formElements.dateTimeSection}`);
        console.log(`   Contact section: ${formElements.contactSection}`);
        console.log(`   Summary section: ${formElements.summarySection}`);
        console.log(`   selectService function: ${formElements.selectServiceFunction}`);
        console.log(`   nextStep function: ${formElements.nextStepFunction}`);
        console.log(`   submitBooking function: ${formElements.submitBookingFunction}`);

        // Try to click a service option if it exists
        if (formElements.serviceOptions > 0) {
            console.log('\n🖱️ Testing service selection...');
            
            const result = await page.evaluate(() => {
                try {
                    const option = document.querySelector('.service-option');
                    if (option) {
                        option.click();
                        return 'Service option clicked successfully';
                    } else {
                        return 'No service option found';
                    }
                } catch (error) {
                    return `Error: ${error.message}`;
                }
            });
            
            console.log(`   Result: ${result}`);

            // Check if the next button appeared
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const nextButtonVisible = await page.evaluate(() => {
                const nextBtn = document.getElementById('next-btn');
                return nextBtn && nextBtn.style.display !== 'none';
            });
            
            console.log(`   Next button visible: ${nextButtonVisible}`);
        }

        // Test the availability API
        console.log('\n🔗 Testing availability API...');
        
        const apiTest = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/web-booking/availability/060863f2-0623-4785-b01a-f1760cfb8d14/2025-06-29');
                const data = await response.json();
                return {
                    status: response.status,
                    success: data.success,
                    slotsCount: data.data?.available_slots?.length || 0
                };
            } catch (error) {
                return { error: error.message };
            }
        });
        
        console.log(`   API Status: ${apiTest.status || 'Error'}`);
        console.log(`   API Success: ${apiTest.success || 'N/A'}`);
        console.log(`   Available slots: ${apiTest.slotsCount || 0}`);

        // Test the booking API endpoint
        console.log('\n📝 Testing booking API endpoint...');
        
        const bookingApiTest = await page.evaluate(async () => {
            try {
                const testBooking = {
                    client_name: 'Test User',
                    guest_email: 'test@example.com',
                    guest_phone: '555-0123',
                    scheduled_date: new Date().toISOString(),
                    session_type: '60min',
                    location_type: 'in_clinic',
                    session_notes: 'Test booking',
                    final_price: 135,
                    booking_platform: 'website',
                    guest_booking: true
                };

                const response = await fetch('/api/web-booking/book', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(testBooking)
                });

                return {
                    status: response.status,
                    contentType: response.headers.get('content-type'),
                    url: response.url
                };
            } catch (error) {
                return { error: error.message };
            }
        });
        
        console.log(`   Booking API Status: ${bookingApiTest.status || 'Error'}`);
        console.log(`   Content Type: ${bookingApiTest.contentType || 'N/A'}`);
        console.log(`   API URL: ${bookingApiTest.url || 'N/A'}`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

testRealBooking().catch(console.error);