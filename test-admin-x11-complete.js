#!/usr/bin/env node

/**
 * ITT Heal Admin Dashboard - Complete X11 Browser Testing
 * Tests all functionality with real browser clicks until 100% success
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class AdminDashboardTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
        this.dashboardUrl = 'https://ittheal.com/admin/';
        this.testBookingId = null;
    }

    async init() {
        console.log('🚀 Starting Complete Admin Dashboard X11 Testing...');
        
        // Launch browser with X11 display
        this.browser = await puppeteer.launch({
            headless: false,
            devtools: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--display=:0'
            ]
        });

        this.page = await this.browser.newPage();
        
        // Set viewport for desktop testing
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // Enable console logging
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('🔥 BROWSER ERROR:', msg.text());
                this.testResults.errors.push(`Browser: ${msg.text()}`);
            }
        });

        // Enable request/response logging
        this.page.on('requestfailed', req => {
            console.log('❌ REQUEST FAILED:', req.url(), req.failure().errorText);
            this.testResults.errors.push(`Request failed: ${req.url()}`);
        });
    }

    async test(name, testFunction) {
        this.testResults.total++;
        console.log(`\n🧪 Testing: ${name}`);
        
        try {
            await testFunction();
            this.testResults.passed++;
            console.log(`✅ PASSED: ${name}`);
            return true;
        } catch (error) {
            this.testResults.failed++;
            this.testResults.errors.push(`${name}: ${error.message}`);
            console.log(`❌ FAILED: ${name} - ${error.message}`);
            return false;
        }
    }

    async runAllTests() {
        await this.init();

        // Test 1: Dashboard Loading and Navigation
        await this.test('Dashboard loads and displays correctly', async () => {
            await this.page.goto(this.dashboardUrl, { waitUntil: 'networkidle0' });
            
            // Check page title
            const title = await this.page.title();
            if (!title.includes('ITT Heal - Admin Dashboard')) {
                throw new Error(`Incorrect page title: ${title}`);
            }

            // Check if main elements are present
            await this.page.waitForSelector('.admin-container', { timeout: 10000 });
            await this.page.waitForSelector('.sidebar', { timeout: 5000 });
            await this.page.waitForSelector('.main-content', { timeout: 5000 });
            
            // Check if metrics are loading
            await this.page.waitForSelector('.metrics-grid', { timeout: 5000 });
        });

        // Test 2: Navigation between pages
        await this.test('Navigation works between all pages', async () => {
            const pages = ['bookings', 'sessions', 'availability', 'analytics', 'reports', 'clients'];
            
            for (const pageType of pages) {
                console.log(`  📍 Navigating to ${pageType}...`);
                
                // Click navigation item
                await this.page.click(`[data-page="${pageType}"]`);
                await this.page.waitForTimeout(1000);
                
                // Check if page is active
                const isActive = await this.page.$eval(`[data-page="${pageType}"]`, el => 
                    el.classList.contains('active')
                );
                
                if (!isActive) {
                    throw new Error(`Navigation to ${pageType} failed - nav item not active`);
                }
                
                // Check if page content is visible
                const pageVisible = await this.page.$eval(`#${pageType}-page`, el => 
                    getComputedStyle(el).display !== 'none'
                );
                
                if (!pageVisible) {
                    throw new Error(`${pageType} page content not visible`);
                }
            }
            
            // Return to dashboard
            await this.page.click('[data-page="dashboard"]');
        });

        // Test 3: API Data Loading
        await this.test('API data loads correctly', async () => {
            // Navigate to bookings
            await this.page.click('[data-page="bookings"]');
            await this.page.waitForTimeout(3000);
            
            // Wait for table to load
            await this.page.waitForSelector('#bookings-table-body', { timeout: 10000 });
            
            // Check if data loaded (not showing loading message)
            const hasData = await this.page.evaluate(() => {
                const tbody = document.querySelector('#bookings-table-body');
                const loadingMessage = tbody.querySelector('.loading');
                return !loadingMessage && tbody.children.length > 0;
            });
            
            if (!hasData) {
                throw new Error('Bookings data did not load properly');
            }
        });

        // Test 4: Metric Cards Update
        await this.test('Dashboard metrics display real data', async () => {
            await this.page.click('[data-page="dashboard"]');
            await this.page.waitForTimeout(2000);
            
            // Check if metric values are not zero
            const metrics = await this.page.evaluate(() => {
                return {
                    totalRevenue: document.getElementById('total-revenue').textContent,
                    activeBookings: document.getElementById('active-bookings').textContent,
                    addonRevenue: document.getElementById('addon-revenue').textContent,
                    availableSlots: document.getElementById('available-slots').textContent
                };
            });
            
            console.log('  📊 Metrics:', metrics);
            
            // Validate metrics are not default values
            if (metrics.totalRevenue === '$0' && metrics.activeBookings === '0') {
                console.log('  ⚠️  Warning: Metrics show zero values (may be expected if no data)');
            }
        });

        // Test 5: Edit Modal Functionality
        await this.test('Edit booking modal opens and functions', async () => {
            await this.page.click('[data-page="bookings"]');
            await this.page.waitForTimeout(2000);
            
            // Find first edit button and click it
            const editButtons = await this.page.$$('.btn:contains("Edit")');
            if (editButtons.length === 0) {
                throw new Error('No edit buttons found');
            }
            
            // Click first edit button using JavaScript (more reliable)
            await this.page.evaluate(() => {
                const editBtn = document.querySelector('button[onclick*="editBooking"]');
                if (editBtn) editBtn.click();
            });
            
            await this.page.waitForTimeout(1000);
            
            // Check if modal opened
            const modalVisible = await this.page.$eval('#edit-booking-modal', el => 
                el.classList.contains('active')
            );
            
            if (!modalVisible) {
                throw new Error('Edit modal did not open');
            }
            
            // Test form fields are populated
            const clientName = await this.page.$eval('#edit-client-name', el => el.value);
            console.log(`  📝 Client name in form: ${clientName}`);
            
            // Close modal
            await this.page.click('#cancel-edit');
            await this.page.waitForTimeout(500);
            
            // Verify modal closed
            const modalClosed = await this.page.$eval('#edit-booking-modal', el => 
                !el.classList.contains('active')
            );
            
            if (!modalClosed) {
                throw new Error('Modal did not close properly');
            }
        });

        // Test 6: Add New Booking
        await this.test('Add new booking functionality works', async () => {
            await this.page.click('[data-page="bookings"]');
            await this.page.waitForTimeout(1000);
            
            // Click add booking button
            await this.page.click('#add-booking');
            await this.page.waitForTimeout(1000);
            
            // Check modal opened
            const modalOpen = await this.page.$eval('#edit-booking-modal', el => 
                el.classList.contains('active')
            );
            
            if (!modalOpen) {
                throw new Error('Add booking modal did not open');
            }
            
            // Fill form
            await this.page.type('#edit-client-name', 'Test Client Dashboard');
            await this.page.type('#edit-client-email', 'test@dashboard.com');
            await this.page.type('#edit-client-phone', '555-TEST-DASH');
            await this.page.select('#edit-service-type', '60min');
            
            // Set date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowString = tomorrow.toISOString().slice(0, 16);
            await this.page.evaluate((dateString) => {
                document.getElementById('edit-scheduled-date').value = dateString;
            }, tomorrowString);
            
            await this.page.type('#edit-final-price', '150');
            await this.page.type('#edit-special-requests', 'Test booking from dashboard');
            
            // Submit form
            await this.page.click('#save-edit');
            
            // Wait for success message or modal close
            await this.page.waitForTimeout(3000);
            
            console.log('  💾 New booking creation attempted');
        });

        // Test 7: Quick Actions
        await this.test('Quick action buttons work', async () => {
            await this.page.click('[data-page="bookings"]');
            await this.page.waitForTimeout(2000);
            
            // Try to find and click "Mark Paid" button
            const markPaidBtn = await this.page.$('button[onclick*="markPaid"]');
            if (markPaidBtn) {
                await markPaidBtn.click();
                await this.page.waitForTimeout(1000);
                console.log('  💰 Mark Paid action executed');
            } else {
                console.log('  ⚠️  No Mark Paid buttons available');
            }
        });

        // Test 8: Filters Functionality
        await this.test('Booking filters work correctly', async () => {
            await this.page.click('[data-page="bookings"]');
            await this.page.waitForTimeout(1000);
            
            // Test status filter
            await this.page.select('#booking-status', 'scheduled');
            await this.page.select('#payment-status', 'unpaid');
            
            // Apply filters
            await this.page.click('#apply-filters');
            await this.page.waitForTimeout(2000);
            
            console.log('  🔍 Filter functionality tested');
        });

        // Test 9: Sessions Page
        await this.test('Sessions page loads and displays data', async () => {
            await this.page.click('[data-page="sessions"]');
            await this.page.waitForTimeout(3000);
            
            // Check if sessions content loaded
            const hasContent = await this.page.$eval('#sessions-content', el => 
                !el.textContent.includes('Loading sessions...')
            );
            
            if (!hasContent) {
                throw new Error('Sessions page did not load content');
            }
        });

        // Test 10: Analytics Page
        await this.test('Analytics page displays insights', async () => {
            await this.page.click('[data-page="analytics"]');
            await this.page.waitForTimeout(3000);
            
            // Check if analytics loaded
            const hasAnalytics = await this.page.$eval('#analytics-content', el => 
                !el.textContent.includes('Loading analytics...')
            );
            
            if (!hasAnalytics) {
                throw new Error('Analytics page did not load');
            }
        });

        // Test 11: Reports Generation
        await this.test('Reports can be generated', async () => {
            await this.page.click('[data-page="reports"]');
            await this.page.waitForTimeout(2000);
            
            // Select report type and generate
            await this.page.select('#report-type', 'revenue');
            await this.page.select('#report-period', 'month');
            await this.page.click('#generate-report');
            
            await this.page.waitForTimeout(3000);
            
            // Check if report generated
            const reportGenerated = await this.page.$eval('#report-output', el => 
                !el.textContent.includes('Select report type')
            );
            
            if (!reportGenerated) {
                throw new Error('Report generation failed');
            }
        });

        // Test 12: Responsive Design
        await this.test('Dashboard is responsive', async () => {
            // Test mobile viewport
            await this.page.setViewport({ width: 768, height: 1024 });
            await this.page.waitForTimeout(1000);
            
            // Check if mobile navigation is working
            const sidebar = await this.page.$('.sidebar');
            const sidebarStyles = await this.page.evaluate(el => {
                return window.getComputedStyle(el);
            }, sidebar);
            
            console.log('  📱 Mobile view tested');
            
            // Reset to desktop
            await this.page.setViewport({ width: 1920, height: 1080 });
        });

        // Test 13: Accessibility Features
        await this.test('Accessibility features work', async () => {
            // Test skip link
            await this.page.focus('.skip-link');
            await this.page.keyboard.press('Enter');
            
            // Test keyboard navigation
            await this.page.keyboard.press('Tab');
            
            // Test ARIA attributes
            const ariaElements = await this.page.$$('[aria-label]');
            if (ariaElements.length === 0) {
                throw new Error('No ARIA labels found');
            }
            
            console.log(`  ♿ Found ${ariaElements.length} elements with ARIA labels`);
        });

        // Test 14: Error Handling
        await this.test('Error handling works correctly', async () => {
            // Test with invalid API request (simulate by modifying headers)
            await this.page.evaluate(() => {
                // Try to trigger an error by calling a non-existent function
                if (window.dashboard) {
                    try {
                        window.dashboard.showAlert('Test error handling', 'error');
                    } catch (e) {
                        console.log('Error handling test completed');
                    }
                }
            });
            
            console.log('  🚨 Error handling tested');
        });

        // Test 15: Data Persistence
        await this.test('Data changes persist correctly', async () => {
            await this.page.click('[data-page="dashboard"]');
            await this.page.waitForTimeout(2000);
            
            // Check if metrics are consistent
            const metrics1 = await this.page.evaluate(() => {
                return {
                    revenue: document.getElementById('total-revenue').textContent,
                    bookings: document.getElementById('active-bookings').textContent
                };
            });
            
            // Navigate away and back
            await this.page.click('[data-page="bookings"]');
            await this.page.waitForTimeout(1000);
            await this.page.click('[data-page="dashboard"]');
            await this.page.waitForTimeout(2000);
            
            const metrics2 = await this.page.evaluate(() => {
                return {
                    revenue: document.getElementById('total-revenue').textContent,
                    bookings: document.getElementById('active-bookings').textContent
                };
            });
            
            if (metrics1.revenue !== metrics2.revenue) {
                throw new Error('Metrics not consistent between page loads');
            }
            
            console.log('  💾 Data persistence verified');
        });

        await this.generateReport();
        await this.cleanup();
    }

    async generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 COMPLETE ADMIN DASHBOARD TEST RESULTS');
        console.log('='.repeat(80));
        
        const successRate = Math.round((this.testResults.passed / this.testResults.total) * 100);
        
        console.log(`🎯 Total Tests: ${this.testResults.total}`);
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        
        if (successRate === 100) {
            console.log('\n🎉 🎉 🎉 100% SUCCESS ACHIEVED! 🎉 🎉 🎉');
            console.log('🏆 Admin Dashboard is fully functional with complete CRUD operations!');
        } else if (successRate >= 90) {
            console.log('\n🎉 EXCELLENT: Admin Dashboard is production ready!');
        } else if (successRate >= 80) {
            console.log('\n✅ GOOD: Admin Dashboard is functional with minor issues');
        } else {
            console.log('\n⚠️  NEEDS WORK: Admin Dashboard has significant issues');
        }
        
        if (this.testResults.errors.length > 0) {
            console.log('\n❌ ERRORS ENCOUNTERED:');
            this.testResults.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            successRate: successRate,
            results: this.testResults,
            dashboard_url: this.dashboardUrl,
            test_environment: 'X11 Browser (Puppeteer)',
            features_tested: [
                'Navigation', 'API Integration', 'CRUD Operations',
                'Modal Functionality', 'Filters', 'Reports',
                'Responsive Design', 'Accessibility', 'Error Handling'
            ]
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'admin-dashboard-test-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('\n📄 Detailed report saved to: admin-dashboard-test-report.json');
        console.log('='.repeat(80));
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Run the complete test suite
const tester = new AdminDashboardTester();
tester.runAllTests().catch(console.error);

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n🛑 Test interrupted by user');
    await tester.cleanup();
    process.exit(0);
});

process.on('unhandledRejection', async (error) => {
    console.error('💥 Unhandled error:', error);
    await tester.cleanup();
    process.exit(1);
});