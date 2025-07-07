// Manual test script for second booking to verify gap-filling logic
import puppeteer from 'puppeteer';

async function testManualSecondBooking() {
    console.log('Starting manual second booking test...');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    try {
        // Navigate to the application
        console.log('Navigating to localhost:5173...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
        
        // Wait for the page to load
        await page.waitForSelector('body', { timeout: 10000 });
        
        console.log('Page loaded. Now manually fill out the form with these details:');
        console.log('  Yacht: zavaria');
        console.log('  First Name: Jane');
        console.log('  Surname: TestUser2');
        console.log('  Email: jane.test2@example.com');
        console.log('  Phone: +44 1234 567891');
        console.log('  Address Line 1: 124 Test Street');
        console.log('  City: Test City');
        console.log('  Postcode: TC1 2ST');
        console.log('  Start Date: 2025-07-06');
        console.log('  End Date: 2025-07-13');
        console.log('  Charter Type: Bareboat');
        console.log('  Port of Departure: Largs Marina');
        console.log('  Port of Arrival: Largs Marina');
        console.log('');
        console.log('After filling the form, click "Quick Create"');
        console.log('');
        console.log('Expected booking code: 2527ZA02');
        console.log('Previous booking code should be: 2527ZA01');
        console.log('');
        console.log('Browser will stay open for 5 minutes for manual testing...');
        
        // Wait for 5 minutes for manual testing
        await new Promise(resolve => setTimeout(resolve, 300000));
        
        // After manual testing, check for booking codes
        const pageContent = await page.evaluate(() => {
            const bodyText = document.body.textContent;
            const bookingCodes = bodyText.match(/\d{4}[A-Z]{2}\d{2}/g);
            
            return {
                bookingCodes: bookingCodes || [],
                hasSuccessMessage: bodyText.includes('Booking created') || bodyText.includes('Success'),
                hasErrorMessage: bodyText.includes('Error') || bodyText.includes('Failed')
            };
        });
        
        console.log('=== FINAL TEST RESULTS ===');
        console.log('Booking codes found:', pageContent.bookingCodes);
        console.log('Has success message:', pageContent.hasSuccessMessage);
        console.log('Has error message:', pageContent.hasErrorMessage);
        
        if (pageContent.bookingCodes.length > 0) {
            console.log('All booking codes:', pageContent.bookingCodes);
            console.log('Latest booking code:', pageContent.bookingCodes[pageContent.bookingCodes.length - 1]);
            
            // Check if sequence incremented correctly
            if (pageContent.bookingCodes.includes('2527ZA01') && pageContent.bookingCodes.includes('2527ZA02')) {
                console.log('✅ SUCCESS: Gap-filling logic working correctly!');
                console.log('   - First booking: 2527ZA01');
                console.log('   - Second booking: 2527ZA02');
            } else {
                console.log('❌ ISSUE: Expected sequence not found');
            }
        }
        
        // Take final screenshot
        await page.screenshot({ path: 'manual-second-booking-final.png', fullPage: true });
        console.log('Final screenshot saved as manual-second-booking-final.png');
        
    } catch (error) {
        console.error('Error during test:', error);
        await page.screenshot({ path: 'manual-second-booking-error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

testManualSecondBooking().catch(console.error);