#!/usr/bin/env node

/**
 * Debug time slot loading
 */

const puppeteer = require('puppeteer');

async function debugTimeSlots() {
    console.log('🔍 Debugging Time Slot Loading');
    console.log('==============================');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    try {
        await page.goto('https://ittheal.com/d/#booking', { waitUntil: 'networkidle0' });
        console.log('✅ Loaded booking page');

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Select service first
        await page.evaluate(() => {
            document.querySelector('.service-option').click();
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.click('#next-btn');
        console.log('✅ Navigated to date/time selection');

        // Try to set the date manually and trigger the change event
        const result = await page.evaluate(() => {
            const dateInput = document.getElementById('booking-date');
            const timeSelect = document.getElementById('booking-time');
            
            if (!dateInput || !timeSelect) {
                return { error: 'Date or time elements not found' };
            }
            
            // Set the date value
            dateInput.value = '2025-07-01';
            
            // Trigger the change event manually
            dateInput.dispatchEvent(new Event('change', { bubbles: true }));
            
            return {
                dateValue: dateInput.value,
                timeOptionsInitial: timeSelect.options.length,
                loadingSlotsFunction: typeof window.loadTimeSlots === 'function'
            };
        });

        console.log('📅 Date input result:', result);

        // Wait for time slots to load
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check final state
        const finalState = await page.evaluate(() => {
            const timeSelect = document.getElementById('booking-time');
            const loadingDiv = document.getElementById('time-loading');
            
            const options = [];
            for (let i = 0; i < timeSelect.options.length; i++) {
                options.push({
                    value: timeSelect.options[i].value,
                    text: timeSelect.options[i].text
                });
            }
            
            return {
                timeOptionsCount: timeSelect.options.length,
                timeOptions: options,
                loadingVisible: loadingDiv.style.display !== 'none',
                timeSelectDisabled: timeSelect.disabled
            };
        });

        console.log('🕐 Final time slot state:', finalState);

        // Test the API directly in the browser
        const apiTest = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/web-booking/availability/060863f2-0623-4785-b01a-f1760cfb8d14/2025-07-01');
                const data = await response.json();
                return {
                    status: response.status,
                    success: data.success,
                    slotsCount: data.data?.available_slots?.length || 0,
                    firstSlot: data.data?.available_slots?.[0] || null
                };
            } catch (error) {
                return { error: error.message };
            }
        });

        console.log('🔗 API test result:', apiTest);

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    } finally {
        await browser.close();
    }
}

debugTimeSlots().catch(console.error);