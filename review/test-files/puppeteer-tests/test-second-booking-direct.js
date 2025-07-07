// Direct test script for second booking to verify gap-filling logic
import puppeteer from 'puppeteer';

async function testSecondBookingDirect() {
    console.log('Starting direct second booking test...');
    
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
        
        // Fill the form directly using evaluate
        const formFilled = await page.evaluate(() => {
            try {
                // Select yacht
                const yachtSelect = document.querySelector('select[name="yacht"]');
                if (yachtSelect) {
                    yachtSelect.value = 'zavaria';
                    yachtSelect.dispatchEvent(new Event('change'));
                }
                
                // Fill form fields
                const fields = {
                    'firstName': 'Jane',
                    'surname': 'TestUser2',
                    'email': 'jane.test2@example.com',
                    'phone': '+44 1234 567891',
                    'addressLine1': '124 Test Street',
                    'city': 'Test City',
                    'postcode': 'TC1 2ST',
                    'startDate': '2025-07-06',
                    'endDate': '2025-07-13'
                };
                
                Object.entries(fields).forEach(([name, value]) => {
                    const input = document.querySelector(`input[name="${name}"]`);
                    if (input) {
                        input.value = value;
                        input.dispatchEvent(new Event('input'));
                        input.dispatchEvent(new Event('change'));
                    }
                });
                
                // Select charter type
                const charterTypeSelect = document.querySelector('select[name="charterType"]');
                if (charterTypeSelect) {
                    charterTypeSelect.value = 'Bareboat';
                    charterTypeSelect.dispatchEvent(new Event('change'));
                }
                
                // Select ports
                const portOfDepartureSelect = document.querySelector('select[name="portOfDeparture"]');
                if (portOfDepartureSelect) {
                    portOfDepartureSelect.value = 'Largs Marina';
                    portOfDepartureSelect.dispatchEvent(new Event('change'));
                }
                
                const portOfArrivalSelect = document.querySelector('select[name="portOfArrival"]');
                if (portOfArrivalSelect) {
                    portOfArrivalSelect.value = 'Largs Marina';
                    portOfArrivalSelect.dispatchEvent(new Event('change'));
                }
                
                return true;
            } catch (error) {
                console.error('Error filling form:', error);
                return false;
            }
        });
        
        if (formFilled) {
            console.log('✓ Form filled successfully');
        } else {
            console.log('✗ Error filling form');
        }
        
        // Wait a moment for form processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Clicking Quick Create button...');
        
        // Click the Quick Create button
        const buttonClicked = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (let button of buttons) {
                if (button.textContent.includes('Quick Create')) {
                    button.click();
                    return true;
                }
            }
            return false;
        });
        
        if (buttonClicked) {
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
                errorMessages
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
        await page.screenshot({ path: 'direct-second-booking-result.png', fullPage: true });
        console.log('Screenshot saved as direct-second-booking-result.png');
        
        // Keep browser open for 15 seconds for manual inspection
        console.log('Browser will stay open for 15 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        
    } catch (error) {
        console.error('Error during test:', error);
        await page.screenshot({ path: 'direct-second-booking-error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

testSecondBookingDirect().catch(console.error);