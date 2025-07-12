#!/usr/bin/env node

/**
 * Test the actual notification functions from the booking flow
 */

require('dotenv').config({ path: '/home/ittz/projects/itt/shared/.env.production' });

const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');

async function testActualNotificationFunctions() {
  console.log('🧪 Testing Actual Notification Functions');
  console.log('========================================');

  // Test 1: Direct SendGrid email (same as booking confirmation)
  console.log('\n📧 Test 1: Booking Confirmation Email (SendGrid)...');
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: 'dolovedev@gmail.com',
      from: 'info@ittheal.com',
      subject: '🚨 URGENT: Complete Paperwork + Booking Confirmation - ITT Heal',
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #667eea;">Booking Confirmation Test</h2>
                    <p>This is a test of the actual booking confirmation email function.</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Test Type:</strong> Actual notification function</p>
                    <p>If you receive this email, the booking notification system is working!</p>
                </div>
            `
    };

    const result = await sgMail.send(msg);
    console.log('✅ Booking email sent successfully!');
    console.log(`Status Code: ${result[0].statusCode}`);
    console.log(`Message ID: ${result[0].headers['x-message-id']}`);
  } catch (error) {
    console.error.message);
  }

  // Test 2: Direct Twilio SMS (same as booking confirmation)
  console.log('\n📱 Test 2: Booking Confirmation SMS (Twilio)...');
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const message = `ITT Heal Booking Confirmed!

Your appointment has been scheduled for:
Date: ${new Date(Date.now() + 24*60*60*1000).toLocaleDateString()}
Time: 10:00 AM

Location: 2425 S Willis St, Abilene, TX 79605

This is a test of the actual booking SMS function.

Please arrive 10 minutes early with valid ID.`;

    const messageData = {
      body: message,
      to: '+14695251001'
    };

    if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
      messageData.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    } else if (process.env.TWILIO_PHONE_NUMBER) {
      messageData.from = process.env.TWILIO_PHONE_NUMBER;
    }

    const result = await client.messages.create(messageData);
    console.log('✅ Booking SMS sent successfully!');
    console.log(`Message SID: ${result.sid}`);
    console.log(`Status: ${result.status}`);
  } catch (error) {
    console.error.message);
  }

  // Test 3: Nodemailer transporter (same as backend)
  console.log('\n📧 Test 3: Nodemailer Transporter (Backend Method)...');
  try {
    // This is the same transporter config used in the backend
    const transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });

    const mailOptions = {
      from: 'info@ittheal.com',
      to: 'dolovedev@gmail.com',
      subject: 'Nodemailer Test - ITT Heal Backend Method',
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #667eea;">Nodemailer Backend Test</h2>
                    <p>This tests the exact same method used in the backend booking flow.</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                    <p>If you receive this email, the backend email method is working!</p>
                </div>
            `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Nodemailer email sent successfully!');
  } catch (error) {
    console.error.message);
    console.error);
  }

  console.log('\n🎯 Notification Function Tests Complete');
  console.log('📱 Check your phone and email for test messages!');
}

testActualNotificationFunctions().catch(console.error);
