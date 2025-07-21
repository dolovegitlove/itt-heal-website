const { SESSION_TYPES, SERVICE_TYPES } = require('../shared/constants/enums');

/**
 * Calendar Booking Module - Calendly-style UI
 * Integrates with existing booking-availability.js backend APIs
 */
(function() {
    'use strict';

    const CalendarBooking = {
        currentDate: new Date(),
        selectedDate: null,
        selectedTime: null,
        // REMOVED: Hardcoded business days - all validation via API
        closedDates: [], // Will be populated from backend
        
        init() {
            this.fetchClosedDates().then(() => {
                this.renderCalendar();
                this.attachEventListeners();
                console.log('✅ Calendar Booking module initialized');
            });
        },

        async fetchClosedDates() {
            try {
                // Fetch closed dates for the next 90 days
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
                // Continue with empty array if fetch fails
            }
        },

        attachEventListeners() {
            // Calendar navigation
            document.getElementById('prev-month')?.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.renderCalendar();
            });

            document.getElementById('next-month')?.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.renderCalendar();
            });

            // Service selection listener
            document.addEventListener('serviceSelected', () => {
                if (this.selectedDate && this.selectedTime) {
                    this.loadTimeSlots(this.selectedDate);
                }
            });
        },

        renderCalendar() {
            const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
            
            const currentMonthElement = document.getElementById('current-month');
            if (currentMonthElement) {
                currentMonthElement.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
            }

            this.renderCalendarDates();
        },

        renderCalendarDates() {
            const calendarGrid = document.getElementById('calendar-grid');
            if (!calendarGrid) return;

            // Clear existing dates (keep headers)
            const existingDates = calendarGrid.querySelectorAll('.calendar-date');
            existingDates.forEach(date => date.remove());

            const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
            const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
            const today = new Date();
            const startDate = firstDay.getDay(); // Day of week for first day

            // Add empty cells for days before the first day of the month
            for (let i = 0; i < startDate; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'calendar-date';
                emptyCell.style.cssText = 'background: #f8f9fa; padding: 0.75rem; min-height: 50px;';
                calendarGrid.appendChild(emptyCell);
            }

            // Add date cells
            for (let day = 1; day <= lastDay.getDate(); day++) {
                const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
                const dateCell = document.createElement('button');
                dateCell.className = 'calendar-date';
                dateCell.textContent = day;
                
                const isBusinessDay = this.businessDays.includes(date.getDay());
                const isPastDate = date < today.setHours(0, 0, 0, 0);
                const isClosedDate = this.isClosedDate(date);
                const isSelected = this.selectedDate && 
                    date.toDateString() === this.selectedDate.toDateString();

                // Base styling
                let cellStyle = 'background: white; border: none; padding: 0.75rem; min-height: 50px; cursor: pointer; transition: all 0.3s; width: 100%; text-align: center; font-weight: 500;';
                
                if (isPastDate || !isBusinessDay || isClosedDate) {
                    cellStyle += 'color: #cbd5e1; cursor: not-allowed; background: #f8f9fa;';
                    dateCell.disabled = true;
                } else if (isSelected) {
                    cellStyle += 'background: #10b981; color: white; font-weight: 700;';
                } else {
                    cellStyle += 'color: var(--sage-700); hover: {background: #f0f9ff;}';
                    dateCell.addEventListener('mouseenter', () => {
                        if (!dateCell.disabled) {
                            dateCell.style.background = '#f0f9ff';
                        }
                    });
                    dateCell.addEventListener('mouseleave', () => {
                        if (!dateCell.disabled && !isSelected) {
                            dateCell.style.background = 'white';
                        }
                    });
                }

                dateCell.style.cssText = cellStyle;
                dateCell.setAttribute('aria-label', `Select ${date.toLocaleDateString()}`);
                
                if (!isPastDate && isBusinessDay && !isClosedDate) {
                    dateCell.addEventListener('click', () => this.selectDate(date));
                }

                calendarGrid.appendChild(dateCell);
            }
        },

        selectDate(date) {
            this.selectedDate = date;
            this.selectedTime = null; // Clear time selection when date changes
            
            // Update hidden form input
            const bookingDateInput = document.getElementById('booking-date');
            if (bookingDateInput) {
                bookingDateInput.value = date.toISOString().split('T')[0];
            }

            // Clear booking time input
            const bookingTimeInput = document.getElementById('booking-time');
            if (bookingTimeInput) {
                bookingTimeInput.value = '';
            }

            // Re-render calendar to show selection
            this.renderCalendarDates();
            
            // Show selected date and load time slots
            this.displaySelectedDate(date);
            this.loadTimeSlots(date);
        },

        displaySelectedDate(date) {
            const selectedDateDisplay = document.getElementById('selected-date-display');
            if (selectedDateDisplay) {
                selectedDateDisplay.textContent = date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            const timeSlotsSection = document.getElementById('time-slots-section');
            if (timeSlotsSection) {
                timeSlotsSection.style.display = 'block';
            }
        },

        loadTimeSlots(date) {
            const timeLoadingDiv = document.getElementById('time-loading');
            const timeSlotsGrid = document.getElementById('time-slots-grid');
            
            if (!timeSlotsGrid) return;

            // Show loading state
            if (timeLoadingDiv) {
                timeLoadingDiv.style.display = 'block';
            }
            
            // Clear existing time slots
            timeSlotsGrid.innerHTML = '';

            // Get selected service
            const activeServiceElement = document.querySelector('.service-option.active');
            let selectedService = 'fascial-release-90'; // default
            
            if (activeServiceElement) {
                selectedService = activeServiceElement.dataset?.service || 
                               activeServiceElement.getAttribute('data-service') || 
                               'fascial-release-90';
            }

            // Map service to backend service type
            const serviceTypeMap = {
                '30min': '30min_massage',
                SERVICE_TYPES['60min']_TYPES['60min']: '60min_massage',
                SERVICE_TYPES['90min']_TYPES['90min']: '90min_massage',
                'fascial-release-30': '30min_massage',
                'fascial-release-60': '60min_massage',
                'fascial-release-90': '90min_massage',
                'test': 'test',
                '30min_massage': '30min_massage',
                '60min_massage': '60min_massage',
                '90min_massage': '90min_massage'
            };
            const serviceType = serviceTypeMap[selectedService] || '90min_massage';

            // Get practitioner ID
            const practitionerId = '060863f2-0623-4785-b01a-f1760cfb8d14';
            const dateString = date.toISOString().split('T')[0];

            // Fetch availability from backend
            fetch(`https://ittheal.com/api/bookings/availability/${practitionerId}/${dateString}?service_type=${serviceType}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (timeLoadingDiv) {
                        timeLoadingDiv.style.display = 'none';
                    }

                    if (data.success && data.data && data.data.available_slots && data.data.available_slots.length > 0) {
                        this.renderTimeSlots(data.data.available_slots, timeSlotsGrid);
                    } else {
                        this.renderNoTimeSlots(timeSlotsGrid);
                    }
                })
                .catch(error => {
                    console.error('Error loading time slots:', error);
                    if (timeLoadingDiv) {
                        timeLoadingDiv.style.display = 'none';
                    }
                    this.renderErrorMessage(timeSlotsGrid);
                });
        },

        renderTimeSlots(slots, container) {
            slots.forEach(slot => {
                const timeButton = document.createElement('button');
                timeButton.className = 'time-slot-button';
                
                // Extract time from ISO string
                const timeDate = new Date(slot.time);
                const hours = String(timeDate.getUTCHours()).padStart(2, '0');
                const minutes = String(timeDate.getUTCMinutes()).padStart(2, '0');
                const timeValue = `${hours}:${minutes}`;
                
                // Use display time from API
                timeButton.textContent = slot.display_time || this.formatTime(timeValue);
                timeButton.value = timeValue;
                
                // Styling
                const isSelected = this.selectedTime === timeValue;
                timeButton.style.cssText = `
                    background: ${isSelected ? '#10b981' : 'white'};
                    color: ${isSelected ? 'white' : 'var(--sage-700)'};
                    border: 2px solid ${isSelected ? '#10b981' : '#e2e8f0'};
                    border-radius: 8px;
                    padding: 0.75rem 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    min-height: 44px;
                `;

                // Hover effects
                if (!isSelected) {
                    timeButton.addEventListener('mouseenter', () => {
                        timeButton.style.background = '#f0f9ff';
                        timeButton.style.borderColor = '#10b981';
                    });
                    timeButton.addEventListener('mouseleave', () => {
                        timeButton.style.background = 'white';
                        timeButton.style.borderColor = '#e2e8f0';
                    });
                }

                // Click handler
                timeButton.addEventListener('click', () => this.selectTime(timeValue, slot));
                
                container.appendChild(timeButton);
            });
        },

        selectTime(timeValue, slotData) {
            this.selectedTime = timeValue;
            
            // Update hidden form input
            const bookingTimeInput = document.getElementById('booking-time');
            if (bookingTimeInput) {
                bookingTimeInput.value = timeValue;
            }

            // Re-render time slots to show selection
            const timeSlotsGrid = document.getElementById('time-slots-grid');
            if (timeSlotsGrid && this.selectedDate) {
                // Re-render with current slots but updated selection
                this.loadTimeSlots(this.selectedDate);
            }

            // Trigger event for form validation
            document.dispatchEvent(new CustomEvent('timeSelected', {
                detail: { date: this.selectedDate, time: timeValue, slot: slotData }
            }));
        },

        renderNoTimeSlots(container) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--sage-600);">
                    <div style="font-size: 1.1rem; margin-bottom: 0.5rem;">No available times</div>
                    <div style="font-size: 0.9rem;">Please select a different date</div>
                </div>
            `;
        },

        renderErrorMessage(container) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #dc2626;">
                    <div style="font-size: 1.1rem; margin-bottom: 0.5rem;">Error loading times</div>
                    <div style="font-size: 0.9rem;">Please check your connection and try again</div>
                </div>
            `;
        },

        formatTime(timeStr) {
            const [hours, minutes] = timeStr.split(':');
            const hour = parseInt(hours, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return `${displayHour}:${minutes} ${ampm}`;
        },

        // Public method to get current selection
        getSelection() {
            return {
                date: this.selectedDate,
                time: this.selectedTime
            };
        },

        isClosedDate(date) {
            const dateStr = date.toISOString().split('T')[0];
            return this.closedDates.includes(dateStr);
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            CalendarBooking.init();
        });
    } else {
        CalendarBooking.init();
    }

    // Expose to global scope
    window.CalendarBooking = CalendarBooking;

    // Add CSS animation for loading spinner
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
})();