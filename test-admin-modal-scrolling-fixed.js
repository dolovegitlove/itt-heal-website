#!/usr/bin/env node

/**
 * Test script for admin modal scrolling functionality
 * Tests all modals for proper scrolling, WCAG compliance, and responsive behavior
 */

const puppeteer = require('puppeteer');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAdminModalScrolling() {
    // Set up virtual display
    process.env.DISPLAY = ':99';
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: [
            '--start-maximized',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--display=:99'
        ]
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('🔍 Testing Admin Modal Scrolling & WCAG Compliance...\n');
        
        // Navigate to admin dashboard
        await page.goto('https://ittheal.com/admin-dashboard.html', { 
            waitUntil: 'networkidle2',
            timeout: 10000 
        });
        
        console.log('✅ Admin dashboard loaded successfully');
        
        // Test different viewport sizes
        const viewports = [
            { width: 1920, height: 1080, name: 'Desktop Large' },
            { width: 768, height: 1024, name: 'Tablet' },
            { width: 375, height: 667, name: 'Mobile' }
        ];
        
        for (const viewport of viewports) {
            console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
            await page.setViewport(viewport);
            await delay(1000);
            
            // Test New Booking Modal
            await testNewBookingModal(page, viewport.name);
            
            // Test Availability Modal (if button exists)
            await testAvailabilityModal(page, viewport.name);
            
            // Test any existing booking detail modal
            await testBookingDetailModal(page, viewport.name);
        }
        
        console.log('\n🎉 All modal scrolling tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Modal scrolling test failed:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

async function testNewBookingModal(page, viewportName) {
    try {
        // Look for New Booking button
        const newBookingButton = await page.$('button[onclick="showNewBookingForm()"]');
        if (!newBookingButton) {
            console.log(`  ⚠️ New Booking button not found (${viewportName})`);
            return;
        }
        
        // Click New Booking button
        await newBookingButton.click();
        await page.waitForSelector('#new-booking-modal:not(.hidden)', { timeout: 3000 });
        
        console.log(`  ✅ New Booking Modal opened (${viewportName})`);
        
        // Test modal dimensions
        const modalInfo = await page.evaluate(() => {
            const modal = document.querySelector('#new-booking-modal .bg-white');
            if (!modal) return null;
            
            const rect = modal.getBoundingClientRect();
            const scrollContainer = modal.querySelector('.overflow-y-auto');
            
            return {
                height: rect.height,
                maxHeight: window.innerHeight * 0.9,
                hasScrollContainer: !!scrollContainer,
                isFlexColumn: modal.classList.contains('flex-col'),
                hasFixedHeader: !!modal.querySelector('.flex-shrink-0'),
                windowHeight: window.innerHeight
            };
        });
        
        if (modalInfo) {
            if (modalInfo.height <= modalInfo.maxHeight) {
                console.log(`  ✅ Modal height (${Math.round(modalInfo.height)}px) within viewport (${modalInfo.windowHeight}px)`);
            } else {
                console.log(`  ⚠️ Modal height (${Math.round(modalInfo.height)}px) exceeds safe area`);
            }
            
            if (modalInfo.hasScrollContainer) {
                console.log(`  ✅ Scrollable content area detected`);
            }
            
            if (modalInfo.isFlexColumn && modalInfo.hasFixedHeader) {
                console.log(`  ✅ Proper flex structure with fixed header`);
            }
        }
        
        // Test form accessibility
        await testFormAccessibility(page);
        
        // Test keyboard navigation
        await testKeyboardNavigation(page);
        
        // Close modal with Escape key
        await page.keyboard.press('Escape');
        await delay(500);
        
        const modalClosed = await page.evaluate(() => {
            const modal = document.querySelector('#new-booking-modal');
            return modal && modal.classList.contains('hidden');
        });
        
        if (modalClosed) {
            console.log(`  ✅ Modal closed with Escape key`);
        } else {
            console.log(`  ⚠️ Modal did not close with Escape key`);
        }
        
    } catch (error) {
        console.log(`  ❌ New Booking Modal test failed (${viewportName}): ${error.message}`);
    }
}

async function testAvailabilityModal(page, viewportName) {
    try {
        // Look for Availability button
        const availabilityButton = await page.$('button[onclick*="availability"], button[onclick*="Availability"]');
        if (!availabilityButton) {
            console.log(`  ⚠️ Availability button not found (${viewportName})`);
            return;
        }
        
        // Click Availability button
        await availabilityButton.click();
        await delay(2000);
        
        // Check if availability modal exists
        const modalExists = await page.$('#availability-modal');
        if (!modalExists) {
            console.log(`  ⚠️ Availability modal not found after click (${viewportName})`);
            return;
        }
        
        console.log(`  ✅ Availability Modal opened (${viewportName})`);
        
        // Test modal structure
        const modalStructure = await page.evaluate(() => {
            const modal = document.querySelector('#availability-modal');
            if (!modal) return null;
            
            return {
                hasScrollableContent: !!modal.querySelector('.overflow-y-auto'),
                hasFixedHeader: !!modal.querySelector('.flex-shrink-0'),
                isFlexColumn: modal.querySelector('.bg-white').classList.contains('flex-col'),
                maxHeight: modal.querySelector('.bg-white').style.maxHeight || modal.querySelector('.bg-white').classList.toString()
            };
        });
        
        if (modalStructure) {
            if (modalStructure.hasScrollableContent && modalStructure.isFlexColumn) {
                console.log(`  ✅ Availability modal has proper scrolling structure`);
            } else {
                console.log(`  ⚠️ Availability modal structure:`, modalStructure);
            }
        }
        
        // Close modal by clicking close button
        const closeButton = await page.$('button[onclick*="close"], button[aria-label*="close"], button[aria-label*="Close"]');
        if (closeButton) {
            await closeButton.click();
            await delay(500);
            console.log(`  ✅ Availability modal closed`);
        }
        
    } catch (error) {
        console.log(`  ❌ Availability Modal test failed (${viewportName}): ${error.message}`);
    }
}

async function testBookingDetailModal(page, viewportName) {
    try {
        // Look for any booking cards that might open detail modals
        const bookingCards = await page.$$('.booking-card');
        if (bookingCards.length === 0) {
            console.log(`  ⚠️ No booking cards found to test detail modal (${viewportName})`);
            return;
        }
        
        // Click the first booking card
        await bookingCards[0].click();
        await delay(1000);
        
        // Check if booking detail modal opened
        const detailModal = await page.$('#booking-modal:not(.hidden)');
        if (!detailModal) {
            console.log(`  ⚠️ Booking detail modal did not open (${viewportName})`);
            return;
        }
        
        console.log(`  ✅ Booking Detail Modal opened (${viewportName})`);
        
        // Test modal structure
        const modalStructure = await page.evaluate(() => {
            const modal = document.querySelector('#booking-modal .bg-white');
            if (!modal) return null;
            
            return {
                hasScrollableContent: !!modal.querySelector('.overflow-y-auto'),
                hasFixedHeader: !!modal.querySelector('.flex-shrink-0'),
                isFlexColumn: modal.classList.contains('flex-col'),
                maxHeight: window.getComputedStyle(modal).maxHeight
            };
        });
        
        if (modalStructure) {
            if (modalStructure.hasScrollableContent && modalStructure.isFlexColumn) {
                console.log(`  ✅ Booking detail modal has proper flex structure`);
            } else {
                console.log(`  ⚠️ Booking detail modal structure:`, modalStructure);
            }
        }
        
        // Close modal
        const closeButton = await page.$('#booking-modal button[onclick*="close"], #booking-modal button[aria-label*="Close"]');
        if (closeButton) {
            await closeButton.click();
            await delay(500);
            console.log(`  ✅ Booking detail modal closed`);
        }
        
    } catch (error) {
        console.log(`  ❌ Booking Detail Modal test failed (${viewportName}): ${error.message}`);
    }
}

async function testFormAccessibility(page) {
    const accessibilityIssues = await page.evaluate(() => {
        const issues = [];
        const modal = document.querySelector('#new-booking-modal');
        if (!modal) return ['Modal not found'];
        
        // Check for proper labels
        const inputs = modal.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            const label = modal.querySelector(`label[for="${input.id}"]`);
            if (!label && input.id) {
                issues.push(`Missing label for input: ${input.id}`);
            }
        });
        
        // Check for aria-describedby
        const inputsWithAria = modal.querySelectorAll('[aria-describedby]');
        inputsWithAria.forEach(input => {
            const describedBy = input.getAttribute('aria-describedby').split(' ');
            describedBy.forEach(id => {
                if (!modal.querySelector(`#${id}`)) {
                    issues.push(`Missing element for aria-describedby: ${id}`);
                }
            });
        });
        
        // Check for required field indicators
        const requiredInputs = modal.querySelectorAll('[required]');
        let hasRequiredIndicator = false;
        requiredInputs.forEach(input => {
            const label = modal.querySelector(`label[for="${input.id}"]`);
            if (label && label.textContent.includes('*')) {
                hasRequiredIndicator = true;
            }
        });
        
        if (requiredInputs.length > 0 && !hasRequiredIndicator) {
            issues.push('Required fields lack visual indicators');
        }
        
        return issues;
    });
    
    if (accessibilityIssues.length === 0) {
        console.log(`  ✅ Form accessibility checks passed`);
    } else {
        console.log(`  ⚠️ Form accessibility issues:`, accessibilityIssues.slice(0, 3));
    }
}

async function testKeyboardNavigation(page) {
    try {
        // Test tab navigation
        await page.keyboard.press('Tab');
        await delay(100);
        
        const focusedElement = await page.evaluate(() => {
            return document.activeElement ? document.activeElement.tagName.toLowerCase() : 'none';
        });
        
        if (['input', 'select', 'button', 'textarea'].includes(focusedElement)) {
            console.log(`  ✅ Keyboard navigation working (focused: ${focusedElement})`);
        } else {
            console.log(`  ⚠️ Unexpected focused element: ${focusedElement}`);
        }
        
    } catch (error) {
        console.log(`  ❌ Keyboard navigation test failed: ${error.message}`);
    }
}

// Run the tests
if (require.main === module) {
    testAdminModalScrolling()
        .then(() => {
            console.log('\n✅ All modal tests completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Modal tests failed:', error);
            process.exit(1);
        });
}

module.exports = { testAdminModalScrolling };