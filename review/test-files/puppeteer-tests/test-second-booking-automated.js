// Automated test script for second booking to verify gap-filling logic
import puppeteer from 'puppeteer';

async function testSecondBookingAutomated() {
    console.log('Starting automated second booking test...');
    
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
        
        console.log('Filling out booking form for second booking...');
        
        // Fill the form step by step with proper waits
        
        // 1. Select yacht
        await page.waitForSelector('select[name="yacht"]');
        await page.select('select[name="yacht"]', 'zavaria');
        console.log('✓ Yacht selected: zavaria');
        
        // 2. Fill first name
        await page.waitForSelector('input[name="firstName"]');
        await page.focus('input[name="firstName"]');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.keyboard.type('Jane');
        console.log('✓ First name filled: Jane');
        
        // 3. Fill surname
        await page.waitForSelector('input[name="surname"]');
        await page.focus('input[name="surname"]');
        await page.keyboard.selectall();
        await page.keyboard.type('TestUser2');
        console.log('✓ Surname filled: TestUser2');
        
        // 4. Fill email
        await page.waitForSelector('input[name="email"]');
        await page.focus('input[name="email"]');
        await page.keyboard.selectall();
        await page.keyboard.type('jane.test2@example.com');
        console.log('✓ Email filled: jane.test2@example.com');
        
        // 5. Fill phone
        await page.waitForSelector('input[name="phone"]');
        await page.focus('input[name="phone"]');
        await page.keyboard.selectall();
        await page.keyboard.type('+44 1234 567891');
        console.log('✓ Phone filled: +44 1234 567891');
        
        // 6. Fill address line 1
        await page.waitForSelector('input[name="addressLine1"]');
        await page.focus('input[name="addressLine1"]');
        await page.keyboard.selectall();
        await page.keyboard.type('124 Test Street');
        console.log('✓ Address line 1 filled: 124 Test Street');
        
        // 7. Fill city
        await page.waitForSelector('input[name="city"]');
        await page.focus('input[name="city"]');
        await page.keyboard.selectall();
        await page.keyboard.type('Test City');
        console.log('✓ City filled: Test City');
        
        // 8. Fill postcode
        await page.waitForSelector('input[name="postcode"]');
        await page.focus('input[name="postcode"]');
        await page.keyboard.selectall();
        await page.keyboard.type('TC1 2ST');
        console.log('✓ Postcode filled: TC1 2ST');
        
        // 9. Fill start date
        await page.waitForSelector('input[name="startDate"]');
        await page.focus('input[name="startDate"]');
        await page.keyboard.selectall();
        await page.keyboard.type('2025-07-06');
        console.log('✓ Start date filled: 2025-07-06');
        
        // 10. Fill end date
        await page.waitForSelector('input[name="endDate"]');
        await page.focus('input[name="endDate"]');
        await page.keyboard.selectall();
        await page.keyboard.type('2025-07-13');
        console.log('✓ End date filled: 2025-07-13');
        
        // 11. Select charter type
        await page.waitForSelector('select[name="charterType"]');
        await page.select('select[name="charterType"]', 'Bareboat');
        console.log('✓ Charter type selected: Bareboat');
        
        // 12. Select port of departure
        await page.waitForSelector('select[name="portOfDeparture"]');
        await page.select('select[name="portOfDeparture"]', 'Largs Marina');
        console.log('✓ Port of departure selected: Largs Marina');
        
        // 13. Select port of arrival
        await page.waitForSelector('select[name="portOfArrival"]');
        await page.select('select[name="portOfArrival"]', 'Largs Marina');
        console.log('✓ Port of arrival selected: Largs Marina');
        
        // Wait a moment for all fields to be processed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Form filled out, clicking Quick Create...');
        
        // Click the Quick Create button
        await page.waitForSelector('button');
        const quickCreateButton = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (let button of buttons) {
                if (button.textContent.includes('Quick Create')) {
                    button.click();
                    return true;
                }
            }
            return false;
        });
        
        if (quickCreateButton) {
            console.log('✓ Quick Create button clicked');
        } else {
            console.log('✗ Quick Create button not found');
        }
        
        // Wait for the booking creation process
        console.log('Waiting for booking creation...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check for booking codes and messages
        const pageContent = await page.evaluate(() => {
            const bodyText = document.body.textContent;
            const bookingCodes = bodyText.match(/\d{4}[A-Z]{2}\d{2}/g);
            
            // Look for success/error messages
            const successMessages = [];
            const errorMessages = [];
            
            const elements = document.querySelectorAll('*');
            elements.forEach(el => {
                const text = el.textContent.toLowerCase();
                if (text.includes('booking created') || text.includes('success')) {
                    successMessages.push(el.textContent);
                }
                if (text.includes('error') || text.includes('failed')) {
                    errorMessages.push(el.textContent);
                }
            });
            
            return {
                bookingCodes: bookingCodes || [],
                successMessages,
                errorMessages,
                fullText: bodyText
            };
        });
        
        console.log('=== TEST RESULTS ===');
        console.log('Booking codes found:', pageContent.bookingCodes);
        console.log('Success messages:', pageContent.successMessages);
        console.log('Error messages:', pageContent.errorMessages);
        
        if (pageContent.bookingCodes.length > 0) {
            console.log('All booking codes:', pageContent.bookingCodes);
            console.log('Latest booking code:', pageContent.bookingCodes[pageContent.bookingCodes.length - 1]);
            
            // Check if we have the expected sequence
            const hasFirstBooking = pageContent.bookingCodes.includes('2527ZA01');
            const hasSecondBooking = pageContent.bookingCodes.includes('2527ZA02');
            
            if (hasFirstBooking && hasSecondBooking) {
                console.log('✅ SUCCESS: Gap-filling logic working correctly!');
                console.log('   - First booking: 2527ZA01');
                console.log('   - Second booking: 2527ZA02');
            } else if (hasFirstBooking) {
                console.log('⚠️  PARTIAL: First booking found but second booking code differs');
                console.log('   - Expected: 2527ZA02');
                console.log('   - Actual: ', pageContent.bookingCodes[pageContent.bookingCodes.length - 1]);
            } else {
                console.log('❌ ISSUE: Expected booking codes not found');
            }
        } else {
            console.log('❌ No booking codes found in the page');
        }
        
        // Take a screenshot for reference
        await page.screenshot({ path: 'automated-second-booking-result.png', fullPage: true });
        console.log('Screenshot saved as automated-second-booking-result.png');
        
        // Keep browser open for 10 seconds for manual inspection
        console.log('Browser will stay open for 10 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
    } catch (error) {
        console.error('Error during test:', error);
        await page.screenshot({ path: 'automated-second-booking-error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

testSecondBookingAutomated().catch(console.error);