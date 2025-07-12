#!/usr/bin/env node

/**
 * Comprehensive Mobile Responsiveness Validation
 * This validation should catch mobile viewport issues before deployment
 */

const puppeteer = require('puppeteer');

async function validateMobileResponsiveness() {
    console.log('🔍 Comprehensive Mobile Responsiveness Validation...');
    
    let browser;
    const issues = [];
    
    try {
        browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Critical mobile viewports to test
        const viewports = [
            { name: 'Galaxy Z Fold 6 (Folded)', width: 374, height: 2316, critical: true },
            { name: 'Galaxy Z Fold 6 (Unfolded)', width: 832, height: 2268, critical: true },
            { name: 'iPhone 14 Pro', width: 393, height: 852, critical: true },
            { name: 'iPhone SE', width: 375, height: 667, critical: true },
            { name: 'iPad Mini', width: 768, height: 1024, critical: false },
            { name: 'Small Mobile', width: 320, height: 568, critical: true }
        ];
        
        for (const viewport of viewports) {
            console.log(`\n📱 Testing: ${viewport.name} (${viewport.width}x${viewport.height})`);
            
            await page.setViewport({ 
                width: viewport.width, 
                height: viewport.height,
                deviceScaleFactor: viewport.width < 600 ? 2 : 1
            });
            
            await page.goto('https://ittheal.com/admin.html', { waitUntil: 'networkidle0' });
            
            // Test 1: Check if content fits in viewport
            const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
            if (bodyWidth > viewport.width + 10) { // 10px tolerance
                const issue = `❌ CRITICAL: Content overflow on ${viewport.name} - Content width: ${bodyWidth}px, Viewport: ${viewport.width}px`;
                issues.push(issue);
                console.log(issue);
            } else {
                console.log('✅ Content fits within viewport');
            }
            
            // Test 2: Check horizontal scrollbar
            const hasHorizontalScroll = await page.evaluate(() => {
                return document.body.scrollWidth > window.innerWidth;
            });
            if (hasHorizontalScroll) {
                const issue = `❌ CRITICAL: Horizontal scrollbar detected on ${viewport.name}`;
                issues.push(issue);
                console.log(issue);
            } else {
                console.log('✅ No horizontal scrollbar');
            }
            
            // Test 3: Check if main content is visible
            const mainContent = await page.$('.main-content');
            if (!mainContent) {
                const issue = `❌ CRITICAL: Main content not found on ${viewport.name}`;
                issues.push(issue);
                console.log(issue);
                continue;
            }
            
            const mainContentBox = await mainContent.boundingBox();
            if (!mainContentBox || mainContentBox.width > viewport.width) {
                const issue = `❌ CRITICAL: Main content too wide on ${viewport.name}`;
                issues.push(issue);
                console.log(issue);
            } else {
                console.log('✅ Main content sized correctly');
            }
            
            // Test 4: Check filter panel on mobile
            const filterPanel = await page.$('.filter-panel');
            if (filterPanel && viewport.width <= 600) {
                const filterPanelBox = await filterPanel.boundingBox();
                if (filterPanelBox && filterPanelBox.width > viewport.width - 20) { // 20px margin
                    const issue = `⚠️  Filter panel may be too wide on ${viewport.name}`;
                    issues.push(issue);
                    console.log(issue);
                } else {
                    console.log('✅ Filter panel sized correctly');
                }
            }
            
            // Test 5: Check if buttons are touch-friendly (44px minimum)
            const buttons = await page.$$('button');
            let smallButtons = 0;
            for (const button of buttons) {
                const box = await button.boundingBox();
                if (box && (box.width < 44 || box.height < 44)) {
                    smallButtons++;
                }
            }
            if (smallButtons > 0) {
                const issue = `⚠️  ${smallButtons} buttons below 44px touch target on ${viewport.name}`;
                issues.push(issue);
                console.log(issue);
            } else {
                console.log('✅ All buttons touch-friendly');
            }
            
            // Test 6: Check section headers stack properly on mobile
            if (viewport.width <= 600) {
                const sectionHeaders = await page.$$('.section-header');
                for (const header of sectionHeaders) {
                    const headerBox = await header.boundingBox();
                    if (headerBox && headerBox.width > viewport.width - 20) {
                        const issue = `⚠️  Section header may overflow on ${viewport.name}`;
                        issues.push(issue);
                        console.log(issue);
                        break;
                    }
                }
                if (issues.length === 0 || !issues[issues.length - 1].includes('Section header')) {
                    console.log('✅ Section headers stack correctly');
                }
            }
            
            // Test 7: Check calendar controls on mobile
            if (viewport.width <= 600) {
                // Switch to calendar view
                const calendarBtn = await page.$('#calendar-view-btn');
                if (calendarBtn) {
                    await calendarBtn.click();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    const calendarControls = await page.$('#calendar-controls');
                    if (calendarControls) {
                        const controlsBox = await calendarControls.boundingBox();
                        if (controlsBox && controlsBox.width > viewport.width - 20) {
                            const issue = `⚠️  Calendar controls may overflow on ${viewport.name}`;
                            issues.push(issue);
                            console.log(issue);
                        } else {
                            console.log('✅ Calendar controls sized correctly');
                        }
                    }
                }
            }
            
            // Test 8: Check viewport meta tag (should be in HTML)
            const hasViewportMeta = await page.evaluate(() => {
                const meta = document.querySelector('meta[name="viewport"]');
                return meta && meta.content.includes('width=device-width');
            });
            if (!hasViewportMeta && viewport.critical) {
                const issue = `❌ CRITICAL: Missing proper viewport meta tag for ${viewport.name}`;
                issues.push(issue);
                console.log(issue);
            } else if (hasViewportMeta) {
                console.log('✅ Viewport meta tag present');
            }
        }
        
        // Summary
        console.log('\n📊 MOBILE RESPONSIVENESS VALIDATION SUMMARY');
        console.log('='.repeat(50));
        
        const criticalIssues = issues.filter(issue => issue.includes('CRITICAL'));
        const warnings = issues.filter(issue => issue.includes('⚠️'));
        
        console.log(`Total Issues Found: ${issues.length}`);
        console.log(`Critical Issues: ${criticalIssues.length}`);
        console.log(`Warnings: ${warnings.length}`);
        
        if (criticalIssues.length > 0) {
            console.log('\n❌ CRITICAL ISSUES THAT MUST BE FIXED:');
            criticalIssues.forEach(issue => console.log(issue));
        }
        
        if (warnings.length > 0) {
            console.log('\n⚠️  WARNINGS TO REVIEW:');
            warnings.forEach(issue => console.log(issue));
        }
        
        if (issues.length === 0) {
            console.log('\n🎉 ALL MOBILE RESPONSIVENESS TESTS PASSED!');
            return true;
        } else {
            console.log(`\n❌ ${issues.length} responsiveness issues found`);
            return criticalIssues.length === 0; // Pass if no critical issues
        }
        
    } catch (error) {
        console.error('❌ Mobile responsiveness validation failed:', error.message);
        return false;
    } finally {
        if (browser) await browser.close();
    }
}

// Validation that should run before deployment
async function preDeploymentValidation() {
    console.log('🚀 PRE-DEPLOYMENT MOBILE VALIDATION');
    console.log('This validation should catch mobile responsiveness issues BEFORE they reach production.\n');
    
    const success = await validateMobileResponsiveness();
    
    if (success) {
        console.log('\n✅ DEPLOYMENT APPROVED: Mobile responsiveness validated');
        process.exit(0);
    } else {
        console.log('\n❌ DEPLOYMENT BLOCKED: Fix mobile responsiveness issues first');
        console.log('\n🔧 RECOMMENDED FIXES:');
        console.log('1. Add @media (max-width: 600px) styles for all new components');
        console.log('2. Ensure all buttons meet 44px touch target minimum');
        console.log('3. Test content overflow on Z Fold 6 folded (374px width)');
        console.log('4. Stack layout elements vertically on mobile');
        console.log('5. Add horizontal scroll prevention');
        process.exit(1);
    }
}

if (require.main === module) {
    preDeploymentValidation();
}

module.exports = { validateMobileResponsiveness };