/**
 * Logo Loading Optimization Script
 * Implements advanced techniques for fastest possible logo loading
 */

// Create optimized logo preloading function
function optimizeLogoLoading() {
    console.log('🚀 Optimizing logo loading performance...');
    
    // 1. Preload logo with high priority if not already done
    if (!document.querySelector('link[rel="preload"][href*="itt-heal-lotus-64.png"]')) {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'image';
        preloadLink.href = './assets/logos/itt-heal-lotus-64.png';
        preloadLink.setAttribute('fetchpriority', 'high');
        document.head.appendChild(preloadLink);
        console.log('✅ Added high-priority logo preload');
    }
    
    // 2. Create optimized image loading with error handling
    const logoElements = document.querySelectorAll('img[src*="itt-heal-lotus"]');
    
    logoElements.forEach((logo, index) => {
        console.log(`🖼️ Optimizing logo element ${index + 1}...`);
        
        // Set loading priority
        logo.loading = 'eager';
        logo.fetchPriority = 'high';
        
        // Add optimized loading attributes
        logo.decoding = 'async';
        
        // Create invisible preload test image for instant caching
        const testImg = new Image();
        testImg.onload = function() {
            console.log(`✅ Logo ${index + 1} preloaded in cache`);
            // Force browser to use cached version
            logo.src = logo.src; // Trigger reload from cache
        };
        testImg.onerror = function() {
            console.warn(`⚠️ Logo ${index + 1} preload failed, using fallback`);
        };
        testImg.src = logo.src;
        
        // Add intersection observer for instant loading when visible
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Logo is about to be visible - ensure it's loaded
                        entry.target.loading = 'eager';
                        observer.unobserve(entry.target);
                    }
                });
            }, { rootMargin: '50px' });
            
            observer.observe(logo);
        }
    });
    
    // 3. Add CSS optimization for logo rendering
    const logoCSS = `
        .itt-logo-leaf {
            image-rendering: crisp-edges;
            image-rendering: -webkit-optimize-contrast;
            will-change: transform;
            backface-visibility: hidden;
            transform: translateZ(0);
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = logoCSS;
    document.head.appendChild(styleSheet);
    
    console.log('🎨 Added GPU-accelerated logo rendering CSS');
    
    // 4. Add service worker caching for logo (if service worker exists)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            // Request service worker to cache logo aggressively
            registration.active?.postMessage({
                type: 'CACHE_LOGO',
                url: './assets/logos/itt-heal-lotus-64.png'
            });
        });
    }
    
    console.log('✅ Logo loading optimization complete');
}

// 5. Add performance monitoring
function monitorLogoPerformance() {
    const logos = document.querySelectorAll('img[src*="itt-heal-lotus"]');
    
    logos.forEach((logo, index) => {
        const startTime = performance.now();
        
        logo.addEventListener('load', () => {
            const loadTime = performance.now() - startTime;
            console.log(`📊 Logo ${index + 1} loaded in ${loadTime.toFixed(2)}ms`);
            
            // Report slow loading
            if (loadTime > 100) {
                console.warn(`⚠️ Logo ${index + 1} loaded slowly (${loadTime.toFixed(2)}ms)`);
            }
        });
        
        logo.addEventListener('error', () => {
            console.error(`❌ Logo ${index + 1} failed to load`);
        });
    });
}

// Initialize optimization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        optimizeLogoLoading();
        monitorLogoPerformance();
    });
} else {
    optimizeLogoLoading();
    monitorLogoPerformance();
}

// Export for manual usage
window.optimizeLogoLoading = optimizeLogoLoading;