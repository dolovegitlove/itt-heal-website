#!/usr/bin/env node

/**
 * CSS Class Validation Script for ITT Heal
 * Validates CSS classes work with both Tailwind and luxury-spa.css
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

class CSSValidator {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.htmlFiles = [];
    this.cssContent = '';
    this.tailwindClasses = new Set();
    this.customClasses = new Set();
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async validate() {
    this.log('\n🎨 CSS Validation for Tailwind + Luxury Spa CSS', 'bright');
    this.log('=' .repeat(50), 'blue');

    // Load CSS files
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
    try {
      // Load luxury-spa.css
      const cssPath = path.join(__dirname, 'dist', 'luxury-spa.css');
      if (fs.existsSync(cssPath)) {
        this.cssContent = fs.readFileSync(cssPath, 'utf8');
        this.extractCustomClasses();
        this.log('✅ Loaded luxury-spa.css', 'green');
      } else {
        this.log('⚠️  luxury-spa.css not found', 'yellow');
      }

      // Common Tailwind classes (since we're using CDN)
      this.initializeTailwindClasses();

    } catch (error) {
      this.log(`❌ Error loading CSS: ${error.message}`, 'red');
    }
  }

  extractCustomClasses() {
    // Extract class selectors from CSS
    const classRegex = /\.([a-zA-Z0-9_-]+)(?:[:\s\[\{])/g;
    let match;
    while ((match = classRegex.exec(this.cssContent)) !== null) {
      this.customClasses.add(match[1]);
    }
  }

  initializeTailwindClasses() {
    // Common Tailwind utility classes
    const tailwindPrefixes = [
      'flex', 'grid', 'block', 'inline', 'hidden',
      'p-', 'px-', 'py-', 'pt-', 'pb-', 'pl-', 'pr-',
      'm-', 'mx-', 'my-', 'mt-', 'mb-', 'ml-', 'mr-',
      'w-', 'h-', 'min-w-', 'min-h-', 'max-w-', 'max-h-',
      'text-', 'font-', 'bg-', 'border-', 'rounded-',
      'shadow-', 'opacity-', 'z-', 'gap-', 'space-',
      'items-', 'justify-', 'self-', 'content-',
      'md:', 'lg:', 'xl:', 'sm:', 'hover:', 'focus:',
      'bg-spa-', 'text-spa-' // Our custom Tailwind colors
    ];

    // Add common patterns
    tailwindPrefixes.forEach(prefix => {
      this.tailwindClasses.add(prefix);
    });
  }

  findHTMLFiles() {
    const searchDirs = [__dirname];
    const ignorePatterns = [
      'node_modules',
      'logs',
      '.git',
      'dist',
      'd'
    ];

    const findFiles = (dir) => {
      try {
        const files = fs.readdirSync(dir);

        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !ignorePatterns.includes(file)) {
            findFiles(fullPath);
          } else if (file.endsWith('.html')) {
            this.htmlFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    findFiles(__dirname);
    this.log(`\n📁 Found ${this.htmlFiles.length} HTML files to validate`, 'blue');
  }

  async validateHTMLFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const dom = new JSDOM(content);
      const document = dom.window.document;
      const fileName = path.basename(filePath);

      this.log(`\n🔍 Checking: ${fileName}`, 'yellow');

      // Find all elements with class attributes
      const elementsWithClasses = document.querySelectorAll('[class]');

      for (const element of elementsWithClasses) {
        const classes = element.className.split(/\s+/).filter(c => c);

        for (const className of classes) {
          this.validateClass(className, element, fileName);
        }
      }

      // Check for common CSS issues
      this.checkCommonIssues(document, fileName);

    } catch (error) {
      this.log(`❌ Error validating ${filePath}: ${error.message}`, 'red');
    }
  }

  validateClass(className, element, fileName) {
    // Skip empty classes
    if (!className) {return;}

    // Check if it's a valid Tailwind class
    const isTailwind = this.isTailwindClass(className);

    // Check if it's in our custom CSS
    const isCustom = this.customClasses.has(className);

    // Check if it's a responsive/variant Tailwind class
    const isResponsive = className.includes(':');

    if (!isTailwind && !isCustom && !isResponsive) {
      // Check if it might be a component class that should exist
      if (this.shouldBeCustomClass(className)) {
        this.issues.push({
          type: 'missing-class',
          file: fileName,
          className: className,
          element: element.tagName.toLowerCase(),
          message: `Class "${className}" not found in luxury-spa.css or Tailwind`
        });

        // Suggest a fix
        this.fixes.push({
          type: 'add-class',
          className: className,
          suggestion: this.generateClassSuggestion(className, element)
        });
      }
    }
  }

  isTailwindClass(className) {
    // Check if it matches common Tailwind patterns
    for (const prefix of this.tailwindClasses) {
      if (className.startsWith(prefix)) {
        return true;
      }
    }

    // Check for full utility classes
    const commonUtilities = [
      'flex', 'block', 'inline-block', 'hidden', 'relative', 'absolute',
      'fixed', 'sticky', 'container', 'mx-auto', 'text-center', 'text-left',
      'text-right', 'font-bold', 'font-normal', 'italic', 'underline'
    ];

    return commonUtilities.includes(className);
  }

  shouldBeCustomClass(className) {
    // Patterns that indicate custom classes
    const customPatterns = [
      'spa-', 'luxury-', 'btn-', 'card-', 'modal-', 'form-',
      'header-', 'nav-', 'hero-', 'section-', 'footer-'
    ];

    return customPatterns.some(pattern => className.includes(pattern));
  }

  generateClassSuggestion(className, element) {
    // Generate CSS based on the class name and element type
    let css = `.${className} {\n`;

    if (className.includes('btn') || element.tagName === 'BUTTON') {
      css += `  /* Button styling */
  padding: var(--space-md) var(--space-lg);
  background-color: var(--spa-sage-dark);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-family: 'Playfair Display', serif;
  cursor: pointer;
  transition: all 0.3s ease;\n`;
    } else if (className.includes('card')) {
      css += `  /* Card styling */
  background-color: white;
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);\n`;
    } else {
      css += '  /* Add your styles here */\n';
    }

    css += '}\n';
    return css;
  }

  checkCommonIssues(document, fileName) {
    // Check for invisible buttons
    const buttons = document.querySelectorAll('button, .btn, [role="button"]');

    buttons.forEach(button => {
      const classes = button.className.split(/\s+/);
      const hasBackground = classes.some(c =>
        c.includes('bg-') ||
                this.customClasses.has(c) && this.cssContent.includes(`.${c}`) &&
                this.cssContent.includes('background')
      );

      if (!hasBackground && !button.style.backgroundColor) {
        this.issues.push({
          type: 'invisible-button',
          file: fileName,
          element: button.outerHTML.substring(0, 100),
          message: 'Button may be invisible (no background color)'
        });
      }
    });

    // Check for missing button text
    buttons.forEach(button => {
      if (!button.textContent.trim() && !button.getAttribute('aria-label')) {
        this.issues.push({
          type: 'missing-button-text',
          file: fileName,
          element: button.outerHTML.substring(0, 100),
          message: 'Button has no visible text or aria-label'
        });
      }
    });
  }

  reportResults() {
    this.log('\n📊 Validation Results', 'bright');
    this.log('=' .repeat(50), 'blue');

    if (this.issues.length === 0) {
      this.log('\n✅ All CSS validations passed!', 'green');
      this.log('Both Tailwind and luxury-spa.css are working correctly.', 'green');
    } else {
      this.log(`\n❌ Found ${this.issues.length} CSS issues:`, 'red');

      this.issues.forEach((issue, index) => {
        this.log(`\n${index + 1}. ${issue.type.toUpperCase()}`, 'yellow');
        this.log(`   File: ${issue.file}`);
        this.log(`   ${issue.message}`);
        if (issue.className) {
          this.log(`   Class: ${issue.className}`);
        }
      });
    }
  }

  async applyFixes() {
    if (this.fixes.length === 0) {return;}

    this.log('\n🔧 Applying CSS Fixes', 'bright');
    this.log('=' .repeat(50), 'blue');

    const cssPath = path.join(__dirname, 'dist', 'luxury-spa.css');
    let cssContent = this.cssContent;

    // Group fixes by type
    const classesToAdd = this.fixes.filter(f => f.type === 'add-class');

    if (classesToAdd.length > 0) {
      this.log(`\n📝 Adding ${classesToAdd.length} missing classes to luxury-spa.css:`, 'yellow');

      // Add new classes at the end of the file
      cssContent += '\n\n/* ===================================\n';
      cssContent += '   AUTO-GENERATED CLASSES\n';
      cssContent += '   Added by CSS validation script\n';
      cssContent += '   =================================== */\n\n';

      classesToAdd.forEach(fix => {
        this.log(`   + .${fix.className}`, 'green');
        cssContent += fix.suggestion + '\n';
      });

      // Write updated CSS
      try {
        fs.writeFileSync(cssPath, cssContent);
        this.log('\n✅ CSS file updated successfully!', 'green');
      } catch (error) {
        this.log(`\n❌ Error updating CSS file: ${error.message}`, 'red');
      }
    }
  }
}

// Run validation
if (require.main === module) {
  const validator = new CSSValidator();
  validator.validate().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = CSSValidator;
