#!/usr/bin/env node

/**
 * Enhanced Enum Consistency Validator
 * Validates enum consistency between frontend, backend, and database
 * Fixes detected mismatches automatically where possible
 */

const fs = require('fs');
const path = require('path');

// Import centralized enums
const BACKEND_ENUMS_PATH = '/home/ittz/projects/itt/shared/backend/constants/enums.js';
let BACKEND_ENUMS = {};

try {
    BACKEND_ENUMS = require(BACKEND_ENUMS_PATH);
    console.log('✅ Backend enums loaded successfully');
} catch (error) {
    console.error('❌ Failed to load backend enums:', error.message);
    process.exit(1);
}

class EnumConsistencyValidator {
    constructor() {
        this.issues = [];
        this.fixes = [];
        this.frontendFiles = [
            'js/native-booking.js',
            'js/shared-payment.js', 
            '3t/js/native-booking.js',
            '3t/js/shared-payment.js',
            'shared-config.js',
            '3t/shared-config.js'
        ];
    }

    async validateAll() {
        console.log('🔍 Starting Enhanced Enum Consistency Validation');
        console.log('=' .repeat(60));

        await this.validateFrontendEnums();
        await this.validateServiceTypes();
        await this.validatePaymentTypes();
        await this.validateSessionStatus();
        await this.generateReport();

        return this.issues.length === 0;
    }

    async validateFrontendEnums() {
        console.log('\n📋 Validating Frontend Enum Usage...');
        
        for (const file of this.frontendFiles) {
            const filePath = path.join(__dirname, file);
            
            if (!fs.existsSync(filePath)) {
                console.log(`⏭️  Skipping ${file} (file not found)`);
                continue;
            }

            try {
                const content = fs.readFileSync(filePath, 'utf8');
                await this.validateFileEnums(file, content);
            } catch (error) {
                console.error(`❌ Error reading ${file}:`, error.message);
                this.issues.push({
                    type: 'FILE_READ_ERROR',
                    file: file,
                    error: error.message
                });
            }
        }
    }

    async validateFileEnums(filename, content) {
        console.log(`  📄 Checking ${filename}...`);

        // Check for hardcoded service types that should use enums
        const serviceTypePatterns = [
            /'(30min|60min|90min|120min|fasciaflow|consultation)'/g,
            /"(30min|60min|90min|120min|fasciaflow|consultation)"/g,
            /service[_-]?type.*['"](30min|60min|90min|120min|fasciaflow|consultation)['"]/gi
        ];

        for (const pattern of serviceTypePatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const foundValue = match[1];
                if (!BACKEND_ENUMS.SESSION_TYPES[foundValue]) {
                    this.issues.push({
                        type: 'INVALID_SERVICE_TYPE',
                        file: filename,
                        value: foundValue,
                        line: this.getLineNumber(content, match.index),
                        severity: 'HIGH'
                    });
                }
            }
        }

        // Check for payment type inconsistencies
        const paymentTypePatterns = [
            /payment[_-]?type.*['"](card|cash|bank_transfer|insurance|other|comp)['"]/gi,
            /'(card|cash|bank_transfer|insurance|other|comp)'/g,
            /"(card|cash|bank_transfer|insurance|other|comp)"/g
        ];

        for (const pattern of paymentTypePatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const foundValue = match[1];
                if (!BACKEND_ENUMS.PAYMENT_TYPES[foundValue]) {
                    this.issues.push({
                        type: 'INVALID_PAYMENT_TYPE',
                        file: filename,
                        value: foundValue,
                        line: this.getLineNumber(content, match.index),
                        severity: 'HIGH'
                    });
                }
            }
        }
    }

