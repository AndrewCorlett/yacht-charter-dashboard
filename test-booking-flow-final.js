import puppeteer from 'puppeteer';
import fs from 'fs';

async function testBookingFlowFinal() {
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
        errors: [],
        formValidationPassed: false
    };

    try {
        console.log('Starting comprehensive booking flow test...');
        
        // Launch browser with more debugging options
        browser = await puppeteer.launch({ 
            headless: false, 
            slowMo: 100,
            defaultViewport: { width: 1400, height: 900 },
            devtools: false
        });
        
        page = await browser.newPage();
        
        // Monitor network requests
        page.on('request', request => {
            if (request.url().includes('api') || request.method() === 'POST') {
                console.log(`Request: ${request.method()} ${request.url()}`);
                testResults.networkRequests.push({
                    method: request.method(),
                    url: request.url(),
                    postData: request.postData()
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
            const text = msg.text();
            console.log(`Console ${msg.type()}: ${text}`);
            if (msg.type() === 'error') {
                testResults.consoleErrors.push(text);
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
            path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots/final-01-initial.png',
            fullPage: true 
        });
        testResults.screenshots.push('final-01-initial.png');

        console.log('2. Waiting for form elements...');
        await page.waitForSelector('.Quick Create Booking', { timeout: 10000 }).catch(() => {});
        await page.waitForSelector('select', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('3. Inspecting form structure...');
        // Get all form elements to understand the structure
        const formStructure = await page.evaluate(() => {
            const selects = Array.from(document.querySelectorAll('select')).map(s => ({
                name: s.name,
                id: s.id,
                options: Array.from(s.options).map(o => ({ value: o.value, text: o.text }))
            }));
            
            const inputs = Array.from(document.querySelectorAll('input')).map(i => ({
                name: i.name,
                id: i.id,
                type: i.type,
                placeholder: i.placeholder
            }));
            
            return { selects, inputs };
        });
        
        console.log('Form structure:', JSON.stringify(formStructure, null, 2));

        // Find and fill yacht selection
        console.log('4. Selecting yacht...');
        const yachtSelect = await page.$('select');
        if (yachtSelect) {
            // Get all options first
            const options = await page.evaluate(select => {
                return Array.from(select.options).map(option => ({
                    value: option.value,
                    text: option.text
                }));
            }, yachtSelect);
            
            console.log('Available yacht options:', options);
            
            // Try to select Calico Moon
            const calicoMoonOption = options.find(opt => 
                opt.text.toLowerCase().includes('calico moon') || 
                opt.value === '50dba171-b830-4d88-9cb0-c14a37c4d58a'
            );
            
            if (calicoMoonOption) {
                await page.select('select', calicoMoonOption.value);
                console.log(`✓ Selected yacht: ${calicoMoonOption.text}`);
            } else {
                // Select the first non-empty option
                const validOption = options.find(opt => opt.value && opt.value !== '');
                if (validOption) {
                    await page.select('select', validOption.value);
                    console.log(`✓ Selected yacht: ${validOption.text}`);
                }
            }
        }

        console.log('5. Filling customer details...');
        
        // Fill first name
        const firstNameInput = await page.$('input[placeholder*="First name"], input[placeholder*="first name"]');
        if (firstNameInput) {
            await firstNameInput.type('Jane');
            console.log('✓ First name filled');
        }

        // Fill surname
        const surnameInput = await page.$('input[placeholder*="Surname"], input[placeholder*="surname"]');
        if (surnameInput) {
            await surnameInput.type('Doe');
            console.log('✓ Surname filled');
        }

        // Fill email
        const emailInput = await page.$('input[placeholder*="email"]');
        if (emailInput) {
            await emailInput.type('jane.doe@example.com');
            console.log('✓ Email filled');
        }

        // Fill phone
        const phoneInput = await page.$('input[placeholder*="7XXX XXXXXX"], input[placeholder*="phone"]');
        if (phoneInput) {
            await phoneInput.click({ clickCount: 3 });
            await phoneInput.type('+44 7987 654321');
            console.log('✓ Phone filled');
        }

        // Fill address
        const addressInput = await page.$('input[placeholder*="Building number"]');
        if (addressInput) {
            await addressInput.type('456 Test Avenue');
            console.log('✓ Address filled');
        }

        // Fill city
        const cityInput = await page.$('input[placeholder*="Cardiff"]');
        if (cityInput) {
            await cityInput.click({ clickCount: 3 });
            await cityInput.type('London');
            console.log('✓ City filled');
        }

        // Fill postcode
        const postcodeInput = await page.$('input[placeholder*="CF10 1AB"]');
        if (postcodeInput) {
            await postcodeInput.click({ clickCount: 3 });
            await postcodeInput.type('SW1A 1AA');
            console.log('✓ Postcode filled');
        }

        console.log('6. Setting dates...');
        
        // Handle start date
        const startDateInputs = await page.$$('input[placeholder="mm/dd/yyyy"]');
        if (startDateInputs.length >= 1) {
            const startDateInput = startDateInputs[0];
            await startDateInput.click();
            await startDateInput.evaluate(input => input.value = '');
            await startDateInput.type('08/01/2025');
            console.log('✓ Start date set');
        }

        // Handle end date
        if (startDateInputs.length >= 2) {
            const endDateInput = startDateInputs[1];
            await endDateInput.click();
            await endDateInput.evaluate(input => input.value = '');
            await endDateInput.type('08/07/2025');
            console.log('✓ End date set');
        }

        // Take screenshot after filling
        await page.screenshot({ 
            path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots/final-02-filled.png',
            fullPage: true 
        });
        testResults.screenshots.push('final-02-filled.png');

        console.log('7. Submitting form...');
        
        // Find and click submit button
        const submitButton = await page.$('button:contains("Quick Create")') || 
                             await page.$('button[type="submit"]') ||
                             await page.$('input[type="submit"]');
        
        if (!submitButton) {
            // Try to find button by text content
            const buttons = await page.$$('button');
            for (let button of buttons) {
                const text = await button.evaluate(b => b.textContent.toLowerCase());
                if (text.includes('quick') || text.includes('create')) {
                    await button.click();
                    testResults.formSubmitted = true;
                    break;
                }
            }
        } else {
            await submitButton.click();
            testResults.formSubmitted = true;
        }
        
        if (testResults.formSubmitted) {
            console.log('✓ Form submitted');
            
            // Wait for response and check for various outcomes
            console.log('8. Waiting for response...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check for validation errors
            const validationErrorSelectors = [
                '.error:not(:empty)',
                '.alert-danger:not(:empty)', 
                '[class*="error"]:not(:empty)',
                '.text-red-500:not(:empty)',
                '.is-invalid:not(:empty)'
            ];
            
            let validationErrors = [];
            for (let selector of validationErrorSelectors) {
                try {
                    const errors = await page.$$eval(selector, elements => 
                        elements.map(el => el.textContent.trim()).filter(text => text.length > 0)
                    );
                    validationErrors = validationErrors.concat(errors);
                } catch (e) {
                    // Selector not found, continue
                }
            }
            
            // Check for specific error messages
            const pageText = await page.evaluate(() => document.body.textContent);
            if (pageText.includes('required') || pageText.includes('Please fix')) {
                const errorMatch = pageText.match(/Please fix the following errors?:([^.]*)/i);
                if (errorMatch) {
                    validationErrors.push(errorMatch[1].trim());
                }
            }
            
            testResults.validationErrors = validationErrors;
            testResults.formValidationPassed = validationErrors.length === 0;
            
            if (validationErrors.length > 0) {
                console.log('❌ Validation errors found:', validationErrors);
            } else {
                console.log('✓ Form validation passed');
            }
            
            // Check for success modal
            const modalFound = await page.evaluate(() => {
                const modals = document.querySelectorAll('.modal, [role="dialog"], .success, .alert-success');
                for (let modal of modals) {
                    if (modal.style.display === 'block' || modal.classList.contains('show') || 
                        modal.offsetParent !== null) {
                        return {
                            found: true,
                            text: modal.textContent,
                            className: modal.className
                        };
                    }
                }
                return { found: false };
            });
            
            if (modalFound.found) {
                testResults.modalAppeared = true;
                console.log(`✓ Success modal found: ${modalFound.text.substring(0, 100)}...`);
                
                // Extract booking number
                const bookingMatch = modalFound.text.match(/booking\s*(?:number|id|ref)[:\s]*([A-Za-z0-9-]+)/i);
                if (bookingMatch) {
                    testResults.bookingNumber = bookingMatch[1];
                    console.log(`✓ Booking number: ${testResults.bookingNumber}`);
                }
            }
            
        } else {
            console.log('❌ Failed to submit form');
        }
        
        // Take final screenshot
        await page.screenshot({ 
            path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots/final-03-result.png',
            fullPage: true 
        });
        testResults.screenshots.push('final-03-result.png');

        testResults.success = testResults.formSubmitted && testResults.formValidationPassed;
        console.log('✓ Test completed');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        testResults.errors.push(error.message);
        
        if (page) {
            try {
                await page.screenshot({ 
                    path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots/final-99-error.png',
                    fullPage: true 
                });
                testResults.screenshots.push('final-99-error.png');
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

// Run the final comprehensive test
testBookingFlowFinal().then(results => {
    console.log('\n' + '='.repeat(70));
    console.log('COMPREHENSIVE BOOKING FLOW TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`✅ Overall Success: ${results.success}`);
    console.log(`📝 Form Submitted: ${results.formSubmitted}`);
    console.log(`✔️  Form Validation Passed: ${results.formValidationPassed}`);
    console.log(`🎉 Success Modal Appeared: ${results.modalAppeared}`);
    console.log(`🎫 Booking Number: ${results.bookingNumber || 'Not captured'}`);
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
        console.log('\nNetwork Requests Made:');
        results.networkRequests.forEach((req, i) => {
            console.log(`  ${i + 1}. ${req.method} ${req.url}`);
            if (req.postData) {
                console.log(`     Data: ${req.postData.substring(0, 100)}...`);
            }
        });
    }
    
    if (results.consoleErrors.length > 0) {
        console.log('\nBrowser Console Errors:');
        results.consoleErrors.forEach((error, i) => {
            console.log(`  ${i + 1}. ${error}`);
        });
    }
    
    if (results.screenshots.length > 0) {
        console.log('\nScreenshots Captured:');
        results.screenshots.forEach(screenshot => {
            console.log(`  📸 ${screenshot}`);
        });
    }
    
    // Save detailed results
    fs.writeFileSync(
        '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-results-comprehensive.json',
        JSON.stringify(results, null, 2)
    );
    console.log('\n📊 Comprehensive results saved to test-results-comprehensive.json');
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY:');
    if (results.success) {
        console.log('🎉 BOOKING CREATION FLOW WORKS SUCCESSFULLY!');
        console.log(`   - Form submitted successfully`);
        console.log(`   - No validation errors`);
        if (results.modalAppeared) {
            console.log(`   - Success modal appeared`);
        }
        if (results.bookingNumber) {
            console.log(`   - Booking number: ${results.bookingNumber}`);
        }
    } else if (results.formSubmitted) {
        console.log('⚠️  FORM SUBMITTED BUT VALIDATION ISSUES FOUND');
        console.log('   - Check validation errors above');
    } else {
        console.log('❌ FORM SUBMISSION FAILED');
        console.log('   - Check error messages above');
    }
    console.log('='.repeat(70));
    
}).catch(error => {
    console.error('Failed to run comprehensive test:', error);
});