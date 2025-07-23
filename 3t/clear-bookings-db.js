const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'ittm_user',
    user: 'ittm_user',
    password: 'your_secure_password_2024!',
});

async function clearAllBookingsDB() {
    console.log('🗑️ Clearing all bookings from database...');
    
    try {
        // Connect to database
        const client = await pool.connect();
        
        try {
            // Get count of bookings before deletion
            const countResult = await client.query('SELECT COUNT(*) FROM bookings');
            const totalBookings = parseInt(countResult.rows[0].count);
            console.log(`📅 Found ${totalBookings} bookings to delete`);
            
            if (totalBookings === 0) {
                console.log('✅ No bookings to delete');
                return;
            }
            
            // Delete all bookings
            const deleteResult = await client.query('DELETE FROM bookings');
            console.log(`🗑️ Deleted ${deleteResult.rowCount} bookings`);
            
            // Reset the sequence if it exists
            try {
                await client.query('ALTER SEQUENCE bookings_id_seq RESTART WITH 1');
                console.log('🔄 Reset booking ID sequence to 1');
            } catch (seqError) {
                console.log('ℹ️ No booking ID sequence to reset');
            }
            
            // Verify deletion
            const verifyResult = await client.query('SELECT COUNT(*) FROM bookings');
            const remainingBookings = parseInt(verifyResult.rows[0].count);
            console.log(`📊 Remaining bookings: ${remainingBookings}`);
            
            if (remainingBookings === 0) {
                console.log('✅ All bookings successfully deleted!');
            } else {
                console.log(`⚠️ ${remainingBookings} bookings remain`);
            }
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error during database booking deletion:', error.message);
    } finally {
        await pool.end();
    }
}

// Run the database deletion
clearAllBookingsDB().catch(console.error);