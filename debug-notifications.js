#!/usr/bin/env node

/**
 * Debug notification system - comprehensive analysis
 */

require('dotenv').config({ path: '/home/ittz/projects/itt/shared/.env.production' });

console.log('🔍 ITT Heal Notification System Debug Report\n');
console.log('=' + '='.repeat(60) + '=');

// 1. Environment Check
console.log('\n📋 ENVIRONMENT CONFIGURATION:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ SET' : '❌ NOT SET');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ SET' : '❌ NOT SET');
console.log('TWILIO_MESSAGING_SERVICE_SID:', process.env.TWILIO_MESSAGING_SERVICE_SID ? '✅ SET' : '❌ NOT SET');
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET');
console.log('TEST_SMS_TO:', process.env.TEST_SMS_TO || '❌ NOT SET');
console.log('TEST_EMAIL_TO:', process.env.TEST_EMAIL_TO || '❌ NOT SET');

// 2. Service Tests
console.log('\n🧪 SERVICE TESTS:');

async function testSMSService() {
    try {
        console.log('\n📱 SMS Service Test:');
        const smsService = require('/home/ittz/projects/itt/shared/backend/services/smsService');
        
        // Test basic SMS
        const testResult = await smsService.sendTestSMS(process.env.TEST_SMS_TO || '+14695251001');
        console.log('  Basic SMS:', testResult.success ? '✅ SUCCESS' : '❌ FAILED');
        if (testResult.success) {
            console.log('  Message ID:', testResult.messageId);
            console.log('  Status:', testResult.status);
        } else {
            console.log('  Error:', testResult.error);
        }
        
        // Test booking confirmation SMS
        const bookingResult = await smsService.sendBookingConfirmationSMS(process.env.TEST_SMS_TO || '+14695251001', {
            sessionType: 'Debug Test Session',
            scheduledDate: new Date(),
            scheduledTime: '2:00 PM',
            location: '2425 S Willis St, Abilene, TX 79605'
        });
        console.log('  Booking SMS:', bookingResult.success ? '✅ SUCCESS' : '❌ FAILED');
        if (bookingResult.success) {
            console.log('  Message ID:', bookingResult.messageId);
        } else {
            console.log('  Error:', bookingResult.error);
        }
        
        return { sms_working: testResult.success && bookingResult.success };
        
    } catch (error) {
        console.log('  ❌ SMS Service Error:', error.message);
        return { sms_working: false, sms_error: error.message };
    }
}

async function testEmailService() {
    try {
        console.log('\n📧 Email Service Test:');
        
        // Test if we're in test mode that skips emails
        if (process.env.NODE_ENV === 'test' || process.env.SENDGRID_API_KEY === 'SG.disabled_for_testing') {
            console.log('  ⚠️  EMAIL DISABLED - Test mode detected');
            console.log('  NODE_ENV:', process.env.NODE_ENV);
            console.log('  SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY?.substring(0, 20) + '...');
            return { email_working: false, email_disabled: true };
        }
        
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER || 'apikey',
                pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY
            }
        });
        
        // Test with a verified sender (if any)
        const testEmail = {
            from: process.env.EMAIL_USER || 'info@ittheal.com',
            to: process.env.TEST_EMAIL_TO || 'dolovedev@gmail.com',
            subject: '🚨 ITT Heal Notification Debug Test',
            html: `
                <h2>Email Service Debug Test</h2>
                <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
                <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
                <p>If you receive this, email notifications are working correctly!</p>
            `
        };
        
        const result = await transporter.sendMail(testEmail);
        console.log('  Email Test: ✅ SUCCESS');
        console.log('  Message ID:', result.messageId);
        console.log('  Response:', result.response);
        
        return { email_working: true, email_message_id: result.messageId };
        
    } catch (error) {
        console.log('  ❌ Email Service Error:', error.message);
        
        // Check for specific SendGrid errors
        if (error.message.includes('verified Sender Identity')) {
            console.log('  🎯 ISSUE: SendGrid sender identity not verified');
            console.log('  💡 SOLUTION: Verify sender identity for:', process.env.EMAIL_USER);
            console.log('  🔗 URL: https://sendgrid.com/docs/for-developers/sending-email/sender-identity/');
        }
        
        return { email_working: false, email_error: error.message };
    }
}

