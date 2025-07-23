const { chromium } = require('playwright');

async function deleteAllBookingsComplete() {
    console.log('🗑️ Starting complete booking deletion process...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Override dialog handling
    page.on('dialog', async dialog => {
        console.log('✅ Auto-confirming dialog:', dialog.message());
        await dialog.accept();
    });
    
    try {
        // Navigate to admin dashboard
        console.log('📋 Navigating to admin dashboard...');
        await page.goto('https://ittheal.com/3t/admin/', { waitUntil: 'networkidle', timeout: 30000 });
        
        // Wait for initial load
        await page.waitForTimeout(3000);
        
        let totalDeleted = 0;
        let consecutiveEmptyRounds = 0;
        const maxEmptyRounds = 3;
        
        while (consecutiveEmptyRounds < maxEmptyRounds) {
            console.log(`\n🔄 Checking for bookings (deleted so far: ${totalDeleted})...`);
            
            // Check current booking count
            const bookingCards = await page.locator('.booking-card').count();
            console.log(`📅 Found ${bookingCards} booking cards on current page`);
            
            if (bookingCards === 0) {
                consecutiveEmptyRounds++;
                console.log(`⏳ No bookings found (${consecutiveEmptyRounds}/${maxEmptyRounds} checks)`);
                
                // Try refreshing to check if more bookings load
                await page.reload({ waitUntil: 'networkidle' });
                await page.waitForTimeout(2000);
                continue;
            }
            
            consecutiveEmptyRounds = 0; // Reset counter when bookings found
            
            // Delete all visible bookings
            let deletedInThisRound = 0;
            
            while (true) {
                // Re-check booking count after each deletion
                const currentBookings = await page.locator('.booking-card').count();
                if (currentBookings === 0) break;
                
                console.log(`🎯 Attempting to delete booking (${currentBookings} remaining on page)...`);
                
                // Find the first delete button
                const deleteButton = await page.locator('.booking-card').first()
                    .locator('button').filter({ hasText: /Delete|🗑️/ }).first();
                
                if (await deleteButton.count() === 0) {
                    console.log('⚠️ No delete button found');
                    break;
                }
                
                // Click delete button
                await deleteButton.click();
                console.log('🖱️ Clicked delete button');
                
                // Wait for any modal or confirmation
                await page.waitForTimeout(1000);
                
                // Check for confirmation button in modal
                const confirmButton = await page.locator('button').filter({ hasText: /Delete|Confirm|Yes/ });
                if (await confirmButton.count() > 0) {
                    await confirmButton.first().click();
                    console.log('✅ Clicked confirmation button');
                }
                
                // Wait for deletion to process
                await page.waitForTimeout(1500);
                
                deletedInThisRound++;
                totalDeleted++;
                console.log(`✅ Deleted booking #${totalDeleted}`);
                
                // Check if we need to wait for more bookings to load
                if (deletedInThisRound % 3 === 0) {
                    console.log('⏳ Waiting for next batch to load...');
                    await page.waitForTimeout(2000);
                }
            }
            
            console.log(`📊 Deleted ${deletedInThisRound} bookings in this round`);
            
            // Refresh to load more bookings
            console.log('🔄 Refreshing to check for more bookings...');
            await page.reload({ waitUntil: 'networkidle' });
            await page.waitForTimeout(2000);
        }
        
        console.log(`\n✅ DELETION COMPLETE!`);
        console.log(`📊 Total bookings deleted: ${totalDeleted}`);
        console.log('🎉 All bookings have been cleared from the system');
        
        // Take final screenshot
        await page.screenshot({ path: '/home/ittz/projects/itt/site/3t/admin-all-bookings-deleted.png' });
        console.log('📸 Final screenshot saved: admin-all-bookings-deleted.png');
        
    } catch (error) {
        console.error('❌ Error during booking deletion:', error.message);
        await page.screenshot({ path: '/home/ittz/projects/itt/site/3t/admin-deletion-error.png' });
    }
    
    await browser.close();
}

// Run the complete deletion
deleteAllBookingsComplete().catch(console.error);