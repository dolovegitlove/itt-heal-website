#!/usr/bin/env node
/**
 * CLAUDE.md Lint - Real-time file checker
 * Runs on every file save in VS Code
 */

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) {
    console.error('Usage: claude-lint.js <file>');
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const violations = [];

// Check 1: Hardcoded prices
const pricePatterns = [
    /data-price=["']?\$?\d+/g,
    /price:\s*\d+(?!.*\/\/ Dynamic)/g,
    /webPrice:\s*\d+/g,
    /appPrice:\s*\d+/g
];

for (const pattern of pricePatterns) {
    const matches = content.match(pattern);
    if (matches && !filePath.includes('shared-config') && !filePath.includes('pricing-booking')) {
        violations.push({
            line: getLineNumber(content, matches[0]),
            message: `Hardcoded price: ${matches[0]}`,
            severity: 'error'
        });
    }
}

// Check 2: Unverified API calls
const apiCalls = content.match(/fetch\(['"]/g) || [];
if (apiCalls.length > 0) {
    const hasVerification = content.includes('// Backend verified:');
    if (!hasVerification) {
        violations.push({
            line: getLineNumber(content, 'fetch('),
            message: 'API call without backend verification comment',
            severity: 'warning'
        });
    }
}

// Check 3: Multiple config sources
if (content.includes('PRICING_CONFIG') && !filePath.includes('shared-config')) {
    violations.push({
        line: getLineNumber(content, 'PRICING_CONFIG'),
        message: 'Pricing config should only be in shared-config.js',
        severity: 'error'
    });
}

// Check 4: console.log in production
const consoleLogs = content.match(/console\.log/g) || [];
if (consoleLogs.length > 0 && !filePath.includes('test') && !filePath.includes('debug')) {
    violations.push({
        line: getLineNumber(content, 'console.log'),
        message: 'Remove console.log from production code',
        severity: 'warning'
    });
}

// Helper to get line number
function getLineNumber(content, searchStr) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(searchStr)) {
            return i + 1;
        }
    }
    return 1;
}

// Output results
if (violations.length > 0) {
    console.error(`\n❌ CLAUDE.md VIOLATIONS in ${path.basename(filePath)}:\n`);
    violations.forEach(v => {
        const icon = v.severity === 'error' ? '❌' : '⚠️';
        console.error(`  ${icon} Line ${v.line}: ${v.message}`);
    });
    console.error('\nFix these violations to ensure CLAUDE.md compliance.\n');
    
    // Exit with error for errors, success for warnings only
    const hasErrors = violations.some(v => v.severity === 'error');
    process.exit(hasErrors ? 1 : 0);
} else {
    console.log(`✅ ${path.basename(filePath)} is CLAUDE.md compliant!`);
}