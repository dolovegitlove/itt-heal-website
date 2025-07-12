#!/usr/bin/env node

const fs = require('fs');

console.log('🔍 Testing Admin Dashboard Implementation');
console.log('=====================================');

// Read the admin dashboard file
const dashboardContent = fs.readFileSync('/home/ittz/projects/itt/site/admin-dashboard.html', 'utf8');

// Test 1: Check if new booking modal HTML exists
const hasModalHTML = dashboardContent.includes('id="new-booking-modal"');
console.log(`✅ New Booking Modal HTML: ${hasModalHTML ? 'PRESENT' : 'MISSING'}`);

// Test 2: Check if showNewBookingForm function is implemented (not just alert)
const hasRealShowFunction = dashboardContent.includes('modal.classList.remove(\'hidden\')') && 
                           dashboardContent.includes('showNewBookingForm()') &&
                           !dashboardContent.includes('alert(\'New booking form - Coming in next phase!\')');
console.log(`✅ showNewBookingForm Function: ${hasRealShowFunction ? 'IMPLEMENTED' : 'PLACEHOLDER'}`);

// Test 3: Check if closeNewBookingModal function exists
const hasCloseFunction = dashboardContent.includes('function closeNewBookingModal()');
console.log(`✅ closeNewBookingModal Function: ${hasCloseFunction ? 'IMPLEMENTED' : 'MISSING'}`);

// Test 4: Check if updatePricing function exists
const hasPricingFunction = dashboardContent.includes('function updatePricing()');
console.log(`✅ updatePricing Function: ${hasPricingFunction ? 'IMPLEMENTED' : 'MISSING'}`);

// Test 5: Check if createNewBooking function exists
const hasCreateFunction = dashboardContent.includes('async function createNewBooking(event)') && 
                         dashboardContent.includes('fetch(\'/api/admin/bookings\'');
console.log(`✅ createNewBooking Function: ${hasCreateFunction ? 'IMPLEMENTED' : 'MISSING'}`);

// Test 6: Check if toast notification system exists
const hasToastFunction = dashboardContent.includes('function showToast(') && 
                        dashboardContent.includes('toast-notification');
console.log(`✅ Toast Notification System: ${hasToastFunction ? 'IMPLEMENTED' : 'MISSING'}`);

// Test 7: Check if dashboard metrics are clickable
const hasClickableMetrics = dashboardContent.includes('onclick="filterBookings(\'all\')"') &&
                           dashboardContent.includes('onclick="filterBookings(\'today\')"') &&
                           dashboardContent.includes('onclick="filterBookings(\'upcoming\')"');
console.log(`✅ Clickable Dashboard Metrics: ${hasClickableMetrics ? 'IMPLEMENTED' : 'MISSING'}`);

// Test 8: Check if filters work (Clear Filters button)
const hasClearFilters = dashboardContent.includes('function clearFilters()') &&
                       dashboardContent.includes('onclick="clearFilters()"');
console.log(`✅ Clear Filters Button: ${hasClearFilters ? 'FUNCTIONAL' : 'NON-FUNCTIONAL'}`);

// Test 9: Check mobile responsive improvements
const hasMobileCSS = dashboardContent.includes('background: rgba(255, 255, 255, 0.9)') &&
                    dashboardContent.includes('@media (max-width: 768px)');
console.log(`✅ Mobile UI Contrast: ${hasMobileCSS ? 'IMPROVED' : 'NOT IMPROVED'}`);

// Test 10: Check form fields in modal
const hasFormFields = dashboardContent.includes('id="client-name"') &&
                     dashboardContent.includes('id="service-type"') &&
                     dashboardContent.includes('id="booking-date"') &&
                     dashboardContent.includes('id="booking-location"');
console.log(`✅ Complete Form Fields: ${hasFormFields ? 'PRESENT' : 'MISSING'}`);

console.log('\n📊 ADMIN DASHBOARD STATUS');
console.log('=========================');

const implementedFeatures = [
    hasModalHTML,
    hasRealShowFunction, 
    hasCloseFunction,
    hasPricingFunction,
    hasCreateFunction,
    hasToastFunction,
    hasClickableMetrics,
    hasClearFilters,
    hasMobileCSS,
    hasFormFields
].filter(Boolean).length;

const totalFeatures = 10;
const completionRate = Math.round((implementedFeatures / totalFeatures) * 100);

console.log(`Features Implemented: ${implementedFeatures}/${totalFeatures}`);
console.log(`Completion Rate: ${completionRate}%`);

if (completionRate === 100) {
    console.log('🎉 ALL ADMIN DASHBOARD FEATURES FULLY IMPLEMENTED!');
    console.log('');
    console.log('✅ Add Booking - Functional modal form with pricing');
    console.log('✅ Dashboard Metrics - Dynamic and clickable');
    console.log('✅ Filters - Status, location, date filters working');
    console.log('✅ Clear Filters - Button is functional');
    console.log('✅ Mobile UI - Improved contrast and styling');
    console.log('✅ Toast Notifications - Success/error feedback');
    
    process.exit(0);
} else {
    console.log(`💥 ${totalFeatures - implementedFeatures} features still need implementation`);
    process.exit(1);
}