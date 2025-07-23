const { chromium } = require('playwright');

async function deleteAllBookingsManual() {
    console.log('🗑️ Manually deleting all bookings with proper handling...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        // Navigate to admin dashboard
        console.log('📋 Navigating to admin dashboard...');
        await page.goto('https://ittheal.com/3t/admin/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Wait for page to load
        await page.waitForTimeout(5000);
        
        let deletedCount = 0;
        let rounds = 0;
        const maxRounds = 20; // Limit rounds to prevent infinite loop
        
        while (rounds < maxRounds) {
            rounds++;
            console.log(`\n🔄 Round ${rounds} - Checking for bookings...`);
            
            // Refresh the page to get fresh data
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(3000);
            
            // Check for booking cards
            const bookingCards = await page.locator('.booking-card').count();
            console.log(`📅 Found ${bookingCards} booking cards`);
            
            if (bookingCards === 0) {
                console.log('✅ No more bookings found - deletion complete!');
                break;
            }
            
            // Delete each visible booking
            for (let i = 0; i < bookingCards && i < 10; i++) {
                try {
                    console.log(`🗑️ Deleting booking ${i + 1}...`);
                    
                    // Find the delete button on the first booking card
                    const deleteButton = page.locator('.booking-card').nth(i).locator('button').filter({ hasText: /Delete|🗑️/ }).first();
                    
                    const buttonExists = await deleteButton.count() > 0;
                    if (!buttonExists) {
                        console.log(`⚠️ No delete button found on booking ${i + 1}`);
                        continue;
                    }
                    
                    await deleteButton.click();
                    await page.waitForTimeout(1000);
                    
                    // Handle confirmation dialog
                    const confirmButton = page.locator('button').filter({ hasText: /Delete|Confirm|Yes/ }).first();
                    const confirmExists = await confirmButton.count() > 0;
                    
                    if (confirmExists) {
                        await confirmButton.click();
                        deletedCount++;
                        console.log(`✅ Deleted booking ${deletedCount}`);
                    } else {
                        // Handle browser confirm dialog
                        await page.evaluate(() => {
                            // Override window.confirm to auto-accept
                            window.confirm = () => true;
                        });
                        await deleteButton.click();
                        deletedCount++;
                        console.log(`✅ Deleted booking ${deletedCount} (browser dialog)`);
                    }
                    
                    await page.waitForTimeout(1500);
                    
                } catch (error) {
                    console.error(`❌ Error deleting booking ${i + 1}:`, error.message);
                }
            }
            
            console.log(`📊 Round ${rounds} complete - deleted ${deletedCount} total bookings`);
        }
        
        console.log(`\n✅ Final result: Deleted ${deletedCount} bookings in ${rounds} rounds`);
        
        // Take final screenshot
        await page.screenshot({ path: '/home/ittz/projects/itt/site/3t/admin-final-state.png' });
        console.log('📸 Final screenshot saved: admin-final-state.png');
        
    } catch (error) {
        console.error('❌ Error during manual booking deletion:', error.message);
        await page.screenshot({ path: '/home/ittz/projects/itt/site/3t/admin-deletion-error.png' });
    }
    
    await browser.close();
}

// Run the manual deletion
deleteAllBookingsManual().catch(console.error);