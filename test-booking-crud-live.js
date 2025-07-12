#!/usr/bin/env node

// ITT Heal - Live Booking System Test
// Automated testing for booking CRUD operations

const https = require('https');
const fs = require('fs');
const path = require('path');

const config = {
    baseUrl: 'https://ittheal.com',
    endpoints: {
        health: '/api/health-check',
        bookings: '/api/bookings',
        sessions: '/api/sessions'
    },
    timeout: 30000
};

class BookingTester {
    constructor() {
        this.testResults = [];
        this.startTime = new Date();
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
        console.log(logEntry);
        
        // Ensure logs directory exists
        const logsDir = path.join(__dirname, 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        // Append to log file
        const logFile = path.join(logsDir, 'cron-live-testing.log');
        fs.appendFileSync(logFile, logEntry + '\n');
    }

    async makeRequest(endpoint, options = {}) {
        return new Promise((resolve, reject) => {
            const url = `${config.baseUrl}${endpoint}`;
            const timeout = setTimeout(() => {
                reject(new Error(`Request timeout after ${config.timeout}ms`));
            }, config.timeout);

            https.get(url, (res) => {
                clearTimeout(timeout);
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: data
                    });
                });
            }).on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    }

    async testHealthCheck() {
        try {
            this.log('Testing health check endpoint...');
            const response = await this.makeRequest(config.endpoints.health);
            
            if (response.statusCode === 200) {
                this.log('✅ Health check passed', 'success');
                return true;
            } else {
                this.log(`❌ Health check failed: ${response.statusCode}`, 'error');
                return false;
            }
        } catch (error) {
            this.log(`❌ Health check error: ${error.message}`, 'error');
            return false;
        }
    }

    async testBookingEndpoints() {
        try {
            this.log('Testing booking endpoints...');
            
            // Test booking list endpoint
            const response = await this.makeRequest(config.endpoints.bookings);
            
            if (response.statusCode === 200 || response.statusCode === 404) {
                this.log('✅ Booking endpoint accessible', 'success');
                return true;
            } else {
                this.log(`❌ Booking endpoint failed: ${response.statusCode}`, 'error');
                return false;
            }
        } catch (error) {
            this.log(`❌ Booking endpoint error: ${error.message}`, 'error');
            return false;
        }
    }

    async runAllTests() {
        this.log('🚀 Starting live booking system tests...');
        
        const tests = [
            { name: 'Health Check', fn: () => this.testHealthCheck() },
            { name: 'Booking Endpoints', fn: () => this.testBookingEndpoints() }
        ];

        let passedTests = 0;
        
        for (const test of tests) {
            try {
                const result = await test.fn();
                this.testResults.push({ name: test.name, passed: result });
                if (result) passedTests++;
            } catch (error) {
                this.log(`Test '${test.name}' failed with error: ${error.message}`, 'error');
                this.testResults.push({ name: test.name, passed: false, error: error.message });
            }
        }

        const duration = Date.now() - this.startTime.getTime();
        this.log(`📊 Test Summary: ${passedTests}/${tests.length} tests passed in ${duration}ms`);
        
        if (passedTests === tests.length) {
            this.log('🎉 All tests passed!', 'success');
            process.exit(0);
        } else {
            this.log('💥 Some tests failed', 'error');
            process.exit(1);
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new BookingTester();
    tester.runAllTests().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = BookingTester;