// Test script to verify 12-hour advance booking rule implementation

async function test12HourRule() {
    console.log('🕐 Testing 12-hour advance booking rule for first appointment of the day');
    console.log('================================================================');
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    console.log(`⏰ Current time: ${now.toLocaleString()}`);
    
    // Test different scenarios
    
    // Scenario 1: Test today (should show no slots due to 12-hour rule)
    console.log('\n📅 Scenario 1: Testing today (expecting limited/no slots)');
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    try {
        const response = await fetch(`https://ittheal.com/api/web-booking/availability?date=${todayStr}`);
        const data = await response.json();
        
        console.log(`📊 Today (${todayStr}) availability:`);
        console.log(`   Success: ${data.success}`);
        console.log(`   Available slots: ${data.availableSlots ? data.availableSlots.length : 0}`);
        console.log(`   Is business day: ${data.isBusinessDay}`);
        console.log(`   Message: ${data.message || data.error}`);
        
        if (data.availableSlots && data.availableSlots.length > 0) {
            console.log(`   First available: ${data.availableSlots[0]}`);
            
            // Check if first slot meets 12-hour requirement
            const firstSlot = data.availableSlots[0];
            const [hours, minutes] = firstSlot.split(':').map(Number);
            const slotTime = new Date(today);
            slotTime.setHours(hours, minutes, 0, 0);
            
            const timeDiff = (slotTime.getTime() - now.getTime()) / (1000 * 60 * 60);
            console.log(`   ⏱️  Time difference: ${timeDiff.toFixed(1)} hours`);
            console.log(`   ✅ Meets 12-hour rule: ${timeDiff >= 12 ? 'YES' : 'NO'}`);
        }
    } catch (error) {
        console.error('❌ Error testing today:', error.message);
    }
    
    // Scenario 2: Test tomorrow (should show all slots)
    console.log('\n📅 Scenario 2: Testing tomorrow (expecting all slots available)');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    try {
        const response = await fetch(`https://ittheal.com/api/web-booking/availability?date=${tomorrowStr}`);
        const data = await response.json();
        
        console.log(`📊 Tomorrow (${tomorrowStr}) availability:`);
        console.log(`   Success: ${data.success}`);
        console.log(`   Available slots: ${data.availableSlots ? data.availableSlots.length : 0}`);
        console.log(`   Is business day: ${data.isBusinessDay}`);
        
        if (data.availableSlots && data.availableSlots.length > 0) {
            console.log(`   First available: ${data.availableSlots[0]}`);
            console.log(`   Last available: ${data.availableSlots[data.availableSlots.length - 1]}`);
        }
    } catch (error) {
        console.error('❌ Error testing tomorrow:', error.message);
    }
    
    // Scenario 3: Calculate when booking should become available
    console.log('\n⏰ Scenario 3: When will first appointment be bookable?');
    
    const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    console.log(`📅 12 hours from now: ${twelveHoursFromNow.toLocaleString()}`);
    
    const bookableDate = twelveHoursFromNow.toISOString().split('T')[0];
    const bookableTime = twelveHoursFromNow.toTimeString().slice(0, 5);
    
    console.log(`📅 Earliest bookable date: ${bookableDate}`);
    console.log(`⏰ Earliest bookable time: ${bookableTime} or later`);
    
    console.log('\n✅ 12-hour rule test complete!');
}

// Run the test
if (typeof window === 'undefined') {
    // Node.js environment
    const fetch = require('node-fetch');
    test12HourRule().catch(console.error);
} else {
    // Browser environment
    test12HourRule().catch(console.error);
}