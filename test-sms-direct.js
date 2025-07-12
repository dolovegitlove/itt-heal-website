#!/usr/bin/env node

/**
 * Direct SMS test - bypasses mocks and tests actual Twilio integration
 */

require('dotenv').config({ path: '/home/ittz/projects/itt/shared/.env.production' });

console.log('🔍 Testing DIRECT SMS integration...\n');

// Check environment variables
console.log('Environment variables:');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'NOT SET');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'NOT SET');
console.log('TWILIO_MESSAGING_SERVICE_SID:', process.env.TWILIO_MESSAGING_SERVICE_SID ? 'SET' : 'NOT SET');
console.log('TEST_SMS_TO:', process.env.TEST_SMS_TO || 'NOT SET');
console.log();

async function testDirectSMS() {
    try {
        // Import SMS service
        const smsService = require('/home/ittz/projects/itt/shared/backend/services/smsService');
        
        console.log('1. Testing sendTestSMS function...');
        const testResult = await smsService.sendTestSMS(process.env.TEST_SMS_TO || '+14695251001');
        
        console.log('Test SMS Result:', JSON.stringify(testResult, null, 2));
        
        if (testResult.success) {
            console.log('✅ SMS sent successfully!');
            console.log('Message ID:', testResult.messageId);
        } else {
            console.log('❌ SMS failed:', testResult.error);
        }
        
        console.log('\n2. Testing booking confirmation SMS...');
        const bookingResult = await smsService.sendBookingConfirmationSMS(process.env.TEST_SMS_TO || '+14695251001', {
            sessionType: 'Test Session',
            scheduledDate: new Date(),
            scheduledTime: '2:00 PM',
            location: '2425 S Willis St, Abilene, TX 79605'
        });
        
        console.log('Booking SMS Result:', JSON.stringify(bookingResult, null, 2));
        
        if (bookingResult.success) {
            console.log('✅ Booking SMS sent successfully!');
        } else {
            console.log('❌ Booking SMS failed:', bookingResult.error);
        }
        
    } catch (error) {
        console.error('❌ Direct SMS test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Test email as well
async function testDirectEmail() {
    try {
        console.log('\n3. Testing direct email...');
        
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER || 'apikey',
                pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY
            }
        });
        
        const mailOptions = {
            from: process.env.EMAIL_USER || 'info@ittheal.com',
            to: process.env.TEST_EMAIL_TO || 'dolovedev@gmail.com',
            subject: 'ITT Heal - Direct Email Test',
            html: `
                <h2>Direct Email Test</h2>
                <p>This is a direct test of the email system.</p>
                <p>Timestamp: ${new Date().toISOString()}</p>
                <p>If you received this, email notifications are working!</p>
            `
        };
        
        const emailResult = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', emailResult.messageId);
        
    } catch (error) {
        console.error('❌ Direct email test failed:', error.message);
        console.error('Details:', error);
    }
}

async function runAllTests() {
    await testDirectSMS();
    await testDirectEmail();
    
    console.log('\n🏁 Direct notification tests completed!');
}

runAllTests();