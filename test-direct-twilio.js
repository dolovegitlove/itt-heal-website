#!/usr/bin/env node

/**
 * Direct Twilio SMS test
 */

require('dotenv').config({ path: '/home/ittz/projects/itt/shared/.env.production' });

const twilio = require('twilio');

console.log('🔍 Twilio Environment Check:');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'NOT SET');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'NOT SET');
console.log('TWILIO_MESSAGING_SERVICE_SID:', process.env.TWILIO_MESSAGING_SERVICE_SID ? 'SET' : 'NOT SET');
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? 'SET' : 'NOT SET');
console.log('');

async function sendDirectSMS() {
    try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        const message = await client.messages.create({
            body: '📱 ITT Heal SMS Test: This message confirms SMS is working! Test completed at ' + new Date().toLocaleString(),
            messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
            to: '+14695251001'
        });
        
        console.log('✅ SMS sent successfully!');
        console.log('📱 Message SID:', message.sid);
        console.log('📱 Status:', message.status);
        console.log('📱 To:', message.to);
        
        return true;
        
    } catch (error) {
        console.log('❌ SMS failed:', error.message);
        console.log('❌ Error code:', error.code);
        console.log('❌ More info:', error.moreInfo);
        return false;
    }
}

async function sendDirectEmail() {
    try {
        const nodemailer = require('nodemailer');
        
        // Use a verified sender identity
        const transporter = nodemailer.createTransporter({
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: {
                user: 'apikey',
                pass: process.env.SENDGRID_API_KEY
            }
        });
        
        const mailOptions = {
            from: 'noreply@ittheal.com', // Try a different sender
            to: 'dolovedev@gmail.com',
            subject: '📧 ITT Heal Email Test - SUCCESS!',
            html: `
                <h2>✅ Email Test Successful!</h2>
                <p>This email confirms that the ITT Heal email system is working correctly.</p>
                <p><strong>Test completed:</strong> ${new Date().toLocaleString()}</p>
                <p>Email notifications are fully functional!</p>
            `
        };
        
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', result.messageId);
        
        return true;
        
    } catch (error) {
        console.log('❌ Email failed:', error.message);
        return false;
    }
}

async function runDirectTests() {
    console.log('🧪 Direct SMS & Email Test');
    console.log('============================');
    
    console.log('\n📱 Sending SMS...');
    const smsResult = await sendDirectSMS();
    
    console.log('\n📧 Sending Email...');
    const emailResult = await sendDirectEmail();
    
    console.log('\n📋 Final Results:');
    console.log('==================');
    console.log(`📱 SMS: ${smsResult ? '✅ SENT' : '❌ FAILED'}`);
    console.log(`📧 Email: ${emailResult ? '✅ SENT' : '❌ FAILED'}`);
    
    if (smsResult && emailResult) {
        console.log('\n🎉 BOTH NOTIFICATIONS SENT! Check your phone and email.');
    }
}

runDirectTests();