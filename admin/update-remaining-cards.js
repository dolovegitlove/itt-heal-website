// Script to help update the remaining metric cards
// This shows the replacements needed

const replacements = [
  {
    old: `                <div class="metric-card">
                    <div class="metric-header">
                        <h3 class="metric-title">Active Bookings</h3>
                        <svg class="metric-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z"/>
                        </svg>
                    </div>
                    <div class="metric-value">\${analytics.activeBookings}</div>
                    <div class="metric-change">Scheduled appointments</div>
                </div>`,
    new: `                <!-- Active Appointments Card -->
                <div class="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-spa-lavender-100 hover:border-spa-lavender-200 group">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="text-lg font-semibold text-spa-charcoal-800 font-display">Active Appointments</h3>
                            <div class="flex items-center mt-1">
                                <svg class="w-4 h-4 text-spa-sage-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <span class="text-sm text-spa-charcoal-500">Scheduled</span>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="text-3xl font-bold text-spa-charcoal-800 font-display animate-counter">\${analytics.activeBookings}</div>
                        <p class="text-sm text-spa-charcoal-600 leading-relaxed">Upcoming wellness sessions</p>
                    </div>
                </div>`
  }
];

console.log('Replacement patterns ready for manual editing');
console.log('Apply these replacements to admin-dashboard.js');
