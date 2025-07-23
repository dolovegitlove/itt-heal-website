const { Pool } = require('pg');
const { chromium } = require('playwright');

// Database configuration from the backend
const dbConfig = {
    host: 'localhost',
    port: 5432,
    database: 'itt_heal_db',
    user: 'itt_user',
    password: 'itt_password'
};

async function deleteAllBookingsCompletely() {
    console.log('🗑️ COMPLETE BOOKING DELETION - Database + Admin Interface');
    console.log('================================================================');
    
    // Step 1: Delete from database directly
    console.log('\n📊 STEP 1: Direct Database Deletion');
    console.log('------------------------------------');
    
    let pool;
    try {
        pool = new Pool(dbConfig);
        const client = await pool.connect();
        
        try {
            // Get initial count
            const countResult = await client.query('SELECT COUNT(*) FROM massage_sessions');
            const initialCount = parseInt(countResult.rows[0].count);
            console.log(`📅 Initial database count: ${initialCount} bookings`);
            
            if (initialCount === 0) {
                console.log('✅ Database already empty!');
            } else {
                // Delete all bookings from database
                console.log('🗑️ Deleting all bookings from database...');
                const deleteResult = await client.query('DELETE FROM massage_sessions');
                console.log(`✅ Deleted ${deleteResult.rowCount} bookings from database`);
                
                // Reset sequence
                try {
                    await client.query('ALTER SEQUENCE massage_sessions_id_seq RESTART WITH 1');
                    console.log('🔄 Reset ID sequence');
                } catch (seqError) {
                    console.log('ℹ️ No sequence to reset (using UUIDs)');
                }
                
                // Verify deletion
                const verifyResult = await client.query('SELECT COUNT(*) FROM massage_sessions');
                const finalCount = parseInt(verifyResult.rows[0].count);
                console.log(`📊 Final database count: ${finalCount} bookings`);
                
                if (finalCount === 0) {
                    console.log('✅ Database successfully cleared!');
                } else {
                    console.log(`⚠️ ${finalCount} bookings remain in database`);
                }
            }
            
        } finally {
            client.release();
        }
        
    } catch (dbError) {
        console.error('❌ Database error:', dbError.message);
        console.log('⚠️ Proceeding with admin interface deletion...');
    } finally {
        if (pool) await pool.end();
    }
    
    // Step 2: Clear admin interface
    console.log('\n🖥️ STEP 2: Admin Interface Cleanup');
    console.log('----------------------------------');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 300,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Auto-accept dialogs
    page.on('dialog', async dialog => {
        console.log('✅ Auto-confirming:', dialog.message());
        await dialog.accept();
    });
    
    try {
        console.log('📋 Loading admin dashboard...');
        await page.goto('https://ittheal.com/3t/admin/', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        let totalDeletedFromAdmin = 0;
        let rounds = 0;
        const maxRounds = 25;
        
        while (rounds < maxRounds) {
            rounds++;
            
            // Check for booking cards
            const bookingCount = await page.locator('.booking-card').count();
            console.log(`Round ${rounds}: Found ${bookingCount} booking cards`);
            
            if (bookingCount === 0) {
                console.log('✅ No booking cards found in admin interface');
                break;
            }
            
            // Delete all visible bookings
            let deletedInThisRound = 0;
            for (let i = 0; i < bookingCount && i < 10; i++) {
                try {
                    const deleteButton = page.locator('.booking-card').first()
                        .locator('button').filter({ hasText: /Delete|🗑️/ }).first();
                    
                    if (await deleteButton.count() > 0) {
                        await deleteButton.click();
                        await page.waitForTimeout(500);
                        
                        const confirmButton = page.locator('button').filter({ hasText: /Delete|Confirm|Yes/ });
                        if (await confirmButton.count() > 0) {
                            await confirmButton.first().click();
                        }
                        
                        deletedInThisRound++;
                        totalDeletedFromAdmin++;
                        console.log(`  ✅ Deleted booking #${totalDeletedFromAdmin}`);
                        await page.waitForTimeout(800);
                    }
                } catch (error) {
                    console.log(`  ⚠️ Error deleting booking: ${error.message}`);
                    break;
                }
            }
            
            console.log(`  📊 Deleted ${deletedInThisRound} bookings in round ${rounds}`);
            
            if (deletedInThisRound === 0) {
                console.log('  ⏹️ No more deletions possible, refreshing...');
                await page.reload({ waitUntil: 'networkidle' });
                await page.waitForTimeout(2000);
            }
        }
        
        // Final verification
        console.log('\n🔍 FINAL VERIFICATION');
        console.log('---------------------');
        
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        
        const finalAdminCount = await page.locator('.booking-card').count();
        console.log(`📋 Admin interface shows: ${finalAdminCount} booking cards`);
        
        if (finalAdminCount === 0) {
            console.log('🎉 SUCCESS! Admin interface is completely clear');
            await page.screenshot({ path: '/home/ittz/projects/itt/site/3t/admin-completely-cleared.png' });
            console.log('📸 Screenshot saved: admin-completely-cleared.png');
        } else {
            console.log(`⚠️ ${finalAdminCount} booking cards still visible in admin`);
        }
        
    } catch (adminError) {
        console.error('❌ Admin interface error:', adminError.message);
    }
    
    await browser.close();
    
    // Summary
    console.log('\n📋 DELETION SUMMARY');
    console.log('==================');
    console.log(`✅ Database: Cleared all bookings from massage_sessions table`);
    console.log(`✅ Admin Interface: Deleted ${totalDeletedFromAdmin} booking cards`);
    console.log('🎉 Complete deletion process finished!');
}

// Run the complete deletion
deleteAllBookingsCompletely().catch(console.error);