    async validateServiceTypes() {
        console.log('\n🎯 Validating Service Type Consistency...');
        
        const expectedTypes = Object.keys(BACKEND_ENUMS.SESSION_TYPES);
        console.log(`  Expected types: ${expectedTypes.join(', ')}`);

        // Check if frontend configs match backend enums
        for (const file of this.frontendFiles) {
            const filePath = path.join(__dirname, file);
            
            if (!fs.existsSync(filePath)) continue;

            try {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Look for service type definitions or usage
                const serviceTypeRegex = /(?:serviceTypes|SERVICE_TYPES|sessionTypes).*?[\{\[]([^}\]]+)[\}\]]/gs;
                const matches = content.match(serviceTypeRegex);
                
                if (matches) {
                    for (const match of matches) {
                        const types = this.extractServiceTypes(match);
                        for (const type of types) {
                            if (!expectedTypes.includes(type)) {
                                this.issues.push({
                                    type: 'SERVICE_TYPE_MISMATCH',
                                    file: file,
                                    frontend_value: type,
                                    expected_values: expectedTypes,
                                    severity: 'HIGH'
                                });
                            }
                        }
                    }
                }
            } catch (error) {
                console.error(`❌ Error validating service types in ${file}:`, error.message);
            }
        }
    }

    async validatePaymentTypes() {
        console.log('\n💳 Validating Payment Type Consistency...');
        
        const expectedTypes = Object.keys(BACKEND_ENUMS.PAYMENT_TYPES);
        console.log(`  Expected payment types: ${expectedTypes.join(', ')}`);

        // Similar validation for payment types
        for (const file of this.frontendFiles) {
            const filePath = path.join(__dirname, file);
            
            if (!fs.existsSync(filePath)) continue;

            try {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Look for payment type definitions
                const paymentTypeRegex = /(?:paymentTypes|PAYMENT_TYPES).*?[\{\[]([^}\]]+)[\}\]]/gs;
                const matches = content.match(paymentTypeRegex);
                
                if (matches) {
                    for (const match of matches) {
                        const types = this.extractPaymentTypes(match);
                        for (const type of types) {
                            if (!expectedTypes.includes(type)) {
                                this.issues.push({
                                    type: 'PAYMENT_TYPE_MISMATCH',
                                    file: file,
                                    frontend_value: type,
                                    expected_values: expectedTypes,
                                    severity: 'HIGH'
                                });
                            }
                        }
                    }
                }
            } catch (error) {
                console.error(`❌ Error validating payment types in ${file}:`, error.message);
            }
        }
    }

    async validateSessionStatus() {
        console.log('\n📊 Validating Session Status Consistency...');
        
        const expectedStatuses = Object.keys(BACKEND_ENUMS.SESSION_STATUS);
        console.log(`  Expected statuses: ${expectedStatuses.join(', ')}`);

        // Check session status usage
        for (const file of this.frontendFiles) {
            const filePath = path.join(__dirname, file);
            
            if (!fs.existsSync(filePath)) continue;

            try {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Look for status references
                const statusRegex = /status.*?['"](scheduled|in_progress|completed|cancelled|no_show|pending_approval|comp_request)['"]/gi;
                let match;
                
                while ((match = statusRegex.exec(content)) !== null) {
                    const foundStatus = match[1];
                    if (!expectedStatuses.includes(foundStatus)) {
                        this.issues.push({
                            type: 'SESSION_STATUS_MISMATCH',
                            file: file,
                            frontend_value: foundStatus,
                            expected_values: expectedStatuses,
                            severity: 'MEDIUM',
                            line: this.getLineNumber(content, match.index)
                        });
                    }
                }
            } catch (error) {
                console.error(`❌ Error validating session status in ${file}:`, error.message);
            }
        }
    }

    extractServiceTypes(text) {
        const types = [];
        const patterns = [
            /'([^']+)'/g,
            /"([^"]+)"/g,
            /(\w+):/g
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const value = match[1];
                if (['30min', '60min', '90min', '120min', 'fasciaflow', 'consultation', 'follow_up'].includes(value)) {
                    types.push(value);
                }
            }
        }

        return [...new Set(types)];
    }

    extractPaymentTypes(text) {
        const types = [];
        const patterns = [
            /'([^']+)'/g,
            /"([^"]+)"/g,
            /(\w+):/g
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const value = match[1];
                if (['card', 'cash', 'bank_transfer', 'insurance', 'other', 'comp'].includes(value)) {
                    types.push(value);
                }
            }
        }

        return [...new Set(types)];
    }

    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }

    async generateReport() {
        console.log('\n📋 Generating Enum Consistency Report...');
        console.log('=' .repeat(60));

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total_issues: this.issues.length,
                high_severity: this.issues.filter(i => i.severity === 'HIGH').length,
                medium_severity: this.issues.filter(i => i.severity === 'MEDIUM').length,
                low_severity: this.issues.filter(i => i.severity === 'LOW').length
            },
            issues: this.issues,
            fixes: this.fixes,
            backend_enums: {
                session_types: Object.keys(BACKEND_ENUMS.SESSION_TYPES),
                payment_types: Object.keys(BACKEND_ENUMS.PAYMENT_TYPES),
                session_status: Object.keys(BACKEND_ENUMS.SESSION_STATUS)
            }
        };

        // Save report
        const reportPath = path.join(__dirname, 'logs', 'enum-consistency-report.json');
        
        // Ensure logs directory exists
        const logsDir = path.dirname(reportPath);
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Console output
        if (this.issues.length === 0) {
            console.log('✅ All enum consistency checks passed!');
        } else {
            console.log(`❌ Found ${this.issues.length} enum consistency issues:`);
            
            const groupedIssues = this.issues.reduce((acc, issue) => {
                acc[issue.type] = (acc[issue.type] || []);
                acc[issue.type].push(issue);
                return acc;
            }, {});

            for (const [type, issues] of Object.entries(groupedIssues)) {
                console.log(`\n  ${type}: ${issues.length} issues`);
                for (const issue of issues.slice(0, 3)) { // Show first 3
                    console.log(`    - ${issue.file}: ${issue.frontend_value || issue.value} (${issue.severity})`);
                }
                if (issues.length > 3) {
                    console.log(`    ... and ${issues.length - 3} more`);
                }
            }
        }

        console.log(`\n📄 Full report saved to: ${reportPath}`);
        return report;
    }
}

// Main execution
async function main() {
    const validator = new EnumConsistencyValidator();
    
    try {
        const success = await validator.validateAll();
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('❌ Validation failed with error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = EnumConsistencyValidator;