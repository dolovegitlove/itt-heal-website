const { chromium } = require('playwright');

async function testStripeDebug() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    // Listen for Stripe-related console logs
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Stripe') || text.includes('card') || text.includes('Element')) {
        console.log(`[STRIPE] ${text}`);
      }
    });
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🎯 Testing Stripe card element initialization...\n');
    
    // Navigate to payment step quickly
    await page.click('[data-service="60min"]');
    await page.waitForTimeout(1000);
    
    await page.click('[role="gridcell"]:not(.disabled)');
    await page.waitForTimeout(500);
    
    await page.evaluate(() => {
      const timeSelect = document.getElementById('booking-time');
      if (timeSelect && timeSelect.options.length > 1) {
        timeSelect.selectedIndex = 1;
        timeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('#next-btn');
    await page.waitForTimeout(500);
    
    await page.fill('#client-name', 'Stripe Debug');
    await page.fill('#client-email', 'debug@test.com');
    await page.fill('#client-phone', '940-555-0000');
    await page.click('#next-btn');
    await page.waitForTimeout(2000);
    
    console.log('📋 At payment step - initializing Stripe manually...');
    
    // Try to manually initialize Stripe and check what happens
    const stripeDebug = await page.evaluate(async () => {
      console.log('🔧 Debugging Stripe initialization...');
      
      const container = document.getElementById('stripe-card-element');
      if (!container) {
        return { error: 'Stripe container not found' };
      }
      
      console.log('✅ Stripe container found:', container);
      console.log('📋 Container HTML before:', container.innerHTML);
      console.log('📋 Stripe object available:', typeof Stripe !== 'undefined');
      
      if (typeof Stripe === 'undefined') {
        return { error: 'Stripe not loaded' };
      }
      
      try {
        // Clear any existing content
        container.innerHTML = '';
        
        // Create new Stripe instance
        const stripe = Stripe('pk_live_51QGGaNGJLHwJJ7r70TKr8FJYwjOsGsU4NlWJXCwRYrqBFNHQpE6eHdfbNpjEEaNJhGjk6AuvK64mOJ3gQlEVSO9x006TfA7TBY');
        const elements = stripe.elements();
        
        console.log('📋 Stripe instance created:', !!stripe);
        console.log('📋 Elements created:', !!elements);
        
        // Create card element
        const cardElement = elements.create('card', {
          style: {
            base: {
              fontSize: '16px',
              color: '#374151',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              '::placeholder': {
                color: '#9ca3af',
              },
              padding: '12px'
            },
            invalid: {
              color: '#ef4444',
              iconColor: '#ef4444'
            }
          },
          hidePostalCode: false
        });
        
        console.log('📋 Card element created:', !!cardElement);
        
        // Mount the card element
        await cardElement.mount('#stripe-card-element');
        console.log('📋 Card element mounted');
        
        // Set up event listeners
        cardElement.on('ready', () => {
          console.log('✅ Stripe card element ready');
        });
        
        cardElement.on('change', ({ error, complete }) => {
          console.log('📋 Card input changed:', { error: !!error, complete });
        });
        
        // Store globally for access
        window.cardElement = cardElement;
        window.stripe = stripe;
        
        console.log('📋 Container HTML after:', container.innerHTML);
        
        return { 
          success: true, 
          containerHasContent: container.innerHTML.length > 0,
          elementMounted: !!window.cardElement
        };
        
      } catch (error) {
        console.error('❌ Stripe initialization error:', error);
        return { error: error.message };
      }
    });
    
    console.log('📊 STRIPE DEBUG RESULTS:');
    console.log('Success:', stripeDebug.success);
    console.log('Container has content:', stripeDebug.containerHasContent);
    console.log('Element mounted:', stripeDebug.elementMounted);
    if (stripeDebug.error) {
      console.log('Error:', stripeDebug.error);
    }
    
    // Wait a moment and check if the element is interactive
    await page.waitForTimeout(3000);
    
    console.log('\n📋 Testing card element interaction...');
    
    const interactionTest = await page.evaluate(() => {
      const container = document.getElementById('stripe-card-element');
      const stripeFrame = container?.querySelector('iframe');
      
      return {
        containerExists: !!container,
        containerVisible: container && window.getComputedStyle(container).display !== 'none',
        hasStripeFrame: !!stripeFrame,
        frameVisible: stripeFrame && window.getComputedStyle(stripeFrame).display !== 'none',
        containerHTML: container?.innerHTML?.substring(0, 300) || 'no HTML'
      };
    });
    
    console.log('📊 INTERACTION TEST:');
    console.log('Container exists:', interactionTest.containerExists);
    console.log('Container visible:', interactionTest.containerVisible);
    console.log('Has Stripe iframe:', interactionTest.hasStripeFrame);
    console.log('Frame visible:', interactionTest.frameVisible);
    console.log('Container HTML:', interactionTest.containerHTML);
    
    if (interactionTest.hasStripeFrame && interactionTest.frameVisible) {
      console.log('\n✅ SUCCESS: Stripe card element is properly initialized and visible!');
      
      // Try clicking on it to see if it's interactive
      try {
        await page.click('#stripe-card-element');
        console.log('✅ Card element is clickable');
      } catch (error) {
        console.log('❌ Card element click failed:', error.message);
      }
    } else {
      console.log('\n❌ Issue: Stripe card element not properly initialized');
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Stripe debug test error:', error);
  } finally {
    await browser.close();
  }
}

testStripeDebug().catch(console.error);