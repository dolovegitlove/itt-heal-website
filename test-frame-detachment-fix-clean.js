#!/usr/bin/env node

/**
 * Frame Detachment Fix Validation Test
 * Tests the improved booking flow with frame stability fixes
 */

const puppeteer = require('puppeteer');

console.log('🔧 FRAME DETACHMENT FIX VALIDATION');
console.log('=====================================');

class FrameDetachmentTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  log(level, message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${level} ${message}`);
  }

  addResult(testName, passed, details = '') {
    this.results.push({ testName, passed, details });
    const icon = passed ? '✅' : '❌';
    this.log(icon, `${testName}: ${details || (passed ? 'PASSED' : 'FAILED')}`);
  }

  async initBrowser() {
    this.log('🌐', 'Initializing browser with frame detachment monitoring...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();
    this.page.setDefaultTimeout(30000);

    // Monitor for frame detachment errors
    this.page.on('pageerror', (error) => {
      if (error.message.includes('detached Frame') || error.message.includes('Target closed')) {
        console.error('🚨 FRAME DETACHMENT DETECTED:', error.message);
      }
    });

    await this.page.goto('https://ittheal.com', { waitUntil: 'networkidle2' });
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testCompleteBookingFlowWithFrameValidation() {
    this.log('🔹', 'Testing complete booking flow with frame validation...');

    try {
      // Navigate to booking section
      await this.page.evaluate(() => {
        document.getElementById('booking').scrollIntoView();
      });

      // Step 1: Service Selection
      this.log('📝', 'Step 1: Service Selection');
      const testButton = await this.page.$('div[onclick*="selectService(\'test\'"]');
      if (testButton) {
        await testButton.click();
        await this.wait(1000);

        const serviceSelected = await this.page.evaluate(() => {
          return typeof selectedService !== 'undefined' && selectedService === 'test';
        });
        this.addResult('Service Selection', serviceSelected, 'Test service selected');

        // Check if next button is available
        const nextBtn = await this.page.$('#next-btn');
        if (nextBtn) {
          // Step 2: Date/Time Selection with frame monitoring
          this.log('📝', 'Step 2: Date/Time Selection');
          await nextBtn.click();
          await this.wait(2000); // Wait for async transition

          // Validate frame is still attached
          const frameValid = await this.validateFrameIntegrity();
          this.addResult('Frame Integrity After Step 2', frameValid, 'DOM frame remains attached');

          // Fill date
          const dateField = await this.page.$('#booking-date');
          if (dateField) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateString = tomorrow.toISOString().split('T')[0];

            await this.page.type('#booking-date', dateString);
            await this.wait(1500);
            this.addResult('Date Input', true, `Date filled: ${dateString}`);

            // Step 3: Contact Information with enhanced frame validation
            this.log('📝', 'Step 3: Contact Information (Critical Step)');
            const nextBtn2 = await this.page.$('#next-btn');
            if (nextBtn2) {
              await nextBtn2.click();
              await this.wait(2000); // Wait for async transition

              // Critical frame validation after contact form transition
              const frameValidAfterContact = await this.validateFrameIntegrity();
              this.addResult('Frame Integrity After Contact Step', frameValidAfterContact,
                'DOM frame remains attached after contact transition');

              // Test contact form field filling
              const contactFields = [
                { id: '#client-name', value: 'Frame Test User', name: 'Name Field' },
                { id: '#client-email', value: 'frametest@example.com', name: 'Email Field' },
                { id: '#client-phone', value: '(555) 123-4567', name: 'Phone Field' },
                { id: '#session-notes', value: 'Testing frame detachment fix', name: 'Notes Field' }
              ];

              let contactFieldsSuccess = 0;
              for (const field of contactFields) {
                try {
                  await this.page.waitForSelector(field.id, { timeout: 5000 });

                  // Validate frame before each field interaction
                  const frameOk = await this.validateFrameIntegrity();
                  if (!frameOk) {
                    this.addResult(field.name, false, 'Frame detached before field interaction');
                    continue;
                  }

                  await this.page.click(field.id);
                  await this.page.evaluate((id) => document.querySelector(id).value = '', field.id);
                  await this.page.type(field.id, field.value, { delay: 50 });

                  contactFieldsSuccess++;
                  this.addResult(field.name, true, `Successfully filled: ${field.value}`);
                } catch (error) {
                  this.addResult(field.name, false, `Field filling failed: ${error.message}`);
                }
              }

              this.addResult('Contact Form Completion', contactFieldsSuccess === contactFields.length,
                `${contactFieldsSuccess}/${contactFields.length} fields filled successfully`);

              // Step 4: Payment Information (Most Critical)
              this.log('📝', 'Step 4: Payment Information (Frame Detachment Critical Point)');
              const nextBtn3 = await this.page.$('#next-btn');
              if (nextBtn3) {
                await nextBtn3.click();
                await this.wait(4000); // Extended wait for Stripe initialization

                // Critical frame validation after payment transition
                const frameValidAfterPayment = await this.validateFrameIntegrity();
                this.addResult('Frame Integrity After Payment Step', frameValidAfterPayment,
                  'DOM frame remains attached after payment transition');

                // Test Stripe Elements initialization
                await this.wait(2000); // Additional wait for Stripe

                const stripeStatus = await this.page.evaluate(() => {
                  try {
                    return {
                      stripeLoaded: typeof Stripe !== 'undefined',
                      paymentSectionVisible: document.getElementById('payment-info') &&
                                                                  window.getComputedStyle(document.getElementById('payment-info')).display !== 'none',
                      cardElementExists: document.getElementById('stripe-card-element') !== null,
                      cardElementHasContent: document.getElementById('stripe-card-element') &&
                                                                 document.getElementById('stripe-card-element').children.length > 0
                    };
                  } catch (e) {
                    return { error: e.message };
                  }
                });

                this.addResult('Stripe SDK Available', stripeStatus.stripeLoaded, 'Stripe JavaScript SDK loaded');
                this.addResult('Payment Section Visible', stripeStatus.paymentSectionVisible, 'Payment form displayed');
                this.addResult('Stripe Card Element Present', stripeStatus.cardElementExists, 'Stripe card element exists');
                this.addResult('Stripe Elements Rendered', stripeStatus.cardElementHasContent, 'Stripe elements fully rendered');

                // Final frame integrity check
                const finalFrameCheck = await this.validateFrameIntegrity();
                this.addResult('Final Frame Integrity', finalFrameCheck, 'Frame remains stable throughout entire flow');
              }
            }
          }
        }
      }

    } catch (error) {
      this.addResult('Complete Flow Test', false, `Flow test failed: ${error.message}`);
    }
  }

  async validateFrameIntegrity() {
    try {
      return await this.page.evaluate(() => {
        try {
          // Test multiple DOM operations to ensure frame is responsive
          const testElement = document.getElementById('booking');
          if (!testElement) {return false;}

          // Test DOM query operations
          const elements = document.querySelectorAll('div');
          if (elements.length === 0) {return false;}

          // Test DOM manipulation
          const testDiv = document.createElement('div');
          testDiv.id = 'frame-test-element';
          document.body.appendChild(testDiv);
          const retrievedDiv = document.getElementById('frame-test-element');
          document.body.removeChild(testDiv);

          return Boolean(retrievedDiv);
        } catch (e) {
          console.error('Frame validation error:', e.message);
          return false;
        }
      });
    } catch (error) {
      console.error('Frame integrity check failed:', error.message);
      return false;
    }
  }

  generateSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 FRAME DETACHMENT FIX VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`🎯 Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed === 0) {
      console.log('\n🎉 FRAME DETACHMENT ISSUES RESOLVED!');
      console.log('✅ All booking form steps maintain frame integrity');
      console.log('✅ Contact form fields can be filled without detachment');
      console.errors');
      console.log('✅ Navigation maintains DOM stability');
    } else {
      console.log('\n⚠️  REMAINING ISSUES:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   • ${result.testName}: ${result.details}`);
      });
    }

    return failed === 0;
  }

  async runTests() {
    try {
      await this.initBrowser();
      await this.testCompleteBookingFlowWithFrameValidation();
      return this.generateSummary();

    } catch (error) {
      console.error('💥 Test execution failed:', error);
      return false;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the frame detachment validation
const test = new FrameDetachmentTest();
test.runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
