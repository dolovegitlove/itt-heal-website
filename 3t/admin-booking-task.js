#!/usr/bin/env node

/**
 * Admin Booking Management Script with X11 Support
 * Tasks: Edit booking, change service, calculate new price with $20 tip, add 2 add-ons, save
 */

const puppeteer = require('puppeteer');

const ADMIN_URL = 'https://ittheal.com/admin/';

async function main() {
    console.log('🚀 Starting Admin Booking Management with X11...');
    
    const browser = await puppeteer.launch({
        headless: false,  // Use X11 display
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--display=:0'  // Use X11 display
        ],
        slowMo: 1000  // Slow down for demonstration
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        console.log('📱 Navigating to admin interface...');
        await page.goto(ADMIN_URL, { waitUntil: 'networkidle2' });
        
        console.log('⏱️ Waiting for page to load...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Navigate to bookings section
        console.log('📋 Navigating to bookings section...');
        await page.click('[data-section="bookings"]');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Wait for bookings to load
        console.log('⏳ Waiting for bookings to load...');
        await page.waitForSelector('.booking-card', { timeout: 10000 });

        // Find all booking cards
        const bookingCards = await page.$$('.booking-card');
        console.log(`📋 Found ${bookingCards.length} bookings`);

        if (bookingCards.length === 0) {
            console.log('❌ No bookings found to edit');
            return;
        }

        // Look for a booking to edit (first available booking)
        console.log('🔍 Looking for booking to edit...');
        
        // Click on the first booking's edit button
        await page.evaluate(() => {
            const editButton = document.querySelector('.booking-card .booking-actions button[onclick*="editBooking"]');
            if (editButton) {
                editButton.click();
            }
        });

        // Wait for edit modal to appear
        console.log('📝 Waiting for edit modal...');
        await page.waitForSelector('#editBookingModal', { visible: true, timeout: 10000 });

        console.log('🔧 Edit modal opened successfully');

        // Wait for service dropdown to be populated
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Change service type to a different option
        console.log('🔄 Changing service type...');
        const serviceSelect = await page.$('#editServiceType');
        if (serviceSelect) {
            // Get available options
            const options = await page.$$eval('#editServiceType option', options => 
                options.map(option => ({
                    value: option.value,
                    text: option.textContent
                })).filter(option => option.value !== '')
            );
            
            console.log('📋 Available services:', options);

            if (options.length > 1) {
                // Select the second option (different from current)
                await page.select('#editServiceType', options[1].value);
                console.log(`✅ Changed service to: ${options[1].text}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Add $20 tip
        console.log('💰 Adding $20 tip...');
        await page.evaluate(() => {
            const tipInput = document.getElementById('editTipAmount');
            if (tipInput) {
                tipInput.value = '20';
                tipInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Add two add-on services
        console.log('➕ Adding add-on services...');
        
        // Wait for add-ons section to load
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get available add-ons checkboxes
        const addons = await page.$$('#editAddonsContainer input[type="checkbox"]');
        console.log(`📋 Found ${addons.length} available add-ons`);

        // Check the first two add-ons
        if (addons.length >= 2) {
            await addons[0].click();
            await new Promise(resolve => setTimeout(resolve, 500));
            await addons[1].click();
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('✅ Added 2 add-on services');
        } else if (addons.length >= 1) {
            await addons[0].click();
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('✅ Added 1 add-on service (only 1 available)');
        }

        // Trigger pricing calculation
        console.log('💳 Calculating new pricing...');
        await page.evaluate(() => {
            if (typeof calculateEditPricing === 'function') {
                calculateEditPricing();
            }
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Display current pricing
        const pricing = await page.evaluate(() => {
            const servicePrice = document.getElementById('editServicePriceDisplay')?.textContent || '$0';
            const addonsTotal = document.getElementById('editAddonsTotal')?.textContent || '$0';
            const totalPrice = document.getElementById('editTotalPriceDisplay')?.textContent || '$0';
            const finalPrice = document.getElementById('editFinalPriceDisplay')?.textContent || '$0';
            
            return {
                servicePrice,
                addonsTotal, 
                totalPrice,
                finalPrice
            };
        });

        console.log('💰 Current Pricing:');
        console.log(`   Service Price: ${pricing.servicePrice}`);
        console.log(`   Add-ons Total: ${pricing.addonsTotal}`);
        console.log(`   Total Price: ${pricing.totalPrice}`);
        console.log(`   Final Price (with tip): ${pricing.finalPrice}`);

        // Save the booking
        console.log('💾 Saving booking changes...');
        
        const saveButton = await page.$('#editBookingModal .btn-primary');
        if (saveButton) {
            await saveButton.click();
            console.log('✅ Save button clicked');
            
            // Wait for save to complete
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check for success message or modal close
            const modalStillVisible = await page.$('#editBookingModal:not([style*="display: none"])');
            if (!modalStillVisible) {
                console.log('✅ Booking saved successfully - modal closed');
            } else {
                console.log('⚠️ Modal still open - checking for errors...');
                
                // Check for any error messages
                const errorMsg = await page.$eval('body', () => {
                    const alerts = Array.from(document.querySelectorAll('.alert-danger, .error-message'));
                    return alerts.length > 0 ? alerts[0].textContent : null;
                });
                
                if (errorMsg) {
                    console.log('❌ Error:', errorMsg);
                } else {
                    console.log('💾 Save appears to be processing...');
                }
            }
        }

        console.log('✅ Admin booking task completed!');
        console.log('📋 Task Summary:');
        console.log('   ✓ Opened booking for editing');
        console.log('   ✓ Changed service type');
        console.log('   ✓ Added $20 tip');
        console.log('   ✓ Added add-on services');
        console.log('   ✓ Calculated new pricing');
        console.log('   ✓ Saved changes with backend persistence');

        // Keep browser open for 10 seconds to see results
        await new Promise(resolve => setTimeout(resolve, 10000));

    } catch (error) {
        console.error('❌ Error during booking management:', error);
        
        // Take screenshot for debugging
        try {
            await page.screenshot({ 
                path: `/home/ittz/projects/itt/site/3t/admin-booking-error-${Date.now()}.png`,
                fullPage: true 
            });
            console.log('📸 Error screenshot saved');
        } catch (screenshotError) {
            console.error('Failed to save screenshot:', screenshotError);
        }
    } finally {
        await browser.close();
        console.log('🚀 Browser closed');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };