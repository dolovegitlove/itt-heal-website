#!/usr/bin/env node

/**
 * Real Booking Test with Actual Notification Delivery
 * This creates a REAL booking that sends REAL emails and SMS
 */

const https = require('https');
const readline = require('readline');

// Create readline interface for user confirmation
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class RealBookingTest {
    constructor() {
        this.baseUrl = 'https://ittheal.com';
        this.testUser = {
            name: 'Real Test User',
            email: 'dolovedev@gmail.com', // Real email that will receive notification
            phone: '+14695251001' // Real phone that will receive SMS
        };
        this.results = {
            paymentIntent: false,
            bookingCreated: false,
            emailSent: false,
            smsSent: false,
            adminBookingVisible: false,
            adminPaymentVisible: false,
            overall: false
        };
        this.bookingData = {};
    }

    async confirm(message) {
        return new Promise((resolve) => {
            rl.question(`\n${message} (yes/no): `, (answer) => {
                resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
            });
        });
    }

    async makeRequest(path, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'ITT-Real-Booking-Test/1.0'
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(body);
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

    async createRealBooking() {
        console.log('\n📋 Creating REAL Booking with Notifications...');
        
        try {
            // Step 1: Create payment intent
            console.log('\n💳 Step 1: Creating payment intent...');
            const paymentResponse = await this.makeRequest('/api/web-booking/create-payment-intent', 'POST', {
                amount: 50, // $0.50 test booking
                service_type: 'test',
                client_info: this.testUser
            });

            if (paymentResponse.status !== 200 || !paymentResponse.data.clientSecret) {
                console.log('❌ Payment intent creation failed:', paymentResponse.data);
                return false;
            }

            console.log('✅ Payment intent created:', paymentResponse.data.paymentIntentId);
            this.bookingData.paymentIntentId = paymentResponse.data.paymentIntentId;
            this.results.paymentIntent = true;

            // Step 2: Create the booking
            console.log('\n📋 Step 2: Creating booking...');
            
            // Use a random future time
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 7) + 3);
            futureDate.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);
            
            const bookingData = {
                service_type: 'test',
                practitioner_id: '060863f2-0623-4785-b01a-f1760cfb8d14', // Dr. Shiffer
                scheduled_date: futureDate.toISOString(),
                client_name: this.testUser.name,
                client_email: this.testUser.email,
                client_phone: this.testUser.phone,
                special_requests: 'REAL TEST - Verify notifications are actually sent',
                payment_intent_id: this.bookingData.paymentIntentId,
                payment_method: 'card'
            };

            const bookingResponse = await this.makeRequest('/api/web-booking/book', 'POST', bookingData);

            if ((bookingResponse.status === 200 || bookingResponse.status === 201) && bookingResponse.data.success) {
                console.log('✅ Booking created successfully!');
                console.log(`📋 Session ID: ${bookingResponse.data.data.session.id}`);
                console.log(`📅 Scheduled: ${new Date(bookingResponse.data.data.session.scheduled_date).toLocaleString()}`);
                console.log(`🧾 Receipt: ${bookingResponse.data.data.payment.receipt_number}`);
                
                this.bookingData.bookingId = bookingResponse.data.data.session.id;
                this.bookingData.receipt = bookingResponse.data.data.payment.receipt_number;
                this.results.bookingCreated = true;

                console.log('\n🔔 NOTIFICATIONS BEING SENT:');
                console.log(`📧 Email being sent to: ${this.testUser.email}`);
                console.log(`📱 SMS being sent to: ${this.testUser.phone}`);
                
                return true;
            } else {
                console.log('❌ Booking creation failed:', bookingResponse.data);
                return false;
            }

        } catch (error) {
            console.log('❌ Booking creation error:', error.message);
            return false;
        }
    }

    async verifyNotifications() {
        console.log('\n🔍 Step 3: Verifying Notifications...');
        
        console.log('\n⏳ Waiting 10 seconds for notifications to be delivered...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        console.log('\n📧 CHECK YOUR EMAIL:');
        console.log(`   - Email sent to: ${this.testUser.email}`);
        console.log('   - Subject: "🚨 URGENT: Complete Paperwork + Booking Confirmation - ITT Heal"');
        console.log('   - Should contain booking details and paperwork link');
        
        const emailReceived = await this.confirm('Did you receive the booking confirmation EMAIL?');
        this.results.emailSent = emailReceived;

        console.log('\n📱 CHECK YOUR PHONE:');
        console.log(`   - SMS sent to: ${this.testUser.phone}`);
        console.log('   - Should start with "ITT Heal Booking Confirmed!"');
        console.log('   - Should contain date, time, and location');
        
        const smsReceived = await this.confirm('Did you receive the booking confirmation SMS?');
        this.results.smsSent = smsReceived;

        return { emailReceived, smsReceived };
    }

    async verifyAdminDashboard() {
        console.log('\n🏢 Step 4: Verifying Admin Dashboard Updates...');
        
        // Check bookings
        const bookingsResponse = await this.makeRequest('/api/admin/bookings');
        if (bookingsResponse.status === 200 && bookingsResponse.data.bookings) {
            const ourBooking = bookingsResponse.data.bookings.find(booking => 
                booking.client_email === this.testUser.email && 
                booking.id === this.bookingData.bookingId
            );

            if (ourBooking) {
                console.log('✅ Booking visible in admin dashboard');
                console.log(`   - Client: ${ourBooking.client_name}`);
                console.log(`   - Service: ${ourBooking.service_type}`);
                console.log(`   - Status: ${ourBooking.session_status}`);
                console.log(`   - Payment: ${ourBooking.payment_status}`);
                this.results.adminBookingVisible = true;
            } else {
                console.log('❌ Booking not found in admin dashboard');
            }
        }

        // Check payments
        const paymentsResponse = await this.makeRequest('/api/admin/payments');
        if (paymentsResponse.status === 200) {
            console.log('✅ Admin payments endpoint accessible');
            console.log(`   - Total payments in system: ${paymentsResponse.data.count}`);
            console.log(`   - Total revenue: $${paymentsResponse.data.total_revenue}`);
            this.results.adminPaymentVisible = true;
        }
    }

    async runTest() {
        console.log('🧪 ITT Heal - REAL Booking Test with Notification Verification');
        console.log('=============================================================');
        console.log(`🌐 Target: ${this.baseUrl}`);
        console.log(`👤 Real User: ${this.testUser.name}`);
        console.log(`📧 Real Email: ${this.testUser.email}`);
        console.log(`📱 Real Phone: ${this.testUser.phone}`);
        console.log(`📅 Date: ${new Date().toISOString()}`);

        console.log('\n⚠️  WARNING: This will create a REAL booking and send REAL notifications!');
        const proceed = await this.confirm('Do you want to proceed with the real booking test?');
        
        if (!proceed) {
            console.log('\n❌ Test cancelled by user');
            rl.close();
            return false;
        }

        // Create the booking
        const bookingSuccess = await this.createRealBooking();
        if (!bookingSuccess) {
            console.log('\n❌ Booking creation failed - test aborted');
            rl.close();
            return false;
        }

        // Verify notifications
        await this.verifyNotifications();

        // Verify admin dashboard
        await this.verifyAdminDashboard();

        // Calculate results
        this.results.overall = this.results.bookingCreated && 
                              this.results.emailSent && 
                              this.results.smsSent && 
                              this.results.adminBookingVisible;

        // Print results
        console.log('\n📊 Real Booking Test Results');
        console.log('============================');
        console.log(`💳 Payment Intent: ${this.results.paymentIntent ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`📋 Booking Created: ${this.results.bookingCreated ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`📧 Email Delivered: ${this.results.emailSent ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`📱 SMS Delivered: ${this.results.smsSent ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`🏢 Admin Booking Visible: ${this.results.adminBookingVisible ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`💰 Admin Payment System: ${this.results.adminPaymentVisible ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`🎯 Overall: ${this.results.overall ? '✅ PASS' : '❌ FAIL'}`);

        if (this.results.overall) {
            console.log('\n🎉 COMPLETE SUCCESS - 100% VERIFIED!');
            console.log('✅ Real booking created');
            console.log('✅ Real email notification sent and received');
            console.log('✅ Real SMS notification sent and received');
            console.log('✅ Admin dashboard shows booking');
            console.log('✅ Payment system working');
            console.log('\n🚀 System is 100% operational with real notifications!');
        } else {
            console.log('\n⚠️ Some components failed verification');
            if (!this.results.emailSent) console.log('❌ Email notification was not received');
            if (!this.results.smsSent) console.log('❌ SMS notification was not received');
        }

        if (this.bookingData.bookingId) {
            console.log(`\n📋 Real Booking Created:`);
            console.log(`   - Booking ID: ${this.bookingData.bookingId}`);
            console.log(`   - Receipt: ${this.bookingData.receipt}`);
            console.log(`   - Client: ${this.testUser.name}`);
        }

        rl.close();
        return this.results.overall;
    }
}

// Run the test
async function main() {
    const tester = new RealBookingTest();
    const success = await tester.runTest();
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = RealBookingTest;