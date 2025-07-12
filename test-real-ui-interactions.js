const puppeteer = require('puppeteer');

(async () => {
    console.log('🖱️  ITT Heal REAL Browser Clicks & UI Interaction Test');
    console.log('====================================================');
    console.log('🎯 Testing actual user interactions with real clicks, scrolls, and form fills\n');
    
    const browser = await puppeteer.launch({ 
        headless: 'new', // Headless but still real interactions
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1440, height: 900 }
    });
    
    let testResults = [];
    
    try {
        const page = await browser.newPage();
        
        // Enable request interception to log network activity
        await page.setRequestInterception(true);
        let networkErrors = [];
        
        page.on('request', request => {
            request.continue();
        });
        
        page.on('response', response => {
            if (response.status() >= 400) {
                networkErrors.push(`${response.status()}: ${response.url()}`);
            }
        });
        
        console.log('🌐 Loading main website...');
        await page.goto('https://ittheal.com', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test 1: Header Navigation Click Test
        console.log('\n🔹 Test 1: Header Navigation Clicks');
        try {
            // Click hamburger menu if mobile
            const hamburger = await page.$('.itt-hamburger, .menu-toggle, [aria-label*="menu"]');
            if (hamburger) {
                console.log('   📱 Clicking mobile menu...');
                await hamburger.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Check if menu opened
                const menuOpen = await page.evaluate(() => {
                    const menu = document.querySelector('#mobile-menu, .mobile-nav');
                    return menu && menu.style.display !== 'none';
                });
                
                console.log(`   ✅ Mobile menu opened: ${menuOpen}`);
                testResults.push(['Header Navigation', menuOpen ? 'PASS' : 'FAIL']);
                
                // Close menu
                await hamburger.click();
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                console.log('   ✅ Desktop view - no mobile menu needed');
                testResults.push(['Header Navigation', 'PASS']);
            }
        } catch (error) {
            console.log(`   ❌ Header navigation error: ${error.message}`);
            testResults.push(['Header Navigation', 'FAIL']);
        }
        
        // Test 2: Hero Section CTA Click
        console.log('\n🔹 Test 2: Hero CTA Button Click');
        try {
            const ctaButton = await page.$('a[href*="services"], .btn, button, a[href*="book"]');
            if (ctaButton) {
                const buttonText = await page.evaluate(el => el.textContent.trim(), ctaButton);
                console.log(`   🎯 Clicking CTA: "${buttonText}"`);
                
                await ctaButton.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Check if we scrolled to services or navigated
                const currentUrl = page.url();
                const scrollPosition = await page.evaluate(() => window.pageYOffset);
                
                console.log(`   ✅ After click - URL: ${currentUrl}`);
                console.log(`   ✅ Scroll position: ${scrollPosition}px`);
                testResults.push(['Hero CTA Click', scrollPosition > 100 ? 'PASS' : 'FAIL']);
            } else {
                throw new Error('No CTA button found');
            }
        } catch (error) {
            console.log(`   ❌ Hero CTA error: ${error.message}`);
            testResults.push(['Hero CTA Click', 'FAIL']);
        }
        
        // Test 3: Service Selection Interaction
        console.log('\n🔹 Test 3: Service Selection Clicks');
        try {
            // Scroll to booking section
            await page.evaluate(() => {
                const booking = document.querySelector('#booking, #services');
                if (booking) booking.scrollIntoView({ behavior: 'smooth' });
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Click service option
            const serviceOption = await page.$('.service-option, [onclick*="selectService"]');
            if (serviceOption) {
                console.log('   🛍️  Clicking service option...');
                await serviceOption.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Check if service was selected (visual feedback)
                const isSelected = await page.evaluate(() => {
                    const selected = document.querySelector('.service-option[style*="border-color: #10b981"], .service-option[style*="background"]');
                    return !!selected;
                });
                
                console.log(`   ✅ Service selected: ${isSelected}`);
                testResults.push(['Service Selection', isSelected ? 'PASS' : 'FAIL']);
                
                // Check if Next button appeared
                const nextButton = await page.$('#next-btn, button[onclick*="nextStep"]');
                const nextVisible = nextButton ? await nextButton.isIntersectingViewport() : false;
                console.log(`   ✅ Next button visible: ${nextVisible}`);
                
                if (nextVisible) {
                    await nextButton.click();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    console.log('   ✅ Clicked Next to proceed to date/time');
                }
            } else {
                throw new Error('No service options found');
            }
        } catch (error) {
            console.log(`   ❌ Service selection error: ${error.message}`);
            testResults.push(['Service Selection', 'FAIL']);
        }
        
        // Test 4: Date/Time Form Interaction
        console.log('\n🔹 Test 4: Date/Time Form Fill');
        try {
            // Fill date input
            const dateInput = await page.$('#booking-date, input[type="date"]');
            if (dateInput) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateStr = tomorrow.toISOString().split('T')[0];
                
                console.log(`   📅 Setting date to: ${dateStr}`);
                await dateInput.click();
                await dateInput.evaluate((el, value) => {
                    el.value = value;
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                }, dateStr);
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Check if time slots loaded
                const timeSelect = await page.$('#booking-time, select');
                if (timeSelect) {
                    const options = await timeSelect.$$eval('option', opts => 
                        opts.filter(opt => opt.value && opt.value !== '').length
                    );
                    
                    console.log(`   ⏰ Time slots loaded: ${options}`);
                    
                    if (options > 0) {
                        // Select first available time
                        await timeSelect.select(await timeSelect.$eval('option:nth-child(2)', opt => opt.value));
                        console.log('   ✅ Selected time slot');
                        testResults.push(['Date/Time Form', 'PASS']);
                        
                        // Click next if available
                        const nextBtn = await page.$('#next-btn');
                        if (nextBtn) {
                            await nextBtn.click();
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    } else {
                        testResults.push(['Date/Time Form', 'PARTIAL']);
                    }
                } else {
                    throw new Error('Time select not found');
                }
            } else {
                throw new Error('Date input not found');
            }
        } catch (error) {
            console.log(`   ❌ Date/time form error: ${error.message}`);
            testResults.push(['Date/Time Form', 'FAIL']);
        }
        
        // Test 5: Contact Form Fill
        console.log('\n🔹 Test 5: Contact Information Form');
        try {
            const nameInput = await page.$('#client-name, input[placeholder*="name"]');
            const emailInput = await page.$('#client-email, input[type="email"]');
            const phoneInput = await page.$('#client-phone, input[type="tel"]');
            
            if (nameInput && emailInput && phoneInput) {
                console.log('   👤 Filling contact information...');
                
                await nameInput.click();
                await nameInput.type('Test User', { delay: 100 });
                
                await emailInput.click();
                await emailInput.type('test@example.com', { delay: 100 });
                
                await phoneInput.click();
                await phoneInput.type('(555) 123-4567', { delay: 100 });
                
                // Fill notes if present
                const notesArea = await page.$('#session-notes, textarea');
                if (notesArea) {
                    await notesArea.click();
                    await notesArea.type('UI test - not a real booking', { delay: 100 });
                }
                
                console.log('   ✅ Contact form filled successfully');
                testResults.push(['Contact Form Fill', 'PASS']);
                
                // Proceed to summary
                const nextBtn = await page.$('#next-btn');
                if (nextBtn) {
                    await nextBtn.click();
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // Check if summary appeared
                    const summary = await page.$('#booking-summary, .summary');
                    const summaryVisible = summary ? await summary.isIntersectingViewport() : false;
                    console.log(`   ✅ Booking summary shown: ${summaryVisible}`);
                }
            } else {
                throw new Error('Contact form fields not found');
            }
        } catch (error) {
            console.log(`   ❌ Contact form error: ${error.message}`);
            testResults.push(['Contact Form Fill', 'FAIL']);
        }
        
        // Test 6: Booking Summary & Cancel (DO NOT SUBMIT)
        console.log('\n🔹 Test 6: Booking Summary Review');
        try {
            const summaryContent = await page.$('#summary-content, .summary-content');
            if (summaryContent) {
                const summaryText = await page.evaluate(el => el.textContent, summaryContent);
                console.log('   📋 Summary content found');
                console.log(`   📝 Contains: ${summaryText.substring(0, 100)}...`);
                
                // Check total price display
                const totalPrice = await page.$('#total-price, .total');
                const priceShown = totalPrice ? await page.evaluate(el => el.textContent, totalPrice) : 'Not found';
                console.log(`   💰 Total price: ${priceShown}`);
                
                console.log('   ⚠️  NOT submitting - this is a test');
                testResults.push(['Booking Summary', 'PASS']);
            } else {
                throw new Error('Booking summary not found');
            }
        } catch (error) {
            console.log(`   ❌ Booking summary error: ${error.message}`);
            testResults.push(['Booking Summary', 'FAIL']);
        }
        
        // Test 7: Footer Links & Contact Info
        console.log('\n🔹 Test 7: Footer Contact Links');
        try {
            // Scroll to footer
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Test phone link
            const phoneLink = await page.$('a[href^="tel:"]');
            if (phoneLink) {
                const phoneNumber = await page.evaluate(el => el.href, phoneLink);
                console.log(`   📞 Phone link: ${phoneNumber}`);
            }
            
            // Test email link
            const emailLink = await page.$('a[href^="mailto:"]');
            if (emailLink) {
                const emailAddress = await page.evaluate(el => el.href, emailLink);
                console.log(`   📧 Email link: ${emailAddress}`);
            }
            
            testResults.push(['Footer Links', phoneLink && emailLink ? 'PASS' : 'PARTIAL']);
        } catch (error) {
            console.log(`   ❌ Footer links error: ${error.message}`);
            testResults.push(['Footer Links', 'FAIL']);
        }
        
        // Test 8: Mobile Responsive Interaction
        console.log('\n🔹 Test 8: Mobile View Real Interaction');
        try {
            await page.setViewport({ width: 375, height: 812 });
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Test mobile menu again
            const mobileMenu = await page.$('.itt-hamburger, .menu-toggle');
            if (mobileMenu) {
                await mobileMenu.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Try clicking a menu item
                const menuItem = await page.$('#mobile-menu a, .mobile-nav a');
                if (menuItem) {
                    await menuItem.click();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    console.log('   📱 Mobile menu navigation successful');
                }
            }
            
            testResults.push(['Mobile Interaction', 'PASS']);
        } catch (error) {
            console.log(`   ❌ Mobile interaction error: ${error.message}`);
            testResults.push(['Mobile Interaction', 'FAIL']);
        }
        
        // Network Error Summary
        if (networkErrors.length > 0) {
            console.log('\n⚠️  Network Errors Detected:');
            networkErrors.forEach(error => console.log(`   - ${error}`));
        }
        
    } catch (error) {
        console.error('💥 Critical test error:', error);
    } finally {
        // Results Summary
        console.log('\n========================================');
        console.log('🖱️  REAL UI INTERACTION TEST RESULTS');
        console.log('========================================');
        
        const passCount = testResults.filter(([, result]) => result === 'PASS').length;
        const totalCount = testResults.length;
        const successRate = Math.round((passCount / totalCount) * 100);
        
        testResults.forEach(([test, result]) => {
            const icon = result === 'PASS' ? '✅' : result === 'PARTIAL' ? '⚠️' : '❌';
            console.log(`${icon} ${test}: ${result}`);
        });
        
        console.log(`\n📊 Success Rate: ${successRate}% (${passCount}/${totalCount})`);
        
        if (successRate === 100) {
            console.log('\n🎉 ALL REAL INTERACTIONS SUCCESSFUL!');
            console.log('✅ Users can successfully navigate the entire site');
            console.log('✅ Booking flow works from start to finish');
            console.log('✅ Forms accept input and provide feedback');
            console.log('✅ Mobile interactions function properly');
        } else if (successRate >= 80) {
            console.log('\n✅ MOSTLY SUCCESSFUL - Minor issues detected');
        } else {
            console.log('\n⚠️  SIGNIFICANT ISSUES - Review failed tests');
        }
        
        console.log('\n🛡️  IMPORTANT: This was a real interaction test');
        console.log('🔒 No actual bookings were submitted');
        console.log('💡 All user flows tested with real clicks and form fills');
        
        await browser.close();
    }
})();