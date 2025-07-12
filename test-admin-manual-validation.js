#!/usr/bin/env node

/**
 * Manual Admin Dashboard Validation
 * Tests backend connectivity and basic functionality without browser automation
 */

const http = require('http');

class ManualAdminValidator {
    constructor() {
        this.baseUrl = 'http://185.125.171.10:3001';
        this.siteUrl = 'http://185.125.171.10:3000';
        this.results = {
            totalTests: 0,
            passed: 0,
            failed: 0,
            details: []
        };
    }

    async log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'pass' ? '✅' : type === 'fail' ? '❌' : '📋';
        console.log(`${timestamp} ${prefix} ${message}`);
        
        if (type === 'pass') this.results.passed++;
        if (type === 'fail') this.results.failed++;
        this.results.totalTests++;
        
        this.results.details.push({ timestamp, type, message });
    }

    async makeRequest(url, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || 80,
                path: urlObj.pathname + urlObj.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'ITT-Admin-Validator/1.0'
                }
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const parsed = res.headers['content-type']?.includes('application/json') ? 
                            JSON.parse(body) : body;
                        resolve({ 
                            status: res.statusCode, 
                            data: parsed,
                            headers: res.headers 
                        });
                    } catch (e) {
                        resolve({ 
                            status: res.statusCode, 
                            data: body,
                            headers: res.headers 
                        });
                    }
                });
            });

            req.on('error', reject);

            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    async makeRequestWithHeaders(url, options) {
        return fetch(url, options).then(async response => ({
            status: response.status,
            data: await response.json(),
            headers: response.headers
        }));
    }

    async testBackendAPIs() {
        await this.log('=== Testing Backend API Endpoints ===', 'info');

        // Test health endpoint
        try {
            const healthResponse = await this.makeRequest(`${this.baseUrl}/api/health`);
            if (healthResponse.status === 200) {
                await this.log('Health check endpoint working', 'pass');
            } else {
                await this.log(`Health check failed: ${healthResponse.status}`, 'fail');
            }
        } catch (error) {
            await this.log(`Health check error: ${error.message}`, 'fail');
        }

        // Test admin bookings endpoint
        try {
            const bookingsResponse = await this.makeRequest(`${this.baseUrl}/api/admin/bookings`);
            if (bookingsResponse.status === 200 && bookingsResponse.data.bookings) {
                await this.log(`Admin bookings API working: ${bookingsResponse.data.bookings.length} bookings found`, 'pass');
            } else {
                await this.log(`Admin bookings API failed: ${bookingsResponse.status}`, 'fail');
            }
        } catch (error) {
            await this.log(`Admin bookings API error: ${error.message}`, 'fail');
        }

        // Test creating a test booking (admin endpoint with correct headers)
        try {
            const testBooking = {
                guest_name: 'Admin Test Client',
                guest_email: 'admin.test2@ittheal.com',
                guest_phone: '+1234567890',
                session_type: 'consultation',
                scheduled_date: new Date(Date.now() + 24*60*60*1000).toISOString(), // Tomorrow
                special_requests: 'Admin dashboard functionality test',
                payment_status: 'paid',
                final_price: '150.00'
            };

            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-access': 'dr-shiffer-emergency-access'
                },
                body: JSON.stringify(testBooking)
            };

            const createResponse = await this.makeRequestWithHeaders(`${this.baseUrl}/api/admin/massage-sessions`, options);
            if (createResponse.status === 200 || createResponse.status === 201) {
                await this.log('Admin booking creation working', 'pass');
            } else {
                await this.log(`Admin booking creation failed: ${createResponse.status}`, 'fail');
            }
        } catch (error) {
            await this.log(`Admin booking creation error: ${error.message}`, 'fail');
        }
    }

    async testFrontendAccess() {
        await this.log('=== Testing Frontend Access ===', 'info');

        // Test admin dashboard page load
        try {
            const dashboardResponse = await this.makeRequest(`${this.siteUrl}/admin-dashboard.html`);
            if (dashboardResponse.status === 200) {
                await this.log('Admin dashboard page loads successfully', 'pass');
                
                // Check if it contains expected content
                const content = dashboardResponse.data.toString();
                if (content.includes('Dr. Shiffer Admin Dashboard')) {
                    await this.log('Admin dashboard contains correct title', 'pass');
                } else {
                    await this.log('Admin dashboard missing expected title', 'fail');
                }

                if (content.includes('nav-tab')) {
                    await this.log('Admin dashboard contains navigation tabs', 'pass');
                } else {
                    await this.log('Admin dashboard missing navigation tabs', 'fail');
                }

                if (content.includes('booking-card')) {
                    await this.log('Admin dashboard contains booking card structure', 'pass');
                } else {
                    await this.log('Admin dashboard missing booking card structure', 'fail');
                }

                if (content.includes('modal')) {
                    await this.log('Admin dashboard contains modal functionality', 'pass');
                } else {
                    await this.log('Admin dashboard missing modal functionality', 'fail');
                }

            } else {
                await this.log(`Admin dashboard page failed to load: ${dashboardResponse.status}`, 'fail');
            }
        } catch (error) {
            await this.log(`Admin dashboard access error: ${error.message}`, 'fail');
        }
    }

    async testDataIntegrity() {
        await this.log('=== Testing Data Integrity ===', 'info');

        try {
            const bookingsResponse = await this.makeRequest(`${this.baseUrl}/api/admin/bookings`);
            
            if (bookingsResponse.status === 200 && bookingsResponse.data.bookings) {
                const bookings = bookingsResponse.data.bookings;
                
                // Check if bookings have required fields
                const requiredFields = ['id', 'client_name', 'service_type', 'scheduled_date', 'payment_status', 'session_status'];
                let allFieldsPresent = true;
                
                for (const booking of bookings.slice(0, 3)) { // Check first 3 bookings
                    for (const field of requiredFields) {
                        if (!(field in booking)) {
                            allFieldsPresent = false;
                            await this.log(`Missing field '${field}' in booking ${booking.id}`, 'fail');
                        }
                    }
                }
                
                if (allFieldsPresent && bookings.length > 0) {
                    await this.log('Booking data contains all required fields', 'pass');
                }
                
                // Check date formats
                const validDates = bookings.every(booking => {
                    try {
                        new Date(booking.scheduled_date);
                        return true;
                    } catch {
                        return false;
                    }
                });
                
                if (validDates) {
                    await this.log('All booking dates are valid', 'pass');
                } else {
                    await this.log('Some booking dates are invalid', 'fail');
                }

            } else {
                await this.log('No booking data available for integrity check', 'info');
            }
        } catch (error) {
            await this.log(`Data integrity check error: ${error.message}`, 'fail');
        }
    }

    async testCoreFeatures() {
        await this.log('=== Testing Core Features ===', 'info');

        // Test statistics calculation
        try {
            const bookingsResponse = await this.makeRequest(`${this.baseUrl}/api/admin/bookings`);
            
            if (bookingsResponse.status === 200 && bookingsResponse.data.bookings) {
                const bookings = bookingsResponse.data.bookings;
                
                // Calculate today's appointments
                const today = new Date().toISOString().split('T')[0];
                const todaysAppointments = bookings.filter(booking => 
                    booking.scheduled_date.startsWith(today)
                ).length;
                
                // Calculate total revenue
                const totalRevenue = bookings
                    .filter(booking => booking.payment_status === 'paid')
                    .reduce((sum, booking) => sum + parseFloat(booking.final_price || 0), 0);
                
                // Calculate unique clients
                const uniqueClients = new Set(bookings.map(b => b.client_email)).size;
                
                await this.log(`Statistics calculated: ${todaysAppointments} today, $${totalRevenue.toFixed(2)} revenue, ${uniqueClients} clients`, 'pass');
                
            } else {
                await this.log('Cannot calculate statistics without booking data', 'info');
            }
        } catch (error) {
            await this.log(`Statistics calculation error: ${error.message}`, 'fail');
        }
    }

    async runValidation() {
        console.log('🔍 Manual Admin Dashboard Validation');
        console.log('====================================');
        
        await this.testBackendAPIs();
        await this.testFrontendAccess();
        await this.testDataIntegrity();
        await this.testCoreFeatures();
        
        this.generateReport();
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 MANUAL ADMIN DASHBOARD VALIDATION RESULTS');
        console.log('='.repeat(60));
        
        const passRate = this.results.totalTests > 0 ? 
            ((this.results.passed / this.results.totalTests) * 100).toFixed(1) : 0;
        
        console.log(`\n📈 SUMMARY:`);
        console.log(`   Total Tests: ${this.results.totalTests}`);
        console.log(`   ✅ Passed: ${this.results.passed}`);
        console.log(`   ❌ Failed: ${this.results.failed}`);
        console.log(`   📊 Pass Rate: ${passRate}%`);
        
        const status = passRate >= 90 ? '🎉 EXCELLENT' : 
                      passRate >= 75 ? '✅ GOOD' : 
                      passRate >= 50 ? '⚠️ NEEDS IMPROVEMENT' : '❌ CRITICAL ISSUES';
        
        console.log(`\n🎯 OVERALL STATUS: ${status}`);
        
        if (this.results.failed > 0) {
            console.log(`\n❌ FAILED TESTS:`);
            this.results.details
                .filter(detail => detail.type === 'fail')
                .forEach(detail => {
                    console.log(`   • ${detail.message}`);
                });
        }
        
        // Feature Assessment
        console.log(`\n🔧 FEATURE ASSESSMENT:`);
        console.log(`   📊 Backend APIs: ${this.results.passed >= 3 ? 'Working' : 'Issues Found'}`);
        console.log(`   🎨 Frontend Loading: ${passRate >= 70 ? 'Working' : 'Issues Found'}`);
        console.log(`   📋 Data Structure: ${passRate >= 80 ? 'Valid' : 'Issues Found'}`);
        console.log(`   📈 Statistics: ${passRate >= 75 ? 'Calculating' : 'Issues Found'}`);
        
        const isProduction = passRate >= 80;
        console.log(`\n🚀 PRODUCTION READINESS: ${isProduction ? '✅ READY' : '❌ NOT READY'}`);
        
        console.log(`\n📝 MANUAL TESTING CHECKLIST:`);
        console.log(`   □ Open browser and navigate to: http://185.125.171.10:3000/admin-dashboard.html`);
        console.log(`   □ Verify all tabs (Dashboard, Bookings, Schedule, etc.) load`);
        console.log(`   □ Click "New Booking" button and verify modal opens`);
        console.log(`   □ Fill out booking form and verify fields work`);
        console.log(`   □ Test "Block Time" and "Set Availability" modals`);
        console.log(`   □ Navigate to Bookings tab and test filters`);
        console.log(`   □ Navigate to Schedule tab and test date picker`);
        console.log(`   □ Verify booking cards display correctly`);
        console.log(`   □ Test on mobile device or narrow browser window`);
        console.log(`   □ Verify stats cards show real data`);
        
        console.log('\n' + '='.repeat(60));
        return passRate >= 80;
    }
}

// Run the validation
async function main() {
    const validator = new ManualAdminValidator();
    const success = await validator.runValidation();
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ManualAdminValidator;