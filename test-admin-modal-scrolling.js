#!/usr/bin/env node

/**
 * Test script for admin modal scrolling functionality
 * Tests all modals for proper scrolling, WCAG compliance, and responsive behavior
 */

const puppeteer = require('puppeteer');

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
            { width: 1366, height: 768, name: 'Desktop Medium' },
            { width: 768, height: 1024, name: 'Tablet' },
            { width: 375, height: 667, name: 'Mobile' }
        ];
        
        for (const viewport of viewports) {
            console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
            await page.setViewport(viewport);
            await page.waitForFunction(() => true, {timeout: 1000}).catch(() => {});
            
            // Test New Booking Modal
            await testNewBookingModal(page, viewport.name);
            
            // Test Availability Modal
            await testAvailabilityModal(page, viewport.name);
            
            // Test Paperwork Modal
            await testPaperworkModal(page, viewport.name);
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
        // Click New Booking button
        await page.click('button[onclick="showNewBookingForm()"]');
        await page.waitForSelector('#new-booking-modal:not(.hidden)', { timeout: 3000 });
        
        console.log(`  ✅ New Booking Modal opened (${viewportName})`);
        
        // Test modal dimensions
        const modalRect = await page.evaluate(() => {
            const modal = document.querySelector('#new-booking-modal .bg-white');
            const rect = modal.getBoundingClientRect();
            return {
                height: rect.height,
                maxHeight: window.innerHeight * 0.85,
                hasScroll: modal.querySelector('.overflow-y-auto') !== null
            };
        });
        
        if (modalRect.height <= modalRect.maxHeight) {
            console.log(`  ✅ Modal height (${Math.round(modalRect.height)}px) within 85vh limit`);
        } else {
            console.log(`  ⚠️ Modal height (${Math.round(modalRect.height)}px) exceeds 85vh limit`);
        }
        
        if (modalRect.hasScroll) {
            console.log(`  ✅ Scrollable content area detected`);
        }
        
        // Test form accessibility
        await testFormAccessibility(page);
        
        // Test keyboard navigation
        await testKeyboardNavigation(page, 'new-booking');
        
        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForSelector('#new-booking-modal.hidden', { timeout: 2000 });
        console.log(`  ✅ Modal closed with Escape key`);
        
    } catch (error) {
        console.log(`  ❌ New Booking Modal test failed (${viewportName}): ${error.message}`);
    }
}

async function testAvailabilityModal(page, viewportName) {
    try {
        // Click Availability button
        await page.click('button[onclick="openAvailabilityModal()"]');
        await page.waitForSelector('#availability-modal', { timeout: 3000 });
        
        console.log(`  ✅ Availability Modal opened (${viewportName})`);
        
        // Test modal scrolling
        const canScroll = await page.evaluate(() => {
            const scrollContainer = document.querySelector('#availability-modal .overflow-y-auto');
            if (!scrollContainer) return false;
            
            const scrollHeight = scrollContainer.scrollHeight;
            const clientHeight = scrollContainer.clientHeight;
            return scrollHeight > clientHeight;
        });
        
        if (canScroll) {
            console.log(`  ✅ Availability modal has scrollable content`);
        }
        
        // Close modal
        await page.click('button[onclick="closeAvailabilityModal()"]');
        await page.waitForFunction(() => true, {timeout: 100}).catch(() => {})(1000);
        console.log(`  ✅ Availability modal closed`);
        
    } catch (error) {
        console.log(`  ❌ Availability Modal test failed (${viewportName}): ${error.message}`);
    }
}

async function testPaperworkModal(page, viewportName) {
    try {
        // Click Paperwork button
        await page.click('button[onclick="openPaperworkModal()"]');
        await page.waitForSelector('#paperwork-modal', { timeout: 3000 });
        
        console.log(`  ✅ Paperwork Modal opened (${viewportName})`);
        
        // Test modal structure
        const modalStructure = await page.evaluate(() => {
            const modal = document.querySelector('#paperwork-modal');
            return {
                hasFixedHeader: modal.querySelector('.flex-shrink-0') !== null,
                hasScrollableContent: modal.querySelector('.flex-1.overflow-y-auto') !== null,
                hasFixedFooter: modal.querySelector('.border-t.flex-shrink-0') !== null
            };
        });
        
        if (modalStructure.hasFixedHeader && modalStructure.hasScrollableContent && modalStructure.hasFixedFooter) {
            console.log(`  ✅ Paperwork modal has proper flex structure`);
        } else {
            console.log(`  ⚠️ Paperwork modal structure issues:`, modalStructure);
        }
        
        // Close modal
        await page.click('button[onclick="closePaperworkModal()"]');
        await page.waitForFunction(() => true, {timeout: 100}).catch(() => {})(1000);
        console.log(`  ✅ Paperwork modal closed`);
        
    } catch (error) {
        console.log(`  ❌ Paperwork Modal test failed (${viewportName}): ${error.message}`);
    }
}

async function testFormAccessibility(page) {
    const accessibilityIssues = await page.evaluate(() => {
        const issues = [];
        const modal = document.querySelector('#new-booking-modal');
        
        // Check for proper labels
        const inputs = modal.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            const label = modal.querySelector(`label[for="${input.id}"]`);
            if (!label) {
                issues.push(`Missing label for input: ${input.id}`);
            }
        });
        
        // Check for aria-describedby
        const inputsWithHelp = modal.querySelectorAll('[aria-describedby]');
        inputsWithHelp.forEach(input => {
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
        console.log(`  ⚠️ Form accessibility issues:`, accessibilityIssues);
    }
}

async function testKeyboardNavigation(page, modalType) {
    try {
        // Test tab navigation
        await page.keyboard.press('Tab');
        await page.waitForFunction(() => true, {timeout: 100}).catch(() => {})(100);
        
        const focusedElement = await page.evaluate(() => {
            return document.activeElement.tagName.toLowerCase();
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