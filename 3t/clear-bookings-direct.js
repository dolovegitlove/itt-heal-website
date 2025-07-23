const http = require('http');

async function clearBookingsDirectly() {
    console.log('🗑️ Attempting to clear bookings via direct backend access...');
    
    try {
        // Try to access the backend directly on localhost:3000
        const bookings = await makeLocalAPIRequest('GET', '/api/bookings');
        console.log(`📅 Found ${bookings.length || 0} bookings`);
        
        if (!bookings || bookings.length === 0) {
            console.log('✅ No bookings found or already cleared');
            return;
        }
        
        let deletedCount = 0;
        
        // Try to delete each booking
        for (const booking of bookings) {
            try {
                console.log(`🗑️ Deleting booking ID: ${booking.id}...`);
                await makeLocalAPIRequest('DELETE', `/api/bookings/${booking.id}`);
                deletedCount++;
                console.log(`✅ Deleted booking ${booking.id}`);
            } catch (error) {
                console.error(`❌ Failed to delete booking ${booking.id}:`, error.message);
            }
        }
        
        console.log(`✅ Completed! Deleted ${deletedCount} out of ${bookings.length} bookings`);
        
        // Verify by checking remaining bookings
        const remaining = await makeLocalAPIRequest('GET', '/api/bookings');
        console.log(`📊 Remaining bookings: ${remaining.length || 0}`);
        
    } catch (error) {
        console.error('❌ Error during direct backend deletion:', error.message);
        
        // Try alternative endpoints
        console.log('🔄 Trying alternative admin endpoints...');
        try {
            const adminBookings = await makeLocalAPIRequest('GET', '/api/admin/bookings');
            console.log(`📋 Admin endpoint found ${adminBookings.length || 0} bookings`);
        } catch (adminError) {
            console.error('❌ Admin endpoint also failed:', adminError.message);
        }
    }
}

function makeLocalAPIRequest(method, path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        const response = data ? JSON.parse(data) : {};
                        // Handle different response formats
                        resolve(response.bookings || response.data || response || []);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                } catch (parseError) {
                    console.log('Raw response:', data);
                    reject(new Error(`Parse error: ${parseError.message}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.end();
    });
}

// Run the direct deletion
clearBookingsDirectly().catch(console.error);