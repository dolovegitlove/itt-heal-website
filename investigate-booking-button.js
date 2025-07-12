#!/usr/bin/env node

/**
 * Investigate Booking Button Behavior
 * Find out what happens when the booking button is clicked
 */

const puppeteer = require('puppeteer');

async function investigateBookingButton() {
    console.log('🔍 Investigating Booking Button Behavior');
    console.log('========================================');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        // Navigate to main site
        await page.goto('https://ittheal.com/d/', { waitUntil: 'networkidle0', timeout: 30000 });
        console.log('✅ Loaded main website');

        // Find all booking-related links and buttons
        const bookingElements = await page.evaluate(() => {
            const selectors = [
                'a[href*="book"]',
                'button[class*="book"]',
                '[class*="book"][role="button"]',
                'a[href*="calendar"]',
                'a[href*="appointment"]',
                '.btn',
                '.button'
            ];

            const results = [];
            
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((el, index) => {
                    results.push({
                        selector: selector,
                        index: index,
                        text: el.textContent.trim().substring(0, 50),
                        href: el.href || null,
                        onclick: el.onclick ? el.onclick.toString() : null,
                        dataAction: el.getAttribute('data-action'),
                        className: el.className,
                        tagName: el.tagName
                    });
                });
            });

            return results;
        });

        console.log(`\n📋 Found ${bookingElements.length} potential booking elements:`);
        bookingElements.forEach((el, i) => {
            console.log(`\n${i + 1}. ${el.tagName} (${el.selector})`);
            console.log(`   Text: "${el.text}"`);
            console.log(`   Href: ${el.href || 'none'}`);
            console.log(`   Class: ${el.className || 'none'}`);
            console.log(`   Data-action: ${el.dataAction || 'none'}`);
            if (el.onclick) {
                console.log(`   OnClick: ${el.onclick.substring(0, 100)}...`);
            }
        });

        // Look for contact forms or contact information
        const contactInfo = await page.evaluate(() => {
            const results = {
                forms: [],
                emailLinks: [],
                phoneLinks: [],
                contactSections: []
            };

            // Find forms
            document.querySelectorAll('form').forEach((form, i) => {
                results.forms.push({
                    index: i,
                    action: form.action,
                    method: form.method,
                    inputs: Array.from(form.querySelectorAll('input, textarea, select')).length
                });
            });

            // Find email links
            document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
                results.emailLinks.push({
                    text: link.textContent.trim(),
                    href: link.href
                });
            });

            // Find phone links
            document.querySelectorAll('a[href^="tel:"]').forEach(link => {
                results.phoneLinks.push({
                    text: link.textContent.trim(),
                    href: link.href
                });
            });

            // Find contact sections
            const contactKeywords = ['contact', 'booking', 'appointment', 'schedule'];
            document.querySelectorAll('section, div').forEach(el => {
                const text = el.textContent.toLowerCase();
                const id = el.id?.toLowerCase() || '';
                const className = el.className?.toLowerCase() || '';
                
                if (contactKeywords.some(keyword => 
                    text.includes(keyword) || id.includes(keyword) || className.includes(keyword)
                )) {
                    results.contactSections.push({
                        tag: el.tagName,
                        id: el.id,
                        className: el.className,
                        text: el.textContent.trim().substring(0, 100)
                    });
                }
            });

            return results;
        });

        console.log(`\n📧 Contact Information Found:`);
        console.log(`   Forms: ${contactInfo.forms.length}`);
        contactInfo.forms.forEach((form, i) => {
            console.log(`   Form ${i + 1}: ${form.inputs} inputs, action: ${form.action || 'none'}`);
        });

        console.log(`   Email links: ${contactInfo.emailLinks.length}`);
        contactInfo.emailLinks.forEach(email => {
            console.log(`     ${email.text} (${email.href})`);
        });

        console.log(`   Phone links: ${contactInfo.phoneLinks.length}`);
        contactInfo.phoneLinks.forEach(phone => {
            console.log(`     ${phone.text} (${phone.href})`);
        });

        console.log(`   Contact sections: ${contactInfo.contactSections.length}`);

        // Try clicking the first booking button and see what happens
        if (bookingElements.length > 0) {
            console.log(`\n🖱️ Testing click on first booking element...`);
            
            const firstElement = bookingElements[0];
            console.log(`Clicking: ${firstElement.text} (${firstElement.selector})`);

            // Click and track navigation
            const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => null);
            
            await page.evaluate((selector, index) => {
                const elements = document.querySelectorAll(selector);
                if (elements[index]) {
                    elements[index].click();
                }
            }, firstElement.selector, firstElement.index);

            // Wait a bit to see if navigation occurs
            await Promise.race([
                navigationPromise,
                new Promise(resolve => setTimeout(resolve, 3000))
            ]);

            const newUrl = page.url();
            console.log(`Result URL: ${newUrl}`);

            if (newUrl !== 'https://ittheal.com/d/') {
                console.log('✅ Navigation occurred after click');
                
                // Check the new page for booking functionality
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const newPageInfo = await page.evaluate(() => {
                    return {
                        title: document.title,
                        forms: document.querySelectorAll('form').length,
                        inputs: document.querySelectorAll('input').length,
                        hasBookingForm: document.querySelector('form, .booking-form, .appointment-form') !== null
                    };
                });

                console.log(`New page: ${newPageInfo.title}`);
                console.log(`Forms: ${newPageInfo.forms}, Inputs: ${newPageInfo.inputs}`);
                console.log(`Has booking form: ${newPageInfo.hasBookingForm}`);
            } else {
                console.log('⚠️ No navigation occurred - might be a modal or AJAX action');
                
                // Check for modals or new content
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const modalInfo = await page.evaluate(() => {
                    // Look for common modal patterns
                    const modals = document.querySelectorAll('.modal, .popup, .overlay, [role="dialog"]');
                    const newForms = document.querySelectorAll('form');
                    
                    return {
                        modals: modals.length,
                        forms: newForms.length,
                        modalVisible: Array.from(modals).some(modal => 
                            getComputedStyle(modal).display !== 'none' && 
                            getComputedStyle(modal).visibility !== 'hidden'
                        )
                    };
                });

                console.log(`Modals found: ${modalInfo.modals}`);
                console.log(`Modal visible: ${modalInfo.modalVisible}`);
                console.log(`Forms now: ${modalInfo.forms}`);
            }
        }

    } catch (error) {
        console.error('❌ Investigation failed:', error.message);
    } finally {
        await browser.close();
    }
}

investigateBookingButton().catch(console.error);