#!/usr/bin/env node

/**
 * Verify Notifications Test - Check logs and system to confirm notifications are sent
 */

const https = require('https');
const { exec } = require('child_process');

class NotificationVerificationTest {
    constructor() {
        this.baseUrl = 'https://ittheal.com';
        this.results = {
            bookingCreated: false,
            emailQueued: false,
            smsQueued: false,
            emailServiceActive: false,
            smsServiceActive: false,
            adminVisible: false,
            overall: false
        };
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
                    'User-Agent': 'ITT-Notification-Verification/1.0'
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

    async checkLogs(pattern) {
        return new Promise((resolve) => {
            exec(`sudo journalctl -u itt-heal-backend -n 100 | grep -i "${pattern}" | tail -5`, (error, stdout) => {
                if (error) {
                    resolve('');
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    }

    async createTestBooking() {
        console.log('\n📋 Creating test booking to verify notification flow...');
        
        try {
            // Create payment intent
            const paymentResponse = await this.makeRequest('/api/web-booking/create-payment-intent', 'POST', {
                amount: 50,
                service_type: 'test',
                client_info: {
                    name: 'Notification Test User',
                    email: 'notificationtest@example.com',
                    phone: '+1234567890'
                }
            });

            if (paymentResponse.status !== 200) {
                console.log('❌ Payment intent creation failed');
                return null;
            }

            const paymentIntentId = paymentResponse.data.paymentIntentId;
            console.log(`✅ Payment intent created: ${paymentIntentId}`);

            // Create booking
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 5);
            futureDate.setHours(14, 0, 0, 0);
            
            const bookingResponse = await this.makeRequest('/api/web-booking/book', 'POST', {
                service_type: 'test',
                practitioner_id: '060863f2-0623-4785-b01a-f1760cfb8d14',
                scheduled_date: futureDate.toISOString(),
                client_name: 'Notification Test User',
                client_email: 'notificationtest@example.com',
                client_phone: '+1234567890',
                special_requests: 'Testing notification delivery system',
                payment_intent_id: paymentIntentId,
                payment_method: 'card'
            });

            if ((bookingResponse.status === 200 || bookingResponse.status === 201) && bookingResponse.data.success) {
                console.log('✅ Test booking created successfully');
                this.results.bookingCreated = true;
                return {
                    bookingId: bookingResponse.data.data.session.id,
                    receipt: bookingResponse.data.data.payment.receipt_number
                };
            } else {
                console.log('❌ Booking creation failed:', bookingResponse.data);
                return null;
            }

        } catch (error) {
            console.log('❌ Error creating test booking:', error.message);
            return null;
        }
    }

    async verifyEmailService() {
        console.log('\n📧 Verifying Email Service...');
        
        // Check if SendGrid is configured
        const emailLogs = await this.checkLogs('email.*sent\\|sendgrid\\|booking confirmation email');
        
        if (emailLogs) {
            console.log('✅ Email service activity detected in logs');
            console.log('📄 Recent email logs:', emailLogs.substring(0, 200) + '...');
            this.results.emailServiceActive = true;
        } else {
            console.log('⚠️ No recent email activity in logs');
        }

        // Check SendGrid configuration
        const sgConfigured = process.env.SENDGRID_API_KEY && !process.env.SENDGRID_API_KEY.includes('disabled');
        if (sgConfigured) {
            console.log('✅ SendGrid API key is configured');
        } else {
            console.log('❌ SendGrid API key not properly configured');
        }

        return sgConfigured;
    }

    async verifySMSService() {
        console.log('\n📱 Verifying SMS Service...');
        
        // Check if Twilio is configured
        const smsLogs = await this.checkLogs('sms.*sent\\|twilio\\|booking confirmation sms');
        
        if (smsLogs) {
            console.log('✅ SMS service activity detected in logs');
            console.log('📄 Recent SMS logs:', smsLogs.substring(0, 200) + '...');
            this.results.smsServiceActive = true;
        } else {
            console.log('⚠️ No recent SMS activity in logs');
        }

        // Check Twilio configuration
        const twilioConfigured = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;
        if (twilioConfigured) {
            console.log('✅ Twilio credentials are configured');
        } else {
            console.log('❌ Twilio credentials not properly configured');
        }

        return twilioConfigured;
    }

    async verifyNotificationQueue() {
        console.log('\n🔍 Checking notification queue in last booking...');
        
        // Check recent booking logs for notification attempts
        const bookingLogs = await this.checkLogs('booking.*created\\|notification\\|email\\|sms');
        
        if (bookingLogs.includes('email') || bookingLogs.includes('Email')) {
            console.log('✅ Email notification queued in recent bookings');
            this.results.emailQueued = true;
        }
        
        if (bookingLogs.includes('sms') || bookingLogs.includes('SMS')) {
            console.log('✅ SMS notification queued in recent bookings');
            this.results.smsQueued = true;
        }
    }

    async checkRecentBookings() {
        console.log('\n🏢 Checking recent bookings in admin...');
        
        const response = await this.makeRequest('/api/admin/bookings');
        if (response.status === 200 && response.data.bookings) {
            const recentBookings = response.data.bookings.slice(0, 5);
            
            console.log(`✅ Found ${response.data.count} bookings in system`);
            console.log('\n📋 Recent bookings:');
            
            recentBookings.forEach((booking, index) => {
                console.log(`${index + 1}. ${booking.client_name || 'Unknown'} - ${booking.service_type} - ${booking.payment_status}`);
                if (booking.client_email) {
                    console.log(`   📧 Email: ${booking.client_email}`);
                }
                if (booking.client_phone) {
                    console.log(`   📱 Phone: ${booking.client_phone}`);
                }
            });
            
            this.results.adminVisible = true;
        }
    }

    async runVerification() {
        console.log('🧪 ITT Heal - Notification System Verification');
        console.log('=============================================');
        console.log(`🌐 Target: ${this.baseUrl}`);
        console.log(`📅 Date: ${new Date().toISOString()}`);

        // Create a test booking
        const bookingData = await this.createTestBooking();
        
        if (bookingData) {
            console.log(`\n📋 Test Booking Details:`);
            console.log(`   - Booking ID: ${bookingData.bookingId}`);
            console.log(`   - Receipt: ${bookingData.receipt}`);
            
            // Wait for notifications to process
            console.log('\n⏳ Waiting 5 seconds for notification processing...');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // Verify services
        await this.verifyEmailService();
        await this.verifySMSService();
        await this.verifyNotificationQueue();
        await this.checkRecentBookings();

        // Calculate overall result
        this.results.overall = this.results.bookingCreated && 
                              (this.results.emailServiceActive || this.results.emailQueued) &&
                              (this.results.smsServiceActive || this.results.smsQueued) &&
                              this.results.adminVisible;

        // Print results
        console.log('\n📊 Notification System Verification Results');
        console.log('==========================================');
        console.log(`📋 Test Booking Created: ${this.results.bookingCreated ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`📧 Email Service Active: ${this.results.emailServiceActive ? '✅ PASS' : '⚠️ CHECK LOGS'}`);
        console.log(`📧 Email Queued: ${this.results.emailQueued ? '✅ PASS' : '⚠️ NOT DETECTED'}`);
        console.log(`📱 SMS Service Active: ${this.results.smsServiceActive ? '✅ PASS' : '⚠️ CHECK LOGS'}`);
        console.log(`📱 SMS Queued: ${this.results.smsQueued ? '✅ PASS' : '⚠️ NOT DETECTED'}`);
        console.log(`🏢 Admin Dashboard: ${this.results.adminVisible ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`🎯 Overall: ${this.results.overall ? '✅ PASS' : '❌ NEEDS ATTENTION'}`);

        if (!this.results.overall) {
            console.log('\n⚠️ NOTIFICATION SYSTEM ISSUES DETECTED:');
            if (!this.results.emailServiceActive && !this.results.emailQueued) {
                console.log('❌ Email notifications may not be working properly');
                console.log('   - Check SendGrid configuration');
                console.log('   - Verify SENDGRID_API_KEY is set correctly');
            }
            if (!this.results.smsServiceActive && !this.results.smsQueued) {
                console.log('❌ SMS notifications may not be working properly');
                console.log('   - Check Twilio configuration');
                console.log('   - Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set');
            }
        } else {
            console.log('\n✅ Notification system appears to be configured correctly');
            console.log('📝 Note: To verify actual delivery, check:');
            console.log('   - SendGrid dashboard for email delivery status');
            console.log('   - Twilio dashboard for SMS delivery status');
        }

        return this.results.overall;
    }
}

// Run the test
async function main() {
    const tester = new NotificationVerificationTest();
    const success = await tester.runVerification();
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = NotificationVerificationTest;