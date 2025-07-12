#!/usr/bin/env node

/**
 * Button Consistency Validation Script for ITT Heal
 * Ensures all buttons use consistent CSS classes and WCAG compliance
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

class ButtonValidator {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.htmlFiles = [];
    this.cssContent = '';
    this.validButtonClasses = new Set(['btn-luxury', 'btn-primary', 'btn-secondary', 'luxury-button-secondary']);
    this.invalidClasses = new Set(); // Classes that don't exist in CSS
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async validate() {
    this.log('\n🔲 Button Consistency Validation for ITT Heal', 'bright');
    this.log('=' .repeat(50), 'blue');

    // Load CSS content
    await this.loadCSS();

    // Find HTML files
    this.findHTMLFiles();

    // Validate each HTML file
    for (const htmlFile of this.htmlFiles) {
      await this.validateHTMLFile(htmlFile);
    }

    // Report results
    this.reportResults();

    // Apply fixes if needed
    if (this.fixes.length > 0) {
      await this.applyFixes();
    }

    return this.issues.length === 0;
  }

  async loadCSS() {
    const cssFiles = [
      './dist/luxury-spa.css',
      './css/luxury-spa.css',
      './luxury-spa.css'
    ];

    for (const cssFile of cssFiles) {
      if (fs.existsSync(cssFile)) {
        this.cssContent = fs.readFileSync(cssFile, 'utf8');
        this.log(`✅ Loaded CSS: ${cssFile}`, 'green');
        break;
      }
    }

    if (!this.cssContent) {
      this.log('❌ No CSS file found', 'red');
    }
  }

  findHTMLFiles() {
    const files = fs.readdirSync('.');
    this.htmlFiles = files.filter(file => 
      file.endsWith('.html') && 
      !file.includes('test-') && 
      !file.includes('nginx-debian')
    );
    
    this.log(`📄 Found ${this.htmlFiles.length} HTML files to validate`, 'blue');
  }

  async validateHTMLFile(fileName) {
    try {
      const content = fs.readFileSync(fileName, 'utf8');
      const dom = new JSDOM(content);
      const document = dom.window.document;

      this.log(`\n🔍 Validating: ${fileName}`, 'yellow');

      // Find all buttons and button-like elements
      const buttons = document.querySelectorAll('button, a[class*="btn"], a[class*="button"], .luxury-button-secondary');

      for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        this.validateButton(button, fileName, i);
      }

    } catch (error) {
      this.log(`❌ Error validating ${fileName}: ${error.message}`, 'red');
    }
  }

  validateButton(button, fileName, index) {
    const classes = button.className.split(/\s+/).filter(c => c.length > 0);
    const inlineStyles = button.getAttribute('style') || '';
    const tagName = button.tagName.toLowerCase();
    const id = button.id || `button-${index}`;

    // Check for invalid classes
    for (const className of classes) {
      if (this.invalidClasses.has(className)) {
        this.issues.push({
          type: 'invalid-class',
          file: fileName,
          element: id,
          className: className,
          message: `Button uses non-existent class: ${className}`
        });

        this.fixes.push({
          type: 'fix-invalid-class',
          file: fileName,
          element: button,
          oldClass: className,
          newClass: this.suggestCorrectClass(className),
          message: `Replace ${className} with proper button class`
        });
      }
    }

    // Check for buttons with inline styles instead of classes
    if (inlineStyles.length > 100) {
      const hasValidButtonClass = classes.some(c => this.validButtonClasses.has(c));
      
      if (!hasValidButtonClass) {
        this.issues.push({
          type: 'inline-styles',
          file: fileName,
          element: id,
          message: 'Button uses inline styles instead of proper CSS classes'
        });

        this.fixes.push({
          type: 'fix-inline-styles',
          file: fileName,
          element: button,
          suggestedClass: this.suggestButtonClass(button),
          message: 'Replace inline styles with proper button classes'
        });
      }
    }

    // Check WCAG compliance
    this.validateWCAG(button, fileName, id);
  }

  validateWCAG(button, fileName, id) {
    const style = button.getAttribute('style') || '';
    const classes = button.className;

    // Check minimum touch target size (44px)
    if (!style.includes('min-height: 44px') && !style.includes('min-width: 44px')) {
      this.issues.push({
        type: 'wcag-touch-target',
        file: fileName,
        element: id,
        message: 'Button does not meet WCAG 44px minimum touch target size'
      });
    }

    // Check for missing aria-label on icon buttons
    const hasText = button.textContent.trim().length > 0;
    const hasAriaLabel = button.getAttribute('aria-label');
    const hasTitle = button.getAttribute('title');

    if (!hasText && !hasAriaLabel && !hasTitle) {
      this.issues.push({
        type: 'wcag-accessibility',
        file: fileName,
        element: id,
        message: 'Button lacks accessible text (aria-label or visible text)'
      });
    }
  }

  suggestCorrectClass(invalidClass) {
    if (invalidClass.includes('secondary')) return 'btn-luxury btn-secondary';
    if (invalidClass.includes('primary')) return 'btn-luxury btn-primary';
    if (invalidClass.includes('button')) return 'btn-luxury btn-primary';
    return 'btn-luxury btn-primary';
  }

  suggestButtonClass(button) {
    const style = button.getAttribute('style') || '';
    const text = button.textContent.toLowerCase();

    // Determine if it should be primary or secondary based on styling/text
    if (style.includes('background: #f5f5f2') || 
        style.includes('border: 2px solid') ||
        text.includes('without app') ||
        text.includes('app store') ||
        text.includes('google play')) {
      return 'btn-luxury btn-secondary';
    }

    return 'btn-luxury btn-primary';
  }

  reportResults() {
    this.log('\n📊 Button Validation Results', 'bright');
    this.log('=' .repeat(30), 'blue');

    if (this.issues.length === 0) {
      this.log('✅ All buttons are consistent and compliant!', 'green');
      return;
    }

    // Group issues by type
    const issueTypes = {};
    this.issues.forEach(issue => {
      if (!issueTypes[issue.type]) {
        issueTypes[issue.type] = [];
      }
      issueTypes[issue.type].push(issue);
    });

    for (const [type, issues] of Object.entries(issueTypes)) {
      this.log(`\n❌ ${type.toUpperCase()} (${issues.length} issues):`, 'red');
      issues.forEach(issue => {
        this.log(`   📄 ${issue.file} - ${issue.element}: ${issue.message}`, 'yellow');
      });
    }

    this.log(`\n🔧 Found ${this.fixes.length} automatic fixes available`, 'blue');
  }

  async applyFixes() {
    this.log('\n🔧 Applying automatic fixes...', 'bright');

    const fileChanges = {};

    // Group fixes by file
    this.fixes.forEach(fix => {
      if (!fileChanges[fix.file]) {
        fileChanges[fix.file] = [];
      }
      fileChanges[fix.file].push(fix);
    });

    // Apply fixes file by file
    for (const [fileName, fixes] of Object.entries(fileChanges)) {
      let content = fs.readFileSync(fileName, 'utf8');
      let changed = false;

      for (const fix of fixes) {
        if (fix.type === 'fix-invalid-class') {
          const oldPattern = new RegExp(`class="([^"]*?)${fix.oldClass}([^"]*?)"`, 'g');
          const newContent = content.replace(oldPattern, (match, before, after) => {
            return `class="${before}${fix.newClass}${after}"`;
          });
          
          if (newContent !== content) {
            content = newContent;
            changed = true;
            this.log(`✅ Fixed invalid class in ${fileName}: ${fix.oldClass} → ${fix.newClass}`, 'green');
          }
        } else if (fix.type === 'fix-inline-styles') {
          // This would require more complex DOM manipulation
          this.log(`⚠️  Manual fix needed in ${fileName}: Replace inline styles with ${fix.suggestedClass}`, 'yellow');
        }
      }

      if (changed) {
        fs.writeFileSync(fileName, content);
        this.log(`💾 Updated ${fileName}`, 'green');
      }
    }
  }
}

// Run validation
async function main() {
  const validator = new ButtonValidator();
  const success = await validator.validate();
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ButtonValidator;