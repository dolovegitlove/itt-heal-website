/**
 * Booking Availability Module
 * Handles time slot loading and availability management
 */
(function() {
    'use strict';

    const BookingAvailability = {
        retryCount: 0,
        maxRetries: 3,
        retryDelay: 1000,

        init() {
            this.attachEventListeners();
            console.log('✅ Booking Availability module initialized');
        },

        attachEventListeners() {
            // Listen for date changes
            const dateInput = document.getElementById('booking-date');
            if (dateInput) {
                dateInput.addEventListener('change', () => {
                    this.refresh();
                });
            }

            // Listen for service selection changes
            document.addEventListener('serviceSelected', () => {
                const selectedDate = document.getElementById('booking-date')?.value;
                if (selectedDate) {
                    this.refresh();
                }
            });
        },

        refresh() {
            this.retryCount = 0;
            this.loadTimeSlots();
        },

        loadTimeSlots() {
            const dateInput = document.getElementById('booking-date');
            const timeSelect = document.getElementById('booking-time');
            const loadingDiv = document.getElementById('time-loading');
            
            if (!dateInput || !timeSelect) {
                console.error('Required booking elements not found');
                return;
            }
            
            if (!dateInput.value) {
                timeSelect.innerHTML = '<option value="">Select date first...</option>';
                timeSelect.disabled = true;
                return;
            }
            
            // Show loading state
            if (loadingDiv) {
                loadingDiv.style.display = 'block';
                loadingDiv.innerHTML = this.retryCount > 0 ? 
                    `<div style="color: #f59e0b;">Retrying... (Attempt ${this.retryCount + 1}/${this.maxRetries + 1})</div>` : 
                    '<div>Loading available times...</div>';
            }
            
            timeSelect.disabled = true;
            timeSelect.innerHTML = '<option value="">Loading times...</option>';
            
            const selectedDate = dateInput.value;
            const selectedService = document.querySelector('.service-option.active')?.dataset?.service || 'fascial-release-90';
            
            // Determine practitioner ID based on service type
            const practitionerId = this.getPractitionerIdForService(selectedService);
            
            // Make API call to get available times
            fetch(`/api/web-booking/availability/${practitionerId}/${selectedDate}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success && data.availability && data.availability.length > 0) {
                        this.populateTimeSlots(data.availability, timeSelect);
                        if (loadingDiv) {
                            loadingDiv.style.display = 'none';
                        }
                    } else {
                        this.handleNoAvailability(timeSelect, loadingDiv);
                    }
                })
                .catch(error => {
                    console.error('Error loading time slots:', error);
                    this.handleFetchError(error.message, timeSelect, loadingDiv);
                });
        },

        getPractitionerIdForService(service) {
            // Map services to practitioner IDs
            const serviceToPractitioner = {
                'fascial-release-90': 1,
                'fascial-release-60': 1,
                'integrative-touch-90': 1,
                'integrative-touch-60': 1,
                'wellness-consultation': 1,
                'premium-package': 1
            };
            
            return serviceToPractitioner[service] || 1;
        },

        populateTimeSlots(availability, timeSelect) {
            timeSelect.innerHTML = '<option value="">Select a time...</option>';
            
            availability.forEach(slot => {
                const option = document.createElement('option');
                option.value = slot.start_time;
                
                // Format time for display
                const timeStr = this.formatTime(slot.start_time);
                const durationStr = slot.duration ? ` (${slot.duration} min)` : '';
                
                option.textContent = timeStr + durationStr;
                option.dataset.slotId = slot.id;
                option.dataset.endTime = slot.end_time;
                
                timeSelect.appendChild(option);
            });
            
            timeSelect.disabled = false;
        },

        formatTime(timeStr) {
            // Convert 24-hour time to 12-hour format with AM/PM
            const [hours, minutes] = timeStr.split(':');
            const hour = parseInt(hours, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            
            return `${displayHour}:${minutes} ${ampm}`;
        },

        handleNoAvailability(timeSelect, loadingDiv) {
            timeSelect.innerHTML = '<option value="">No times available for this date</option>';
            timeSelect.disabled = false;
            
            if (loadingDiv) {
                loadingDiv.innerHTML = `
                    <div style="color: #dc2626; margin-top: 10px;">
                        No available appointments for this date.
                        <br>Please select a different date.
                    </div>
                `;
                loadingDiv.style.display = 'block';
            }
        },

        handleFetchError(errorMessage, timeSelect, loadingDiv) {
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                setTimeout(() => {
                    this.loadTimeSlots();
                }, this.retryDelay);
            } else {
                timeSelect.innerHTML = '<option value="">Error loading times - Please refresh page</option>';
                timeSelect.disabled = false;
                
                if (loadingDiv) {
                    loadingDiv.innerHTML = `
                        <div style="color: #dc2626; margin-top: 10px;">
                            <strong>Unable to load available times</strong><br>
                            <span style="font-size: 14px;">Please check your internet connection and try again.</span><br>
                            <button onclick="window.BookingAvailability.refresh()" style="margin-top: 10px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                Retry
                            </button>
                        </div>
                    `;
                    loadingDiv.style.display = 'block';
                }
            }
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            BookingAvailability.init();
        });
    } else {
        BookingAvailability.init();
    }

    // Expose to global scope
    window.BookingAvailability = BookingAvailability;
})();