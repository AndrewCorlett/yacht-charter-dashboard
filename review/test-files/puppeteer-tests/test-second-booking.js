// Test script for second booking to verify gap-filling logic
import puppeteer from 'puppeteer';

async function testSecondBooking() {
    console.log('Starting second booking test...');
    
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
        
        // Fill out the booking form with second set of details
        console.log('Filling out booking form for second booking...');
        
        // Select yacht
        await page.select('select[name="yacht"]', 'zavaria');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Fill personal details
        await page.type('input[name="firstName"]', 'Jane');
        await page.type('input[name="surname"]', 'TestUser2');
        await page.type('input[name="email"]', 'jane.test2@example.com');
        await page.type('input[name="phone"]', '+44 1234 567891');
        
        // Fill address details
        await page.type('input[name="addressLine1"]', '124 Test Street');
        await page.type('input[name="city"]', 'Test City');
        await page.type('input[name="postcode"]', 'TC1 2ST');
        
        // Fill dates
        await page.type('input[name="startDate"]', '2025-07-06');
        await page.type('input[name="endDate"]', '2025-07-13');
        
        console.log('Form filled out, clicking Quick Create...');
        
        // Click Quick Create button
        await page.click('button:contains("Quick Create")');
        
        // Wait for response
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check for success message and booking code
        const successMessage = await page.evaluate(() => {
            const alerts = document.querySelectorAll('.alert, .success, .notification, [class*="success"], [class*="alert"]');
            for (let alert of alerts) {
                if (alert.textContent.includes('Booking created') || alert.textContent.includes('Success')) {
                    return alert.textContent;
                }
            }
            return null;
        });
        
        // Look for booking code in various places
        const bookingCode = await page.evaluate(() => {
            // Check for booking code in success message
            const bodyText = document.body.textContent;
            const codeMatch = bodyText.match(/\d{4}[A-Z]{2}\d{2}/g);
            return codeMatch ? codeMatch : null;
        });
        
        // Check if both bookings are visible
        const bookingsList = await page.evaluate(() => {
            const bookings = [];
            const elements = document.querySelectorAll('*');
            elements.forEach(el => {
                if (el.textContent.includes('2527ZA')) {
                    bookings.push(el.textContent);
                }
            });
            return bookings;
        });
        
        console.log('=== TEST RESULTS ===');
        console.log('Success message:', successMessage);
        console.log('Booking codes found:', bookingCode);
        console.log('All bookings visible:', bookingsList);
        
        // Take a screenshot for reference
        await page.screenshot({ path: 'second-booking-test-result.png', fullPage: true });
        console.log('Screenshot saved as second-booking-test-result.png');
        
        // Keep browser open for manual inspection
        console.log('Browser will stay open for manual inspection. Press Ctrl+C to close.');
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
        
    } catch (error) {
        console.error('Error during test:', error);
        await page.screenshot({ path: 'second-booking-test-error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

testSecondBooking().catch(console.error);