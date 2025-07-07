import puppeteer from 'puppeteer';
import fs from 'fs';

async function testBookingFlowV2() {
    let browser;
    let page;
    let testResults = {
        success: false,
        formSubmitted: false,
        modalAppeared: false,
        bookingNumber: null,
        validationErrors: [],
        consoleErrors: [],
        networkRequests: [],
        screenshots: [],
        errors: []
    };

    try {
        console.log('Starting improved booking flow test...');
        
        // Launch browser
        browser = await puppeteer.launch({ 
            headless: false, 
            slowMo: 50,
            defaultViewport: { width: 1400, height: 900 }
        });
        
        page = await browser.newPage();
        
        // Monitor network requests
        page.on('request', request => {
            if (request.url().includes('api') || request.method() === 'POST') {
                testResults.networkRequests.push({
                    method: request.method(),
                    url: request.url(),
                    headers: request.headers()
                });
            }
        });

        page.on('response', response => {
            if (response.url().includes('api') || response.request().method() === 'POST') {
                console.log(`Response: ${response.status()} ${response.url()}`);
            }
        });
        
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
            path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots/v2-01-initial-page.png',
            fullPage: true 
        });
        testResults.screenshots.push('v2-01-initial-page.png');

        // Wait for the form to be visible
        console.log('2. Waiting for Quick Create form...');
        await page.waitForSelector('form', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fill yacht selection
        console.log('3. Selecting yacht: Calico Moon');
        await page.select('select[name="yachtId"]', '50dba171-b830-4d88-9cb0-c14a37c4d58a');

        // Fill customer details
        console.log('4. Filling customer details...');
        await page.type('input[name="firstName"]', 'Jane');
        await page.type('input[name="surname"]', 'Doe');
        await page.type('input[name="email"]', 'jane.doe@example.com');
        await page.type('input[name="phone"]', '+44 7987 654321');

        // Fill address
        await page.type('input[name="addressLine1"]', '456 Test Avenue');
        await page.type('input[name="city"]', 'London');
        await page.type('input[name="postcode"]', 'SW1A 1AA');

        // Handle dates more carefully
        console.log('5. Setting dates...');
        
        // Clear and set start date
        const startDateInput = await page.$('input[name="startDate"]');
        await startDateInput.click({ clickCount: 3 }); // Select all
        await startDateInput.type('08/01/2025');
        
        // Clear and set end date
        const endDateInput = await page.$('input[name="endDate"]');
        await endDateInput.click({ clickCount: 3 }); // Select all
        await endDateInput.type('08/07/2025');

        // Take screenshot after filling form
        await page.screenshot({ 
            path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots/v2-02-form-filled.png',
            fullPage: true 
        });
        testResults.screenshots.push('v2-02-form-filled.png');

        console.log('6. Submitting form...');
        
        // Click submit button
        const submitButton = await page.$('button[type="submit"]');
        if (!submitButton) {
            throw new Error('Submit button not found');
        }
        
        await submitButton.click();
        testResults.formSubmitted = true;
        
        // Wait for response
        console.log('7. Waiting for response...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check for validation errors
        const errorMessages = await page.$$eval('.error, .alert-danger, [class*="error"]', elements => 
            elements.map(el => el.textContent.trim()).filter(text => text.length > 0)
        );
        
        if (errorMessages.length > 0) {
            testResults.validationErrors = errorMessages;
            console.log('❌ Validation errors found:', errorMessages);
        }
        
        // Check for success modal or notification
        const modalSelectors = [
            '.modal[style*="display: block"]',
            '.modal.show',
            '[role="dialog"]',
            '.success-modal',
            '.booking-success',
            '.alert-success',
            '.notification'
        ];
        
        for (let selector of modalSelectors) {
            try {
                const modal = await page.waitForSelector(selector, { timeout: 2000 });
                if (modal) {
                    testResults.modalAppeared = true;
                    const modalText = await page.$eval(selector, el => el.textContent);
                    console.log(`✓ Modal found: ${modalText.substring(0, 100)}...`);
                    
                    // Look for booking number
                    const bookingMatch = modalText.match(/booking\s*(?:number|id|ref(?:erence)?)[:\s]*([A-Za-z0-9-]+)/i);
                    if (bookingMatch) {
                        testResults.bookingNumber = bookingMatch[1];
                        console.log(`✓ Booking number: ${testResults.bookingNumber}`);
                    }
                    break;
                }
            } catch {
                // Continue to next selector
            }
        }
        
        // Take final screenshot
        await page.screenshot({ 
            path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots/v2-03-after-submission.png',
            fullPage: true 
        });
        testResults.screenshots.push('v2-03-after-submission.png');

        // If no modal found, check if form was reset or if there are any success indicators
        if (!testResults.modalAppeared) {
            console.log('8. Checking for other success indicators...');
            
            // Check if form was reset (indicating possible success)
            const formValues = await page.evaluate(() => {
                const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="date"], select');
                return Array.from(inputs).map(input => ({
                    name: input.name,
                    value: input.value,
                    type: input.type
                }));
            });
            
            console.log('Form values after submission:', formValues);
        }

        testResults.success = testResults.validationErrors.length === 0;
        console.log('✓ Test completed');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        testResults.errors.push(error.message);
        
        // Take error screenshot
        if (page) {
            try {
                await page.screenshot({ 
                    path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots/v2-99-error.png',
                    fullPage: true 
                });
                testResults.screenshots.push('v2-99-error.png');
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

// Run the improved test
testBookingFlowV2().then(results => {
    console.log('\n' + '='.repeat(60));
    console.log('IMPROVED BOOKING FLOW TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Overall Success: ${results.success}`);
    console.log(`📝 Form Submitted: ${results.formSubmitted}`);
    console.log(`🎉 Modal Appeared: ${results.modalAppeared}`);
    console.log(`🎫 Booking Number: ${results.bookingNumber || 'Not found'}`);
    console.log(`⚠️  Validation Errors: ${results.validationErrors.length}`);
    console.log(`🌐 Network Requests: ${results.networkRequests.length}`);
    console.log(`🖼️  Screenshots: ${results.screenshots.length} taken`);
    console.log(`❌ Console Errors: ${results.consoleErrors.length}`);
    console.log(`🚨 Page Errors: ${results.errors.length}`);
    
    if (results.validationErrors.length > 0) {
        console.log('\nValidation Errors:');
        results.validationErrors.forEach((error, i) => {
            console.log(`  ${i + 1}. ${error}`);
        });
    }

    if (results.networkRequests.length > 0) {
        console.log('\nNetwork Requests:');
        results.networkRequests.forEach((req, i) => {
            console.log(`  ${i + 1}. ${req.method} ${req.url}`);
        });
    }
    
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
        '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-results-v2.json',
        JSON.stringify(results, null, 2)
    );
    console.log('\n📊 Detailed results saved to test-results-v2.json');
    
}).catch(error => {
    console.error('Failed to run test:', error);
});