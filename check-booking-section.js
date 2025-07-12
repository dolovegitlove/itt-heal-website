#!/usr/bin/env node

/**
 * Check the booking section content
 */

const puppeteer = require('puppeteer');

async function checkBookingSection() {
    console.log('🔍 Checking Booking Section Content');
    console.log('===================================');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    try {
        await page.goto('https://ittheal.com/', { waitUntil: 'networkidle0' });
        
        // Navigate to booking section
        await page.goto('https://ittheal.com/#booking', { waitUntil: 'networkidle0' });
        
        // Check what's in the booking section
        const bookingContent = await page.evaluate(() => {
            // Look for booking section by ID
            const bookingSection = document.getElementById('booking');
            if (bookingSection) {
                return {
                    found: true,
                    html: bookingSection.innerHTML.substring(0, 1000),
                    text: bookingSection.textContent.trim().substring(0, 500),
                    forms: bookingSection.querySelectorAll('form').length,
                    inputs: bookingSection.querySelectorAll('input').length,
                    buttons: bookingSection.querySelectorAll('button').length
                };
            }
            
            // Look for booking-related sections
            const sections = Array.from(document.querySelectorAll('section, div')).filter(el => {
                const text = el.textContent.toLowerCase();
                const id = el.id?.toLowerCase() || '';
                const className = el.className?.toLowerCase() || '';
                return text.includes('booking') || id.includes('booking') || className.includes('booking');
            });
            
            if (sections.length > 0) {
                const section = sections[0];
                return {
                    found: true,
                    html: section.innerHTML.substring(0, 1000),
                    text: section.textContent.trim().substring(0, 500),
                    forms: section.querySelectorAll('form').length,
                    inputs: section.querySelectorAll('input').length,
                    buttons: section.querySelectorAll('button').length
                };
            }
            
            return { found: false };
        });
        
        if (bookingContent.found) {
            console.log('✅ Found booking section');
            console.log(`Forms: ${bookingContent.forms}`);
            console.log(`Inputs: ${bookingContent.inputs}`);
            console.log(`Buttons: ${bookingContent.buttons}`);
            console.log('\nContent preview:');
            console.log(bookingContent.text);
            
            if (bookingContent.html.includes('form')) {
                console.log('\n📝 HTML contains form elements');
            }
        } else {
            console.log('❌ No booking section found');
        }
        
        // Check the entire page for any hidden forms or booking functionality
        const pageAnalysis = await page.evaluate(() => {
            const allText = document.body.textContent.toLowerCase();
            return {
                hasBookingText: allText.includes('booking') || allText.includes('appointment'),
                hasFormText: allText.includes('form') || allText.includes('submit'),
                hasContactText: allText.includes('contact') || allText.includes('email') || allText.includes('phone'),
                totalForms: document.querySelectorAll('form').length,
                totalInputs: document.querySelectorAll('input').length,
                totalButtons: document.querySelectorAll('button').length,
                hasMailto: document.querySelectorAll('a[href^="mailto:"]').length > 0,
                hasTel: document.querySelectorAll('a[href^="tel:"]').length > 0
            };
        });
        
        console.log('\n📊 Page Analysis:');
        console.log(`   Has booking text: ${pageAnalysis.hasBookingText}`);
        console.log(`   Has form text: ${pageAnalysis.hasFormText}`);
        console.log(`   Has contact text: ${pageAnalysis.hasContactText}`);
        console.log(`   Total forms: ${pageAnalysis.totalForms}`);
        console.log(`   Total inputs: ${pageAnalysis.totalInputs}`);
        console.log(`   Total buttons: ${pageAnalysis.totalButtons}`);
        console.log(`   Has mailto links: ${pageAnalysis.hasMailto}`);
        console.log(`   Has tel links: ${pageAnalysis.hasTel}`);
        
        if (pageAnalysis.totalForms === 0) {
            console.log('\n⚠️ ISSUE: No forms found on the main website!');
            console.log('   This explains why manual bookings are not working.');
            console.log('   Users can only contact via email/phone, not book directly.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

checkBookingSection().catch(console.error);