// 3. Booking Flow Analysis
async function analyzeBookingFlow() {
    console.log('\n🔄 BOOKING FLOW ANALYSIS:');
    
    try {
        // Check the webBooking route to see notification logic
        const fs = require('fs');
        const webBookingPath = '/home/ittz/projects/itt/shared/backend/routes/webBooking.js';
        const webBookingContent = fs.readFileSync(webBookingPath, 'utf8');
        
        // Check for notification calls in booking endpoint
        const hasBookingSMS = webBookingContent.includes('sendBookingConfirmationSMS');
        const hasBookingEmail = webBookingContent.includes('sendBookingConfirmationEmail');
        const hasPaymentSMS = webBookingContent.includes('sendPaymentConfirmationSMS');
        const hasPaymentEmail = webBookingContent.includes('sendPaymentConfirmationEmail');
        
        console.log('  Booking SMS call:', hasBookingSMS ? '✅ PRESENT' : '❌ MISSING');
        console.log('  Booking Email call:', hasBookingEmail ? '✅ PRESENT' : '❌ MISSING');
        console.log('  Payment SMS call:', hasPaymentSMS ? '✅ PRESENT' : '❌ MISSING');
        console.log('  Payment Email call:', hasPaymentEmail ? '✅ PRESENT' : '❌ MISSING');
        
        // Check for conditional logic that might skip notifications
        const hasTestMode = webBookingContent.includes('NODE_ENV === \'test\'');
        const hasEmailSkip = webBookingContent.includes('disabled_for_testing');
        
        console.log('  Test mode detection:', hasTestMode ? '⚠️  PRESENT' : '✅ NONE');
        console.log('  Email skip logic:', hasEmailSkip ? '⚠️  PRESENT' : '✅ NONE');
        
        return {
            notifications_in_booking: hasBookingSMS && hasBookingEmail,
            test_mode_detected: hasTestMode || hasEmailSkip
        };
        
    } catch (error) {
        console.log('  ❌ Analysis Error:', error.message);
        return { analysis_failed: true };
    }
}

// 4. Real-time Test
async function performLiveTest() {
    console.log('\n🎯 LIVE NOTIFICATION TEST:');
    
    try {
        // Direct service test
        console.log('  Testing direct service calls...');
        
        const smsResult = await testSMSService();
        const emailResult = await testEmailService();
        const flowAnalysis = await analyzeBookingFlow();
        
        console.log('\n📊 SUMMARY:');
        console.log('  SMS Service:', smsResult.sms_working ? '✅ WORKING' : '❌ BROKEN');
        console.log('  Email Service:', emailResult.email_working ? '✅ WORKING' : 
                    emailResult.email_disabled ? '⚠️  DISABLED' : '❌ BROKEN');
        console.log('  Booking Flow:', flowAnalysis.notifications_in_booking ? '✅ COMPLETE' : '❌ INCOMPLETE');
        
        console.log('\n🎯 ROOT CAUSE ANALYSIS:');
        
        if (!smsResult.sms_working) {
            console.log('❌ SMS NOT WORKING:');
            console.log('   Cause:', smsResult.sms_error || 'Unknown');
        }
        
        if (!emailResult.email_working) {
            if (emailResult.email_disabled) {
                console.log('⚠️  EMAIL DISABLED:');
                console.log('   Cause: Test mode or disabled configuration');
                console.log('   NODE_ENV:', process.env.NODE_ENV);
            } else {
                console.log('❌ EMAIL NOT WORKING:');
                console.log('   Cause:', emailResult.email_error || 'Unknown');
                if (emailResult.email_error?.includes('verified Sender Identity')) {
                    console.log('   🔧 FIX: Verify sender identity in SendGrid');
                }
            }
        }
        
        if (flowAnalysis.test_mode_detected) {
            console.log('⚠️  TEST MODE INTERFERENCE:');
            console.log('   Cause: Code may skip notifications in test environment');
        }
        
        console.log('\n💡 RECOMMENDED ACTIONS:');
        
        if (smsResult.sms_working) {
            console.log('✅ SMS: No action needed - working correctly');
        } else {
            console.log('🔧 SMS: Check Twilio credentials and phone number format');
        }
        
        if (emailResult.email_working) {
            console.log('✅ Email: No action needed - working correctly');
        } else if (emailResult.email_disabled) {
            console.log('🔧 Email: Change NODE_ENV from "test" to "production"');
            console.log('🔧 Email: Update SENDGRID_API_KEY if set to disabled value');
        } else {
            console.log('🔧 Email: Verify sender identity in SendGrid dashboard');
            console.log('🔧 Email: Use verified email address in FROM_EMAIL');
        }
        
        console.log('\n🚀 IMMEDIATE FIX:');
        console.log('1. Change NODE_ENV to "production" in .env file');
        console.log('2. Verify info@ittheal.com in SendGrid dashboard');
        console.log('3. Test with a real booking to confirm notifications work');
        
    } catch (error) {
        console.log('❌ Live test failed:', error.message);
    }
}

// Run all tests
async function runDebugSuite() {
    await performLiveTest();
    
    console.log('\n' + '='.repeat(62));
    console.log('🏁 DEBUG REPORT COMPLETE');
    console.log('='.repeat(62));
}

runDebugSuite();