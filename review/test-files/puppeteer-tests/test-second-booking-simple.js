// Simple test script for second booking to verify gap-filling logic
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
        
        // Clear any existing form data first
        await page.evaluate(() => {
            const inputs = document.querySelectorAll('input, select');
            inputs.forEach(input => {
                if (input.type === 'text' || input.type === 'email' || input.type === 'tel' || input.type === 'date') {
                    input.value = '';
                } else if (input.tagName === 'SELECT') {
                    input.selectedIndex = 0;
                }
            });
        });
        
        console.log('Filling out booking form for second booking...');
        
        // Select yacht (zavaria)
        await page.evaluate(() => {
            const yachtSelect = document.querySelector('select[name="yacht"]');
            if (yachtSelect) {
                yachtSelect.value = 'zavaria';
                yachtSelect.dispatchEvent(new Event('change'));
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Fill personal details
        await page.evaluate(() => {
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
        });
        
        console.log('Form filled out, looking for Quick Create button...');
        
        // Find and click the Quick Create button
        const quickCreateButton = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (let button of buttons) {
                if (button.textContent.includes('Quick Create')) {
                    return true;
                }
            }
            return false;
        });
        
        if (quickCreateButton) {
            await page.evaluate(() => {
                const buttons = document.querySelectorAll('button');
                for (let button of buttons) {
                    if (button.textContent.includes('Quick Create')) {
                        button.click();
                        break;
                    }
                }
            });
            console.log('Quick Create button clicked');
        } else {
            console.log('Quick Create button not found');
        }
        
        // Wait for response
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        // Check for booking codes and messages
        const pageContent = await page.evaluate(() => {
            const bodyText = document.body.textContent;
            const bookingCodes = bodyText.match(/\d{4}[A-Z]{2}\d{2}/g);
            
            return {
                allText: bodyText,
                bookingCodes: bookingCodes || [],
                hasSuccessMessage: bodyText.includes('Booking created') || bodyText.includes('Success'),
                hasErrorMessage: bodyText.includes('Error') || bodyText.includes('Failed')
            };
        });
        
        console.log('=== TEST RESULTS ===');
        console.log('Booking codes found:', pageContent.bookingCodes);
        console.log('Has success message:', pageContent.hasSuccessMessage);
        console.log('Has error message:', pageContent.hasErrorMessage);
        
        if (pageContent.bookingCodes.length > 0) {
            console.log('Latest booking code:', pageContent.bookingCodes[pageContent.bookingCodes.length - 1]);
        }
        
        // Take a screenshot for reference
        await page.screenshot({ path: 'second-booking-test-result.png', fullPage: true });
        console.log('Screenshot saved as second-booking-test-result.png');
        
        // Keep browser open for 30 seconds for manual inspection
        console.log('Browser will stay open for 30 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
    } catch (error) {
        console.error('Error during test:', error);
        await page.screenshot({ path: 'second-booking-test-error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

testSecondBooking().catch(console.error);