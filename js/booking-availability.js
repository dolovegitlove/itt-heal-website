// Note: This is a frontend file, enum values should be defined locally or imported from shared frontend constants

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
        inputTimeout: null,
        lastApiCall: null, // Cache to prevent duplicate API calls

        init() {
            this.attachEventListeners();
            console.log('✅ Booking Availability module initialized');
        },

        attachEventListeners() {
            // Single consolidated date change listener with proper debouncing
            const dateInput = document.getElementById('booking-date');
            if (dateInput) {
                // Only listen for 'change' event (most reliable for date inputs)
                dateInput.addEventListener('change', () => {
                    // Clear any pending debounced calls
                    clearTimeout(this.inputTimeout);
                    // Debounce to prevent multiple rapid calls
                    this.inputTimeout = setTimeout(() => {
                        this.refresh();
                    }, 300);
                });
            }

            // Listen for service selection changes
            document.addEventListener('serviceSelected', () => {
                const selectedDate = document.getElementById('booking-date')?.value;
                if (selectedDate) {
                    this.refresh();
                }
            });
            
            // Listen for calendar date selection
            document.addEventListener('timeSelected', () => {
                // Calendar has made a selection, no need to refresh
                console.log('✅ Calendar date/time selected');
            });
            
            // Listen for time selection changes to store for persistence
            const timeSelect = document.getElementById('booking-time');
            if (timeSelect) {
                timeSelect.addEventListener('change', () => {
                    if (timeSelect.value) {
                        timeSelect.dataset.previousSelection = timeSelect.value;
                    }
                });
            }
        },

        refresh() {
            this.retryCount = 0;
            this.loadTimeSlots();
        },

        isValidBookingDate(dateString) {
            if (!dateString) return false;
            
            const selectedDate = new Date(dateString + 'T00:00:00');
            const now = new Date();
            
            // For same-day booking, check business hours and advance requirement
            if (selectedDate.toDateString() === now.toDateString()) {
                const dayOfWeek = selectedDate.getDay();
                
                // Business hours by day of week (0=Sunday, 6=Saturday)
                const businessHours = {
                    0: null, // Sunday - CLOSED
                    1: { start: 10, end: 18 }, // Monday: 10 AM - 6 PM
                    2: null, // Tuesday - CLOSED  
                    3: { start: 12, end: 20 }, // Wednesday: 12 PM - 8 PM
                    4: null, // Thursday - CLOSED
                    5: { start: 10, end: 18 }, // Friday: 10 AM - 6 PM
                    6: { start: 11, end: 19 }  // Saturday: 11 AM - 7 PM
                };
                
                const todayHours = businessHours[dayOfWeek];
                if (!todayHours) {
                    return false; // Closed today
                }
                
                // Check if we're currently in business hours
                const currentHour = now.getHours();
                const currentMinutes = now.getMinutes();
                const currentTime = currentHour + (currentMinutes / 60);
                
                // Check if there's at least 1 hour left before business closes
                const endTime = todayHours.end;
                const timeUntilClose = endTime - currentTime;
                
                // Allow if there's more than 1 hour until close
                return timeUntilClose > 1;
            }
            
            // For future dates, always allow (backend will validate business days)
            return selectedDate >= now;
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

            // Check if the selected date is valid for booking
            if (!this.isValidBookingDate(dateInput.value)) {
                const selectedDate = new Date(dateInput.value + 'T00:00:00');
                const now = new Date();
                const isToday = selectedDate.toDateString() === now.toDateString();
                
                if (isToday) {
                    timeSelect.innerHTML = '<option value="">No availability - Need 1 hour advance within business hours</option>';
                } else {
                    timeSelect.innerHTML = '<option value="">Please select a valid business day</option>';
                }
                timeSelect.disabled = true;
                if (loadingDiv) {
                    loadingDiv.style.display = 'none';
                }
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
            // Get selected service with better detection
            const activeServiceElement = document.querySelector('.service-option.active');
            let selectedService = 'fascial-release-90'; // default
            
            if (activeServiceElement) {
                // Try different ways to get the service type
                selectedService = activeServiceElement.dataset?.service || 
                                 activeServiceElement.getAttribute('data-service') || 
                                 activeServiceElement.dataset?.serviceType ||
                                 activeServiceElement.getAttribute('data-service-type') ||
                                 'fascial-release-90';
            }
            
            console.log(`🔍 Debug: Selected service: ${selectedService}`);
            
            // Determine practitioner ID based on service type
            const practitionerId = this.getPractitionerIdForService(selectedService);
            
            // Make API call to get available times with service type
            // ✅ CLAUDE.md compliance: Only using backend-verified service types
            // Service types aligned with backend enums
            const SERVICE_TYPES = {
                '30min': '30min',
                '60min': '60min',
                '90min': '90min',
                '120min': '120min',
                consultation: 'consultation',
                follow_up: 'follow_up',
                subscription: 'subscription',
                package: 'package',
                other: 'other'
            };
            
            const serviceTypeMap = {
                '30min': '30min_massage',
                '60min': '60min_massage',
                '90min': '90min_massage',
                '120min': '120min_massage',
                'fascial-release-30': '30min_massage',
                'fascial-release-60': '60min_massage',
                'fascial-release-90': '90min_massage',
                'test': 'test',
                // Add the actual data-service-type values from HTML
                '30min_massage': '30min_massage',
                '60min_massage': '60min_massage',
                '90min_massage': '90min_massage',
                'consultation': SERVICE_TYPES.consultation
                // Using backend-verified service types
            };
            const serviceType = serviceTypeMap[selectedService] || '90min_massage';
            
            console.log(`🔍 Debug: Service mapping: ${selectedService} -> ${serviceType}`);
            console.log(`🔍 Debug: API URL: /api/web-booking/availability/${practitionerId}/${selectedDate}?service_type=${serviceType}`);
            
            // Check cache to prevent duplicate API calls
            const apiKey = `${practitionerId}-${selectedDate}-${serviceType}`;
            if (this.lastApiCall === apiKey) {
                console.log('🔄 Skipping duplicate API call - using cache');
                if (loadingDiv) loadingDiv.style.display = 'none';
                timeSelect.disabled = false;
                
                // Still preserve time selection even when using cache
                const currentSelection = timeSelect.value;
                const lastDate = timeSelect.dataset.lastDate;
                if (!currentSelection && selectedDate === lastDate) {
                    // Try to restore previous selection if available
                    const previousSelection = timeSelect.dataset.previousSelection;
                    if (previousSelection && timeSelect.querySelector(`option[value="${previousSelection}"]`)) {
                        timeSelect.value = previousSelection;
                        console.log(`✅ Time selection restored from cache: ${previousSelection} for date ${selectedDate}`);
                    }
                }
                return;
            }
            this.lastApiCall = apiKey;
            
            fetch(`https://ittheal.com/api/web-booking/availability/${practitionerId}/${selectedDate}?service_type=${serviceType}`)
                .then(response => {
                    if (!response.ok) {
                        // For 400 errors, parse the JSON to get error details
                        if (response.status === 400) {
                            return response.json().then(errorData => {
                                const error = new Error(errorData.error || 'Validation error');
                                error.status = response.status;
                                error.code = errorData.code;
                                error.data = errorData;
                                throw error;
                            });
                        } else {
                            // For other errors, create generic error
                            const error = new Error(`HTTP error! status: ${response.status}`);
                            error.status = response.status;
                            throw error;
                        }
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success && data.data && data.data.available_slots && data.data.available_slots.length > 0) {
                        this.populateTimeSlots(data.data.available_slots, timeSelect);
                        if (loadingDiv) {
                            loadingDiv.style.display = 'none';
                        }
                    } else {
                        this.handleNoAvailability(timeSelect, loadingDiv);
                    }
                })
                .catch(error => {
                    console.error('Error loading time slots:', error);
                    this.handleFetchError(error, timeSelect, loadingDiv);
                });
        },

        getPractitionerIdForService(service) {
            // Map services to practitioner IDs - using actual UUID from backend
            const practitionerUUID = '060863f2-0623-4785-b01a-f1760cfb8d14';
            const serviceToPractitioner = {
                'fascial-release-90': practitionerUUID,
                'fascial-release-60': practitionerUUID,
                'integrative-touch-90': practitionerUUID,
                'integrative-touch-60': practitionerUUID,
                'wellness-consultation': practitionerUUID,
                'premium-package': practitionerUUID
            };
            
            return serviceToPractitioner[service] || practitionerUUID;
        },

        populateTimeSlots(availability, timeSelect) {
            // Store current selection and date to check if we should preserve it
            const currentSelection = timeSelect.value;
            const currentDate = document.getElementById('booking-date')?.value;
            const lastDate = timeSelect.dataset.lastDate;
            
            timeSelect.innerHTML = '<option value="">Select a time...</option>';
            
            availability.forEach(slot => {
                const option = document.createElement('option');
                
                // Extract time from ISO string for the value
                const timeDate = new Date(slot.time);
                const hours = String(timeDate.getUTCHours()).padStart(2, '0');
                const minutes = String(timeDate.getUTCMinutes()).padStart(2, '0');
                const timeValue = `${hours}:${minutes}`;
                
                option.value = timeValue;
                
                // Use the pre-formatted display time from API
                const durationStr = slot.duration ? ` (${slot.duration} min)` : '';
                option.textContent = slot.display_time + durationStr;
                
                // Store additional data
                option.dataset.slotTime = slot.time;
                option.dataset.duration = slot.duration;
                
                timeSelect.appendChild(option);
            });
            
            // Only restore selection if we're on the same date and selection exists in new slots
            if (currentSelection && currentDate === lastDate && timeSelect.querySelector(`option[value="${currentSelection}"]`)) {
                timeSelect.value = currentSelection;
                console.log(`✅ Time selection preserved: ${currentSelection} for date ${currentDate}`);
            }
            
            // Store current date and selection for next comparison/cache restoration
            timeSelect.dataset.lastDate = currentDate;
            if (timeSelect.value) {
                timeSelect.dataset.previousSelection = timeSelect.value;
            }
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

        handleFetchError(error, timeSelect, loadingDiv) {
            // Handle 400 errors with specific error details
            if (error.status === 400) {
                if (error.code === 'CLOSED_DATE') {
                    this.handleClosedDateError(timeSelect, loadingDiv);
                } else {
                    this.handleGeneralValidationError(timeSelect, loadingDiv, error.message);
                }
                return;
            }

            // For other errors, retry as before
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
        },

        handleClosedDateError(timeSelect, loadingDiv) {
            timeSelect.innerHTML = '<option value="">Please select an open business day</option>';
            timeSelect.disabled = true;
            
            if (loadingDiv) {
                loadingDiv.innerHTML = `
                    <div style="color: #f59e0b; margin-top: 10px;">
                        <strong>⚠️ Closed Day Selected</strong><br>
                        <span style="font-size: 14px;">The selected date is not available for appointments.</span><br>
                        <span style="font-size: 12px;"><strong>Open Days:</strong> Monday & Friday (10-6), Wednesday (12-8), Saturday (11-7)</span><br>
                        <button onclick="window.BookingAvailability.suggestNextAvailableDate()" style="margin-top: 8px; padding: 6px 12px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            Suggest Next Available Date
                        </button>
                    </div>
                `;
                loadingDiv.style.display = 'block';
            }
        },

        handleGeneralValidationError(timeSelect, loadingDiv, errorMessage) {
            timeSelect.innerHTML = '<option value="">Need 1 hour advance within business hours</option>';
            timeSelect.disabled = true;
            
            if (loadingDiv) {
                loadingDiv.innerHTML = `
                    <div style="color: #f59e0b; margin-top: 10px;">
                        <strong>⚠️ Booking Requirement</strong><br>
                        <span style="font-size: 14px;">${errorMessage || 'Appointments must be booked at least 1 hour in advance during business hours.'}</span><br>
                        <span style="font-size: 12px;">Business Hours: Mon/Fri 10-6, Wed 12-8, Sat 11-7</span>
                    </div>
                `;
                loadingDiv.style.display = 'block';
            }
        },

        suggestNextAvailableDate() {
            const now = new Date();
            const businessDays = [1, 3, 5, 6]; // Monday, Wednesday, Friday, Saturday
            
            // Find next business day
            let nextDate = new Date(now);
            nextDate.setDate(nextDate.getDate() + 1);
            
            while (!businessDays.includes(nextDate.getDay())) {
                nextDate.setDate(nextDate.getDate() + 1);
            }
            
            // Format as YYYY-MM-DD for input
            const dateString = nextDate.toISOString().split('T')[0];
            
            // Set the date input
            const dateInput = document.getElementById('booking-date');
            if (dateInput) {
                dateInput.value = dateString;
                
                // Trigger the change event to reload availability
                dateInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Scroll to the date input
                dateInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Flash the input to indicate it changed
                const originalBackground = dateInput.style.backgroundColor;
                dateInput.style.backgroundColor = '#10b981';
                dateInput.style.transition = 'background-color 0.3s';
                
                setTimeout(() => {
                    dateInput.style.backgroundColor = originalBackground;
                }, 1000);
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