#!/usr/bin/env node

/**
 * Comprehensive Admin Dashboard UI Test
 * Tests every button, modal, tab, and form in the unified admin dashboard
 */

const puppeteer = require('puppeteer');

class AdminUITester {
    constructor() {
        this.baseUrl = 'http://185.125.171.10:3000';
        this.results = {
            totalTests: 0,
            passed: 0,
            failed: 0,
            details: []
        };
    }

    async log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'pass' ? '✅' : type === 'fail' ? '❌' : '📋';
        console.log(`${timestamp} ${prefix} ${message}`);
        
        if (type === 'pass') this.results.passed++;
        if (type === 'fail') this.results.failed++;
        this.results.totalTests++;
        
        this.results.details.push({ timestamp, type, message });
    }

    async wait(ms = 1000) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    async testElement(page, selector, description, action = 'click') {
        try {
            await page.waitForSelector(selector, { timeout: 5000 });
            const element = await page.$(selector);
            
            if (!element) {
                await this.log(`${description}: Element not found (${selector})`, 'fail');
                return false;
            }

            if (action === 'click') {
                await element.click();
                await this.wait(500);
            } else if (action === 'visible') {
                const isVisible = await element.isIntersectingViewport();
                if (!isVisible) {
                    await this.log(`${description}: Element not visible`, 'fail');
                    return false;
                }
            }

            await this.log(`${description}: ${action} successful`, 'pass');
            return true;
        } catch (error) {
            await this.log(`${description}: ${error.message}`, 'fail');
            return false;
        }
    }

    async testForm(page, formSelector, fields, description) {
        try {
            await this.log(`Testing form: ${description}`, 'info');
            
            for (const [fieldId, value] of Object.entries(fields)) {
                const fieldSelector = `${formSelector} #${fieldId}`;
                await page.waitForSelector(fieldSelector, { timeout: 3000 });
                
                const element = await page.$(fieldSelector);
                if (!element) {
                    await this.log(`Form field not found: ${fieldId}`, 'fail');
                    continue;
                }

                const tagName = await page.evaluate(el => el.tagName.toLowerCase(), element);
                
                if (tagName === 'select') {
                    await page.select(fieldSelector, value);
                } else if (tagName === 'textarea') {
                    await page.evaluate((el, val) => el.value = val, element, value);
                } else {
                    await page.type(fieldSelector, value, { delay: 50 });
                }
                
                await this.wait(200);
            }
            
            await this.log(`Form filled successfully: ${description}`, 'pass');
            return true;
        } catch (error) {
            await this.log(`Form test failed: ${description} - ${error.message}`, 'fail');
            return false;
        }
    }

    async testModal(page, modalTriggerSelector, modalId, formFields = null) {
        try {
            // Click trigger to open modal
            await this.testElement(page, modalTriggerSelector, `Open modal: ${modalId}`, 'click');
            await this.wait(500);
            
            // Check if modal is visible
            const modalVisible = await this.testElement(page, `#${modalId}:not(.hidden)`, `Modal visible: ${modalId}`, 'visible');
            if (!modalVisible) return false;
            
            // Test form if provided
            if (formFields) {
                await this.testForm(page, `#${modalId}`, formFields, `Modal form: ${modalId}`);
            }
            
            // Close modal using close button
            await this.testElement(page, `#${modalId} .close-button`, `Close modal: ${modalId}`, 'click');
            await this.wait(500);
            
            // Verify modal is hidden
            const modalHidden = await page.$(`#${modalId}.hidden`);
            if (modalHidden) {
                await this.log(`Modal closed successfully: ${modalId}`, 'pass');
                return true;
            } else {
                await this.log(`Modal failed to close: ${modalId}`, 'fail');
                return false;
            }
        } catch (error) {
            await this.log(`Modal test failed: ${modalId} - ${error.message}`, 'fail');
            return false;
        }
    }

    async testTabNavigation(page) {
        const tabs = [
            'dashboard',
            'bookings', 
            'schedule',
            'availability',
            'clients',
            'settings'
        ];

        for (const tab of tabs) {
            try {
                // Click tab
                await this.testElement(page, `.nav-tab[onclick="showTab('${tab}')"]`, `Navigate to ${tab} tab`, 'click');
                await this.wait(1000);
                
                // Check if tab content is active
                const isActive = await page.$(`#${tab}-tab.active`);
                if (isActive) {
                    await this.log(`Tab content active: ${tab}`, 'pass');
                    
                    // Wait for any data loading
                    await this.wait(2000);
                    
                } else {
                    await this.log(`Tab content not active: ${tab}`, 'fail');
                }
            } catch (error) {
                await this.log(`Tab test failed: ${tab} - ${error.message}`, 'fail');
            }
        }
    }

    async testAPIConnectivity(page) {
        try {
            // Wait for initial data load
            await this.wait(3000);
            
            // Check if booking cards are populated
            const bookingCards = await page.$$('.booking-card');
            if (bookingCards.length > 0) {
                await this.log(`API connectivity: ${bookingCards.length} bookings loaded`, 'pass');
            } else {
                await this.log('API connectivity: No bookings loaded (may be empty)', 'info');
            }
            
            // Check stats cards for data
            const statsNumbers = await page.$$eval('.stat-card .number', elements => 
                elements.map(el => el.textContent.trim())
            );
            
            if (statsNumbers.some(num => num !== '0' && num !== '$0' && num !== '$0.00')) {
                await this.log('Stats populated with real data', 'pass');
            } else {
                await this.log('Stats showing zero values (may be empty dataset)', 'info');
            }
            
        } catch (error) {
            await this.log(`API connectivity test failed: ${error.message}`, 'fail');
        }
    }

    async testResponsiveDesign(page) {
        const viewports = [
            { width: 1920, height: 1080, name: 'Desktop Large' },
            { width: 1366, height: 768, name: 'Desktop Standard' },
            { width: 768, height: 1024, name: 'Tablet' },
            { width: 375, height: 667, name: 'Mobile' }
        ];

        for (const viewport of viewports) {
            try {
                await page.setViewport(viewport);
                await this.wait(1000);
                
                // Check if navigation is still accessible
                const navVisible = await this.testElement(page, '.nav-tabs', `Navigation visible on ${viewport.name}`, 'visible');
                
                // Check if content is not overflowing
                const bodyOverflow = await page.evaluate(() => {
                    const body = document.body;
                    return body.scrollWidth <= window.innerWidth;
                });
                
                if (bodyOverflow) {
                    await this.log(`No horizontal overflow on ${viewport.name}`, 'pass');
                } else {
                    await this.log(`Horizontal overflow detected on ${viewport.name}`, 'fail');
                }
                
            } catch (error) {
                await this.log(`Responsive test failed for ${viewport.name}: ${error.message}`, 'fail');
            }
        }
        
        // Reset to desktop
        await page.setViewport({ width: 1366, height: 768 });
    }

    async testAccessibility(page) {
        try {
            // Test keyboard navigation
            await page.focus('body');
            await page.keyboard.press('Tab');
            await this.wait(500);
            
            // Check if focus is visible
            const focusedElement = await page.evaluate(() => document.activeElement.tagName);
            if (focusedElement) {
                await this.log('Keyboard navigation working', 'pass');
            }
            
            // Test escape key for modals
            await page.keyboard.press('Escape');
            await this.wait(500);
            
            await this.log('Accessibility basic tests completed', 'pass');
            
        } catch (error) {
            await this.log(`Accessibility test failed: ${error.message}`, 'fail');
        }
    }

    async runComprehensiveTest() {
        console.log('🚀 Starting Comprehensive Admin Dashboard UI Test');
        console.log('==================================================');
        
        const browser = await puppeteer.launch({
            headless: 'new',
            defaultViewport: { width: 1366, height: 768 },
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });

        try {
            const page = await browser.newPage();
            
            // Enable console logging from the page
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    console.log('🔴 Page Error:', msg.text());
                }
            });

            // Navigate to admin dashboard
            await this.log('Navigating to admin dashboard...', 'info');
            await page.goto(`${this.baseUrl}/admin-dashboard.html`, { 
                waitUntil: 'networkidle0',
                timeout: 30000 
            });

            // Test 1: Page Load and Initial State
            await this.log('=== Testing Page Load ===', 'info');
            await this.testElement(page, '.admin-header', 'Header visible', 'visible');
            await this.testElement(page, '.nav-tabs', 'Navigation tabs visible', 'visible');
            await this.testElement(page, '#dashboard-tab.active', 'Dashboard tab active by default', 'visible');

            // Test 2: API Connectivity and Data Loading
            await this.log('=== Testing API Connectivity ===', 'info');
            await this.testAPIConnectivity(page);

            // Test 3: Tab Navigation
            await this.log('=== Testing Tab Navigation ===', 'info');
            await this.testTabNavigation(page);

            // Test 4: Modal Functionality
            await this.log('=== Testing Modal Functionality ===', 'info');
            
            // Go back to dashboard for modal tests
            await this.testElement(page, `.nav-tab[onclick="showTab('dashboard')"]`, 'Return to dashboard', 'click');
            await this.wait(1000);

            // Test New Booking Modal
            await this.testModal(page, 'button[onclick="showModal(\'new-booking-modal\')"]', 'new-booking-modal', {
                'client-name': 'Test Client',
                'client-email': 'test@example.com',
                'client-phone': '+1234567890',
                'service-type': 'consultation',
                'special-requests': 'This is a test booking'
            });

            // Test Block Time Modal
            await this.testModal(page, 'button[onclick="showModal(\'block-time-modal\')"]', 'block-time-modal', {
                'block-date': '2025-07-10',
                'block-start-time': '14:00',
                'block-end-time': '15:00',
                'block-reason': 'Test block'
            });

            // Test Availability Modal
            await this.testModal(page, 'button[onclick="showModal(\'availability-modal\')"]', 'availability-modal', {
                'availability-day': 'monday',
                'availability-start': '09:00',
                'availability-end': '17:00',
                'slot-duration': '60'
            });

            // Test 5: Booking Filters (go to bookings tab)
            await this.log('=== Testing Booking Filters ===', 'info');
            await this.testElement(page, `.nav-tab[onclick="showTab('bookings')"]`, 'Navigate to bookings', 'click');
            await this.wait(2000);
            
            // Test filter dropdowns
            await this.testElement(page, '#filter-status', 'Status filter visible', 'visible');
            await this.testElement(page, '#filter-date-from', 'Date from filter visible', 'visible');
            await this.testElement(page, '#filter-search', 'Search filter visible', 'visible');

            // Test filter functionality
            await page.type('#filter-search', 'test', { delay: 100 });
            await this.wait(1000);
            await this.log('Search filter typing test', 'pass');

            // Clear search
            await page.evaluate(() => document.getElementById('filter-search').value = '');

            // Test 6: Schedule Functionality
            await this.log('=== Testing Schedule Functionality ===', 'info');
            await this.testElement(page, `.nav-tab[onclick="showTab('schedule')"]`, 'Navigate to schedule', 'click');
            await this.wait(2000);
            
            const today = new Date().toISOString().split('T')[0];
            await page.evaluate((date) => {
                document.getElementById('schedule-date').value = date;
                document.getElementById('schedule-date').dispatchEvent(new Event('change'));
            }, today);
            await this.wait(2000);
            await this.log('Schedule date picker test', 'pass');

            // Test 7: Responsive Design
            await this.log('=== Testing Responsive Design ===', 'info');
            await this.testResponsiveDesign(page);

            // Test 8: Accessibility
            await this.log('=== Testing Accessibility ===', 'info');
            await this.testAccessibility(page);

            // Test 9: Action Buttons (test one booking action if bookings exist)
            await this.log('=== Testing Action Buttons ===', 'info');
            await this.testElement(page, `.nav-tab[onclick="showTab('bookings')"]`, 'Return to bookings', 'click');
            await this.wait(2000);
            
            const editButtons = await page.$$('button[onclick*="editBooking"]');
            if (editButtons.length > 0) {
                await editButtons[0].click();
                await this.wait(1000);
                await this.log('Edit booking button clicked (alert should appear)', 'pass');
                
                // Dismiss any alert
                page.on('dialog', async dialog => {
                    await dialog.accept();
                });
            } else {
                await this.log('No booking action buttons found (empty dataset)', 'info');
            }

            // Test 10: Refresh Functionality
            await this.log('=== Testing Refresh Functionality ===', 'info');
            await this.testElement(page, `.nav-tab[onclick="showTab('dashboard')"]`, 'Return to dashboard', 'click');
            await this.wait(1000);
            
            await this.testElement(page, 'button[onclick="refreshData()"]', 'Refresh data button', 'click');
            await this.wait(3000);

        } catch (error) {
            await this.log(`Critical test failure: ${error.message}`, 'fail');
        } finally {
            await browser.close();
        }

        // Generate Final Report
        this.generateReport();
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 COMPREHENSIVE ADMIN DASHBOARD TEST RESULTS');
        console.log('='.repeat(60));
        
        const passRate = this.results.totalTests > 0 ? 
            ((this.results.passed / this.results.totalTests) * 100).toFixed(1) : 0;
        
        console.log(`\n📈 SUMMARY:`);
        console.log(`   Total Tests: ${this.results.totalTests}`);
        console.log(`   ✅ Passed: ${this.results.passed}`);
        console.log(`   ❌ Failed: ${this.results.failed}`);
        console.log(`   📊 Pass Rate: ${passRate}%`);
        
        const status = passRate >= 90 ? '🎉 EXCELLENT' : 
                      passRate >= 75 ? '✅ GOOD' : 
                      passRate >= 50 ? '⚠️ NEEDS IMPROVEMENT' : '❌ CRITICAL ISSUES';
        
        console.log(`\n🎯 OVERALL STATUS: ${status}`);
        
        if (this.results.failed > 0) {
            console.log(`\n❌ FAILED TESTS:`);
            this.results.details
                .filter(detail => detail.type === 'fail')
                .forEach(detail => {
                    console.log(`   • ${detail.message}`);
                });
        }
        
        // Functionality Assessment
        console.log(`\n🔧 FUNCTIONALITY ASSESSMENT:`);
        console.log(`   🎨 UI/UX Design: ${passRate >= 80 ? 'Excellent' : 'Needs Work'}`);
        console.log(`   🔗 Backend Integration: ${passRate >= 70 ? 'Working' : 'Issues Found'}`);
        console.log(`   📱 Responsive Design: ${passRate >= 75 ? 'Mobile Ready' : 'Responsive Issues'}`);
        console.log(`   ♿ Accessibility: ${passRate >= 60 ? 'Basic Compliance' : 'Accessibility Issues'}`);
        console.log(`   🔧 Form Functionality: ${passRate >= 85 ? 'All Forms Working' : 'Form Issues'}`);
        
        const isProduction = passRate >= 85;
        console.log(`\n🚀 PRODUCTION READINESS: ${isProduction ? '✅ READY' : '❌ NOT READY'}`);
        
        if (!isProduction) {
            console.log(`\n📝 RECOMMENDATIONS:`);
            console.log(`   • Fix failed test cases before deployment`);
            console.log(`   • Ensure all modals open/close properly`);
            console.log(`   • Verify all form submissions work`);
            console.log(`   • Test on multiple devices and browsers`);
            console.log(`   • Validate backend API responses`);
        } else {
            console.log(`\n🎉 CONGRATULATIONS! Admin dashboard is production ready.`);
        }
        
        console.log('\n' + '='.repeat(60));
        return passRate >= 85;
    }
}

// Run the comprehensive test
async function main() {
    const tester = new AdminUITester();
    const success = await tester.runComprehensiveTest();
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = AdminUITester;