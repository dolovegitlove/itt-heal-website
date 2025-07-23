const https = require('https');

async function createTestBooking() {
    console.log('🚀 Creating test booking for payment UI testing...');
    
    // Create a test booking using the admin API
    const bookingData = {
        client_name: 'Payment Test User',
        client_email: 'paymenttest@example.com', 
        client_phone: '555-0123',
        service_type: '60min',
        scheduled_date: '2025-07-23', // using scheduled_date as expected by API
        scheduled_time: '14:00:00',   // using scheduled_time as expected by API
        payment_method: 'cash', // create as cash first
        payment_status: 'unpaid',
        total_price: 100.00,
        special_requests: 'Test booking for payment UI testing'
    };
    
    console.log('📝 Creating booking with data:', JSON.stringify(bookingData, null, 2));
    
    const postData = JSON.stringify(bookingData);
    
    const options = {
        hostname: 'ittheal.com',
        port: 443,
        path: '/api/admin/bookings',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-admin-access': 'dr-shiffer-emergency-access',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            console.log(`📡 Status Code: ${res.statusCode}`);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('📥 Response:', data);
                
                if (res.statusCode === 200 || res.statusCode === 201) {
                    console.log('✅ Test booking created successfully');
                    try {
                        const result = JSON.parse(data);
                        if (result.booking && result.booking.id) {
                            console.log(`📋 Booking ID: ${result.booking.id}`);
                        }
                    } catch (e) {
                        console.log('Response data parsed successfully');
                    }
                } else {
                    console.log(`❌ Failed to create booking: ${res.statusCode}`);
                }
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Request error:', error);
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

createTestBooking().catch(console.error);