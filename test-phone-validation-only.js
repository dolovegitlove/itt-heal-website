#!/usr/bin/env node

/**
 * Quick test just for phone validation to debug the issue
 */

const puppeteer = require('puppeteer');

async function testPhoneValidation() {
    console.log('📱 Phone Validation Debug Test');
    console.log('=============================');
    
    const browser = await puppeteer.launch({ 
        headless: true,
        defaultViewport: { width: 1200, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);
    
    try {
        await page.goto('https://ittheal.com', { waitUntil: 'domcontentloaded' });
        
        // Quick navigation to contact form
        await page.evaluate(() => document.querySelector('#booking').scrollIntoView());
        await new Promise(resolve => setTimeout(resolve, 500));
        await page.click('[data-service-type="test"]');
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split('T')[0];
        await page.type('#booking-date', dateString);
        await new Promise(resolve => setTimeout(resolve, 1500));
        await page.waitForSelector('#booking-time option:not([value=""])', { timeout: 5000 });
        await page.select('#booking-time', await page.$eval('#booking-time option:nth-child(2)', el => el.value));
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('📱 Testing invalid area code...');
        await page.type('#client-phone', '9995551234'); // Invalid area code
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const invalidAreaCodeError = await page.evaluate(() => {
            const errorDiv = document.getElementById('client-phone-error');
            return {
                errorShown: errorDiv && errorDiv.style.display !== 'none',
                errorText: errorDiv ? errorDiv.textContent : '',
                fieldBorderColor: document.getElementById('client-phone').style.borderColor
            };
        });
        
        console.log('Invalid area code result:', invalidAreaCodeError);
        
        console.log('📱 Testing valid area code...');
        await page.click('#client-phone');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.type('#client-phone', '9405551234'); // Valid area code
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const validAreaCodeResult = await page.evaluate(() => {
            const errorDiv = document.getElementById('client-phone-error');
            return {
                errorShown: errorDiv && errorDiv.style.display !== 'none',
                errorText: errorDiv ? errorDiv.textContent : '',
                fieldBorderColor: document.getElementById('client-phone').style.borderColor
            };
        });
        
        console.log('Valid area code result:', validAreaCodeResult);
        
        // Test with valid name and email too
        await page.type('#client-name', 'John Smith');
        await page.type('#client-email', 'john@example.com');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const allFieldsStatus = await page.evaluate(() => {
            const nameField = document.getElementById('client-name');
            const emailField = document.getElementById('client-email');
            const phoneField = document.getElementById('client-phone');
            
            return {
                nameValid: nameField.style.borderColor === 'rgb(16, 185, 129)',
                emailValid: emailField.style.borderColor === 'rgb(16, 185, 129)',
                phoneValid: phoneField.style.borderColor === 'rgb(16, 185, 129)'
            };
        });
        
        console.log('All fields status:', allFieldsStatus);
        
        if (invalidAreaCodeError.errorShown && validAreaCodeResult.fieldBorderColor === 'rgb(16, 185, 129)') {
            console.log('✅ Phone validation working correctly');
        } else {
            console.log('❌ Phone validation has issues');
        }
        
    } catch (error) {
        console.log('❌ Test error:', error.message);
    } finally {
        await browser.close();
    }
}

testPhoneValidation().catch(console.error);