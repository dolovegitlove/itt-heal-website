const https = require('https');

async function testApiDirectly() {
    console.log('🔧 Testing payment API directly...');
    
    // Test with main site format
    const mainSiteFormat = {
        amount: 5.00,
        service_type: '60min_massage', 
        client_info: {
            name: 'Test User',
            email: 'test@example.com'
        }
    };
    
    console.log('📤 Testing with main site format:', JSON.stringify(mainSiteFormat, null, 2));
    
    const postData = JSON.stringify(mainSiteFormat);
    
    const options = {
        hostname: 'ittheal.com',
        port: 443,
        path: '/api/web-booking/create-payment-intent',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            console.log(`📡 Status Code: ${res.statusCode}`);
            console.log(`📋 Headers:`, res.headers);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('📥 Response:', data);
                
                if (res.statusCode === 200 || res.statusCode === 201) {
                    console.log('✅ API call successful');
                } else {
                    console.log(`❌ API call failed with status ${res.statusCode}`);
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

testApiDirectly().catch(console.error);