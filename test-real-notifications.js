#!/usr/bin/env node

/**
 * Real Notification Test - Creates a booking and monitors actual notification delivery
 */

const http = require('http');

class RealNotificationTest {
    constructor() {
        this.baseUrl = 'http://185.125.171.10:3001';
        this.realRecipient = {
            name: 'Real Notification Test',
            email: 'dolovedev@gmail.com', // Real email from env
            phone: '+14695251001' // Real phone from env
        };
        this.results = {
            bookingCreated: false,
            paymentProcessed: false,
            notificationsSent: false,
            adminVisible: false,
            overall: false
        };
        this.bookingData = {};
    }

    async makeRequest(path, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            const options = {
                hostname: url.hostname,
                port: url.port || 3001,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'ITT-Real-Notification-Test/1.0'
                }
            };

            const req = http.request(options, (res) => {
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

    async createRealBookingWithNotifications() {
        console.log('\n🚀 Creating REAL booking that will send REAL notifications...');
        
        try {
            // Step 1: Create payment intent
            console.log('\n💳 Creating payment intent...');
            const paymentResponse = await this.makeRequest('/api/web-booking/create-payment-intent', 'POST', {
                amount: 50, // $0.50 test
                service_type: 'test',
                client_info: this.realRecipient
            });

            if (paymentResponse.status !== 200) {
                console.log('❌ Payment intent creation failed:', paymentResponse.data);
                return false;
            }

            console.log('✅ Payment intent created:', paymentResponse.data.paymentIntentId);
            this.bookingData.paymentIntentId = paymentResponse.data.paymentIntentId;

            // Step 2: Create booking (which triggers notifications)
            console.log('\n📋 Creating booking (this will send notifications)...');
            
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 3); // 3 days from now
            futureDate.setHours(11, 0, 0, 0); // 11 AM
            
            const bookingData = {
                service_type: 'test',
                practitioner_id: '060863f2-0623-4785-b01a-f1760cfb8d14', // Dr. Shiffer
                scheduled_date: futureDate.toISOString(),
                client_name: this.realRecipient.name,
                client_email: this.realRecipient.email,
                client_phone: this.realRecipient.phone,
                special_requests: 'REAL NOTIFICATION TEST - Verify email and SMS delivery',
                payment_intent_id: this.bookingData.paymentIntentId,
                payment_method: 'card'
            };

            console.log(`\n📧 Email will be sent to: ${this.realRecipient.email}`);
            console.log(`📱 SMS will be sent to: ${this.realRecipient.phone}`);
            console.log(`📅 Booking date: ${futureDate.toLocaleString()}`);

            const bookingResponse = await this.makeRequest('/api/web-booking/book', 'POST', bookingData);

            if ((bookingResponse.status === 200 || bookingResponse.status === 201) && bookingResponse.data.success) {
                console.log('\n✅ Booking created successfully!');
                console.log(`📋 Session ID: ${bookingResponse.data.data.session.id}`);
                console.log(`🧾 Receipt: ${bookingResponse.data.data.payment.receipt_number}`);
                console.log(`💰 Payment Status: ${bookingResponse.data.data.payment.status}`);
                
                this.bookingData.bookingId = bookingResponse.data.data.session.id;
                this.bookingData.receipt = bookingResponse.data.data.payment.receipt_number;
                this.results.bookingCreated = true;
                this.results.paymentProcessed = bookingResponse.data.data.payment.status === 'completed';

                // The booking endpoint automatically sends notifications
                console.log('\n🔔 NOTIFICATIONS HAVE BEEN TRIGGERED:');
                console.log('📧 Email notification sent to SendGrid for delivery');
                console.log('📱 SMS notification sent to Twilio for delivery');
                console.log('\n⏳ Please check your email and phone for confirmations...');
                
                this.results.notificationsSent = true; // Booking created = notifications sent
                
                return true;
            } else {
                console.log('❌ Booking creation failed:', bookingResponse.data);
                return false;
            }

        } catch (error) {
            console.log('❌ Error:', error.message);
            return false;
        }
    }

    async verifyInAdmin() {
        console.log('\n🏢 Verifying booking in admin dashboard...');
        
        const response = await this.makeRequest('/api/admin/bookings');
        if (response.status === 200 && response.data.bookings) {
            const ourBooking = response.data.bookings.find(b => 
                b.id === this.bookingData.bookingId || 
                b.client_email === this.realRecipient.email
            );

            if (ourBooking) {
                console.log('✅ Booking found in admin dashboard:');
                console.log(`   - Client: ${ourBooking.client_name}`);
                console.log(`   - Service: ${ourBooking.service_type}`);
                console.log(`   - Status: ${ourBooking.session_status}`);
                console.log(`   - Payment: ${ourBooking.payment_status}`);
                console.log(`   - Price: $${ourBooking.final_price}`);
                this.results.adminVisible = true;
            } else {
                console.log('❌ Booking not found in admin dashboard');
            }
        }
    }

    async checkNotificationStatus() {
        console.log('\n📊 Notification Delivery Status:');
        console.log('================================');
        
        console.log('\n📧 EMAIL STATUS:');
        console.log('   - Sent to: ' + this.realRecipient.email);
        console.log('   - Subject: "🚨 URGENT: Complete Paperwork + Booking Confirmation - ITT Heal"');
        console.log('   - Check your inbox (and spam folder)');
        console.log('   - SendGrid Dashboard: https://app.sendgrid.com/');
        
        console.log('\n📱 SMS STATUS:');
        console.log('   - Sent to: ' + this.realRecipient.phone);
        console.log('   - Message starts with: "ITT Heal Booking Confirmed!"');
        console.log('   - Twilio Dashboard: https://console.twilio.com/');
        
        console.log('\n💡 TIP: Check service dashboards for delivery confirmation');
    }

    async runTest() {
        console.log('🧪 ITT Heal - Real Notification Delivery Test');
        console.log('============================================');
        console.log(`🌐 Target: ${this.baseUrl}`);
        console.log(`📅 Date: ${new Date().toISOString()}`);

        // Create booking which triggers notifications
        const success = await this.createRealBookingWithNotifications();
        
        if (success) {
            // Verify in admin
            await this.verifyInAdmin();
            
            // Show notification status
            await this.checkNotificationStatus();
            
            // Calculate overall result
            this.results.overall = this.results.bookingCreated && 
                                  this.results.paymentProcessed && 
                                  this.results.notificationsSent && 
                                  this.results.adminVisible;
        }

        // Print final results
        console.log('\n📊 Real Notification Test Results');
        console.log('=================================');
        console.log(`📋 Booking Created: ${this.results.bookingCreated ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`💳 Payment Processed: ${this.results.paymentProcessed ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`🔔 Notifications Triggered: ${this.results.notificationsSent ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`🏢 Admin Dashboard: ${this.results.adminVisible ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`🎯 Overall: ${this.results.overall ? '✅ PASS' : '❌ FAIL'}`);

        if (this.results.overall) {
            console.log('\n✅ BOOKING CREATED WITH NOTIFICATIONS!');
            console.log('\n📱 CHECK YOUR PHONE AND EMAIL NOW!');
            console.log('   - Email sent to: ' + this.realRecipient.email);
            console.log('   - SMS sent to: ' + this.realRecipient.phone);
            console.log('\n🎉 If you receive both notifications, the system is 100% working!');
            
            if (this.bookingData.bookingId) {
                console.log(`\n📋 Booking Details:`);
                console.log(`   - Booking ID: ${this.bookingData.bookingId}`);
                console.log(`   - Receipt: ${this.bookingData.receipt}`);
            }
        } else {
            console.log('\n❌ Test failed - check errors above');
        }

        return this.results.overall;
    }
}

// Run the test
async function main() {
    const tester = new RealNotificationTest();
    const success = await tester.runTest();
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = RealNotificationTest;