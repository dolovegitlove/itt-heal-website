const { chromium } = require('playwright');

async function testStripePositioning() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    args: ['--window-size=375,812', '--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 812 }); // Mobile size
    
    console.log('🔍 Testing Stripe credit card positioning...');
    await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
    
    // Open modal
    console.log('\n📅 Opening booking modal...');
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(3000);
    
    // Navigate to payment step (Step 4)
    console.log('\n⚡ Navigating to payment step...');
    for (let i = 0; i < 3; i++) {
      try {
        await page.click('#next-btn', { timeout: 2000 });
        await page.waitForTimeout(1000);
      } catch (e) {
        console.log(`Step ${i + 2}: Next button not available`);
      }
    }
    
    // Check Stripe element positioning
    const stripeAnalysis = await page.evaluate(() => {
      const container = document.getElementById('credit-card-section');
      const stripeElement = document.getElementById('stripe-card-element');
      const modal = document.getElementById('booking');
      
      if (!container || !stripeElement) {
        return { error: 'Required elements not found' };
      }
      
      const containerRect = container.getBoundingClientRect();
      const stripeRect = stripeElement.getBoundingClientRect();
      const modalRect = modal.getBoundingClientRect();
      
      // Check if Stripe element is within container bounds
      const isWithinContainer = {
        left: stripeRect.left >= containerRect.left - 5, // 5px tolerance
        right: stripeRect.right <= containerRect.right + 5,
        top: stripeRect.top >= containerRect.top - 5,
        bottom: stripeRect.bottom <= containerRect.bottom + 5
      };
      
      const isFullyContained = isWithinContainer.left && isWithinContainer.right && 
                               isWithinContainer.top && isWithinContainer.bottom;
      
      return {
        container: {
          left: containerRect.left,
          top: containerRect.top,
          width: containerRect.width,
          height: containerRect.height,
          right: containerRect.right,
          bottom: containerRect.bottom
        },
        stripeElement: {
          left: stripeRect.left,
          top: stripeRect.top,
          width: stripeRect.width,
          height: stripeRect.height,
          right: stripeRect.right,
          bottom: stripeRect.bottom
        },
        modal: {
          left: modalRect.left,
          top: modalRect.top,
          width: modalRect.width,
          height: modalRect.height
        },
        positioning: {
          isWithinContainer,
          isFullyContained,
          overflowRight: stripeRect.right > containerRect.right,
          overflowLeft: stripeRect.left < containerRect.left,
          overflowTop: stripeRect.top < containerRect.top,
          overflowBottom: stripeRect.bottom > containerRect.bottom
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
    });
    
    console.log('\n📊 Stripe Element Positioning Analysis:');
    if (stripeAnalysis.error) {
      console.log('❌ Error:', stripeAnalysis.error);
    } else {
      console.log('Container bounds:', stripeAnalysis.container);
      console.log('Stripe element bounds:', stripeAnalysis.stripeElement);
      console.log('Modal bounds:', stripeAnalysis.modal);
      console.log('Viewport:', stripeAnalysis.viewport);
      console.log('\n🎯 Position Check:');
      console.log('Is fully contained:', stripeAnalysis.positioning.isFullyContained);
      console.log('Within bounds check:', stripeAnalysis.positioning.isWithinContainer);
      console.log('Overflow right:', stripeAnalysis.positioning.overflowRight);
      console.log('Overflow left:', stripeAnalysis.positioning.overflowLeft);
      console.log('Overflow top:', stripeAnalysis.positioning.overflowTop);
      console.log('Overflow bottom:', stripeAnalysis.positioning.overflowBottom);
      
      if (stripeAnalysis.positioning.isFullyContained) {
        console.log('\n✅ SUCCESS: Stripe element is properly contained within its box!');
      } else {
        console.log('\n❌ ISSUE: Stripe element is overflowing outside its container');
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'stripe-positioning-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved: stripe-positioning-test.png');
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testStripePositioning().catch(console.error);