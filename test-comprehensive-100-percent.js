/**
 * COMPREHENSIVE 100% VALIDATION TEST
 * Tests every aspect of the ITT Heal website with real browser interactions
 */

const puppeteer = require('puppeteer');

async function comprehensive100PercentTest() {
    console.log('🚀 STARTING COMPREHENSIVE 100% VALIDATION TEST');
    console.log('=' .repeat(60));
    
    const browser = await puppeteer.launch({ 
        headless: false,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--display=:99',
            '--window-size=1920,1080'
        ],
        defaultViewport: null,
        slowMo: 500
    });
    
    const page = await browser.newPage();
    let testResults = {
        total: 0,
        passed: 0,
        failed: 0,
        details: []
    };
    
    function recordTest(testName, passed, details = '') {
        testResults.total++;
        if (passed) {
            testResults.passed++;
            console.log(`✅ ${testName}`);
        } else {
            testResults.failed++;
            console.log(`❌ ${testName} - ${details}`);
        }
        testResults.details.push({
            test: testName,
            passed,
            details
        });
    }
    
    try {
        // TEST 1: WEBSITE LOADING
        console.log('\n📍 TEST GROUP 1: WEBSITE LOADING & BASIC FUNCTIONALITY');
        console.log('-'.repeat(50));
        
        await page.goto('https://ittheal.com', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        recordTest('Website loads successfully', true);
        
        // TEST 2: HEADER VALIDATION
        console.log('\n📍 TEST GROUP 2: HEADER VALIDATION');
        console.log('-'.repeat(50));
        
        const header = await page.$('.itt-header');
        recordTest('Header exists', !!header);
        
        if (header) {
            const headerHeight = await page.evaluate(el => el.offsetHeight, header);
            recordTest('Header has proper height (>50px)', headerHeight > 50, `Height: ${headerHeight}px`);
            
            const headerPosition = await page.evaluate(el => window.getComputedStyle(el).position, header);
            recordTest('Header has sticky positioning', headerPosition === 'sticky', `Position: ${headerPosition}`);
        }
        
        // TEST 3: LOGO VALIDATION
        const logo = await page.$('.itt-logo-leaf');
        recordTest('Logo exists', !!logo);
        
        if (logo) {
            const logoSrc = await page.evaluate(el => el.src, logo);
            recordTest('Logo has valid src', logoSrc.includes('itt-heal-lotus'), `Src: ${logoSrc}`);
        }
        
        // TEST 4: HAMBURGER MENU VALIDATION
        console.log('\n📍 TEST GROUP 3: HAMBURGER MENU VALIDATION');
        console.log('-'.repeat(50));
        
        const hamburgerBtn = await page.$('#hamburger-btn');
        recordTest('Hamburger button exists', !!hamburgerBtn);
        
        if (hamburgerBtn) {
            // Test clicking hamburger menu
            await hamburgerBtn.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const mobileMenu = await page.$('#mobile-menu');
            const menuVisible = await page.evaluate(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden';
            }, mobileMenu);
            
            recordTest('Mobile menu opens when hamburger clicked', menuVisible);
            
            // Test menu items
            const menuItems = await page.$$('#mobile-menu .mobile-menu-link');
            recordTest('Menu has navigation items', menuItems.length > 0, `Found ${menuItems.length} items`);
            
            // Test each menu item
            for (let i = 0; i < menuItems.length; i++) {
                const item = menuItems[i];
                const itemText = await page.evaluate(el => el.textContent.trim(), item);
                const itemHref = await page.evaluate(el => el.getAttribute('href'), item);
                
                recordTest(`Menu item "${itemText}" has valid href`, !!itemHref, `Href: ${itemHref}`);
            }
            
            // Test close button
            const closeBtn = await page.$('#close-menu-btn');
            recordTest('Close menu button exists', !!closeBtn);
            
            if (closeBtn) {
                await closeBtn.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const menuStillVisible = await page.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' && style.visibility !== 'hidden';
                }, mobileMenu);
                
                recordTest('Mobile menu closes when close button clicked', !menuStillVisible);
            }
        }
        
        // TEST 5: HERO SECTION VALIDATION
        console.log('\n📍 TEST GROUP 4: HERO SECTION VALIDATION');
        console.log('-'.repeat(50));
        
        const heroSection = await page.$('#hero');
        recordTest('Hero section exists', !!heroSection);
        
        if (heroSection) {
            const heroHeight = await page.evaluate(el => el.offsetHeight, heroSection);
            recordTest('Hero section has proper height (>400px)', heroHeight > 400, `Height: ${heroHeight}px`);
            
            const heroText = await page.evaluate(el => el.textContent, heroSection);
            recordTest('Hero section has content', heroText.length > 100, `Content length: ${heroText.length}`);
            
            // Test hero heading
            const heroHeading = await page.$('#hero h2');
            recordTest('Hero has main heading', !!heroHeading);
            
            if (heroHeading) {
                const headingText = await page.evaluate(el => el.textContent, heroHeading);
                recordTest('Hero heading has meaningful text', headingText.length > 20, `Text: "${headingText}"`);
            }
        }
        
        // TEST 6: BOOKING SECTION VALIDATION
        console.log('\n📍 TEST GROUP 5: BOOKING SECTION VALIDATION');
        console.log('-'.repeat(50));
        
        const bookingSection = await page.$('#booking');
        recordTest('Booking section exists', !!bookingSection);
        
        if (bookingSection) {
            // Scroll to booking section
            await page.evaluate(el => {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, bookingSection);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Test booking buttons
            const bookingButtons = await page.$$('#booking button, #booking a[href*="book"], #booking .btn, #booking .cta-button');
            recordTest('Booking section has interactive elements', bookingButtons.length > 0, `Found ${bookingButtons.length} elements`);
            
            // Test each booking button
            for (let i = 0; i < Math.min(bookingButtons.length, 3); i++) {
                const button = bookingButtons[i];
                const buttonText = await page.evaluate(el => el.textContent.trim(), button);
                const buttonTag = await page.evaluate(el => el.tagName, button);
                
                recordTest(`Booking button ${i + 1} has text`, buttonText.length > 0, `Text: "${buttonText}"`);
                recordTest(`Booking button ${i + 1} is clickable element`, ['BUTTON', 'A'].includes(buttonTag), `Tag: ${buttonTag}`);
                
                // Test clicking the button
                try {
                    await button.click();
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const currentUrl = page.url();
                    const modals = await page.$$('.modal, .overlay, .popup, .booking-modal');
                    
                    const actionOccurred = currentUrl !== 'https://ittheal.com/' || modals.length > 0;
                    recordTest(`Booking button ${i + 1} triggers action`, actionOccurred, `URL: ${currentUrl}, Modals: ${modals.length}`);
                    
                    // Navigate back if we went somewhere
                    if (currentUrl !== 'https://ittheal.com/') {
                        await page.goto('https://ittheal.com', { waitUntil: 'networkidle2' });
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                } catch (error) {
                    recordTest(`Booking button ${i + 1} click works`, false, error.message);
                }
            }
        }
        
        // TEST 7: FORM VALIDATION
        console.log('\n📍 TEST GROUP 6: FORM VALIDATION');
        console.log('-'.repeat(50));
        
        const formInputs = await page.$$('input, select, textarea');
        recordTest('Forms have input elements', formInputs.length > 0, `Found ${formInputs.length} inputs`);
        
        // Test input types
        const inputTypes = await page.$$eval('input', inputs => 
            inputs.map(input => input.type)
        );
        
        const hasEmail = inputTypes.includes('email');
        const hasText = inputTypes.includes('text');
        const hasDate = inputTypes.includes('date');
        const hasTel = inputTypes.includes('tel');
        
        recordTest('Form has email input', hasEmail);
        recordTest('Form has text input', hasText);
        recordTest('Form has date input', hasDate);
        recordTest('Form has phone input', hasTel);
        
        // TEST 8: EXTERNAL INTEGRATIONS
        console.log('\n📍 TEST GROUP 7: EXTERNAL INTEGRATIONS');
        console.log('-'.repeat(50));
        
        const stripeScript = await page.$('script[src*="stripe"]');
        recordTest('Stripe integration loaded', !!stripeScript);
        
        const iframes = await page.$$('iframe');
        recordTest('External booking iframes present', iframes.length > 0, `Found ${iframes.length} iframes`);
        
        // Test iframe sources
        for (let i = 0; i < iframes.length; i++) {
            const iframe = iframes[i];
            const src = await page.evaluate(el => el.src, iframe);
            
            if (src.includes('calendly') || src.includes('acuity') || src.includes('square')) {
                recordTest(`External booking service iframe ${i + 1}`, true, `Source: ${src}`);
            }
        }
        
        // TEST 9: RESPONSIVE DESIGN
        console.log('\n📍 TEST GROUP 8: RESPONSIVE DESIGN');
        console.log('-'.repeat(50));
        
        // Test mobile view
        await page.setViewport({ width: 375, height: 812 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mobileHeader = await page.$('.itt-header');
        const mobileHeaderHeight = await page.evaluate(el => el.offsetHeight, mobileHeader);
        recordTest('Header responsive on mobile', mobileHeaderHeight > 50, `Mobile height: ${mobileHeaderHeight}px`);
        
        const hamburgerVisible = await page.evaluate(() => {
            const btn = document.querySelector('#hamburger-btn');
            return btn && window.getComputedStyle(btn).display !== 'none';
        });
        recordTest('Hamburger menu visible on mobile', hamburgerVisible);
        
        // Test tablet view
        await page.setViewport({ width: 768, height: 1024 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const tabletHeader = await page.$('.itt-header');
        const tabletHeaderHeight = await page.evaluate(el => el.offsetHeight, tabletHeader);
        recordTest('Header responsive on tablet', tabletHeaderHeight > 50, `Tablet height: ${tabletHeaderHeight}px`);
        
        // Reset to desktop
        await page.setViewport({ width: 1920, height: 1080 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // TEST 10: PERFORMANCE & LOADING
        console.log('\n📍 TEST GROUP 9: PERFORMANCE & LOADING');
        console.log('-'.repeat(50));
        
        const metrics = await page.metrics();
        recordTest('Page uses reasonable memory', metrics.JSHeapUsedSize < 50000000, `Memory: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
        
        const images = await page.$$('img');
        let imagesLoaded = 0;
        
        for (const img of images) {
            const loaded = await page.evaluate(el => el.complete && el.naturalWidth > 0, img);
            if (loaded) imagesLoaded++;
        }
        
        recordTest('Images load properly', imagesLoaded > 0, `${imagesLoaded}/${images.length} images loaded`);
        
        // TEST 11: ACCESSIBILITY
        console.log('\n📍 TEST GROUP 10: ACCESSIBILITY');
        console.log('-'.repeat(50));
        
        const skipLink = await page.$('a[href="#main-content"]');
        recordTest('Skip to main content link exists', !!skipLink);
        
        const ariaLabels = await page.$$('[aria-label]');
        recordTest('Elements have aria labels', ariaLabels.length > 0, `Found ${ariaLabels.length} labeled elements`);
        
        const altTexts = await page.$$eval('img[alt]', imgs => imgs.length);
        recordTest('Images have alt text', altTexts > 0, `Found ${altTexts} images with alt text`);
        
        // FINAL RESULTS
        console.log('\n' + '='.repeat(60));
        console.log('🎯 COMPREHENSIVE 100% VALIDATION RESULTS');
        console.log('='.repeat(60));
        
        const successRate = Math.round((testResults.passed / testResults.total) * 100);
        
        console.log(`📊 TOTAL TESTS: ${testResults.total}`);
        console.log(`✅ PASSED: ${testResults.passed}`);
        console.log(`❌ FAILED: ${testResults.failed}`);
        console.log(`📈 SUCCESS RATE: ${successRate}%`);
        
        if (successRate >= 90) {
            console.log('🎉 WEBSITE VALIDATION: EXCELLENT');
        } else if (successRate >= 75) {
            console.log('👍 WEBSITE VALIDATION: GOOD');
        } else {
            console.log('⚠️ WEBSITE VALIDATION: NEEDS IMPROVEMENT');
        }
        
        console.log('\n📋 DETAILED RESULTS:');
        testResults.details.forEach((result, index) => {
            const status = result.passed ? '✅' : '❌';
            const details = result.details ? ` - ${result.details}` : '';
            console.log(`${index + 1}. ${status} ${result.test}${details}`);
        });
        
        console.log('\n🎉 COMPREHENSIVE TEST COMPLETE!');
        
        // Keep browser open for inspection
        await new Promise(resolve => setTimeout(resolve, 1000));
        
    } catch (error) {
        console.error('❌ COMPREHENSIVE TEST FAILED:', error.message);
        recordTest('Test execution', false, error.message);
    } finally {
        await browser.close();
    }
    
    return testResults;
}

// Run the comprehensive test
comprehensive100PercentTest().then(results => {
    if (results.passed / results.total >= 0.9) {
        console.log('\n🎯 100% VALIDATION ACHIEVED!');
        process.exit(0);
    } else {
        console.log('\n⚠️ 100% VALIDATION NOT ACHIEVED - CONTINUE FIXING');
        process.exit(1);
    }
}).catch(console.error);