/**
 * Frontend Supabase Connection Test
 * 
 * Tests Supabase connection from the browser context
 * to identify frontend-specific issues.
 * 
 * @created 2025-06-27
 */

const puppeteer = require('puppeteer');

async function testFrontendSupabase() {
  console.log('🔍 Testing Supabase connection from frontend...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      console.log('🔴 Browser Error:', text);
    } else if (type === 'warn') {
      console.log('🟡 Browser Warning:', text);
    } else if (type === 'log' && (text.includes('UnifiedDataService') || text.includes('Supabase'))) {
      console.log('📊 Browser Log:', text);
    }
  });

  // Navigate to application
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  // Wait for React to load
  await page.waitForSelector('[data-testid="booking-form"]', { timeout: 10000 });
  
  // Test Supabase connection in browser context
  const testResult = await page.evaluate(() => {
    return new Promise(async (resolve) => {
      try {
        // Check environment variables (using globalThis to access Vite env)
        const envCheck = {
          hasEnvVars: typeof window.__vite_env !== 'undefined',
          windowKeys: Object.keys(window).filter(k => k.includes('VITE') || k.includes('supabase')),
          // Try to access through document meta tags or similar
          metaTags: Array.from(document.querySelectorAll('meta')).map(m => ({ name: m.name, content: m.content }))
        };
        
        console.log('Environment check in browser:', envCheck);
        
        // Check if modules are available
        const moduleCheck = {
          hasSupabaseModule: typeof window.supabase !== 'undefined',
          hasUnifiedService: typeof window.unifiedDataService !== 'undefined',
          documentReady: document.readyState,
          hasReactRoot: !!document.querySelector('#root')
        };
        
        console.log('Module availability:', moduleCheck);
        
        // Try to access Supabase through the existing lib
        try {
          const { supabase } = await import('/src/lib/supabase.js');
          const { default: unifiedDataService } = await import('/src/services/UnifiedDataService.js');
          
          resolve({
            success: true,
            envCheck,
            moduleCheck,
            hasSupabaseClient: !!supabase,
            unifiedServiceInitialized: unifiedDataService.isInitialized,
            bookingCount: unifiedDataService.getAllBookings().length,
            charterCount: unifiedDataService.getAllCharters().length
          });
        } catch (importError) {
          resolve({
            success: false,
            error: importError.message,
            envCheck,
            moduleCheck,
            importError: true
          });
        }
      } catch (error) {
        resolve({
          success: false,
          error: error.message,
          envCheck: {},
          moduleCheck: {}
        });
      }
    });
  });
  
  console.log('🧪 Frontend Test Results:');
  console.log(JSON.stringify(testResult, null, 2));
  
  // Take screenshot for debugging
  await page.screenshot({ 
    path: './frontend-supabase-test.png',
    fullPage: true 
  });
  
  await browser.close();
  
  return testResult;
}

// Run if called directly
if (require.main === module) {
  testFrontendSupabase()
    .then(result => {
      if (result.success) {
        console.log('✅ Frontend Supabase test completed successfully');
        process.exit(0);
      } else {
        console.log('❌ Frontend Supabase test failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('🚨 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testFrontendSupabase };