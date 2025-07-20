/**
 * Custom Calendar Component with Closed Date Support
 * Provides visual calendar with greyed out closed dates
 */
(function() {
    'use strict';

    const CustomCalendar = {
        currentDate: new Date(),
        selectedDate: null,
        closedDates: [],
        businessDays: [1, 3, 5, 6], // Monday, Wednesday, Friday, Saturday
        holidays: {
            '2025-01-01': 'New Year\'s Day',
            '2025-05-26': 'Memorial Day',
            '2025-07-04': 'Independence Day',
            '2025-07-20': 'Closed',
            '2025-09-01': 'Labor Day',
            '2025-11-27': 'Thanksgiving',
            '2025-11-28': 'Black Friday',
            '2025-12-25': 'Christmas Day',
            '2025-12-31': 'New Year\'s Eve'
        },
        
        async init() {
            await this.fetchClosedDates();
            this.replaceDataInput();
            this.render();
            this.attachEventListeners();
            console.log('✅ Custom calendar initialized');
        },

        async fetchClosedDates() {
            try {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 90);
                
                const response = await fetch(`https://ittheal.com/api/web-booking/closed-dates?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`);
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

        replaceDataInput() {
            const dateInputContainer = document.querySelector('#booking-date')?.parentElement;
            if (!dateInputContainer) return;

            // Create WCAG-compliant calendar container with viewport constraint wrapper
            const calendarHTML = `
                <div class="calendar-viewport-wrapper" style="width: 100%; max-width: 100%; overflow: hidden; box-sizing: border-box; padding: 0; margin: 0; display: flex; justify-content: center; align-items: center;">
                <div id="custom-calendar-container" 
                     role="application" 
                     aria-label="Date picker calendar"
                     tabindex="0"
                     style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); focus-outline: 2px solid #2563eb; outline-offset: 2px; max-width: 100%; width: 100%; box-sizing: border-box; overflow: hidden; margin: 0 auto;">
                    
                    <!-- Calendar Instructions for Screen Readers -->
                    <div id="calendar-instructions" class="sr-only" aria-live="polite">
                        Use arrow keys to navigate dates. Press Enter or Space to select a date. Use Page Up/Page Down or arrow keys on month buttons to change months.
                    </div>
                    
                    <!-- Calendar Header -->
                    <div id="calendar-header" 
                         role="banner"
                         style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <button id="prev-month" 
                                type="button"
                                aria-label="Previous month"
                                style="background: #f3f4f6; border: 2px solid #d1d5db; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 1rem; min-width: 44px; min-height: 44px;">
                            ← <span class="sr-only">Previous month</span>
                        </button>
                        <h3 id="current-month-year" 
                            role="heading" 
                            aria-level="3"
                            aria-live="polite"
                            style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--sage-700);"></h3>
                        <button id="next-month" 
                                type="button"
                                aria-label="Next month"
                                style="background: #f3f4f6; border: 2px solid #d1d5db; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 1rem; min-width: 44px; min-height: 44px;">
                            → <span class="sr-only">Next month</span>
                        </button>
                    </div>
                    
                    <!-- Calendar Grid -->
                    <div id="calendar-grid" 
                         role="grid" 
                         aria-label="Calendar dates"
                         aria-describedby="calendar-instructions"
                         style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.25rem;">
                        <!-- Day headers -->
                        <div role="columnheader" aria-label="Sunday" style="text-align: center; font-weight: 600; padding: 0.5rem; color: #374151; font-size: 0.875rem;">Sun</div>
                        <div role="columnheader" aria-label="Monday" style="text-align: center; font-weight: 600; padding: 0.5rem; color: #374151; font-size: 0.875rem;">Mon</div>
                        <div role="columnheader" aria-label="Tuesday" style="text-align: center; font-weight: 600; padding: 0.5rem; color: #374151; font-size: 0.875rem;">Tue</div>
                        <div role="columnheader" aria-label="Wednesday" style="text-align: center; font-weight: 600; padding: 0.5rem; color: #374151; font-size: 0.875rem;">Wed</div>
                        <div role="columnheader" aria-label="Thursday" style="text-align: center; font-weight: 600; padding: 0.5rem; color: #374151; font-size: 0.875rem;">Thu</div>
                        <div role="columnheader" aria-label="Friday" style="text-align: center; font-weight: 600; padding: 0.5rem; color: #374151; font-size: 0.875rem;">Fri</div>
                        <div role="columnheader" aria-label="Saturday" style="text-align: center; font-weight: 600; padding: 0.5rem; color: #374151; font-size: 0.875rem;">Sat</div>
                    </div>
                    
                    <!-- Selected Date Display -->
                    <div id="selected-date-display" 
                         role="status" 
                         aria-live="polite" 
                         aria-atomic="true"
                         style="margin-top: 1rem; padding: 0.75rem; background: #f0fdf4; border: 2px solid #10b981; border-radius: 6px; text-align: center; display: none;">
                        <span style="color: #059669; font-weight: 600;">Selected: </span>
                        <span id="selected-date-text" style="color: #059669;"></span>
                    </div>
                    
                    <!-- Live region for announcements -->
                    <div id="calendar-announcements" 
                         role="status" 
                         aria-live="assertive" 
                         aria-atomic="true" 
                         class="sr-only"></div>
                    
                    <!-- Legend with better contrast -->
                    <div role="img" 
                         aria-label="Calendar legend"
                         class="calendar-legend"
                         style="margin-top: 1rem; display: flex; gap: 1rem; font-size: 0.875rem; color: #374151;">
                        <div>
                            <span style="display: inline-block; width: 16px; height: 16px; background: #f3f4f6; border: 2px solid #9ca3af; border-radius: 4px; vertical-align: middle;" aria-hidden="true"></span>
                            <span style="margin-left: 0.5rem;">Closed</span>
                        </div>
                        <div>
                            <span style="display: inline-block; width: 16px; height: 16px; background: #10b981; border: 2px solid #059669; border-radius: 4px; vertical-align: middle;" aria-hidden="true"></span>
                            <span style="margin-left: 0.5rem;">Selected</span>
                        </div>
                    </div>
                </div>
                </div>
                
                <!-- Keep hidden input for form submission -->
                <input type="hidden" id="booking-date" name="booking-date" required>
                
                <!-- Mobile Responsive & Accessibility Styles -->
                <style>
                    .sr-only {
                        position: absolute;
                        width: 1px;
                        height: 1px;
                        padding: 0;
                        margin: -1px;
                        overflow: hidden;
                        clip: rect(0, 0, 0, 0);
                        white-space: nowrap;
                        border: 0;
                    }
                    
                    #custom-calendar-container:focus {
                        outline: 2px solid #2563eb;
                        outline-offset: 2px;
                    }
                    
                    .calendar-date:focus {
                        outline: 2px solid #2563eb;
                        outline-offset: 2px;
                        z-index: 1;
                        position: relative;
                    }
                    
                    @media (prefers-reduced-motion: reduce) {
                        .calendar-date {
                            transition: none !important;
                        }
                    }
                    
                    
                    /* Compact Calendar - Fits all narrow screens including Galaxy Z Fold */
                    .calendar-viewport-wrapper {
                        width: 100% !important;
                        max-width: 100% !important;
                        overflow: hidden !important;
                        box-sizing: border-box !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        display: flex !important;
                        justify-content: center !important;
                        align-items: center !important;
                    }
                    
                    #custom-calendar-container {
                        width: 100% !important;
                        max-width: min(98vw, 340px) !important;
                        box-sizing: border-box !important;
                        overflow: hidden !important;
                        margin: 0 auto !important;
                        padding: 0.25rem !important;
                        border-width: 1px !important;
                    }
                    
                    #calendar-header {
                        margin-bottom: 0.5rem !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: space-between !important;
                        gap: 0.25rem !important;
                    }
                    
                    #calendar-header button {
                        padding: 0.25rem 0.5rem !important;
                        min-width: 36px !important;
                        min-height: 36px !important;
                        font-size: 0.75rem !important;
                        flex-shrink: 0 !important;
                        border-width: 1px !important;
                    }
                    
                    #current-month-year {
                        font-size: 0.875rem !important;
                        text-align: center !important;
                        flex: 1 !important;
                        white-space: nowrap !important;
                        overflow: hidden !important;
                        text-overflow: ellipsis !important;
                        padding: 0 0.25rem !important;
                        min-width: 0 !important;
                    }
                    
                    #calendar-grid {
                        gap: 0.25rem !important;
                        width: 100% !important;
                        display: grid !important;
                        grid-template-columns: repeat(7, 1fr) !important;
                        max-width: 100% !important;
                    }
                    
                    .calendar-date {
                        padding: 0.25rem !important;
                        width: 100% !important;
                        height: 36px !important;
                        max-height: 36px !important;
                        font-size: 0.875rem !important;
                        margin: 0 !important;
                        border-radius: 6px !important;
                        box-sizing: border-box !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        border-width: 1px !important;
                        flex-shrink: 0 !important;
                    }
                    
                    .calendar-date[role="columnheader"] {
                        font-size: 0.625rem !important;
                        height: 24px !important;
                        max-height: 24px !important;
                        font-weight: 600 !important;
                        padding: 0.125rem !important;
                    }
                    
                    /* Touch targets for interactive dates only */
                    .calendar-date:not([disabled]):not([role="columnheader"]) {
                        min-height: 40px !important;
                        height: 40px !important;
                        cursor: pointer !important;
                    }
                    
                    .calendar-date:not([disabled]):not([role="columnheader"]):hover {
                        transform: scale(1.05) !important;
                        z-index: 2 !important;
                        position: relative !important;
                    }
                    
                    #selected-date-display {
                        padding: 0.375rem !important;
                        font-size: 0.75rem !important;
                        margin: 0.5rem 0 !important;
                        border-width: 1px !important;
                    }
                    
                    .calendar-legend {
                        font-size: 0.625rem !important;
                        margin-top: 0.5rem !important;
                        display: flex !important;
                        gap: 0.5rem !important;
                        flex-wrap: wrap !important;
                        justify-content: center !important;
                    }
                    
                    .calendar-legend span {
                        width: 10px !important;
                        height: 10px !important;
                        border-width: 1px !important;
                    }
                    
                    /* Extra compact for very narrow screens */
                    @media (max-width: 350px) {
                        #custom-calendar-container {
                            max-width: 98vw !important;
                            padding: 0.125rem !important;
                        }
                        
                        .calendar-date {
                            height: 32px !important;
                            font-size: 0.75rem !important;
                        }
                        
                        .calendar-date:not([disabled]):not([role="columnheader"]) {
                            height: 36px !important;
                            min-height: 36px !important;
                        }
                        
                        .calendar-date[role="columnheader"] {
                            height: 20px !important;
                            font-size: 0.5rem !important;
                        }
                        
                        #calendar-header button {
                            min-width: 32px !important;
                            min-height: 32px !important;
                            font-size: 0.625rem !important;
                            padding: 0.125rem 0.25rem !important;
                        }
                        
                        #current-month-year {
                            font-size: 0.75rem !important;
                        }
                    }
                    
                    /* High contrast mode support */
                    @media (prefers-contrast: high) {
                        .calendar-date {
                            border-width: 3px !important;
                        }
                        
                        .calendar-date:not([disabled]) {
                            border-color: #000000 !important;
                            color: #000000 !important;
                        }
                        
                        .calendar-date[disabled] {
                            border-color: #666666 !important;
                            color: #666666 !important;
                            background: #f0f0f0 !important;
                        }
                        
                        .calendar-date[aria-selected="true"] {
                            background: #000000 !important;
                            color: #ffffff !important;
                            border-color: #000000 !important;
                        }
                    }
                    
                    /* Dark mode support */
                    @media (prefers-color-scheme: dark) {
                        #custom-calendar-container {
                            background: #1f2937 !important;
                            border-color: #4b5563 !important;
                            color: #f9fafb !important;
                        }
                        
                        #calendar-header button {
                            background: #374151 !important;
                            color: #f9fafb !important;
                            border-color: #6b7280 !important;
                        }
                        
                        .calendar-date:not([disabled]) {
                            background: #374151 !important;
                            color: #f9fafb !important;
                            border-color: #6b7280 !important;
                        }
                        
                        .calendar-date[disabled] {
                            background: #111827 !important;
                            color: #6b7280 !important;
                            border-color: #374151 !important;
                        }
                        
                        #selected-date-display {
                            background: #065f46 !important;
                            border-color: #059669 !important;
                        }
                    }
                </style>
            `;

            // Replace the date input with calendar
            dateInputContainer.innerHTML = calendarHTML;
        },

        render() {
            this.renderHeader();
            this.renderDates();
        },

        renderHeader() {
            const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
            
            const headerElement = document.getElementById('current-month-year');
            if (headerElement) {
                headerElement.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
            }
        },

        renderDates() {
            const grid = document.getElementById('calendar-grid');
            if (!grid) return;

            // Remove existing date cells (keep headers)
            const existingDates = grid.querySelectorAll('.calendar-date');
            existingDates.forEach(date => date.remove());

            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Track row/column for ARIA
            let currentRow = 1; // Start after headers
            let currentCol = 0;

            // Add empty cells for days before month starts
            for (let i = 0; i < firstDay.getDay(); i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'calendar-date';
                emptyCell.setAttribute('role', 'gridcell');
                emptyCell.setAttribute('aria-hidden', 'true');
                grid.appendChild(emptyCell);
                currentCol++;
            }

            // Add date cells
            for (let day = 1; day <= lastDay.getDate(); day++) {
                const date = new Date(year, month, day);
                const dateString = date.toISOString().split('T')[0];
                const dayOfWeek = date.getDay();
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                
                const dateCell = document.createElement('button');
                dateCell.className = 'calendar-date';
                dateCell.type = 'button';
                dateCell.textContent = day;
                
                // Check if date is available
                const isPastDate = date < today;
                const isBusinessDay = this.businessDays.includes(dayOfWeek);
                const isClosedDate = this.closedDates.includes(dateString);
                const isHoliday = this.holidays[dateString];
                const isSelected = this.selectedDate && 
                    date.toDateString() === this.selectedDate.toDateString();

                // WCAG Attributes
                dateCell.setAttribute('role', 'gridcell');
                dateCell.setAttribute('data-date', dateString);
                dateCell.setAttribute('data-day', day);
                dateCell.setAttribute('aria-rowindex', Math.floor(currentCol / 7) + 2); // +2 for 1-based and headers
                dateCell.setAttribute('aria-colindex', (currentCol % 7) + 1);
                
                // Detailed aria-label
                let ariaLabel = `${dayNames[dayOfWeek]}, ${date.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                })}`;

                if (isPastDate) {
                    ariaLabel += ', past date, unavailable';
                    dateCell.setAttribute('aria-disabled', 'true');
                } else if (!isBusinessDay) {
                    ariaLabel += ', closed day, unavailable';
                    dateCell.setAttribute('aria-disabled', 'true');
                } else if (isClosedDate) {
                    if (isHoliday) {
                        ariaLabel += `, closed for ${isHoliday}, unavailable`;
                    } else {
                        ariaLabel += ', closed, unavailable';
                    }
                    dateCell.setAttribute('aria-disabled', 'true');
                } else if (isSelected) {
                    ariaLabel += ', selected';
                    dateCell.setAttribute('aria-selected', 'true');
                    dateCell.setAttribute('aria-current', 'date');
                } else {
                    ariaLabel += ', available';
                    dateCell.setAttribute('aria-selected', 'false');
                }

                dateCell.setAttribute('aria-label', ariaLabel);

                // Apply styling with better color contrast
                let cellStyle = `
                    border: 2px solid;
                    padding: 0.75rem;
                    margin: 2px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                    width: calc(100% - 4px);
                    aspect-ratio: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    min-width: 44px;
                    min-height: 44px;
                    font-size: 1rem;
                `;

                if (isPastDate || !isBusinessDay || isClosedDate) {
                    // Closed/unavailable styling - Better contrast
                    cellStyle += `
                        background: #f3f4f6;
                        color: #4b5563;
                        border-color: #9ca3af;
                        cursor: not-allowed;
                    `;
                    dateCell.disabled = true;
                    dateCell.tabIndex = -1;
                    
                    // Add holiday indicator
                    if (isHoliday) {
                        dateCell.title = isHoliday;
                        dateCell.innerHTML = `${day}<span style="position: absolute; top: 2px; right: 2px; font-size: 0.6rem;" aria-hidden="true">🚫</span>`;
                    }
                } else if (isSelected) {
                    // Selected styling - High contrast
                    cellStyle += `
                        background: #059669;
                        color: white;
                        border-color: #047857;
                        font-weight: 700;
                    `;
                    dateCell.tabIndex = 0;
                } else {
                    // Available styling - Better contrast
                    cellStyle += `
                        background: white;
                        color: #1f2937;
                        border-color: #6b7280;
                    `;
                    dateCell.tabIndex = 0;
                    
                    // Enhanced hover effect for available dates
                    dateCell.addEventListener('mouseenter', () => {
                        if (!dateCell.disabled) {
                            dateCell.style.background = '#f0fdf4';
                            dateCell.style.borderColor = '#10b981';
                            dateCell.style.color = '#047857';
                        }
                    });
                    
                    dateCell.addEventListener('mouseleave', () => {
                        if (!dateCell.disabled && !isSelected) {
                            dateCell.style.background = 'white';
                            dateCell.style.borderColor = '#6b7280';
                            dateCell.style.color = '#1f2937';
                        }
                    });
                }

                dateCell.style.cssText = cellStyle;
                
                // Event handlers for available dates
                if (!isPastDate && isBusinessDay && !isClosedDate) {
                    // Click handler
                    dateCell.addEventListener('click', () => this.selectDate(date));
                    
                    // Keyboard handlers
                    dateCell.addEventListener('keydown', (e) => this.handleDateKeydown(e, date));
                    
                    // Focus handler
                    dateCell.addEventListener('focus', () => this.announceFocus(dateCell));
                }

                grid.appendChild(dateCell);
                currentCol++;
            }
        },

        selectDate(date) {
            this.selectedDate = date;
            const dateString = date.toISOString().split('T')[0];
            
            // Update hidden input
            const hiddenInput = document.getElementById('booking-date');
            if (hiddenInput) {
                hiddenInput.value = dateString;
                // Trigger change event for other scripts
                hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            // Update display
            const displayElement = document.getElementById('selected-date-display');
            const textElement = document.getElementById('selected-date-text');
            if (displayElement && textElement) {
                displayElement.style.display = 'block';
                textElement.textContent = date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
            
            // Announce selection to screen readers
            this.announceSelection(date);
            
            // Re-render to show selection
            this.renderDates();
            
            // Enable time selection
            const timeSelect = document.getElementById('booking-time');
            if (timeSelect) {
                timeSelect.disabled = false;
            }
            
            // Clear any warnings
            const warningElement = document.getElementById('closed-date-warning');
            if (warningElement) {
                warningElement.style.display = 'none';
            }
            
            const availabilityInfo = document.getElementById('date-availability-info');
            if (availabilityInfo) {
                availabilityInfo.style.display = 'none';
            }
        },

        attachEventListeners() {
            // Previous month
            document.getElementById('prev-month')?.addEventListener('click', () => {
                this.changeMonth(-1);
            });

            // Next month
            document.getElementById('next-month')?.addEventListener('click', () => {
                this.changeMonth(1);
            });

            // Calendar container keyboard navigation
            const container = document.getElementById('custom-calendar-container');
            if (container) {
                container.addEventListener('keydown', (e) => this.handleContainerKeydown(e));
            }

            // Month navigation keyboard support
            document.getElementById('prev-month')?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.changeMonth(-1);
                }
            });

            document.getElementById('next-month')?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.changeMonth(1);
                }
            });
        },

        changeMonth(direction) {
            this.currentDate.setMonth(this.currentDate.getMonth() + direction);
            this.render();
            
            // Announce month change to screen readers
            this.announceMonthChange();
            
            // Focus first available date in new month
            setTimeout(() => {
                this.focusFirstAvailableDate();
            }, 100);
        },

        handleContainerKeydown(e) {
            // Handle Page Up/Page Down for month navigation
            if (e.key === 'PageUp') {
                e.preventDefault();
                this.changeMonth(-1);
            } else if (e.key === 'PageDown') {
                e.preventDefault();
                this.changeMonth(1);
            }
        },

        handleDateKeydown(e, date) {
            e.preventDefault();
            
            const currentDate = new Date(date);
            let newDate = new Date(date);
            
            switch (e.key) {
                case 'Enter':
                case ' ':
                    this.selectDate(date);
                    break;
                    
                case 'ArrowLeft':
                    newDate.setDate(currentDate.getDate() - 1);
                    this.navigateToDate(newDate);
                    break;
                    
                case 'ArrowRight':
                    newDate.setDate(currentDate.getDate() + 1);
                    this.navigateToDate(newDate);
                    break;
                    
                case 'ArrowUp':
                    newDate.setDate(currentDate.getDate() - 7);
                    this.navigateToDate(newDate);
                    break;
                    
                case 'ArrowDown':
                    newDate.setDate(currentDate.getDate() + 7);
                    this.navigateToDate(newDate);
                    break;
                    
                case 'Home':
                    // First day of week
                    newDate.setDate(currentDate.getDate() - currentDate.getDay());
                    this.navigateToDate(newDate);
                    break;
                    
                case 'End':
                    // Last day of week
                    newDate.setDate(currentDate.getDate() + (6 - currentDate.getDay()));
                    this.navigateToDate(newDate);
                    break;
                    
                case 'PageUp':
                    if (e.shiftKey) {
                        // Previous year
                        newDate.setFullYear(currentDate.getFullYear() - 1);
                    } else {
                        // Previous month
                        newDate.setMonth(currentDate.getMonth() - 1);
                    }
                    this.navigateToDate(newDate);
                    break;
                    
                case 'PageDown':
                    if (e.shiftKey) {
                        // Next year
                        newDate.setFullYear(currentDate.getFullYear() + 1);
                    } else {
                        // Next month
                        newDate.setMonth(currentDate.getMonth() + 1);
                    }
                    this.navigateToDate(newDate);
                    break;
            }
        },

        navigateToDate(targetDate) {
            // Check if we need to change month/year
            if (targetDate.getMonth() !== this.currentDate.getMonth() || 
                targetDate.getFullYear() !== this.currentDate.getFullYear()) {
                this.currentDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
                this.render();
            }
            
            // Focus the target date
            setTimeout(() => {
                const targetDateString = targetDate.toISOString().split('T')[0];
                const targetCell = document.querySelector(`[data-date="${targetDateString}"]`);
                if (targetCell && !targetCell.disabled) {
                    targetCell.focus();
                } else {
                    // If target date is not available, find nearest available date
                    this.focusNearestAvailableDate(targetDate);
                }
            }, 100);
        },

        focusFirstAvailableDate() {
            const availableDates = document.querySelectorAll('.calendar-date[tabindex="0"]:not([disabled])');
            if (availableDates.length > 0) {
                availableDates[0].focus();
            }
        },

        focusNearestAvailableDate(targetDate) {
            const availableDates = Array.from(document.querySelectorAll('.calendar-date[tabindex="0"]:not([disabled])'));
            if (availableDates.length === 0) return;
            
            // Find the closest available date
            let closestDate = availableDates[0];
            let closestDiff = Math.abs(new Date(availableDates[0].dataset.date) - targetDate);
            
            availableDates.forEach(dateElement => {
                const dateValue = new Date(dateElement.dataset.date);
                const diff = Math.abs(dateValue - targetDate);
                if (diff < closestDiff) {
                    closestDiff = diff;
                    closestDate = dateElement;
                }
            });
            
            closestDate.focus();
        },

        announceFocus(dateElement) {
            const announcements = document.getElementById('calendar-announcements');
            if (announcements) {
                announcements.textContent = dateElement.getAttribute('aria-label');
            }
        },

        announceMonthChange() {
            const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
            const announcements = document.getElementById('calendar-announcements');
            if (announcements) {
                announcements.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()} calendar`;
            }
        },

        announceSelection(date) {
            const announcements = document.getElementById('calendar-announcements');
            if (announcements) {
                const formattedDate = date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                announcements.textContent = `Selected ${formattedDate}`;
            }
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Only initialize if we're on step 2
            const dateTimeSection = document.getElementById('datetime-selection');
            if (dateTimeSection) {
                // Use MutationObserver to detect when step 2 becomes visible
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.target.style.display !== 'none' && !window.customCalendarInitialized) {
                            window.customCalendarInitialized = true;
                            CustomCalendar.init();
                        }
                    });
                });
                
                observer.observe(dateTimeSection, {
                    attributes: true,
                    attributeFilter: ['style']
                });
                
                // Also check if already visible
                if (dateTimeSection.style.display !== 'none') {
                    CustomCalendar.init();
                }
            }
        });
    }

    // Expose to global scope
    window.CustomCalendar = CustomCalendar;
})();