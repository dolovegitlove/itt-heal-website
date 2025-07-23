const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debug12HourRule() {
    console.log('🔍 Debugging 12-hour rule implementation');
    console.log('=======================================');
    
    const now = new Date();
    console.log(`⏰ Current time: ${now.toISOString()}`);
    console.log(`⏰ Current time local: ${now.toLocaleString()}`);
    
    // Test tomorrow morning - should be affected by 12-hour rule if no bookings exist
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    console.log(`\n📅 Testing: ${tomorrowStr}`);
    
    try {
        const response = await fetch(`https://ittheal.com/api/web-booking/availability?date=${tomorrowStr}`);
        const data = await response.json();
        
        console.log('\n📊 API Response:');
        console.log('================');
        console.log(JSON.stringify(data, null, 2));
        
        // Calculate expected behavior
        console.log('\n🔍 Analysis:');
        console.log('============');
        
        if (data.success && data.availableSlots) {
            console.log(`✅ Request successful`);
            console.log(`📅 Date: ${data.date}`);
            console.log(`🏢 Business day: ${data.isBusinessDay}`);
            console.log(`📝 Available slots: ${data.availableSlots.length}`);
            console.log(`🚫 Booked slots: ${data.bookedSlots ? data.bookedSlots.length : 0}`);
            
            if (data.bookedSlots && data.bookedSlots.length === 0) {
                console.log('\n⚠️ IMPORTANT: No existing bookings found!');
                console.log('   This means ALL slots should be subject to 12-hour rule');
                
                // Check first available slot
                if (data.availableSlots.length > 0) {
                    const firstSlot = data.availableSlots[0];
                    const [hours, minutes] = firstSlot.split(':').map(Number);
                    
                    const slotDateTime = new Date(tomorrow);
                    slotDateTime.setHours(hours, minutes, 0, 0);
                    
                    const timeDiffHours = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                    
                    console.log(`\n🕐 First slot analysis:`);
                    console.log(`   Time slot: ${firstSlot}`);
                    console.log(`   Full datetime: ${slotDateTime.toISOString()}`);
                    console.log(`   Time difference: ${timeDiffHours.toFixed(2)} hours`);
                    
                    if (timeDiffHours >= 12) {
                        console.log(`   ✅ Correctly allows slot (>=12 hours)`);
                    } else {
                        console.log(`   ❌ Should be blocked by 12-hour rule (<12 hours)`);
                    }
                }
                
                // Check if early morning slots are properly blocked
                const businessStart = data.businessHours.start;
                const earlySlots = data.availableSlots.filter(slot => {
                    const [hours] = slot.split(':').map(Number);
                    return hours < 16; // Before 4 PM tomorrow
                });
                
                console.log(`\n📊 Early slots (before 4 PM tomorrow): ${earlySlots.length}`);
                console.log(`   Slots: ${earlySlots.join(', ')}`);
                
                if (earlySlots.length > 0) {
                    console.log(`   ⚠️  These early slots might violate 12-hour rule`);
                }
            }
        } else {
            console.log(`❌ Request failed: ${data.error || data.message}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    console.log('\n🔧 Next steps to verify implementation:');
    console.log('======================================');
    console.log('1. Check backend logs for meetsMinimumAdvanceForTimeSlot calls');
    console.log('2. Verify existingBookings parameter is being passed correctly');
    console.log('3. Check if business hours are in the right timezone');
    console.log('4. Test with curl commands to verify API behavior');
}

debug12HourRule().catch(console.error);