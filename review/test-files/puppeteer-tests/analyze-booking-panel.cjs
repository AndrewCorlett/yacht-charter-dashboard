const puppeteer = require('puppeteer');

async function analyzeBookingPanel() {
  console.log('🔍 Starting Booking Panel Analysis...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    
    console.log('📡 Navigating to dashboard...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📅 Navigating to bookings section...');
    // Try to find bookings navigation
    const bookingsNav = await page.$('[data-section="bookings"]');
    if (bookingsNav) {
      await bookingsNav.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Look for booking panel or booking list
    console.log('🔍 Searching for booking panel elements...');
    const bookingElements = await page.evaluate(() => {
      const selectors = [
        '.booking-panel',
        '[data-testid="booking-panel"]',
        '.booking-list',
        '[data-testid="booking-list"]',
        '.booking-card',
        'button[data-booking-id]'
      ];
      
      const found = {};
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        found[selector] = {
          count: elements.length,
          exists: elements.length > 0,
          firstElement: elements[0] ? {
            tagName: elements[0].tagName,
            className: elements[0].className,
            textContent: elements[0].textContent?.trim().substring(0, 50)
          } : null
        };
      });
      
      return found;
    });
    
    console.log('📊 Booking Elements Search Results:');
    Object.entries(bookingElements).forEach(([selector, info]) => {
      console.log(`${selector}: ${info.exists ? '✅ Found' : '❌ Not found'} (${info.count} elements)`);
      if (info.firstElement) {
        console.log(`  First: ${info.firstElement.tagName} - ${info.firstElement.textContent}`);
      }
    });
    
    // Take screenshot of current booking interface
    console.log('📸 Taking baseline screenshot...');
    await page.screenshot({ 
      path: 'booking-panel-baseline.png',
      fullPage: true
    });
    
    // Try to open a booking panel if booking list exists
    console.log('🔍 Attempting to open booking panel...');
    const bookingCard = await page.$('.booking-card, [data-booking-id]');
    if (bookingCard) {
      console.log('📋 Found booking card, clicking to open panel...');
      await bookingCard.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Take screenshot of opened panel
      await page.screenshot({ 
        path: 'booking-panel-opened.png',
        fullPage: true
      });
    }
    
    // Analyze current header structure
    const headerAnalysis = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('h1, h2, h3, .header, [class*="header"]'));
      return headers.map(header => ({
        tagName: header.tagName,
        className: header.className,
        textContent: header.textContent?.trim(),
        parent: header.parentElement?.className
      }));
    });
    
    console.log('\n📋 Current Header Analysis:');
    headerAnalysis.forEach((header, index) => {
      console.log(`Header ${index}: ${header.tagName} - "${header.textContent}"`);
      console.log(`  Classes: ${header.className}`);
    });
    
    // Analyze current trip type and form elements
    const formAnalysis = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const tripTypeSelect = selects.find(select => 
        select.name?.toLowerCase().includes('trip') || 
        select.id?.toLowerCase().includes('trip') ||
        Array.from(select.options).some(opt => opt.value.includes('charter') || opt.value.includes('bareboat'))
      );
      
      const addressLabels = Array.from(document.querySelectorAll('label'))
        .filter(label => label.textContent?.toLowerCase().includes('address'));
      
      return {
        tripTypeSelect: tripTypeSelect ? {
          name: tripTypeSelect.name,
          id: tripTypeSelect.id,
          options: Array.from(tripTypeSelect.options).map(opt => ({
            value: opt.value,
            text: opt.textContent
          })),
          selectedValue: tripTypeSelect.value
        } : null,
        addressLabels: addressLabels.map(label => ({
          textContent: label.textContent,
          className: label.className
        }))
      };
    });
    
    console.log('\n📝 Current Form Analysis:');
    if (formAnalysis.tripTypeSelect) {
      console.log('Trip Type Select Found:');
      console.log(`  Current value: ${formAnalysis.tripTypeSelect.selectedValue}`);
      console.log('  Options:');
      formAnalysis.tripTypeSelect.options.forEach(opt => {
        console.log(`    - ${opt.value}: "${opt.text}"`);
      });
    } else {
      console.log('❌ Trip Type Select not found');
    }
    
    console.log('\nAddress Labels Found:');
    formAnalysis.addressLabels.forEach(label => {
      console.log(`  - "${label.textContent}"`);
    });
    
    return {
      bookingElements,
      headerAnalysis,
      formAnalysis
    };
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    return null;
  } finally {
    await browser.close();
  }
}

analyzeBookingPanel().then(result => {
  if (result) {
    console.log('\n✅ Booking panel analysis completed successfully');
  } else {
    console.log('\n❌ Booking panel analysis failed');
  }
});