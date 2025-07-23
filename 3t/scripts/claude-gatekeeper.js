#!/usr/bin/env node
/**
 * CLAUDE.md Gatekeeper - Server-side Enforcement
 * Runs on CI/CD and prevents deployment of code that violates CLAUDE.md
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ClaudeGatekeeper {
    constructor() {
        this.violations = [];
        this.warnings = [];
        this.projectRoot = path.resolve(__dirname, '..');
    }

    // Main enforcement function
    async enforceRules() {
        console.log('🔒 CLAUDE.md Gatekeeper - Starting enforcement scan...\n');

        // Run all checks
        await this.checkHardcodedPrices();
        await this.checkMultiplePricingSources();
        await this.checkBackendFirst();
        await this.checkAPIDocumentation();
        await this.checkSchemaCompatibility();
        await this.checkSingleSourceOfTruth();

        // Report results
        this.reportResults();

        // Exit with appropriate code
        if (this.violations.length > 0) {
            process.exit(1); // Block deployment
        }
        process.exit(0);
    }

    // Check 1: No hardcoded prices
    async checkHardcodedPrices() {
        console.log('Checking for hardcoded prices...');
        
        const patterns = [
            /data-price=["']?\$?\d+/g,
            /price:\s*\d+(?!.*\/\/ Dynamic)/g,
            /webPrice:\s*\d+/g,
            /appPrice:\s*\d+/g,
            /\$\d+(?:\.?\d{2})?(?!.*API)/g  // Dollar amounts not marked as from API
        ];

        const files = this.findFiles(['.html', '.js', '.jsx'], ['node_modules', 'test', '.git']);
        
        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            for (const pattern of patterns) {
                const matches = content.match(pattern);
                if (matches) {
                    // Special exemption for shared-config.js as temporary single source
                    if (!file.includes('shared-config.js') && !file.includes('pricing-booking.js')) {
                        this.addViolation(
                            `Hardcoded price found in ${path.relative(this.projectRoot, file)}: ${matches[0]}`,
                            'Prices must be loaded from backend API, not hardcoded in frontend files.'
                        );
                    }
                }
            }
        }
    }

    // Check 2: Multiple pricing sources
    async checkMultiplePricingSources() {
        console.log('Checking for multiple pricing sources...');
        
        const pricingFiles = [];
        const files = this.findFiles(['.js', '.html'], ['node_modules', 'test']);
        
        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes('PRICING_CONFIG') || 
                content.includes('sessions:') || 
                content.includes('service_prices')) {
                pricingFiles.push(file);
            }
        }

        // Temporary: Allow max 2 (shared-config.js and pricing-booking.js)
        if (pricingFiles.length > 2) {
            this.addViolation(
                `Multiple pricing configurations found (${pricingFiles.length} files)`,
                'Use a single source of truth for pricing. Found in: ' + 
                pricingFiles.map(f => path.basename(f)).join(', ')
            );
        }
    }

    // Check 3: Backend-first development
    async checkBackendFirst() {
        console.log('Checking backend-first compliance...');
        
        // Check if API endpoints exist for all major features
        const requiredEndpoints = [
            { path: '/api/pricing', purpose: 'Pricing should come from backend' },
            { path: '/api/web-booking/services', purpose: 'Services should be dynamic' },
            { path: '/api/web-booking/addons', purpose: 'Add-ons should be dynamic' }
        ];

        for (const endpoint of requiredEndpoints) {
            // This is a simplified check - in production, actually test the endpoint
            const hasEndpoint = this.checkEndpointExists(endpoint.path);
            if (!hasEndpoint) {
                this.addWarning(
                    `Missing backend endpoint: ${endpoint.path}`,
                    endpoint.purpose
                );
            }
        }
    }

    // Check 4: API documentation
    async checkAPIDocumentation() {
        console.log('Checking API documentation...');
        
        const apiCalls = [];
        const files = this.findFiles(['.js'], ['node_modules', 'test']);
        
        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            const fetchCalls = content.match(/fetch\(['"`]([^'"`]+)['"`]/g) || [];
            apiCalls.push(...fetchCalls);
        }

        // Check if these are documented
        const docFile = path.join(this.projectRoot, 'docs/api.md');
        if (fs.existsSync(docFile)) {
            const docContent = fs.readFileSync(docFile, 'utf8');
            for (const call of [...new Set(apiCalls)]) {
                const endpoint = call.match(/['"`]([^'"`]+)['"`]/)[1];
                if (!docContent.includes(endpoint)) {
                    this.addWarning(
                        `Undocumented API endpoint: ${endpoint}`,
                        'All API endpoints should be documented in docs/api.md'
                    );
                }
            }
        }
    }

    // Check 5: Schema compatibility
    async checkSchemaCompatibility() {
        console.log('Checking schema compatibility...');
        
        // Look for new field additions without schema checks
        const files = this.findFiles(['.js'], ['node_modules', 'test', 'migration']);
        
        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            
            // Check for object field assignments that might be new
            const newFieldPatterns = [
                /body:\s*JSON\.stringify\(\{[^}]*\}\)/g,
                /data\.[a-z_]+\s*=\s*[^;]+/g
            ];
            
            for (const pattern of newFieldPatterns) {
                const matches = content.match(pattern);
                if (matches && !content.includes('// Schema verified:')) {
                    this.addWarning(
                        `Possible unverified schema field in ${path.basename(file)}`,
                        'Add comment "// Schema verified: [date]" after checking backend compatibility'
                    );
                }
            }
        }
    }

    // Check 6: Single source of truth
    async checkSingleSourceOfTruth() {
        console.log('Checking single source of truth principle...');
        
        const configPatterns = [
            { pattern: 'SERVICE_TYPES', type: 'service configuration' },
            { pattern: 'ADDON_TYPES', type: 'addon configuration' },
            { pattern: 'BUSINESS_HOURS', type: 'business hours configuration' }
        ];

        for (const config of configPatterns) {
            const files = this.findFilesContaining(config.pattern);
            if (files.length > 1) {
                this.addViolation(
                    `Multiple ${config.type} definitions found`,
                    `Found in ${files.length} files. Should have single source.`
                );
            }
        }
    }

    // Helper: Find files by extension
    findFiles(extensions, excludeDirs = []) {
        const files = [];
        const walk = (dir) => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    if (!excludeDirs.some(ex => fullPath.includes(ex))) {
                        walk(fullPath);
                    }
                } else if (extensions.some(ext => item.endsWith(ext))) {
                    files.push(fullPath);
                }
            }
        };
        
        walk(this.projectRoot);
        return files;
    }

    // Helper: Find files containing pattern
    findFilesContaining(pattern) {
        const files = this.findFiles(['.js', '.html'], ['node_modules', 'test']);
        return files.filter(file => {
            const content = fs.readFileSync(file, 'utf8');
            return content.includes(pattern);
        });
    }

    // Helper: Check if endpoint exists (simplified)
    checkEndpointExists(endpoint) {
        // In real implementation, this would make an actual API call
        // For now, check if it's referenced in backend code
        const backendFiles = this.findFiles(['.js'], ['node_modules']).filter(f => 
            f.includes('backend') || f.includes('routes') || f.includes('api')
        );
        
        for (const file of backendFiles) {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes(endpoint)) {
                return true;
            }
        }
        return false;
    }

    // Add violation
    addViolation(message, details) {
        this.violations.push({ message, details });
    }

    // Add warning
    addWarning(message, details) {
        this.warnings.push({ message, details });
    }

    // Report results
    reportResults() {
        console.log('\n' + '='.repeat(60));
        console.log('CLAUDE.md GATEKEEPER REPORT');
        console.log('='.repeat(60) + '\n');

        if (this.violations.length === 0 && this.warnings.length === 0) {
            console.log('✅ All checks passed! Code is CLAUDE.md compliant.\n');
            return;
        }

        if (this.violations.length > 0) {
            console.log(`❌ VIOLATIONS FOUND: ${this.violations.length}\n`);
            this.violations.forEach((v, i) => {
                console.log(`${i + 1}. ${v.message}`);
                console.log(`   ${v.details}\n`);
            });
        }

        if (this.warnings.length > 0) {
            console.log(`⚠️  WARNINGS: ${this.warnings.length}\n`);
            this.warnings.forEach((w, i) => {
                console.log(`${i + 1}. ${w.message}`);
                console.log(`   ${w.details}\n`);
            });
        }

        if (this.violations.length > 0) {
            console.log('❌ DEPLOYMENT BLOCKED: Fix violations before deploying.\n');
        }
    }
}

// Run the gatekeeper
const gatekeeper = new ClaudeGatekeeper();
gatekeeper.enforceRules().catch(err => {
    console.error('Gatekeeper error:', err);
    process.exit(1);
});