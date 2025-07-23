#!/usr/bin/env node
/**
 * Smart MD Loader - Loads only what's needed
 */

const fs = require('fs');
const path = require('path');

class SmartMDLoader {
    constructor() {
        this.cache = {};
    }

    // Load CLAUDE.md rules only when checking compliance
    loadClaudeRules() {
        if (!this.cache.claude) {
            this.cache.claude = fs.readFileSync('CLAUDE.md', 'utf8');
        }
        return this.cache.claude;
    }

    // Load go.md commands only when needed
    loadGoCommands() {
        if (!this.cache.go) {
            this.cache.go = fs.readFileSync('go.md', 'utf8');
        }
        return this.cache.go;
    }

    // Search across both without loading everything
    search(query) {
        const results = [];
        
        // Search CLAUDE.md if query seems rule-related
        if (query.match(/rule|enforce|principle|backend|claude/i)) {
            const claude = this.loadClaudeRules();
            const lines = claude.split('\n');
            lines.forEach((line, i) => {
                if (line.toLowerCase().includes(query.toLowerCase())) {
                    results.push({ file: 'CLAUDE.md', line: i + 1, content: line });
                }
            });
        }

        // Search go.md if query seems command-related
        if (query.match(/command|go|deploy|test|validate/i)) {
            const go = this.loadGoCommands();
            const lines = go.split('\n');
            lines.forEach((line, i) => {
                if (line.toLowerCase().includes(query.toLowerCase())) {
                    results.push({ file: 'go.md', line: i + 1, content: line });
                }
            });
        }

        return results;
    }

    // Get specific section without loading entire file
    getSection(file, section) {
        const content = file === 'CLAUDE.md' ? this.loadClaudeRules() : this.loadGoCommands();
        const lines = content.split('\n');
        const sectionStart = lines.findIndex(line => line.includes(section));
        
        if (sectionStart === -1) return null;
        
        const sectionLines = [];
        for (let i = sectionStart; i < lines.length; i++) {
            sectionLines.push(lines[i]);
            // Stop at next section
            if (i > sectionStart && lines[i].startsWith('#')) break;
        }
        
        return sectionLines.join('\n');
    }

    // Memory-efficient summary
    getSummary() {
        return {
            claude: {
                size: fs.statSync('CLAUDE.md').size,
                sections: this.getTableOfContents('CLAUDE.md'),
                purpose: 'Development rules and enforcement'
            },
            go: {
                size: fs.statSync('go.md').size,
                sections: this.getTableOfContents('go.md'),
                purpose: 'Command reference and automation'
            }
        };
    }

    getTableOfContents(file) {
        const content = fs.readFileSync(file, 'utf8');
        const headers = content.split('\n').filter(line => line.startsWith('#'));
        return headers.map(h => h.replace(/^#+\s*/, ''));
    }
}

// CLI interface
if (require.main === module) {
    const loader = new SmartMDLoader();
    const command = process.argv[2];
    const arg = process.argv[3];

    switch (command) {
        case 'search':
            const results = loader.search(arg);
            console.log(`Found ${results.length} matches for "${arg}":`);
            results.forEach(r => {
                console.log(`${r.file}:${r.line} - ${r.content.trim()}`);
            });
            break;

        case 'section':
            const section = loader.getSection('CLAUDE.md', arg) || loader.getSection('go.md', arg);
            console.log(section || 'Section not found');
            break;

        case 'summary':
            console.log(JSON.stringify(loader.getSummary(), null, 2));
            break;

        default:
            console.log('Usage: smart-md-loader.js [search|section|summary] <query>');
    }
}

module.exports = SmartMDLoader;