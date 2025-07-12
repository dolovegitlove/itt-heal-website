#!/usr/bin/env node

const { PractitionerAvailability } = require('../shared/backend/models');

async function debugAvailability() {
    console.log('🔍 Testing PractitionerAvailability model directly...');
    
    try {
        const drSchifferId = '060863f2-0623-4785-b01a-f1760cfb8d14';
        
        const testData = {
            practitioner_id: drSchifferId,
            date: '2025-07-01',
            start_time: '14:00',
            end_time: '15:00',
            is_available: true,
            is_recurring: false,
            recurring_pattern: null,
            reason: null,
            description: 'Test availability slot',
            is_override: true,
            created_by: drSchifferId
        };
        
        console.log('📝 Attempting to create availability with data:', testData);
        
        const result = await PractitionerAvailability.create(testData);
        
        console.log('✅ Successfully created availability:', result.id);
        console.log('📊 Result:', JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('❌ Error creating availability:', error.message);
        console.error('📋 Full error:', error);
        
        if (error.name === 'SequelizeValidationError') {
            console.log('🔍 Validation errors:');
            error.errors.forEach(err => {
                console.log(`  - ${err.path}: ${err.message}`);
            });
        }
    }
    
    process.exit(0);
}

debugAvailability();