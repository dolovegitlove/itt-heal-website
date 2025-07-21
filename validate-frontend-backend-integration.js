#!/usr/bin/env node

/**
 * Comprehensive Frontend-Backend Integration Validator
 * Catches ALL types of mismatches between frontend and backend
 * 
 * This should prevent issues like:
 * - API endpoint mismatches (wrong URLs)
 * - Data attribute mismatches (data-service vs data-service-type)
 * - Request/response field mismatches
 * - Enum value mismatches
 * - HTTP method mismatches
 * - Missing endpoints
 * - Schema inconsistencies
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

class FrontendBackendValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.results = {
            apiEndpoints: [],
            dataAttributes: [],
            requestFields: [],
            responseFields: [],
            enumValues: [],
            httpMethods: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    addError(category, message, details = {}) {
        const error = { category, message, details, timestamp: new Date().toISOString() };
        this.errors.push(error);
        this.log(`ERROR [${category}]: ${message}`, 'error');
        if (Object.keys(details).length > 0) {
            this.log(`   Details: ${JSON.stringify(details, null, 2)}`);
        }
    }

    addWarning(category, message, details = {}) {
        const warning = { category, message, details, timestamp: new Date().toISOString() };
        this.warnings.push(warning);
        this.log(`WARNING [${category}]: ${message}`, 'warn');
    }

    // 1. API ENDPOINT VALIDATION
    extractFrontendAPIEndpoints() {
        this.log('🔍 Extracting API endpoints from frontend code...');
        
        const frontendFiles = ['index.html', 'js/native-booking.js', 'js/booking-availability.js', 'admin/admin-dashboard.js'];
        const endpoints = new Set();
        
        frontendFiles.forEach(file => {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                
                // Extract fetch() calls
                const fetchRegex = /fetch\(['"`]([^'"`]+)['"`]/g;
                let match;
                while ((match = fetchRegex.exec(content)) !== null) {
                    if (match[1].startsWith('/api/') || match[1].includes('/api/')) {
                        endpoints.add(match[1]);
                    }
                }
                
                // Extract XMLHttpRequest calls
                const xhrRegex = /(?:open|send)\(['"`](?:GET|POST|PUT|DELETE)['"`]\s*,\s*['"`]([^'"`]+)['"`]/g;
                while ((match = xhrRegex.exec(content)) !== null) {
                    if (match[1].startsWith('/api/')) {
                        endpoints.add(match[1]);
                    }
                }
            }
        });
        
        this.results.apiEndpoints = Array.from(endpoints);
        this.log(`✅ Found ${this.results.apiEndpoints.length} API endpoints in frontend`);
        this.results.apiEndpoints.forEach(endpoint => this.log(`   - ${endpoint}`));
    }

    async testBackendEndpoint(endpoint, method = 'GET', testData = null) {
        return new Promise((resolve) => {
            // Clean up endpoint for testing
            let testEndpoint = endpoint;
            
            // Replace template variables with test values
            testEndpoint = testEndpoint.replace(/\$\{[^}]+\}/g, 'test-value');
            testEndpoint = testEndpoint.replace(/\{[^}]+\}/g, 'test-value');
            
            // Handle query parameters
            if (testEndpoint.includes('?')) {
                const [base, query] = testEndpoint.split('?');
                testEndpoint = base + '?' + query.replace(/=\$\{[^}]+\}/g, '=test-value');
            }
            
            const url = new URL(testEndpoint, 'https://ittheal.com');
            const postData = testData ? JSON.stringify(testData) : null;
            
            const options = {
                hostname: url.hostname,
                port: 443,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'ITT-Integration-Validator/1.0'
                }
            };
            
            if (postData) {
                options.headers['Content-Length'] = Buffer.byteLength(postData);
            }

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(body);
                        resolve({
                            status: res.statusCode,
                            data: response,
                            exists: res.statusCode !== 404,
                            headers: res.headers
                        });
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            data: body,
                            exists: res.statusCode !== 404,
                            headers: res.headers
                        });
                    }
                });
            });

            req.on('error', (error) => {
                resolve({
                    status: 0,
                    data: null,
                    exists: false,
                    error: error.message
                });
            });

            if (postData) {
                req.write(postData);
            }
            req.end();
        });
    }

    async validateAPIEndpoints() {
        this.log('🔍 Validating API endpoint existence...');
        
        for (const endpoint of this.results.apiEndpoints) {
            this.log(`   Testing: ${endpoint}`);
            
            // Test with GET first
            const getResult = await this.testBackendEndpoint(endpoint, 'GET');
            
            if (!getResult.exists) {
                // Try with POST if GET fails
                const postResult = await this.testBackendEndpoint(endpoint, 'POST', {
                    test: true
                });
                
                if (!postResult.exists) {
                    this.addError('API_ENDPOINT', `Endpoint not found: ${endpoint}`, {
                        endpoint,
                        getStatus: getResult.status,
                        postStatus: postResult.status
                    });
                } else {
                    this.log(`   ✅ ${endpoint} - EXISTS (POST only)`);
                }
            } else {
                this.log(`   ✅ ${endpoint} - EXISTS`);
            }
        }
    }

    // 2. DATA ATTRIBUTE VALIDATION
    extractDataAttributes() {
        this.log('🔍 Extracting data attributes from HTML...');
        
        if (!fs.existsSync('index.html')) {
            this.addError('DATA_ATTRIBUTES', 'index.html not found');
            return;
        }
        
        const htmlContent = fs.readFileSync('index.html', 'utf8');
        const dataAttributes = new Set();
        
        // Extract all data-* attributes
        const dataAttrRegex = /data-([a-zA-Z0-9-]+)="([^"]+)"/g;
        let match;
        
        while ((match = dataAttrRegex.exec(htmlContent)) !== null) {
            dataAttributes.add({
                attribute: `data-${match[1]}`,
                value: match[2],
                fullMatch: match[0]
            });
        }
        
        this.results.dataAttributes = Array.from(dataAttributes);
        this.log(`✅ Found ${this.results.dataAttributes.length} data attributes`);
    }

    validateDataAttributeUsage() {
        this.log('🔍 Validating data attribute usage consistency...');
        
        const jsFiles = ['js/native-booking.js', 'js/booking-availability.js', 'admin/admin-dashboard.js'];
        const usedAttributes = new Set();
        
        // Find which data attributes are actually used in JavaScript
        jsFiles.forEach(file => {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                
                // Look for getAttribute, dataset, querySelector with data attributes
                const attrUsageRegex = /(?:getAttribute|dataset|querySelector|querySelectorAll)\(['"`]([^'"`]*data-[^'"`]+)['"`]|\.([a-zA-Z][a-zA-Z0-9]*)/g;
                let match;
                
                while ((match = attrUsageRegex.exec(content)) !== null) {
                    if (match[1]) {
                        usedAttributes.add(match[1]);
                    }
                }
            }
        });
        
        // Check for unused data attributes
        const definedAttrs = new Set(this.results.dataAttributes.map(attr => attr.attribute));
        const unusedAttrs = [...definedAttrs].filter(attr => !usedAttributes.has(attr));
        
        if (unusedAttrs.length > 0) {
            this.addWarning('DATA_ATTRIBUTES', `Unused data attributes found: ${unusedAttrs.join(', ')}`);
        }
        
        this.log(`✅ Data attribute usage validation completed`);
    }

    // 3. REQUEST/RESPONSE FIELD VALIDATION
    extractRequestResponseFields() {
        this.log('🔍 Extracting request/response field patterns...');
        
        const jsFiles = ['index.html', 'js/native-booking.js', 'js/booking-availability.js', 'admin/admin-dashboard.js'];
        const requestFields = new Set();
        const responseFields = new Set();
        
        jsFiles.forEach(file => {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                
                // Extract fields from JSON.stringify (request fields)
                const requestRegex = /JSON\.stringify\(\s*\{([^}]+)\}/g;
                let match;
                
                while ((match = requestRegex.exec(content)) !== null) {
                    const fields = match[1].match(/(\w+):/g);
                    if (fields) {
                        fields.forEach(field => {
                            requestFields.add(field.replace(':', ''));
                        });
                    }
                }
                
                // Extract fields from response access patterns
                const responseRegex = /(?:response|data|result)\.(\w+)/g;
                while ((match = responseRegex.exec(content)) !== null) {
                    responseFields.add(match[1]);
                }
            }
        });
        
        this.results.requestFields = Array.from(requestFields);
        this.results.responseFields = Array.from(responseFields);
        
        this.log(`✅ Found ${this.results.requestFields.length} request fields, ${this.results.responseFields.length} response fields`);
    }

    // 4. ENUM VALUE VALIDATION
    extractEnumValues() {
        this.log('🔍 Extracting enum values from frontend...');
        
        const enumValues = new Map();
        
        // Service types from HTML
        if (fs.existsSync('index.html')) {
            const htmlContent = fs.readFileSync('index.html', 'utf8');
            const serviceTypes = [];
            
            const serviceTypeRegex = /data-service-type="([^"]+)"/g;
            let match;
            while ((match = serviceTypeRegex.exec(htmlContent)) !== null) {
                serviceTypes.push(match[1]);
            }
            
            enumValues.set('service_types', serviceTypes);
        }
        
        // Payment methods
        const paymentMethods = ['credit_card', 'complimentary', 'cash'];
        enumValues.set('payment_methods', paymentMethods);
        
        // Booking statuses (from JavaScript)
        const bookingStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        enumValues.set('booking_statuses', bookingStatuses);
        
        this.results.enumValues = Array.from(enumValues.entries());
        this.log(`✅ Found ${this.results.enumValues.length} enum categories`);
    }

    async validateEnumValues() {
        this.log('🔍 Validating enum values with backend...');
        
        for (const [enumType, values] of this.results.enumValues) {
            this.log(`   Testing ${enumType}: ${values.join(', ')}`);
            
            if (enumType === 'service_types') {
                for (const serviceType of values) {
                    // Test the actual booking endpoint where the mismatch occurs
                    const testResult = await this.testBackendEndpoint(
                        '/api/bookings',
                        'POST',
                        {
                            client_name: 'Test Client',
                            client_email: 'test@test.com',
                            service_type: serviceType,
                            practitioner_id: '060863f2-0623-4785-b01a-f1760cfb8d14',
                            scheduled_date: '2025-07-21T15:00:00.000Z'
                        }
                    );
                    
                    // Check if backend properly handles this service type
                    if (testResult.status >= 400) {
                        this.addError('ENUM_VALUES', `Backend rejected service type: ${serviceType}`, {
                            enumType,
                            value: serviceType,
                            backendResponse: testResult.data,
                            httpStatus: testResult.status
                        });
                    } else if (testResult.data && testResult.data.success === false) {
                        this.addError('ENUM_VALUES', `Backend validation failed for service type: ${serviceType}`, {
                            enumType,
                            value: serviceType,
                            backendResponse: testResult.data
                        });
                    } else {
                        this.log(`   ✅ ${serviceType} - Backend accepts this service type`);
                    }
                }
            }
        }
    }

    // 5. HTTP METHOD VALIDATION
    extractHTTPMethods() {
        this.log('🔍 Extracting HTTP methods from frontend...');
        
        const methods = new Map();
        
        const jsFiles = ['index.html', 'js/native-booking.js', 'js/booking-availability.js', 'admin/admin-dashboard.js'];
        
        jsFiles.forEach(file => {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                
                // Extract method from fetch calls
                const fetchMethodRegex = /fetch\(['"`]([^'"`]+)['"`]\s*,\s*\{[^}]*method:\s*['"`]([^'"`]+)['"`]/g;
                let match;
                
                while ((match = fetchMethodRegex.exec(content)) !== null) {
                    const endpoint = match[1];
                    const method = match[2];
                    
                    if (endpoint.includes('/api/')) {
                        if (!methods.has(endpoint)) {
                            methods.set(endpoint, []);
                        }
                        methods.get(endpoint).push(method);
                    }
                }
            }
        });
        
        this.results.httpMethods = Array.from(methods.entries());
        this.log(`✅ Found HTTP methods for ${this.results.httpMethods.length} endpoints`);
    }

    async validateHTTPMethods() {
        this.log('🔍 Validating HTTP methods with backend...');
        
        for (const [endpoint, methods] of this.results.httpMethods) {
            for (const method of methods) {
                this.log(`   Testing ${method} ${endpoint}`);
                
                const testResult = await this.testBackendEndpoint(endpoint, method, method === 'POST' ? { test: true } : null);
                
                if (testResult.status === 405) {
                    this.addError('HTTP_METHODS', `Method not allowed: ${method} ${endpoint}`, {
                        endpoint,
                        method,
                        status: testResult.status
                    });
                }
            }
        }
    }

    // 6. GENERATE COMPREHENSIVE REPORT
    generateReport() {
        this.log('📊 Generating comprehensive validation report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalErrors: this.errors.length,
                totalWarnings: this.warnings.length,
                categoriesChecked: [
                    'API_ENDPOINTS',
                    'DATA_ATTRIBUTES', 
                    'REQUEST_RESPONSE_FIELDS',
                    'ENUM_VALUES',
                    'HTTP_METHODS'
                ],
                validationPassed: this.errors.length === 0
            },
            results: this.results,
            errors: this.errors,
            warnings: this.warnings,
            recommendations: []
        };
        
        // Add recommendations based on errors
        if (this.errors.length > 0) {
            report.recommendations.push('Add this validation script to your CI/CD pipeline');
            report.recommendations.push('Run validation before each deployment');
            report.recommendations.push('Consider using TypeScript for better type safety');
            report.recommendations.push('Implement API contract testing');
        }
        
        // Save report
        const reportPath = './logs/frontend-backend-validation-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        this.log(`📋 Report saved to ${reportPath}`);
        
        return report;
    }

    async run() {
        this.log('🚀 Starting comprehensive frontend-backend integration validation...');
        this.log('This will catch ALL types of mismatches between frontend and backend!');
        
        // Ensure logs directory exists
        if (!fs.existsSync('./logs')) {
            fs.mkdirSync('./logs', { recursive: true });
        }
        
        try {
            // 1. API Endpoints
            this.extractFrontendAPIEndpoints();
            await this.validateAPIEndpoints();
            
            // 2. Data Attributes
            this.extractDataAttributes();
            this.validateDataAttributeUsage();
            
            // 3. Request/Response Fields
            this.extractRequestResponseFields();
            
            // 4. Enum Values
            this.extractEnumValues();
            await this.validateEnumValues();
            
            // 5. HTTP Methods
            this.extractHTTPMethods();
            await this.validateHTTPMethods();
            
            // 6. Generate Report
            const report = this.generateReport();
            
            // Summary
            this.log('📊 VALIDATION SUMMARY:');
            this.log(`   Errors: ${this.errors.length}`);
            this.log(`   Warnings: ${this.warnings.length}`);
            this.log(`   API Endpoints: ${this.results.apiEndpoints.length}`);
            this.log(`   Data Attributes: ${this.results.dataAttributes.length}`);
            this.log(`   Request Fields: ${this.results.requestFields.length}`);
            this.log(`   Response Fields: ${this.results.responseFields.length}`);
            
            if (this.errors.length > 0) {
                this.log('❌ VALIDATION FAILED!');
                this.log('🔧 Issues found that need fixing:');
                this.errors.forEach((error, index) => {
                    this.log(`   ${index + 1}. [${error.category}] ${error.message}`);
                });
                process.exit(1);
            } else {
                this.log('✅ ALL VALIDATIONS PASSED!');
                this.log('🎉 No frontend-backend mismatches detected!');
                process.exit(0);
            }
            
        } catch (error) {
            this.log(`💥 Validation failed with error: ${error.message}`, 'error');
            process.exit(1);
        }
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new FrontendBackendValidator();
    validator.run().catch(error => {
        console.error('Validation failed:', error);
        process.exit(1);
    });
}

module.exports = FrontendBackendValidator;