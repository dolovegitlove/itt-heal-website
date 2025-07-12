#!/usr/bin/env node

/**
 * Backend Endpoints Test - Verify all APIs work before UI testing
 */

const https = require('https');
const querystring = require('querystring');

class BackendEndpointTest {
  constructor() {
    this.baseUrl = 'https://ittheal.com';
    this.results = {
      paymentIntent: false,
      emailService: false,
      smsService: false,
      adminBookings: false,
      adminPayments: false,
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
          'User-Agent': 'ITT-Backend-Test/1.0'
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

  async testPaymentIntent() {
    console.log('\n💳 Testing Payment Intent Creation...');

    try {
      const response = await this.makeRequest('/api/web-booking/create-payment-intent', 'POST', {
        amount: 100,
        service_type: 'test',
        client_info: {
          name: 'Backend Test User',
          email: 'backendtest@ittheal.com',
          phone: '+1234567890'
        }
      });

      if (response.status === 200 && response.data.clientSecret) {
        console.log('✅ Payment intent created successfully');
        console.log(`💳 Payment Intent ID: ${response.data.paymentIntentId}`);
        console.log(`🔑 Client Secret: ${response.data.clientSecret.substring(0, 20)}...`);
        this.results.paymentIntent = true;
        return true;
      }
      console.log('❌ Payment intent creation failed:', response.data);
      return false;


    } catch (error) {
      console.error.message);
      return false;
    }
  }

  async testEmailService() {
    console.log('\n📧 Testing Email Service...');

    try {
      const response = await this.makeRequest('/api/web-booking/test-email', 'POST', {
        email: 'backendtest@ittheal.com'
      });

      if (response.status === 200 && (response.data.success || response.data.message)) {
        console.log('✅ Email service working');
        console.log(`📧 Response: ${response.data.message || 'Email service operational'}`);
        this.results.emailService = true;
        return true;
      }
      console.log('❌ Email service test failed:', response.data);
      return false;


    } catch (error) {
      console.error.message);
      return false;
    }
  }

  async testSMSService() {
    console.log('\n📱 Testing SMS Service...');

    try {
      const response = await this.makeRequest('/api/web-booking/test-sms', 'POST', {
        phone: '+1234567890'
      });

      if (response.status === 200 && (response.data.success || response.data.message)) {
        console.log('✅ SMS service working');
        console.log(`📱 Response: ${response.data.message || 'SMS service operational'}`);
        this.results.smsService = true;
        return true;
      }
      console.log('❌ SMS service test failed:', response.data);
      return false;


    } catch (error) {
      console.error.message);
      return false;
    }
  }

  async testAdminBookings() {
    console.log('\n🏢 Testing Admin Bookings Endpoint...');

    try {
      const response = await this.makeRequest('/api/admin/bookings');

      if (response.status === 200 && response.data.success) {
        console.log('✅ Admin bookings endpoint working');
        console.log(`📋 Found ${response.data.count} bookings`);
        if (response.data.bookings && response.data.bookings.length > 0) {
          const latest = response.data.bookings[0];
          console.log(`📝 Latest booking: ${latest.client_name} - ${latest.service_type}`);
        }
        this.results.adminBookings = true;
        return true;
      }
      console.log('❌ Admin bookings test failed:', response.data);
      return false;


    } catch (error) {
      console.error.message);
      return false;
    }
  }

  async testAdminPayments() {
    console.log('\n💰 Testing Admin Payments Endpoint...');

    try {
      const response = await this.makeRequest('/api/admin/payments');

      if (response.status === 200 && response.data.success) {
        console.log('✅ Admin payments endpoint working');
        console.log(`💰 Found ${response.data.count} payments`);
        console.log(`💵 Total revenue: $${response.data.total_revenue}`);
        this.results.adminPayments = true;
        return true;
      }
      console.log('❌ Admin payments test failed:', response.data);
      return false;


    } catch (error) {
      console.error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🧪 ITT Heal Backend Endpoints Test');
    console.log('===================================');
    console.log(`🌐 Testing: ${this.baseUrl}`);
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log('');

    // Test all endpoints
    await this.testPaymentIntent();
    await this.testEmailService();
    await this.testSMSService();
    await this.testAdminBookings();
    await this.testAdminPayments();

    // Calculate overall result
    const allTests = Object.values(this.results).slice(0, -1); // Exclude 'overall'
    this.results.overall = allTests.every(result => result === true);

    // Print results
    console.log('\n📊 Backend Test Results');
    console.log('========================');
    console.log(`💳 Payment Intent: ${this.results.paymentIntent ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📧 Email Service: ${this.results.emailService ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📱 SMS Service: ${this.results.smsService ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🏢 Admin Bookings: ${this.results.adminBookings ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`💰 Admin Payments: ${this.results.adminPayments ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🎯 Overall: ${this.results.overall ? '✅ PASS' : '❌ FAIL'}`);

    if (this.results.overall) {
      console.log('\n🎉 All backend endpoints are working perfectly!');
      console.log('✅ Ready for frontend UI testing');
    } else {
      console.log('\n⚠️ Some backend endpoints need attention');
      console.log('❌ Fix backend issues before proceeding to UI tests');
    }

    return this.results.overall;
  }
}

// Run the test
async function main() {
  const tester = new BackendEndpointTest();
  const success = await tester.runAllTests();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = BackendEndpointTest;
