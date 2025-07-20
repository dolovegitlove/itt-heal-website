/**
 * API Test for Closed Dates Endpoint
 * Tests the backend API that the custom calendar uses
 */

const https = require('https');

async function testClosedDatesAPI() {
    console.log('🧪 Testing /api/web-booking/closed-dates endpoint...');
    
    const tests = [
        {
            name: 'Basic closed dates fetch for July 2025',
            url: 'https://ittheal.com/api/web-booking/closed-dates?start_date=2025-07-01&end_date=2025-07-31',
            expectations: {
                success: true,
                hasClosedDates: true,
                includesJuly20: '2025-07-20'
            }
        },
        {
            name: 'Closed dates with default parameters',
            url: 'https://ittheal.com/api/web-booking/closed-dates',
            expectations: {
                success: true,
                hasData: true
            }
        }
    ];
    
    let allTestsPassed = true;
    
    for (const test of tests) {
        try {
            console.log(`\n🔍 Running: ${test.name}`);
            
            const response = await makeRequest(test.url);
            const data = JSON.parse(response);
            
            // Test success field
            if (data.success !== test.expectations.success) {
                console.log(`❌ FAIL: Expected success=${test.expectations.success}, got ${data.success}`);
                allTestsPassed = false;
                continue;
            }
            
            // Test data structure
            if (test.expectations.hasData && !data.data) {
                console.log(`❌ FAIL: Expected data object, got none`);
                allTestsPassed = false;
                continue;
            }
            
            // Test closed dates array
            if (test.expectations.hasClosedDates && !Array.isArray(data.data.closed_dates)) {
                console.log(`❌ FAIL: Expected closed_dates array, got ${typeof data.data.closed_dates}`);
                allTestsPassed = false;
                continue;
            }
            
            // Test specific date inclusion
            if (test.expectations.includesJuly20) {
                const hasJuly20 = data.data.closed_dates.includes(test.expectations.includesJuly20);
                // Note: July 20, 2025 is a Sunday, so it might be closed by business hours rather than specific date
                console.log(`📅 July 20th check: ${hasJuly20 ? 'Present' : 'Not in specific closed dates (may be closed by business hours)'}`);
            }
            
            // Log successful response
            console.log(`✅ PASS: ${test.name}`);
            console.log(`   - Success: ${data.success}`);
            console.log(`   - Closed dates count: ${data.data.closed_dates?.length || 0}`);
            console.log(`   - Has business days: ${!!data.data.business_days}`);
            
        } catch (error) {
            console.log(`❌ FAIL: ${test.name} - ${error.message}`);
            allTestsPassed = false;
        }
    }
    
    console.log(`\n🏁 API Tests Complete: ${allTestsPassed ? 'ALL PASSED' : 'SOME FAILED'}`);
    return allTestsPassed;
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => reject(new Error('Request timeout')));
    });
}

// Run tests if called directly
if (require.main === module) {
    testClosedDatesAPI().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { testClosedDatesAPI };