import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function testBookingFlow() {
    let browser;
    let page;
    let testResults = {
        success: false,
        formSubmitted: false,
        modalAppeared: false,
        bookingNumber: null,
        consoleErrors: [],
        screenshots: [],
        errors: []
    };

    try {
        console.log('Starting booking flow test...');
        
        // Launch browser
        browser = await puppeteer.launch({ 
            headless: false, 
            slowMo: 100,
            defaultViewport: { width: 1200, height: 800 }
        });
        
        page = await browser.newPage();
        
        // Listen for console messages
        page.on('console', msg => {
            console.log(`Console ${msg.type()}: ${msg.text()}`);
            if (msg.type() === 'error') {
                testResults.consoleErrors.push(msg.text());
            }
        });

        // Listen for page errors
        page.on('pageerror', error => {
            console.log(`Page error: ${error.message}`);
            testResults.errors.push(error.message);
        });

        console.log('1. Navigating to http://localhost:5173');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
        
        // Take initial screenshot
        await page.screenshot({ 
            path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots/01-initial-page.png',
            fullPage: true 
        });
        testResults.screenshots.push('01-initial-page.png');
        console.log('✓ Initial page screenshot taken');

        // Wait for the form to be visible
        console.log('2. Waiting for Quick Create form to be visible...');
        await page.waitForSelector('form', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Allow form to fully render

        // Fill yacht selection
        console.log('3. Selecting yacht: Calico Moon');
        const yachtSelector = 'select[name="yachtId"], #yachtId, select[id*="yacht"]';
        await page.waitForSelector(yachtSelector, { timeout: 5000 });
        await page.select(yachtSelector, '50dba171-b830-4d88-9cb0-c14a37c4d58a');
        console.log('✓ Yacht selected');

        // Fill first name
        console.log('4. Filling first name: Jane');
        const firstNameSelector = 'input[name="firstName"], #firstName, input[placeholder*="first name" i]';
        await page.waitForSelector(firstNameSelector, { timeout: 5000 });
        await page.type(firstNameSelector, 'Jane');
        console.log('✓ First name filled');

        // Fill surname
        console.log('5. Filling surname: Doe');
        const surnameSelector = 'input[name="surname"], #surname, input[name="lastName"], #lastName, input[placeholder*="surname" i], input[placeholder*="last name" i]';
        await page.waitForSelector(surnameSelector, { timeout: 5000 });
        await page.type(surnameSelector, 'Doe');
        console.log('✓ Surname filled');

        // Fill email
        console.log('6. Filling email: jane.doe@example.com');
        const emailSelector = 'input[name="email"], #email, input[type="email"]';
        await page.waitForSelector(emailSelector, { timeout: 5000 });
        await page.type(emailSelector, 'jane.doe@example.com');
        console.log('✓ Email filled');

        // Fill phone
        console.log('7. Filling phone: +44 7987 654321');
        const phoneSelector = 'input[name="phone"], #phone, input[type="tel"]';
        await page.waitForSelector(phoneSelector, { timeout: 5000 });
        await page.type(phoneSelector, '+44 7987 654321');
        console.log('✓ Phone filled');

        // Fill address line 1
        console.log('8. Filling address: 456 Test Avenue');
        const addressSelector = 'input[name="addressLine1"], #addressLine1, input[name="address"], #address, input[placeholder*="address" i]';
        await page.waitForSelector(addressSelector, { timeout: 5000 });
        await page.type(addressSelector, '456 Test Avenue');
        console.log('✓ Address filled');

        // Fill city
        console.log('9. Filling city: London');
        const citySelector = 'input[name="city"], #city, input[placeholder*="city" i]';
        await page.waitForSelector(citySelector, { timeout: 5000 });
        await page.type(citySelector, 'London');
        console.log('✓ City filled');

        // Fill postcode
        console.log('10. Filling postcode: SW1A 1AA');
        const postcodeSelector = 'input[name="postcode"], #postcode, input[name="postalCode"], #postalCode, input[placeholder*="postcode" i], input[placeholder*="postal" i]';
        await page.waitForSelector(postcodeSelector, { timeout: 5000 });
        await page.type(postcodeSelector, 'SW1A 1AA');
        console.log('✓ Postcode filled');

        // Fill start date
        console.log('11. Setting start date: 2025-08-01');
        const startDateSelector = 'input[name="startDate"], #startDate, input[type="date"]:first-of-type';
        await page.waitForSelector(startDateSelector, { timeout: 5000 });
        await page.evaluate((selector) => {
            document.querySelector(selector).value = '2025-08-01';
        }, startDateSelector);
        console.log('✓ Start date set');

        // Fill end date
        console.log('12. Setting end date: 2025-08-07');
        const endDateSelector = 'input[name="endDate"], #endDate, input[type="date"]:last-of-type';
        await page.waitForSelector(endDateSelector, { timeout: 5000 });
        await page.evaluate((selector) => {
            document.querySelector(selector).value = '2025-08-07';
        }, endDateSelector);
        console.log('✓ End date set');

        // Take screenshot before submission
        await page.screenshot({ 
            path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots/02-form-filled.png',
            fullPage: true 
        });
        testResults.screenshots.push('02-form-filled.png');
        console.log('✓ Form filled screenshot taken');

        // Submit the form
        console.log('13. Submitting form by clicking "Quick Create" button...');
        const submitSelector = 'button[type="submit"], button:contains("Quick Create"), input[type="submit"]';
        
        // Try different approaches to find the submit button
        let submitButton;
        try {
            submitButton = await page.waitForSelector('button[type="submit"]', { timeout: 3000 });
        } catch {
            try {
                submitButton = await page.waitForSelector('button', { timeout: 3000 });
                // Find button with text containing "Quick Create"
                const buttons = await page.$$('button');
                for (let button of buttons) {
                    const text = await button.getProperty('textContent');
                    const textValue = await text.jsonValue();
                    if (textValue.toLowerCase().includes('quick') || textValue.toLowerCase().includes('create')) {
                        submitButton = button;
                        break;
                    }
                }
            } catch {
                throw new Error('Could not find submit button');
            }
        }

        if (submitButton) {
            await submitButton.click();
            testResults.formSubmitted = true;
            console.log('✓ Form submitted');
            
            // Wait for potential modal or response
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check for success modal
            console.log('14. Checking for success modal...');
            try {
                const modalSelectors = [
                    '.modal', 
                    '[role="dialog"]', 
                    '.success-modal',
                    '.booking-success',
                    '.alert-success',
                    '.notification'
                ];
                
                let modalFound = false;
                for (let selector of modalSelectors) {
                    try {
                        await page.waitForSelector(selector, { timeout: 2000 });
                        modalFound = true;
                        testResults.modalAppeared = true;
                        console.log(`✓ Modal found with selector: ${selector}`);
                        
                        // Try to extract booking number
                        const modalText = await page.$eval(selector, el => el.textContent);
                        console.log('Modal text:', modalText);
                        
                        // Look for booking number patterns
                        const bookingNumberMatch = modalText.match(/booking\s*(?:number|id|ref(?:erence)?)[:\s]*([A-Za-z0-9-]+)/i);
                        if (bookingNumberMatch) {
                            testResults.bookingNumber = bookingNumberMatch[1];
                            console.log(`✓ Booking number extracted: ${testResults.bookingNumber}`);
                        }
                        
                        break;
                    } catch {
                        // Continue to next selector
                    }
                }
                
                if (!modalFound) {
                    console.log('⚠ No success modal found');
                }
                
            } catch (error) {
                console.log('⚠ Error checking for modal:', error.message);
            }
            
            // Take screenshot after submission
            await page.screenshot({ 
                path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots/03-after-submission.png',
                fullPage: true 
            });
            testResults.screenshots.push('03-after-submission.png');
            console.log('✓ Post-submission screenshot taken');
            
        } else {
            throw new Error('Submit button not found');
        }

        testResults.success = true;
        console.log('✓ Test completed successfully');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        testResults.errors.push(error.message);
        
        // Take error screenshot
        if (page) {
            try {
                await page.screenshot({ 
                    path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots/99-error.png',
                    fullPage: true 
                });
                testResults.screenshots.push('99-error.png');
            } catch (screenshotError) {
                console.error('Failed to take error screenshot:', screenshotError.message);
            }
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    return testResults;
}

// Create screenshots directory
const screenshotsDir = '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots';
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Run the test
testBookingFlow().then(results => {
    console.log('\n' + '='.repeat(50));
    console.log('BOOKING FLOW TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`✅ Test Success: ${results.success}`);
    console.log(`📝 Form Submitted: ${results.formSubmitted}`);
    console.log(`🎉 Modal Appeared: ${results.modalAppeared}`);
    console.log(`🎫 Booking Number: ${results.bookingNumber || 'Not found'}`);
    console.log(`🖼️  Screenshots: ${results.screenshots.length} taken`);
    console.log(`❌ Console Errors: ${results.consoleErrors.length}`);
    console.log(`🚨 Page Errors: ${results.errors.length}`);
    
    if (results.consoleErrors.length > 0) {
        console.log('\nConsole Errors:');
        results.consoleErrors.forEach((error, i) => {
            console.log(`  ${i + 1}. ${error}`);
        });
    }
    
    if (results.errors.length > 0) {
        console.log('\nPage Errors:');
        results.errors.forEach((error, i) => {
            console.log(`  ${i + 1}. ${error}`);
        });
    }
    
    if (results.screenshots.length > 0) {
        console.log('\nScreenshots saved:');
        results.screenshots.forEach(screenshot => {
            console.log(`  📸 ${screenshot}`);
        });
    }
    
    // Save results to JSON file
    fs.writeFileSync(
        '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-results.json',
        JSON.stringify(results, null, 2)
    );
    console.log('\n📊 Detailed results saved to test-results.json');
    
}).catch(error => {
    console.error('Failed to run test:', error);
});