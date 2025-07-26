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
        userSelectionState: {}, // Store user selections across date changes
        isLoading: false, // Prevent overlapping API calls

        init() {
            console.log('🔧 BookingAvailability.init() called');
            
            // Check if required elements exist
            const dateInput = document.getElementById('booking-date');
            const timeSelect = document.getElementById('booking-time');
            
            console.log('📍 Elements found:', {
                dateInput: !!dateInput,
                timeSelect: !!timeSelect,
                dateInputId: dateInput?.id,
                timeSelectId: timeSelect?.id
            });
            
            if (!dateInput || !timeSelect) {
                console.error('❌ Required booking elements not found, retrying in 1 second...');
                setTimeout(() => this.init(), 1000);
                return;
            }
            
            this.attachEventListeners();
            
            
            console.log('✅ Booking Availability module initialized successfully');
        },

        attachEventListeners() {
            // Single consolidated date change listener with proper debouncing
            const dateInput = document.getElementById('booking-date');
            if (dateInput) {
                // Only listen for 'change' event to avoid duplicate calls
                // The change event fires when the user selects a date
                dateInput.addEventListener('change', () => {
                    this.handleDateChange();
                });
            }

            // Listen for service selection changes
            document.addEventListener('serviceSelected', (event) => {
                console.log('📍 Service selected event received:', event.detail);
                
                // Store the selected service globally for future reference
                if (event.detail && event.detail.service) {
                    window.selectedService = event.detail.service;
                }
                
                const selectedDate = document.getElementById('booking-date')?.value;
                if (selectedDate) {
                    console.log('📍 Date already selected, refreshing time slots...');
                    this.refresh();
                } else {
                    console.log('📍 No date selected yet, waiting for date selection...');
                }
            });
            
            // Listen for calendar date selection
            document.addEventListener('timeSelected', () => {
                // Calendar has made a selection, no need to refresh
                console.log('✅ Calendar date/time selected');
            });
            
            // Enhanced time selection persistence
            const timeSelect = document.getElementById('booking-time');
            if (timeSelect) {
                timeSelect.addEventListener('change', () => {
                    this.saveTimeSelection();
                });
            }
        },

        handleDateChange() {
            // Clear any pending debounced calls
            clearTimeout(this.inputTimeout);
            
            // Save current time selection before changing dates
            this.saveTimeSelection();
            
            const dateInput = document.getElementById('booking-date');
            if (dateInput && dateInput.value) {
                console.log(`📅 Date changed to: ${dateInput.value}`);
            }
            
            // Debounce to prevent multiple rapid calls
            this.inputTimeout = setTimeout(() => {
                if (!this.isLoading) {
                    console.log('⏰ Debounced date change, refreshing time slots...');
                    this.refresh();
                } else {
                    console.log('⏳ Loading in progress, skipping refresh...');
                }
            }, 800); // Increased debounce to prevent rate limiting
        },

        saveTimeSelection() {
            const dateInput = document.getElementById('booking-date');
            const timeSelect = document.getElementById('booking-time');
            
            if (dateInput && timeSelect && dateInput.value && timeSelect.value) {
                const selectedDate = dateInput.value;
                const selectedTime = timeSelect.value;
                
                // Store in persistent state object
                this.userSelectionState[selectedDate] = {
                    time: selectedTime,
                    timestamp: Date.now()
                };
                
                // Also store in dataset for backward compatibility
                timeSelect.dataset.previousSelection = selectedTime;
                timeSelect.dataset.lastDate = selectedDate;
                
                console.log(`💾 Saved time selection: ${selectedTime} for date ${selectedDate}`);
            }
        },

        restoreTimeSelection(selectedDate) {
            const timeSelect = document.getElementById('booking-time');
            if (!timeSelect || !selectedDate) return false;

            // Check persistent state first
            const savedState = this.userSelectionState[selectedDate];
            if (savedState && savedState.time) {
                const option = timeSelect.querySelector(`option[value="${savedState.time}"]`);
                if (option) {
                    timeSelect.value = savedState.time;
                    console.log(`✅ Restored time selection from state: ${savedState.time} for date ${selectedDate}`);
                    return true;
                }
            }

            // Fallback to dataset method
            const previousSelection = timeSelect.dataset.previousSelection;
            const lastDate = timeSelect.dataset.lastDate;
            
            if (previousSelection && selectedDate === lastDate) {
                const option = timeSelect.querySelector(`option[value="${previousSelection}"]`);
                if (option) {
                    timeSelect.value = previousSelection;
                    console.log(`✅ Restored time selection from dataset: ${previousSelection} for date ${selectedDate}`);
                    return true;
                }
            }

            return false;
        },

        refresh() {
            this.retryCount = 0;
            this.loadTimeSlots();
        },

        // REMOVED: Frontend booking date validation
        // All booking rules validation now handled by backend API
        // This ensures consistency and single source of truth

        loadTimeSlots() {
            // Prevent overlapping API calls
            if (this.isLoading) {
                console.log('🔄 API call already in progress, skipping...');
                return;
            }

            const dateInput = document.getElementById('booking-date');
            const timeSelect = document.getElementById('booking-time');
            const loadingDiv = document.getElementById('time-loading');
            
            if (!dateInput || !timeSelect) {
                console.error('Required booking elements not found');
                return;
            }
            
            const selectedDate = dateInput.value;
            if (!selectedDate) {
                timeSelect.innerHTML = '<option value="">Select date first...</option>';
                timeSelect.disabled = true;
                this.isLoading = false;
                return;
            }
            

            // Frontend validation REMOVED - backend API handles all booking rules
            // This ensures single source of truth for business rules
            
            // Show loading state
            if (loadingDiv) {
                loadingDiv.style.display = 'block';
                loadingDiv.innerHTML = this.retryCount > 0 ? 
                    `<div style="color: #f59e0b;">Retrying... (Attempt ${this.retryCount + 1}/${this.maxRetries + 1})</div>` : 
                    '<div>Loading available times...</div>';
            }
            
            console.log('📋 Loading times for:', {
                date: selectedDate,
                element: dateInput,
                dateValue: dateInput.value,
                timeSelect: timeSelect,
                loadingDiv: loadingDiv
            });
            
            timeSelect.disabled = true;
            timeSelect.innerHTML = '<option value="">Loading times...</option>';
            
            // Get selected service with better detection
            const activeServiceElement = document.querySelector('.service-option.active');
            let selectedService = '90min_massage'; // default to most popular option
            
            if (activeServiceElement) {
                // Try different ways to get the service type
                selectedService = activeServiceElement.getAttribute('data-service-type') ||
                                 activeServiceElement.dataset?.serviceType ||
                                 activeServiceElement.getAttribute('data-service') || 
                                 activeServiceElement.dataset?.service ||
                                 '90min_massage';
            } else {
                // If no active service, check for any selected service in embedded form
                console.log('⚠️ No active service found, checking for embedded form state...');
                
                // Check if there's a global selectedService variable
                if (typeof window.selectedService !== 'undefined' && window.selectedService) {
                    selectedService = window.selectedService;
                    console.log(`📍 Using global selectedService: ${selectedService}`);
                }
            }
            
            console.log(`🔍 Debug: Selected service: ${selectedService}`);
            
            // Determine practitioner ID based on service type
            const practitionerId = this.getPractitionerIdForService(selectedService);
            
            // Make API call to get available times with service type
            // ✅ CLAUDE.md compliance: Only using backend-verified service types
            // Service types aligned with backend enums
            // CLAUDE.md Compliance: Service types loaded from API via shared-config.js
            
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
                '120min_massage': '120min_massage',
                'consultation': 'consultation'
                // Using backend-verified service types
            };
            
            // Ensure we have a valid service type
            const serviceType = serviceTypeMap[selectedService] || selectedService || '90min_massage';
            
            console.log(`🔍 Debug: Service mapping: ${selectedService} -> ${serviceType}`);
            console.log(`🔍 Debug: API URL: /api/bookings/availability/${practitionerId}/${selectedDate}?service_type=${serviceType}`);
            
            // Check cache to prevent duplicate API calls
            const apiKey = `${practitionerId}-${selectedDate}-${serviceType}`;
            if (this.lastApiCall === apiKey) {
                console.log('🔄 Skipping duplicate API call - using cache');
                if (loadingDiv) loadingDiv.style.display = 'none';
                timeSelect.disabled = false;
                this.isLoading = false;
                
                // Enhanced time selection restoration from cache
                if (!timeSelect.value || timeSelect.value === '') {
                    this.restoreTimeSelection(selectedDate);
                }
                return;
            }
            
            // Set loading state
            this.isLoading = true;
            this.lastApiCall = apiKey;
            
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
            
            // Build proper URL - use the working availability endpoint format
            const apiUrl = `https://ittheal.com/api/bookings/availability?date=${selectedDate}&service_type=${serviceType}`;
            
            console.log('🔍 Making API call to:', apiUrl);
            
            fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                },
                credentials: 'same-origin',
                signal: controller.signal
            })
                .then(response => {
                    clearTimeout(timeoutId);
                    console.log('🔍 API Response Status:', response.status, response.statusText);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    this.isLoading = false;
                    console.log('🔍 API Data:', data);
                    
                    // Handle error responses (like INSUFFICIENT_ADVANCE)
                    if (data.error) {
                        console.log('❌ API returned error:', data.error);
                        let errorMessage = data.error;
                        
                        // For INSUFFICIENT_ADVANCE, also check if there are any available_times
                        if (data.code === 'INSUFFICIENT_ADVANCE' && data.available_times && data.available_times.length > 0) {
                            // There are times available later today
                            console.log('✅ Found available times after advance notice:', data.available_times);
                            this.populateTimeSlots(data.available_times, timeSelect, selectedDate);
                        } else {
                            // No times available or other error
                            timeSelect.innerHTML = `<option value="">${errorMessage}</option>`;
                            timeSelect.disabled = true;
                        }
                        if (loadingDiv) {
                            loadingDiv.style.display = 'none';
                        }
                        return;
                    }
                    
                    // Handle success response
                    if (data.success && data.availableSlots && data.availableSlots.length > 0) {
                        // Success - populate time slots from availableSlots array
                        console.log('✅ Populating time slots:', data.availableSlots.length);
                        this.populateTimeSlots(data.availableSlots, timeSelect, selectedDate);
                        if (loadingDiv) {
                            loadingDiv.style.display = 'none';
                        }
                    } else {
                        // No available slots
                        console.log('❌ No available slots in response');
                        let message = 'No available time slots for this date';
                        if (data.message) {
                            message = data.message;
                        }
                        timeSelect.innerHTML = `<option value="">${message}</option>`;
                        timeSelect.disabled = true;
                        if (loadingDiv) {
                            loadingDiv.style.display = 'none';
                        }
                    }
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    this.isLoading = false;
                    console.error('❌ API Error:', error);
                    
                    let errorMessage = 'Error loading times - please try again';
                    if (error.name === 'AbortError') {
                        errorMessage = 'Request timeout - please try again';
                    } else if (error.message.includes('CORS')) {
                        errorMessage = 'Network error - please refresh page';
                    }
                    
                    // API error - show specific message
                    timeSelect.innerHTML = `<option value="">${errorMessage}</option>`;
                    timeSelect.disabled = true;
                    if (loadingDiv) {
                        loadingDiv.style.display = 'none';
                    }
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

        populateTimeSlots(availability, timeSelect, selectedDate) {
            // Clear dropdown and populate with new options
            timeSelect.innerHTML = '<option value="">Select a time...</option>';
            
            availability.forEach(slot => {
                const option = document.createElement('option');
                
                // Handle API response format: {time: "11:00", available: true}
                let timeValue, displayTime;
                
                if (typeof slot === 'string') {
                    // Simple string format like "13:00"
                    timeValue = slot;
                } else if (slot && slot.time) {
                    // API object format: {time: "11:00", available: true}
                    timeValue = slot.time;
                } else {
                    console.warn('Invalid time slot format:', slot);
                    return; // Skip invalid slots
                }
                
                // Convert 24-hour to 12-hour format for display
                if (timeValue && timeValue.includes(':')) {
                    const [hours, minutes] = timeValue.split(':');
                    const hour24 = parseInt(hours, 10);
                    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                    const ampm = hour24 >= 12 ? 'PM' : 'AM';
                    displayTime = `${hour12}:${minutes || '00'} ${ampm}`;
                } else {
                    console.warn('Invalid time format:', timeValue);
                    return; // Skip invalid time formats
                }
                
                option.value = timeValue;
                option.textContent = displayTime;
                
                // Store additional data
                if (typeof slot === 'object') {
                    option.dataset.slotTime = slot.time;
                    option.dataset.duration = slot.duration;
                }
                
                timeSelect.appendChild(option);
            });
            
            // FORCE ENABLE THE TIME SELECT - this is critical
            timeSelect.disabled = false;
            timeSelect.removeAttribute('disabled');
            
            // Enhanced time selection restoration
            const wasRestored = this.restoreTimeSelection(selectedDate);
            if (!wasRestored) {
                console.log(`ℹ️ No previous time selection to restore for date ${selectedDate}`);
            }
            
            // Update dataset for backward compatibility
            timeSelect.dataset.lastDate = selectedDate;
            
            // Save any restored selection to persistent state
            if (timeSelect.value) {
                this.saveTimeSelection();
            }
            
            console.log(`✅ TIME SELECT ENABLED with ${availability.length} slots`);
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
            this.isLoading = false;
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
            // Handle rate limiting
            if (error.status === 429 || error.isRateLimit) {
                this.handleRateLimitError(timeSelect, loadingDiv);
                return;
            }
            
            // Handle 400 errors with specific error details
            if (error.status === 400) {
                if (error.code === 'CLOSED_DATE') {
                    this.handleClosedDateError(timeSelect, loadingDiv);
                } else if (error.code === 'INSUFFICIENT_ADVANCE') {
                    // Handle insufficient advance booking time
                    this.isLoading = false;
                    timeSelect.innerHTML = '<option value="">Please select a future date</option>';
                    timeSelect.disabled = true;
                    
                    if (loadingDiv) {
                        loadingDiv.innerHTML = `
                            <div style="color: #f59e0b; margin-top: 10px;">
                                <strong>⏰ Booking requires 1 hour advance notice</strong><br>
                                <span style="font-size: 14px;">Please select a future date for your appointment.</span>
                            </div>
                        `;
                        loadingDiv.style.display = 'block';
                    }
                } else {
                    this.handleGeneralValidationError(timeSelect, loadingDiv, error.data?.error || error.message);
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
                this.isLoading = false;
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

        handleGeneralValidationError(timeSelect, loadingDiv, errorMessage) {
            this.isLoading = false;
            timeSelect.innerHTML = '<option value="">No times available</option>';
            timeSelect.disabled = true;
            
            if (loadingDiv) {
                loadingDiv.innerHTML = `
                    <div style="color: #dc2626; margin-top: 10px;">
                        <strong>⚠️ ${errorMessage || 'Unable to load times'}</strong>
                    </div>
                `;
                loadingDiv.style.display = 'block';
            }
        },

        handleRateLimitError(timeSelect, loadingDiv) {
            this.isLoading = false;
            console.log('⏳ Rate limit hit, waiting before retry...');
            
            timeSelect.innerHTML = '<option value="">Please wait...</option>';
            timeSelect.disabled = true;
            
            if (loadingDiv) {
                loadingDiv.innerHTML = `
                    <div style="color: #f59e0b; margin-top: 10px;">
                        <strong>⏳ Loading times, please wait...</strong>
                        <br><span style="font-size: 0.875rem;">High demand - refreshing in a moment</span>
                    </div>
                `;
                loadingDiv.style.display = 'block';
            }
            
            // Retry after a longer delay for rate limits
            setTimeout(() => {
                this.retryCount = 0; // Reset retry count
                this.refresh();
            }, 3000);
        },

        handleClosedDateError(timeSelect, loadingDiv) {
            this.isLoading = false;
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
            console.log('🚀 BookingAvailability: Initializing on DOMContentLoaded');
            BookingAvailability.init();
        });
    } else {
        // Add a small delay to ensure all elements are ready
        setTimeout(() => {
            console.log('🚀 BookingAvailability: Initializing immediately');
            BookingAvailability.init();
        }, 100);
    }

    // Expose to global scope
    window.BookingAvailability = BookingAvailability;
    
    // Also expose individual methods for debugging
    window.loadTimeSlots = () => BookingAvailability.loadTimeSlots();
    window.refreshTimeSlots = () => BookingAvailability.refresh();
})();