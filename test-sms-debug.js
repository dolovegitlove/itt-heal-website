#!/usr/bin/env node

/**
 * Debug SMS functionality - test Twilio configuration
 */

require('dotenv').config({ path: '/home/ittz/projects/itt/shared/.env.production' });

const twilio = require('twilio');

async function testSMSFunctionality() {
    console.log('🔍 Testing SMS Configuration...\n');
    
    // Check environment variables
    console.log('Environment Check:');
    console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'MISSING');
    console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'MISSING');
    console.log('TWILIO_MESSAGING_SERVICE_SID:', process.env.TWILIO_MESSAGING_SERVICE_SID ? 'SET' : 'MISSING');
    console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || 'MISSING');
    console.log();
    
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.error('❌ Missing Twilio credentials');
        return;
    }
    
    try {
        // Initialize Twilio client
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        console.log('✅ Twilio client initialized');
        
        // Test 1: Verify account
        console.log('\n📋 Testing Account Access...');
        const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        console.log(`✅ Account Status: ${account.status}`);
        console.log(`✅ Account Name: ${account.friendlyName}`);
        
        // Test 2: Check messaging service
        if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
            console.log('\n📋 Testing Messaging Service...');
            try {
                const messagingService = await client.messaging.services(process.env.TWILIO_MESSAGING_SERVICE_SID).fetch();
                console.log(`✅ Messaging Service: ${messagingService.friendlyName}`);
                console.log(`✅ Service Status: ${messagingService.status || 'active'}`);
            } catch (serviceError) {
                console.error('❌ Messaging Service Error:', serviceError.message);
                console.log('⚠️ Will try using phone number directly...');
            }
        }
        
        // Test 3: Check phone number
        if (process.env.TWILIO_PHONE_NUMBER) {
            console.log('\n📋 Testing Phone Number...');
            try {
                const phoneNumbers = await client.incomingPhoneNumbers.list({limit: 20});
                const ourNumber = phoneNumbers.find(num => num.phoneNumber === process.env.TWILIO_PHONE_NUMBER);
                if (ourNumber) {
                    console.log(`✅ Phone Number Status: ${ourNumber.status || 'active'}`);
                    console.log(`✅ Capabilities: SMS=${ourNumber.capabilities.sms}, Voice=${ourNumber.capabilities.voice}`);
                } else {
                    console.log('⚠️ Phone number not found in account');
                }
            } catch (phoneError) {
                console.error('❌ Phone Number Error:', phoneError.message);
            }
        }
        
        // Test 4: Try sending a test SMS (to your own number for safety)
        console.log('\n📱 Testing SMS Send (Safe Test)...');
        
        // Use a test number or the ITT business number for testing
        const testNumber = '+19402685999'; // ITT business number
        
        try {
            const testMessage = {
                body: 'ITT Heal SMS Test - System Working! This is a test message.',
                to: testNumber
            };
            
            // Try messaging service first
            if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
                testMessage.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
            } else if (process.env.TWILIO_PHONE_NUMBER) {
                testMessage.from = process.env.TWILIO_PHONE_NUMBER;
            }
            
            const result = await client.messages.create(testMessage);
            
            console.log(`✅ SMS Test Successful!`);
            console.log(`✅ Message SID: ${result.sid}`);
            console.log(`✅ Status: ${result.status}`);
            console.log(`✅ To: ${result.to}`);
            console.log(`✅ From: ${result.from}`);
            
        } catch (smsError) {
            console.error('❌ SMS Send Failed:', smsError.message);
            console.error('Error Code:', smsError.code);
            console.error('Error Details:', smsError.moreInfo);
            
            // Common error troubleshooting
            if (smsError.code === 21211) {
                console.log('💡 Fix: Phone number is not valid');
            } else if (smsError.code === 21608) {
                console.log('💡 Fix: Phone number is not SMS-capable');
            } else if (smsError.code === 21614) {
                console.log('💡 Fix: "To" number is not a valid mobile number');
            } else if (smsError.code === 20003) {
                console.log('💡 Fix: Authentication failed - check credentials');
            } else if (smsError.code === 21606) {
                console.log('💡 Fix: Phone number is not owned by your account');
            }
        }
        
        // Test 5: Check recent messages
        console.log('\n📋 Recent Messages (Last 5)...');
        try {
            const messages = await client.messages.list({limit: 5});
            if (messages.length > 0) {
                messages.forEach((msg, index) => {
                    console.log(`${index + 1}. ${msg.dateCreated.toISOString().split('T')[0]} | ${msg.status} | ${msg.to} | ${msg.body.substring(0, 50)}...`);
                });
            } else {
                console.log('No recent messages found');
            }
        } catch (msgError) {
            console.error('❌ Could not fetch recent messages:', msgError.message);
        }
        
        console.log('\n🎉 SMS Configuration Test Complete!');
        
    } catch (error) {
        console.error('❌ SMS Test Failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testSMSFunctionality();