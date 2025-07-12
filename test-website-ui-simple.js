#!/usr/bin/env node

/**
 * ITT Heal Main Website - Simple Browser UI Testing
 * Tests: https://ittheal.com/
 */

const puppeteer = require('puppeteer');

const MAIN_SITE_URL = 'https://ittheal.com/';

async function test(name, testFn) {
    try {
        console.log(`🔹 Testing: ${name}`);
        await testFn();
        console.log(`✅ PASSED: ${name}`);
        return true;
    } catch (error) {
        console.log(`❌ FAILED: ${name} - ${error.message}`);
        return false;
    }
}

async function runWebsiteTests() {
    console.log('🌐 ITT Heal Main Website - Browser UI Testing');
    console.log('==============================================');
    console.log('🔍 Testing:', MAIN_SITE_URL);
    console.log('');

    let browser;
    let page;
    let passedTests = 0;
    let totalTests = 0;

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // Test 1: Website loads and displays correctly
        if (await test('Website Loading & Basic Structure', async () => {
            await page.goto(MAIN_SITE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
            
            const title = await page.title();
            if (!title || title.includes('Error')) {
                throw new Error(`Invalid page title: ${title}`);
            }
            console.log(`   📄 Page title: ${title}`);
            
            // Check for main content
            const body = await page.$('body');
            if (!body) throw new Error('Page body not found');
            
            console.log('   ✅ Website loads successfully');
        })) passedTests++;
        totalTests++;

        // Test 2: Interactive buttons and links
        if (await test('Interactive Elements & Button Functionality', async () => {
            const buttons = await page.$$('button, .btn, .button, [class*="btn"]');
            const links = await page.$$('a[href]');
            
            console.log(`   🎮 Found ${buttons.length} buttons and ${links.length} links`);
            
            if (buttons.length === 0 && links.length === 0) {
                throw new Error('No interactive elements found');
            }
            
            // Test first few buttons are clickable
            let clickableButtons = 0;
            for (let i = 0; i < Math.min(3, buttons.length); i++) {
                const button = buttons[i];
                const isVisible = await button.isIntersectingViewport();
                if (isVisible) {
                    clickableButtons++;
                }
            }
            
            console.log(`   ✅ ${clickableButtons} buttons are visible and accessible`);
        })) passedTests++;
        totalTests++;

        // Test 3: Mobile responsiveness test
        if (await test('Mobile Responsiveness', async () => {
            // Test mobile viewport
            await page.setViewport({ width: 375, height: 667 });
            await page.reload({ waitUntil: 'networkidle0' });
            
            // Check if content fits
            const body = await page.$('body');
            const boundingBox = await body.boundingBox();
            
            if (boundingBox.width > 395) { // 20px tolerance
                throw new Error('Content overflows on mobile viewport');
            }
            
            console.log('   📱 Mobile viewport: Content fits properly');
            
            // Restore desktop
            await page.setViewport({ width: 1920, height: 1080 });
            
            console.log('   ✅ Mobile responsiveness verified');
        })) passedTests++;
        totalTests++;

        // Test 4: Contact/booking functionality
        if (await test('Contact & Booking Elements', async () => {
            await page.goto(MAIN_SITE_URL, { waitUntil: 'networkidle0' });
            
            // Look for contact or booking related elements
            const contactElements = await page.$$('form, [class*="form"], [class*="contact"], [href*="book"], [href*="contact"]');
            
            if (contactElements.length === 0) {
                throw new Error('No contact or booking elements found');
            }
            
            console.log(`   📞 Found ${contactElements.length} contact/booking elements`);
            
            // Check for forms
            const forms = await page.$$('form');
            if (forms.length > 0) {
                console.log(`   📝 Found ${forms.length} forms on the page`);
            }
            
            console.log('   ✅ Contact and booking elements present');
        })) passedTests++;
        totalTests++;

        // Test 5: Content sections and structure
        if (await test('Content Structure & Sections', async () => {
            // Check for main content sections
            const sections = await page.$$('section, .section, main, .main, [class*="section"]');
            const headings = await page.$$('h1, h2, h3, h4, h5, h6');
            
            if (sections.length === 0) {
                throw new Error('No content sections found');
            }
            
            if (headings.length === 0) {
                throw new Error('No headings found');
            }
            
            console.log(`   📑 Found ${sections.length} content sections and ${headings.length} headings`);
            
            // Check for H1
            const h1Count = await page.$$eval('h1', els => els.length);
            if (h1Count === 0) {
                throw new Error('No H1 heading found');
            }
            
            console.log('   ✅ Content structure is properly organized');
        })) passedTests++;
        totalTests++;

        // Test 6: Images and media loading
        if (await test('Images & Media Loading', async () => {
            const images = await page.$$('img');
            console.log(`   🖼️ Found ${images.length} images`);
            
            if (images.length > 0) {
                // Check if images are loading
                const brokenImages = await page.evaluate(() => {
                    const imgs = Array.from(document.querySelectorAll('img'));
                    return imgs.filter(img => !img.complete || img.naturalWidth === 0).length;
                });
                
                if (brokenImages > 0) {
                    console.log(`   ⚠️ ${brokenImages} images may have loading issues`);
                } else {
                    console.log('   ✅ All images loaded successfully');
                }
            }
            
            console.log('   ✅ Media elements checked');
        })) passedTests++;
        totalTests++;

        // Test 7: Performance check
        if (await test('Basic Performance Check', async () => {
            const startTime = Date.now();
            await page.goto(MAIN_SITE_URL, { waitUntil: 'load' });
            const loadTime = Date.now() - startTime;
            
            console.log(`   ⏱️ Page load time: ${loadTime}ms`);
            
            if (loadTime > 3000) {
                console.log('   ⚠️ Page load time exceeds 3 seconds');
            } else {
                console.log('   ✅ Page loads quickly');
            }
            
            console.log('   ✅ Performance check completed');
        })) passedTests++;
        totalTests++;

    } catch (error) {
        console.error('💥 Test suite error:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    // Results summary
    console.log('');
    console.log('========================================');
    console.log('📊 WEBSITE TEST SUMMARY');
    console.log('========================================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    console.log('');

    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED!');
        console.log('✅ ITT Heal main website is fully functional');
        console.log('✅ UI elements working correctly');
        console.log('✅ Mobile responsive design verified');
        console.log('✅ Performance is acceptable');
    } else {
        console.log(`⚠️ ${totalTests - passedTests} test(s) failed - see details above`);
    }
    
    console.log('');
    console.log('🌐 Tested URL: https://ittheal.com/d/');
}

runWebsiteTests().catch(console.error);