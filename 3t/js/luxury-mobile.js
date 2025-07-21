/**
 * Luxury Mobile Navigation & Responsive Functionality
 * Version: 20250625-mobile-001
 * 
 * Handles mobile navigation, responsive behavior, and mobile-specific interactions
 */

(function() {
    'use strict';
    
    // Mobile Navigation State
    let mobileMenuOpen = false;
    
    /**
     * Initialize mobile navigation and responsive features
     */
    function initMobileNavigation() {
        console.log('Initializing mobile navigation...');
        
        // Find mobile menu button
        const mobileMenuButton = document.getElementById('hamburger-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuButton) {
            mobileMenuButton.addEventListener('click', toggleMobileMenu);
            console.log('Mobile menu button listener added');
        }
        
        // Handle window resize
        window.addEventListener('resize', handleResize);
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', handleOutsideClick);
        
        // Handle escape key
        document.addEventListener('keydown', handleEscapeKey);
    }
    
    /**
     * Toggle mobile menu visibility
     */
    function toggleMobileMenu(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (!mobileMenu) {
            // Create mobile menu if it doesn't exist
            createMobileMenu();
        }
        
        mobileMenuOpen = !mobileMenuOpen;
        updateMobileMenuDisplay();
        
        console.log('Mobile menu toggled:', mobileMenuOpen);
    }
    
    /**
     * Create mobile menu dynamically
     */
    function createMobileMenu() {
        const mobileMenu = document.createElement('div');
        mobileMenu.id = 'mobile-menu';
        mobileMenu.className = 'mobile-menu-overlay';
        mobileMenu.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: none;
        `;
        
        const menuContent = document.createElement('div');
        menuContent.className = 'mobile-menu-content';
        menuContent.style.cssText = `
            position: absolute;
            top: 0;
            right: 0;
            width: 300px;
            height: 100vh;
            background: white;
            padding: 2rem 1.5rem;
            box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        // Add menu items
        const menuItems = [
            { href: '#services', text: 'Services' },
            { href: '#about', text: 'About Dr. Shiffer' },
            { href: '#six-modalities', text: 'Six Modalities' },
            { href: '#pricing', text: 'Pricing' },
            { href: '#booking', text: 'Book Session' },
            { href: 'tel:9402685999', text: 'Call: 940.268.5999' }
        ];
        
        const menuList = document.createElement('nav');
        menuList.style.cssText = 'margin-top: 2rem;';
        
        menuItems.forEach(item => {
            const menuItem = document.createElement('a');
            menuItem.href = item.href;
            menuItem.textContent = item.text;
            menuItem.style.cssText = `
                display: block;
                padding: 1rem 0;
                text-decoration: none;
                color: var(--spa-charcoal, #374151);
                font-size: 1.125rem;
                font-weight: 500;
                border-bottom: 1px solid var(--spa-sage-light, #e5e7eb);
                transition: color 0.3s ease;
            `;
            
            menuItem.addEventListener('click', closeMobileMenu);
            menuList.appendChild(menuItem);
        });
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '✕';
        closeButton.style.cssText = `
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--spa-charcoal, #374151);
        `;
        closeButton.addEventListener('click', closeMobileMenu);
        
        menuContent.appendChild(closeButton);
        menuContent.appendChild(menuList);
        mobileMenu.appendChild(menuContent);
        document.body.appendChild(mobileMenu);
        
        console.log('Mobile menu created dynamically');
    }
    
    /**
     * Update mobile menu display state
     */
    function updateMobileMenuDisplay() {
        const mobileMenu = document.getElementById('mobile-menu');
        const menuContent = mobileMenu?.querySelector('.mobile-menu-content');
        
        if (mobileMenu && menuContent) {
            if (mobileMenuOpen) {
                mobileMenu.style.display = 'block';
                mobileMenu.setAttribute('aria-hidden', 'false');
                // Trigger reflow before adding transform
                mobileMenu.offsetHeight;
                menuContent.style.transform = 'translateX(0)';
                document.body.style.overflow = 'hidden';
            } else {
                mobileMenu.setAttribute('aria-hidden', 'true');
                menuContent.style.transform = 'translateX(100%)';
                document.body.style.overflow = '';
                setTimeout(() => {
                    mobileMenu.style.display = 'none';
                }, 300);
            }
        }
    }
    
    /**
     * Close mobile menu
     */
    function closeMobileMenu() {
        if (mobileMenuOpen) {
            mobileMenuOpen = false;
            updateMobileMenuDisplay();
            console.log('Mobile menu closed');
        }
    }
    
    /**
     * Handle window resize
     */
    function handleResize() {
        const isMobile = window.innerWidth <= 768;
        
        // Close mobile menu on desktop
        if (!isMobile && mobileMenuOpen) {
            closeMobileMenu();
        }
        
        // Update responsive classes
        updateResponsiveClasses();
    }
    
    /**
     * Update responsive classes based on screen size
     */
    function updateResponsiveClasses() {
        const isMobile = window.innerWidth <= 768;
        const isTablet = window.innerWidth <= 1024;
        
        document.body.classList.toggle('is-mobile', isMobile);
        document.body.classList.toggle('is-tablet', isTablet);
        document.body.classList.toggle('is-desktop', !isTablet);
    }
    
    /**
     * Handle clicks outside mobile menu
     */
    function handleOutsideClick(event) {
        const mobileMenu = document.getElementById('mobile-menu');
        const menuContent = mobileMenu?.querySelector('.mobile-menu-content');
        
        if (mobileMenuOpen && mobileMenu && !menuContent?.contains(event.target)) {
            closeMobileMenu();
        }
    }
    
    /**
     * Handle escape key press
     */
    function handleEscapeKey(event) {
        if (event.key === 'Escape' && mobileMenuOpen) {
            closeMobileMenu();
        }
    }
    
    /**
     * Initialize responsive behavior
     */
    function initResponsiveBehavior() {
        // Set initial responsive classes
        updateResponsiveClasses();
        
        // Handle scroll behavior on mobile
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            const header = document.querySelector('header');
            
            if (header && window.innerWidth <= 768) {
                if (currentScrollY > lastScrollY && currentScrollY > 100) {
                    // Scrolling down - hide header
                    header.style.transform = 'translateY(-100%)';
                } else {
                    // Scrolling up - show header
                    header.style.transform = 'translateY(0)';
                }
            }
            
            lastScrollY = currentScrollY;
        });
    }
    
    /**
     * Initialize touch gestures for mobile
     */
    function initTouchGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // Swipe right to open menu (from left edge)
            if (deltaX > 50 && Math.abs(deltaY) < 100 && touchStartX < 50) {
                if (!mobileMenuOpen) {
                    mobileMenuOpen = true;
                    updateMobileMenuDisplay();
                }
            }
            
            // Swipe left to close menu
            if (deltaX < -50 && Math.abs(deltaY) < 100 && mobileMenuOpen) {
                closeMobileMenu();
            }
        });
    }
    
    /**
     * Initialize all mobile features
     */
    function init() {
        console.log('Initializing luxury mobile functionality...');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initMobileNavigation();
                initResponsiveBehavior();
                initTouchGestures();
            });
        } else {
            initMobileNavigation();
            initResponsiveBehavior();
            initTouchGestures();
        }
    }
    
    // Export functions to global scope
    window.LuxuryMobile = {
        toggleMobileMenu,
        closeMobileMenu,
        isMobileMenuOpen: () => mobileMenuOpen,
        init
    };
    
    // Auto-initialize
    init();
    
})();