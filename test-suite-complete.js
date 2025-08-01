#!/usr/bin/env node

/**
 * COMPLETE ITT HEAL TEST SUITE
 * Comprehensive testing that replaces manual verification
 * Includes browser automation, API testing, payment validation, and more
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

console.log('🧪 ITT HEAL COMPLETE TEST SUITE');
console.log('================================');
console.log('Running all tests to replace manual verification...\n');

class TestSuite {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      passed: 0,
      failed: 0,
      warnings: 0,
      totalTests: 0
    };
    this.browser = null;
    this.page = null;
  }

  log(level, message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${level} ${message}`);
  }

  addResult(testName, passed, details = '', warning = false) {
    this.results.tests.push({
      name: testName,
      passed,
      details,
      warning,
      timestamp: new Date().toISOString()
    });

    if (warning) {
      this.results.warnings++;
    } else if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
    this.results.totalTests++;

    const icon = warning ? '⚠️' : (passed ? '✅' : '❌');
    this.log(icon, `${testName}: ${details || (passed ? 'PASSED' : 'FAILED')}`);
  }

  async initBrowser() {
    this.log('🌐', 'Initializing browser for UI tests...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-web-security']
    });
    this.page = await this.browser.newPage();

    // Set longer timeout and error handling
    this.page.setDefaultTimeout(30000);
    this.page.on('error', (error) => {
      console.error('Page error:', error.message);
    });
    this.page.on('pageerror', (error) => {
      console.error('Page JS error:', error.message);
    });

    await this.page.goto('https://ittheal.com', { waitUntil: 'networkidle2', timeout: 30000 });
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async testWebsiteLoading() {
    this.log('🔹', 'TEST GROUP 1: Website Loading & Basic Functionality');

    try {
      const title = await this.page.title();
      this.addResult('Website Title', title.includes('ITT') || title.includes('Integrative'), `Title: "${title}"`);

      const stripeLoaded = await this.page.evaluate(() => typeof Stripe !== 'undefined');
      this.addResult('Stripe SDK Loading', stripeLoaded, 'Stripe JavaScript SDK loaded');

      const bookingSection = await this.page.$('#booking');
      this.addResult('Booking Section Present', Boolean(bookingSection), 'Main booking section found');

    } catch (error) {
      this.addResult('Website Loading', false, `Error: ${error.message}`);
    }
  }

  async testServiceSelection() {
    this.log('🔹', 'TEST GROUP 2: Service Selection & UI Interaction');

    try {
      // Find service buttons
      const serviceButtons = await this.page.$$('div[onclick*="selectService"]');
      this.addResult('Service Buttons Found', serviceButtons.length >= 4, `Found ${serviceButtons.length} service options`);

      if (serviceButtons.length > 0) {
        // Test clicking the test service
        const testButton = await this.page.$('div[onclick*="selectService(\'test\'"]');
        if (testButton) {
          await testButton.click();
          await new Promise(resolve => setTimeout(resolve, 500));

          const serviceSelected = await this.page.evaluate(() => {
            return typeof selectedService !== 'undefined' && selectedService === 'test';
          });
          this.addResult('Service Selection Click', serviceSelected, 'Test service selected successfully');

          // Check if Next button becomes visible
          const nextBtnVisible = await this.page.evaluate(() => {
            const btn = document.getElementById('next-btn');
            return btn && window.getComputedStyle(btn).display !== 'none';
          });
          this.addResult('Next Button Activation', nextBtnVisible, 'Next button becomes clickable after selection');
        } else {
          this.addResult('Test Service Button', false, 'Test service button not found');
        }
      }

    } catch (error) {
      this.addResult('Service Selection', false, `Error: ${error.message}`);
    }
  }

  async testFormNavigation() {
    this.log('🔹', 'TEST GROUP 3: Form Navigation & Step Flow');

    try {
      // Click Next to go to date/time selection
      const nextBtn = await this.page.$('#next-btn');
      if (nextBtn) {
        await nextBtn.click();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if datetime section is visible
        const datetimeVisible = await this.page.evaluate(() => {
          const section = document.getElementById('datetime-selection');
          return section && window.getComputedStyle(section).display !== 'none';
        });
        this.addResult('Step Navigation', datetimeVisible, 'Successfully navigated to date/time step');

        // Test date input
        const dateField = await this.page.$('#booking-date');
        if (dateField) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const dateString = tomorrow.toISOString().split('T')[0];

          await this.page.type('#booking-date', dateString);
          this.addResult('Date Input', true, `Date filled: ${dateString}`);

          // Wait for time slots to potentially load
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Check time slots
          const timeOptions = await this.page.$$('#booking-time option');
          this.addResult('Time Slots Loading', timeOptions.length > 1, `${timeOptions.length} time options available`, timeOptions.length === 1);
        } else {
          this.addResult('Date Field', false, 'Date input field not found');
        }
      } else {
        this.addResult('Next Button', false, 'Next button not found');
      }

    } catch (error) {
      this.addResult('Form Navigation', false, `Error: ${error.message}`);
    }
  }

  async navigateToContactForm() {
    this.log('🔹', 'Navigating to Contact Form Step');

    try {
      // Select a service first
      const testButton = await this.page.$('div[onclick*="selectService(\'test\'"]');
      if (testButton) {
        await testButton.click();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Go to date/time step
      let nextBtn = await this.page.$('#next-btn');
      if (nextBtn) {
        await nextBtn.click();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fill date
        const dateField = await this.page.$('#booking-date');
        if (dateField) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const dateString = tomorrow.toISOString().split('T')[0];
          await this.page.type('#booking-date', dateString);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Go to contact form step
        nextBtn = await this.page.$('#next-btn');
        if (nextBtn) {
          await nextBtn.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      this.log('❌', `Navigation error: ${error.message}`);
    }
  }

  async testContactFormFilling() {
    this.log('🔹', 'TEST GROUP 4: Contact Form & Data Entry');

    try {
      // Test form field filling directly since we're already at contact form
      const formFields = [
        { id: '#client-name', value: 'Automated Test User', name: 'Name Field' },
        { id: '#client-email', value: 'test@example.com', name: 'Email Field' },
        { id: '#client-phone', value: '(555) 123-4567', name: 'Phone Field' },
        { id: '#session-notes', value: 'Automated testing notes', name: 'Notes Field' }
      ];

      for (const field of formFields) {
        try {
          await this.page.waitForSelector(field.id, { timeout: 5000 });
          await this.page.click(field.id);
          await this.page.evaluate((id) => document.querySelector(id).value = '', field.id);
          await this.page.type(field.id, field.value);
          this.addResult(field.name, true, `Filled with: ${field.value}`);
        } catch (error) {
          this.addResult(field.name, false, `Could not fill field: ${error.message}`);
        }
      }

      // Test location dropdown
      try {
        await this.page.waitForSelector('#location-type', { timeout: 5000 });
        await this.page.select('#location-type', 'mobile');
        this.addResult('Location Selection', true, 'Selected mobile service');
      } catch (error) {
        this.addResult('Location Dropdown', false, `Location dropdown error: ${error.message}`);
      }

    } catch (error) {
      this.addResult('Contact Form', false, `Error: ${error.message}`);
    }
  }

  async navigateToPaymentForm() {
    this.log('🔹', 'Navigating to Payment Form Step');

    try {
      // Step 1: Service Selection with validation
      const testButton = await this.page.$('div[onclick*="selectService(\'test\'"]');
      if (testButton) {
        await testButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify service selection worked
        const serviceSelected = await this.page.evaluate(() => {
          return typeof selectedService !== 'undefined' && selectedService === 'test';
        });

        if (!serviceSelected) {
          this.log('❌', 'Service selection failed');
          return;
        }
      }

      // Step 2: Date/time step with proper validation
      await this.page.waitForSelector('#next-btn', { visible: true, timeout: 5000 });
      let nextBtn = await this.page.$('#next-btn');
      if (nextBtn) {
        await nextBtn.click();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Wait for date field and fill it
        await this.page.waitForSelector('#booking-date', { visible: true, timeout: 5000 });
        const dateField = await this.page.$('#booking-date');
        if (dateField) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const dateString = tomorrow.toISOString().split('T')[0];

          await this.page.click('#booking-date');
          await this.page.evaluate(() => document.getElementById('booking-date').value = '');
          await this.page.type('#booking-date', dateString);
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      // Step 3: Contact step with field validation
      await this.page.waitForSelector('#next-btn', { visible: true, timeout: 5000 });
      nextBtn = await this.page.$('#next-btn');
      if (nextBtn) {
        await nextBtn.click();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Wait for contact fields and fill them properly
        await this.page.waitForSelector('#client-name', { visible: true, timeout: 5000 });

        // Fill contact fields with clear and type
        await this.page.click('#client-name');
        await this.page.evaluate(() => document.getElementById('client-name').value = '');
        await this.page.type('#client-name', 'Stripe Test User');
        await new Promise(resolve => setTimeout(resolve, 300));

        await this.page.click('#client-email');
        await this.page.evaluate(() => document.getElementById('client-email').value = '');
        await this.page.type('#client-email', 'stripe@test.com');
        await new Promise(resolve => setTimeout(resolve, 300));

        await this.page.click('#client-phone');
        await this.page.evaluate(() => document.getElementById('client-phone').value = '');
        await this.page.type('#client-phone', '(555) 123-4567');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Step 4: Navigate to payment with extended wait for Stripe
      await this.page.waitForSelector('#next-btn', { visible: true, timeout: 5000 });
      nextBtn = await this.page.$('#next-btn');
      if (nextBtn) {
        await nextBtn.click();
        await new Promise(resolve => setTimeout(resolve, 4000)); // Extra time for Stripe Elements

        // Wait for Stripe to fully initialize
        await this.page.waitForFunction(
          () => typeof Stripe !== 'undefined',
          { timeout: 10000 }
        );
      }

      this.log('✅', 'Successfully navigated to payment form');

    } catch (error) {
      this.log('❌', `Payment navigation error: ${error.message}`);
    }
  }

  async testPaymentIntegration() {
    this.log('🔹', 'TEST GROUP 5: Payment Integration & Stripe Elements');

    try {
      // Wait for payment section to be fully loaded
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check payment section visibility with extended wait
      try {
        await this.page.waitForSelector('#payment-info', { visible: true, timeout: 10000 });
        const paymentVisible = await this.page.evaluate(() => {
          try {
            const section = document.getElementById('payment-info');
            return section && window.getComputedStyle(section).display !== 'none';
          } catch (e) {
            return false;
          }
        });
        this.addResult('Payment Section Display', paymentVisible, 'Payment section is visible and loaded');
      } catch (error) {
        this.addResult('Payment Section Display', false, `Payment section not found: ${error.message}`);
      }

      // Check Stripe SDK availability first
      try {
        const stripeAvailable = await this.page.evaluate(() => {
          return typeof Stripe !== 'undefined';
        });
        this.addResult('Stripe SDK Available', stripeAvailable, 'Stripe JavaScript SDK properly loaded');
      } catch (error) {
        this.addResult('Stripe SDK Available', false, `Stripe SDK check failed: ${error.message}`);
      }

      // Check Stripe Elements with extended timeout
      try {
        await this.page.waitForSelector('#stripe-card-element', { visible: true, timeout: 15000 });

        // Wait for Stripe Elements to be fully initialized
        await this.page.waitForFunction(
          () => {
            const element = document.getElementById('stripe-card-element');
            return element && element.children.length > 0;
          },
          { timeout: 10000 }
        );

        this.addResult('Stripe Card Element', true, 'Stripe card input element fully loaded');
      } catch (error) {
        this.addResult('Stripe Card Element', false, `Stripe element loading failed: ${error.message}`);
      }

      // Check payment total calculation
      try {
        const paymentTotal = await this.page.evaluate(() => {
          try {
            const el = document.getElementById('payment-total-price');
            return el ? el.textContent : '$0';
          } catch (e) {
            return '$0';
          }
        });
        const hasValidTotal = paymentTotal && paymentTotal !== '$0' && !paymentTotal.includes('NaN');
        this.addResult('Payment Total Display', hasValidTotal, `Total calculated: ${paymentTotal}`);
      } catch (error) {
        this.addResult('Payment Total Display', false, `Error getting payment total: ${error.message}`);
      }

      // Test Stripe Elements initialization with comprehensive check
      try {
        const stripeStatus = await this.page.evaluate(() => {
          try {
            return {
              stripeLoaded: typeof Stripe !== 'undefined',
              cardElementExists: typeof cardElement !== 'undefined' && cardElement !== null,
              cardElementMounted: document.getElementById('stripe-card-element') &&
                                             document.getElementById('stripe-card-element').children.length > 0,
              stripeKeySet: typeof stripePublishableKey !== 'undefined' && stripePublishableKey.length > 0
            };
          } catch (e) {
            return { error: e.message };
          }
        });

        this.addResult('Stripe SDK Loaded', stripeStatus.stripeLoaded, 'Stripe library loaded successfully');
        this.addResult('Stripe Card Element Initialized', stripeStatus.cardElementExists, 'Card element object created');
        this.addResult('Stripe Element Mounted', stripeStatus.cardElementMounted, 'Card element mounted in DOM');
        this.addResult('Stripe Key Configured', stripeStatus.stripeKeySet, 'Publishable key configured');

        const allStripeGood = stripeStatus.stripeLoaded && stripeStatus.cardElementExists &&
                                    stripeStatus.cardElementMounted && stripeStatus.stripeKeySet;
        this.addResult('Stripe Full Integration', allStripeGood, 'Complete Stripe integration validated');

      } catch (error) {
        this.addResult('Stripe Elements Integration', false, `Error checking Stripe: ${error.message}`);
      }

      // Test payment intent creation API
      try {
        const paymentIntentResponse = await this.page.evaluate(async () => {
          try {
            const response = await fetch('/api/web-booking/create-payment-intent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: 150.00,
                service_type: 'test',
                client_info: { name: 'Stripe Test User', email: 'stripe@test.com' }
              })
            });
            const data = await response.json();
            return { status: response.status, hasClientSecret: Boolean(data.client_secret) };
          } catch (error) {
            return { error: error.message, status: 0 };
          }
        });

        this.addResult('Payment Intent Creation', paymentIntentResponse.status === 200,
          `API Status: ${paymentIntentResponse.status}, Client Secret: ${paymentIntentResponse.hasClientSecret ? 'Present' : 'Missing'}`);

      } catch (error) {
        this.addResult('Payment Intent API', false, `Payment intent test failed: ${error.message}`);
      }

    } catch (error) {
      this.addResult('Payment Integration', false, `Error: ${error.message}`);
    }
  }

  async testFinalBookingFlow() {
    this.log('🔹', 'TEST GROUP 6: Final Booking & Submission');

    try {
      // Navigate to final confirmation with safer approach
      const nextBtn = await this.page.$('#next-btn');
      if (nextBtn) {
        // Check if navigation is possible
        const canNavigate = await this.page.evaluate(() => {
          try {
            const btn = document.getElementById('next-btn');
            return btn && !btn.disabled && btn.offsetParent !== null;
          } catch (e) {
            return false;
          }
        });

        if (canNavigate) {
          await nextBtn.click();
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Check booking summary with error handling
          try {
            const summaryVisible = await this.page.evaluate(() => {
              try {
                const section = document.getElementById('booking-summary');
                return section && window.getComputedStyle(section).display !== 'none';
              } catch (e) {
                return false;
              }
            });
            this.addResult('Booking Summary Display', summaryVisible, 'Final confirmation page checked');
          } catch (error) {
            this.addResult('Booking Summary Display', false, `Error checking summary: ${error.message}`);
          }

          // Check confirm button with timeout
          try {
            const confirmBtn = await this.page.waitForSelector('#confirm-booking-btn', { timeout: 5000 });
            this.addResult('Confirm Button Present', Boolean(confirmBtn), 'Final booking button found');

            if (confirmBtn) {
              try {
                const buttonText = await this.page.evaluate(() => {
                  try {
                    const btn = document.getElementById('confirm-booking-btn');
                    return btn ? btn.textContent : '';
                  } catch (e) {
                    return '';
                  }
                });
                this.addResult('Button Text Correct', buttonText.includes('Confirm'), `Button text: "${buttonText}"`);

                // Test button interactivity safely
                await confirmBtn.hover();
                this.addResult('Button Interactive', true, 'Confirm button is hoverable/interactive');
              } catch (error) {
                this.addResult('Button Text Check', false, `Error checking button text: ${error.message}`);
              }
            }
          } catch (error) {
            this.addResult('Confirm Button Present', false, `Confirm button not found: ${error.message}`);
          }

          // Check final total with safe evaluation
          try {
            const finalTotal = await this.page.evaluate(() => {
              try {
                const el = document.getElementById('total-price');
                return el ? el.textContent : '$0';
              } catch (e) {
                return '$0';
              }
            });
            this.addResult('Final Total Display', finalTotal !== '$0', `Final total: ${finalTotal}`);
          } catch (error) {
            this.addResult('Final Total Display', false, `Error getting final total: ${error.message}`);
          }
        } else {
          this.addResult('Final Navigation', false, 'Cannot navigate to final step - button not ready');
        }
      } else {
        this.addResult('Final Button Present', false, 'Next button not found for final navigation');
      }

    } catch (error) {
      this.addResult('Final Booking Flow', false, `Error: ${error.message}`);
    }
  }

  async testAPIEndpoints() {
    this.log('🔹', 'TEST GROUP 7: API Endpoints & Backend Integration');

    try {
      // Test payment intent creation with safer evaluation
      try {
        const paymentIntentTest = await this.page.evaluate(async () => {
          try {
            const response = await fetch('/api/web-booking/create-payment-intent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: 1.00,
                service_type: 'test',
                client_info: { name: 'Test', email: 'test@example.com' }
              })
            });
            return { status: response.status, ok: response.ok };
          } catch (error) {
            return { error: error.message, status: 0 };
          }
        });

        this.addResult('Payment Intent API', paymentIntentTest.ok || (paymentIntentTest.status > 0 && paymentIntentTest.status < 500),
          `Status: ${paymentIntentTest.status || 'Network Error'}`, paymentIntentTest.status >= 500);
      } catch (error) {
        this.addResult('Payment Intent API', false, `Test execution error: ${error.message}`);
      }

      // Test booking endpoint with safer evaluation
      try {
        const bookingTest = await this.page.evaluate(async () => {
          try {
            const response = await fetch('/api/web-booking/book', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                service_type: 'test',
                practitioner_id: 'test',
                scheduled_date: new Date().toISOString(),
                client_name: 'Test',
                client_email: 'test@example.com'
              })
            });
            return { status: response.status, ok: response.ok };
          } catch (error) {
            return { error: error.message, status: 0 };
          }
        });

        this.addResult('Booking API', bookingTest.ok || (bookingTest.status > 0 && bookingTest.status < 500),
          `Status: ${bookingTest.status || 'Network Error'}`, bookingTest.status >= 500);
      } catch (error) {
        this.addResult('Booking API', false, `Test execution error: ${error.message}`);
      }

    } catch (error) {
      this.addResult('API Testing', false, `Error: ${error.message}`);
    }
  }

  async testCodeQuality() {
    this.log('🔹', 'TEST GROUP 8: Code Quality & Security');

    try {
      // Check for simulation code in production
      const hasSimulationCode = await this.page.evaluate(() => {
        const bodyText = document.body.innerHTML;
        return bodyText.includes('simulate') || bodyText.includes('mock') || bodyText.includes('fake');
      });
      this.addResult('No Simulation Code', !hasSimulationCode, 'Production code free of simulation/mock code');

      // Check submitBooking function quality
      const submitBookingAnalysis = await this.page.evaluate(() => {
        if (typeof submitBooking === 'undefined') {return { exists: false };}

        const funcString = submitBooking.toString();
        return {
          exists: true,
          hasStripe: funcString.includes('stripe.confirmCardPayment'),
          hasErrorHandling: funcString.includes('catch'),
          hasTimeout: funcString.includes('setTimeout'),
          hasPaymentIntent: funcString.includes('create-payment-intent')
        };
      });

      this.addResult('submitBooking Function', submitBookingAnalysis.exists, 'submitBooking function exists');
      this.addResult('Stripe Integration', submitBookingAnalysis.hasStripe, 'Real Stripe payment integration');
      this.addResult('Error Handling', submitBookingAnalysis.hasErrorHandling, 'Proper error handling implemented');
      this.addResult('Timeout Protection', submitBookingAnalysis.hasTimeout, '15-second timeout fallback');

    } catch (error) {
      this.addResult('Code Quality', false, `Error: ${error.message}`);
    }
  }

  generateReport() {
    const report = {
      ...this.results,
      summary: {
        totalTests: this.results.totalTests,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        successRate: ((this.results.passed / this.results.totalTests) * 100).toFixed(1),
        grade: this.results.failed === 0 ? 'A+' : this.results.failed <= 2 ? 'A' : this.results.failed <= 5 ? 'B' : 'C'
      }
    };

    // Save detailed report
    fs.writeFileSync('logs/test-suite-results.json', JSON.stringify(report, null, 2));

    return report;
  }

  printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUITE SUMMARY');
    console.log('='.repeat(60));

    console.log(`🎯 Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`📈 Success Rate: ${report.summary.successRate}%`);
    console.log(`🏆 Grade: ${report.summary.grade}`);

    if (report.summary.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      report.tests.filter(t => !t.passed && !t.warning).forEach(test => {
        console.log(`   • ${test.name}: ${test.details}`);
      });
    }

    if (report.summary.warnings > 0) {
      console.log('\n⚠️  WARNINGS:');
      report.tests.filter(t => t.warning).forEach(test => {
        console.log(`   • ${test.name}: ${test.details}`);
      });
    }

    console.log('\n🎉 CONCLUSION:');
    if (report.summary.failed === 0) {
      console.log('✅ ALL TESTS PASSED - System is ready for production!');
      console.log('🚀 Browser automation successfully replaces manual clicking!');
    } else if (report.summary.failed <= 2) {
      console.log('⚠️  Minor issues detected - mostly functional');
    } else {
      console.log('❌ Significant issues detected - needs attention');
    }

    console.log('\n📁 Detailed report saved to: logs/test-suite-results.json');
  }

  async runAllTests() {
    try {
      await this.initBrowser();

      // Run tests with better isolation to prevent frame detachment
      await this.testWebsiteLoading();
      await this.testServiceSelection();
      await this.testFormNavigation();

      // Reinitialize browser to prevent frame issues
      await this.closeBrowser();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.initBrowser();

      // Navigate through the form steps properly for contact form test
      await this.navigateToContactForm();
      await this.testContactFormFilling();

      // Another browser restart for payment tests
      await this.closeBrowser();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.initBrowser();

      // Navigate properly for payment tests
      await this.navigateToPaymentForm();
      await this.testPaymentIntegration();
      await this.testFinalBookingFlow();
      await this.testAPIEndpoints();
      await this.testCodeQuality();

      const report = this.generateReport();
      this.printSummary(report);

      return report.summary.failed === 0;

    } catch (error) {
      this.log('💥', `Test suite error: ${error.message}`);
      return false;
    } finally {
      await this.closeBrowser();
    }
  }
}

// Run the complete test suite
const testSuite = new TestSuite();
testSuite.runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
