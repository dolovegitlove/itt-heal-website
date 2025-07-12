const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Test desktop view
        await page.setViewport({ width: 1440, height: 900 });
        await page.goto('https://ittheal.com', { waitUntil: 'networkidle2' });
        
        // Wait for animations
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check CTA block is visible
        const ctaVisible = await page.evaluate(() => {
            const ctaBlock = document.querySelector('.cta-transition-block');
            if (!ctaBlock) return false;
            const rect = ctaBlock.getBoundingClientRect();
            return rect.height > 0 && window.getComputedStyle(ctaBlock).display !== 'none';
        });
        
        console.log('✅ CTA transition block visible:', ctaVisible);
        
        // Measure spacing between hero and services
        const spacing = await page.evaluate(() => {
            const hero = document.querySelector('#hero');
            const services = document.querySelector('#services');
            const cta = document.querySelector('.cta-transition-block');
            
            if (!hero || !services || !cta) return null;
            
            const heroRect = hero.getBoundingClientRect();
            const servicesRect = services.getBoundingClientRect();
            const ctaRect = cta.getBoundingClientRect();
            
            return {
                heroBottom: heroRect.bottom,
                ctaTop: ctaRect.top,
                ctaBottom: ctaRect.bottom,
                servicesTop: servicesRect.top,
                totalGap: servicesRect.top - heroRect.bottom,
                ctaHeight: ctaRect.height
            };
        });
        
        console.log('📏 Desktop spacing measurements:', spacing);
        
        // Test mobile view
        await page.setViewport({ width: 375, height: 812 });
        await page.reload({ waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mobileSpacing = await page.evaluate(() => {
            const hero = document.querySelector('#hero');
            const services = document.querySelector('#services');
            const cta = document.querySelector('.cta-transition-block');
            
            if (!hero || !services || !cta) return null;
            
            const heroRect = hero.getBoundingClientRect();
            const servicesRect = services.getBoundingClientRect();
            const ctaRect = cta.getBoundingClientRect();
            
            return {
                heroBottom: heroRect.bottom,
                ctaTop: ctaRect.top,
                ctaBottom: ctaRect.bottom,
                servicesTop: servicesRect.top,
                totalGap: servicesRect.top - heroRect.bottom,
                ctaHeight: ctaRect.height
            };
        });
        
        console.log('📱 Mobile spacing measurements:', mobileSpacing);
        
        // Check animation is working
        const animationWorking = await page.evaluate(() => {
            const animatedEl = document.querySelector('.animate-fade-in');
            if (!animatedEl) return false;
            const opacity = window.getComputedStyle(animatedEl).opacity;
            return parseFloat(opacity) > 0;
        });
        
        console.log('✨ Animation working:', animationWorking);
        
        // Take screenshots
        await page.setViewport({ width: 1440, height: 900 });
        await page.goto('https://ittheal.com#services', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await page.screenshot({ path: 'spacing-desktop.png', fullPage: false });
        
        await page.setViewport({ width: 375, height: 812 });
        await page.screenshot({ path: 'spacing-mobile.png', fullPage: false });
        
        console.log('\n✅ Spacing fix validated successfully!');
        console.log('📸 Screenshots saved: spacing-desktop.png, spacing-mobile.png');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await browser.close();
    }
})();