const https = require('https');

async function clearAllBookingsAPI() {
    console.log('🗑️ Clearing all bookings via API...');
    
    try {
        // First, get all bookings
        const bookings = await makeAPIRequest('GET', '/api/admin/bookings');
        console.log(`📅 Found ${bookings.length} bookings to delete`);
        
        if (bookings.length === 0) {
            console.log('✅ No bookings to delete');
            return;
        }
        
        let deletedCount = 0;
        
        for (const booking of bookings) {
            try {
                console.log(`🗑️ Deleting booking ${booking.id}...`);
                await makeAPIRequest('DELETE', `/api/bookings/${booking.id}`);
                deletedCount++;
                console.log(`✅ Deleted booking ${booking.id}`);
            } catch (error) {
                console.error(`❌ Failed to delete booking ${booking.id}:`, error.message);
            }
        }
        
        console.log(`✅ Deletion complete! Deleted ${deletedCount} out of ${bookings.length} bookings`);
        
        // Verify deletion
        const remainingBookings = await makeAPIRequest('GET', '/api/admin/bookings');
        console.log(`📊 Remaining bookings: ${remainingBookings.length}`);
        
    } catch (error) {
        console.error('❌ Error during API booking deletion:', error.message);
    }
}

function makeAPIRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'ittheal.com',
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'ITT-Admin-API-Client'
            }
        };
        
        if (data) {
            const jsonData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(jsonData);
        }
        
        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        const parsedData = responseData ? JSON.parse(responseData) : {};
                        resolve(parsedData.bookings || parsedData.data || parsedData);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                    }
                } catch (parseError) {
                    reject(new Error(`Failed to parse response: ${parseError.message}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// Run the API deletion
clearAllBookingsAPI().catch(console.error);