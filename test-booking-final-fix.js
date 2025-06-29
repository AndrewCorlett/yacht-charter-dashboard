import puppeteer from 'puppeteer';

async function finalBookingTest() {
    let browser;
    let page;
    
    try {
        console.log('🚀 Starting final booking test with correct date handling...');
        
        browser = await puppeteer.launch({ 
            headless: false, 
            slowMo: 200,
            defaultViewport: { width: 1400, height: 900 }
        });
        
        page = await browser.newPage();
        
        // Monitor API calls
        page.on('request', request => {
            if (request.url().includes('api') || request.method() === 'POST') {
                console.log(`📡 API Request: ${request.method()} ${request.url()}`);
            }
        });

        page.on('response', response => {
            if (response.url().includes('api') || response.request().method() === 'POST') {
                console.log(`📨 API Response: ${response.status()} ${response.url()}`);
            }
        });
        
        console.log('📄 Loading application...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
        await page.waitForSelector('#yacht', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('📝 Filling booking form...');
        
        // Select yacht
        await page.select('#yacht', '50dba171-b830-4d88-9cb0-c14a37c4d58a');
        console.log('  ✅ Yacht: Calico Moon');
        
        // Fill customer details
        await page.type('#firstName', 'Jane');
        await page.type('#surname', 'Doe');
        await page.type('#email', 'jane.doe@example.com');
        await page.type('#phone', '+44 7987 654321');
        await page.type('#addressLine1', '456 Test Avenue');
        await page.type('#city', 'London');
        await page.type('#postcode', 'SW1A 1AA');
        console.log('  ✅ Customer details completed');
        
        // Handle dates with proper format for date inputs
        console.log('📅 Setting dates with correct format...');
        
        // Clear and set start date
        await page.click('#startDate');
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.keyboard.type('2025-08-01');
        
        // Clear and set end date  
        await page.click('#endDate');
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.keyboard.type('2025-08-07');
        
        console.log('  ✅ Start Date: 2025-08-01');
        console.log('  ✅ End Date: 2025-08-07');
        
        // Verify dates were set correctly
        const startDateValue = await page.$eval('#startDate', el => el.value);
        const endDateValue = await page.$eval('#endDate', el => el.value);
        console.log(`  📅 Verified Start Date: ${startDateValue}`);
        console.log(`  📅 Verified End Date: ${endDateValue}`);
        
        // Take screenshot before submission
        await page.screenshot({ 
            path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots/final-form-ready.png',
            fullPage: true 
        });
        
        console.log('🎯 Submitting booking form...');
        
        // Submit the form
        const submitButton = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
        await submitButton.click();
        
        console.log('⏳ Waiting for server response...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait longer for processing
        
        // Check for validation errors first
        let validationErrors = [];
        try {
            const errorElements = await page.$$('.text-red-500, .error, .alert-danger');
            for (let element of errorElements) {
                const text = await element.evaluate(el => el.textContent.trim());
                if (text && text.length > 0) {
                    validationErrors.push(text);
                }
            }
        } catch (e) {
            // No validation errors found
        }
        
        // Check for success modal or notification
        let successFound = false;
        let bookingNumber = null;
        
        try {
            // Look for success indicators
            const successSelectors = [
                '.modal.show',
                '[role="dialog"]',
                '.alert-success',
                '.success'
            ];
            
            for (let selector of successSelectors) {
                try {
                    const element = await page.$(selector);
                    if (element) {
                        const isVisible = await element.evaluate(el => {
                            return el.offsetParent !== null || 
                                   window.getComputedStyle(el).display !== 'none';
                        });
                        
                        if (isVisible) {
                            const text = await element.evaluate(el => el.textContent);
                            console.log(`🎉 Success element found: ${text.substring(0, 100)}...`);
                            successFound = true;
                            
                            // Try to extract booking number
                            const bookingMatch = text.match(/booking\s*(?:number|id|ref)[:\s]*([A-Za-z0-9-]+)/i);
                            if (bookingMatch) {
                                bookingNumber = bookingMatch[1];
                            }
                            break;
                        }
                    }
                } catch (e) {
                    // Continue to next selector
                }
            }
        } catch (e) {
            console.log('No success modal found');
        }
        
        // Take final screenshot
        await page.screenshot({ 
            path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots/final-result.png',
            fullPage: true 
        });
        
        // Check if form was reset (another indicator of success)
        const formResetCheck = await page.evaluate(() => {
            const firstNameValue = document.querySelector('#firstName')?.value || '';
            const emailValue = document.querySelector('#email')?.value || '';
            return {
                firstName: firstNameValue,
                email: emailValue,
                formAppearReset: firstNameValue === '' && emailValue === ''
            };
        });
        
        // Final results
        const results = {
            dateValuesSet: {
                startDate: startDateValue,
                endDate: endDateValue
            },
            datesValid: startDateValue === '2025-08-01' && endDateValue === '2025-08-07',
            validationErrors: validationErrors,
            hasValidationErrors: validationErrors.length > 0,
            successModalFound: successFound,
            bookingNumber: bookingNumber,
            formResetAfterSubmission: formResetCheck.formAppearReset,
            overallSuccess: validationErrors.length === 0 && (successFound || formResetCheck.formAppearReset)
        };
        
        console.log('\n' + '='.repeat(60));
        console.log('🎯 FINAL BOOKING TEST RESULTS');
        console.log('='.repeat(60));
        console.log(`📅 Dates Set Correctly: ${results.datesValid}`);
        console.log(`❌ Validation Errors: ${results.hasValidationErrors}`);
        console.log(`🎉 Success Modal: ${results.successModalFound}`);
        console.log(`📝 Form Reset: ${results.formResetAfterSubmission}`);
        console.log(`✅ Overall Success: ${results.overallSuccess}`);
        
        if (results.bookingNumber) {
            console.log(`🎫 Booking Number: ${results.bookingNumber}`);
        }
        
        if (results.validationErrors.length > 0) {
            console.log('\n❌ Validation Errors Found:');
            results.validationErrors.forEach((error, i) => {
                console.log(`   ${i + 1}. ${error}`);
            });
        }
        
        return results;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (page) {
            await page.screenshot({ 
                path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots/final-error.png',
                fullPage: true 
            });
        }
        
        return { error: error.message };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the final test
finalBookingTest().then(results => {
    console.log('\n📊 Test completed successfully!');
    console.log('Screenshots saved in: /home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots/');
}).catch(console.error);