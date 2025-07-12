#!/usr/bin/env node

/**
 * Test REAL SMS and Email sending (not just configuration checks)
 */

const { sendTestSMS, sendBookingConfirmationSMS } = require('/home/ittz/projects/itt/shared/backend/services/smsService');
const nodemailer = require('nodemailer');

// Load environment from production config
require('dotenv').config({ path: '/home/ittz/projects/itt/shared/.env.production' });

async function testRealSMS() {
    console.log('📱 Testing REAL SMS sending...');
    
    try {
        const result = await sendTestSMS('4695251001');
        
        if (result.success) {
            console.log('✅ SMS sent successfully!');
            console.log('📱 Message ID:', result.messageId);
            console.log('📱 Status:', result.status);
            return true;
        } else {
            console.log('❌ SMS failed:', result.error);
            return false;
        }
        
    } catch (error) {
        console.log('❌ SMS test error:', error.message);
        return false;
    }
}

async function testRealEmail() {
    console.log('\n📧 Testing REAL Email sending...');
    
    try {
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
            subject: '✅ ITT Heal - REAL Email Test',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #10b981;">📧 Real Email Test Success!</h2>
                    <p>This is a REAL email test from ITT Heal booking system.</p>
                    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                    <p><strong>Test Type:</strong> Actual email delivery test</p>
                    
                    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>📍 Test Confirmation</h3>
                        <p>✅ Email notifications are working correctly!</p>
                        <p>✅ SMTP connection successful</p>
                        <p>✅ Message delivered to recipient</p>
                    </div>
                    
                    <p>If you received this email, the ITT Heal notification system is fully functional!</p>
                    <p><em>- ITT Heal Automated Testing System</em></p>
                </div>
            `
        };
        
        const emailResult = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', emailResult.messageId);
        console.log('📧 Response:', emailResult.response);
        
        return true;
        
    } catch (error) {
        console.log('❌ Email test failed:', error.message);
        console.log('❌ Error details:', error);
        return false;
    }
}

async function runRealTests() {
    console.log('🧪 ITT Heal - REAL SMS & Email Test');
    console.log('====================================');
    console.log(`📅 Test Date: ${new Date().toISOString()}`);
    console.log(`📱 SMS Target: 4695251001`);
    console.log(`📧 Email Target: dolovedev@gmail.com`);
    console.log('');
    
    const smsResult = await testRealSMS();
    const emailResult = await testRealEmail();
    
    console.log('\n📋 REAL Test Results Summary:');
    console.log('==============================');
    console.log(`📱 SMS Delivery: ${smsResult ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`📧 Email Delivery: ${emailResult ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (smsResult && emailResult) {
        console.log('\n🎉 ALL REAL NOTIFICATIONS SENT SUCCESSFULLY!');
        console.log('📱 Check your phone for SMS');
        console.log('📧 Check your email inbox');
    } else {
        console.log('\n❌ Some real notifications failed');
        if (!smsResult) console.log('📱 SMS delivery failed - check Twilio configuration');
        if (!emailResult) console.log('📧 Email delivery failed - check SendGrid configuration');
    }
    
    return smsResult && emailResult;
}

runRealTests()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('💥 Test execution failed:', error);
        process.exit(1);
    });