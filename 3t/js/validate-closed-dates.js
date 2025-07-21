/**
 * Validate Closed Dates Module
 * Checks selected dates against business hours and closed dates
 */
(function() {
    'use strict';

    const ClosedDateValidator = {
        closedDates: [],
        businessDays: [1, 3, 5, 6], // Monday, Wednesday, Friday, Saturday
        
        async init() {
            await this.fetchClosedDates();
            this.attachEventListeners();
            console.log('✅ Closed date validator initialized');
        },

        async fetchClosedDates() {
            try {
                const startDate = new Date().toISOString().split('T')[0];
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 90);
                const endDateStr = endDate.toISOString().split('T')[0];
                
                const response = await fetch(`https://ittheal.com/api/web-booking/closed-dates?start_date=${startDate}&end_date=${endDateStr}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data && data.data.closed_dates) {
                        this.closedDates = data.data.closed_dates;
                        console.log('✅ Closed dates loaded:', this.closedDates);
                    }
                }
            } catch (error) {
                console.error('Error fetching closed dates:', error);
            }
        },

        attachEventListeners() {
            const dateInput = document.getElementById('booking-date');
            if (dateInput) {
                // Set min date to today
                const today = new Date().toISOString().split('T')[0];
                dateInput.min = today;
                
                // Set max date to 90 days from now
                const maxDate = new Date();
                maxDate.setDate(maxDate.getDate() + 90);
                dateInput.max = maxDate.toISOString().split('T')[0];
                
                // Add change listener
                dateInput.addEventListener('change', (e) => this.validateDate(e.target.value));
                
                // Add input listener for real-time validation
                dateInput.addEventListener('input', (e) => this.validateDate(e.target.value));
            }
        },

        validateDate(dateString) {
            if (!dateString) return;
            
            const selectedDate = new Date(dateString + 'T12:00:00');
            const dayOfWeek = selectedDate.getDay();
            const isBusinessDay = this.businessDays.includes(dayOfWeek);
            const isClosedDate = this.closedDates.includes(dateString);
            
            const warningElement = document.getElementById('closed-date-warning');
            const availabilityInfo = document.getElementById('date-availability-info');
            const dateInput = document.getElementById('booking-date');
            
            if (availabilityInfo) {
                availabilityInfo.style.display = 'block';
            }
            
            if (!isBusinessDay || isClosedDate) {
                // Date is not available
                if (warningElement) {
                    warningElement.style.display = 'block';
                    
                    // Customize message based on reason
                    let message = '⚠️ ';
                    if (isClosedDate) {
                        // Check if it's a holiday
                        const holidays = {
                            '2025-01-01': 'New Year\'s Day',
                            '2025-05-26': 'Memorial Day',
                            '2025-07-04': 'Independence Day',
                            '2025-07-20': 'Special Closed Day',
                            '2025-09-01': 'Labor Day',
                            '2025-11-27': 'Thanksgiving',
                            '2025-11-28': 'Black Friday',
                            '2025-12-25': 'Christmas Day',
                            '2025-12-31': 'New Year\'s Eve'
                        };
                        
                        if (holidays[dateString]) {
                            message += `This date is closed for ${holidays[dateString]}.`;
                        } else {
                            message += 'This date is closed.';
                        }
                    } else if (!isBusinessDay) {
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        message += `${dayNames[dayOfWeek]}s are closed.`;
                    }
                    
                    message += ' Please choose an available date.';
                    warningElement.textContent = message;
                }
                
                // Mark input as invalid
                if (dateInput) {
                    dateInput.style.borderColor = '#dc2626';
                    dateInput.setCustomValidity('Please select an available date');
                }
                
                // Clear time selection
                const timeSelect = document.getElementById('booking-time');
                if (timeSelect) {
                    timeSelect.value = '';
                    timeSelect.disabled = true;
                }
                
                return false;
            } else {
                // Date is available
                if (warningElement) {
                    warningElement.style.display = 'none';
                }
                
                if (dateInput) {
                    dateInput.style.borderColor = '#10b981';
                    dateInput.setCustomValidity('');
                }
                
                // Enable time selection
                const timeSelect = document.getElementById('booking-time');
                if (timeSelect) {
                    timeSelect.disabled = false;
                }
                
                // Trigger availability check for time slots
                document.dispatchEvent(new CustomEvent('dateSelected', {
                    detail: { date: dateString }
                }));
                
                return true;
            }
        },

        isDateClosed(dateString) {
            const date = new Date(dateString + 'T12:00:00');
            const dayOfWeek = date.getDay();
            const isBusinessDay = this.businessDays.includes(dayOfWeek);
            const isClosedDate = this.closedDates.includes(dateString);
            
            return !isBusinessDay || isClosedDate;
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ClosedDateValidator.init();
        });
    } else {
        ClosedDateValidator.init();
    }

    // Expose to global scope
    window.ClosedDateValidator = ClosedDateValidator;
})();