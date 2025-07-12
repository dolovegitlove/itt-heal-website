#!/usr/bin/env node

/**
 * Direct SendGrid Test - Test email sending with the exact configuration
 */

require('dotenv').config({ path: '/home/ittz/projects/itt/shared/.env.production' });

const sgMail = require('@sendgrid/mail');

async function testSendGridDirect() {
    console.log('🧪 Testing SendGrid Direct Email Sending');
    console.log('========================================');
    
    // Check environment variables
    console.log('\n🔍 Environment Check:');
    console.log(`SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`FROM_EMAIL: ${process.env.FROM_EMAIL || 'NOT SET'}`);
    console.log(`TEST_EMAIL_TO: ${process.env.TEST_EMAIL_TO || 'NOT SET'}`);
    
    if (!process.env.SENDGRID_API_KEY) {
        console.log('❌ SENDGRID_API_KEY not found in environment');
        return false;
    }
    
    // Set API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Prepare test email
    const msg = {
        to: 'dolovedev@gmail.com',
        from: 'info@ittheal.com', // Use verified sender
        subject: 'Direct SendGrid Test - ITT Heal',
        text: 'This is a direct test of SendGrid email delivery from ITT Heal system.',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">SendGrid Direct Test</h2>
                <p>This is a direct test of SendGrid email delivery.</p>
                <p><strong>Time:</strong> ${new Date().toISOString()}</p>
                <p><strong>From:</strong> ITT Heal System</p>
                <p>If you receive this email, SendGrid is working correctly.</p>
            </div>
        `
    };
    
    console.log('\n📧 Sending test email...');
    console.log(`To: ${msg.to}`);
    console.log(`From: ${msg.from}`);
    console.log(`Subject: ${msg.subject}`);
    
    try {
        const result = await sgMail.send(msg);
        console.log('\n✅ Email sent successfully!');
        console.log(`Status Code: ${result[0].statusCode}`);
        console.log(`Message ID: ${result[0].headers['x-message-id']}`);
        console.log('\n📱 Check your email now!');
        return true;
    } catch (error) {
        console.log('\n❌ Email sending failed:');
        console.error(error.response ? error.response.body : error.message);
        
        if (error.response && error.response.body && error.response.body.errors) {
            error.response.body.errors.forEach(err => {
                console.log(`Error: ${err.message}`);
                if (err.field) console.log(`Field: ${err.field}`);
            });
        }
        
        return false;
    }
}

testSendGridDirect().then(success => {
    process.exit(success ? 0 : 1);
});