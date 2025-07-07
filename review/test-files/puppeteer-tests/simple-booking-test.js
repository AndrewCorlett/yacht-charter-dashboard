import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runSimpleTest() {
    console.log('🚀 Starting Simple Booking Test...');
    
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Monitor console messages and errors
    const consoleMessages = [];
    const pageErrors = [];
    
    page.on('console', msg => {
        const message = `${msg.type().toUpperCase()}: ${msg.text()}`;
        consoleMessages.push(message);
        console.log('🔍 Console:', message);
    });
    
    page.on('pageerror', error => {
        pageErrors.push(error.message);
        console.error('❌ Page Error:', error.message);
    });
    
    try {
        console.log('📍 Step 1: Navigate to localhost:5173');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
        
        // Wait for app to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('📍 Step 2: Take initial screenshot');
        await page.screenshot({ path: path.join(__dirname, 'step1-initial.png'), fullPage: true });
        
        console.log('📍 Step 3: Search for any booking content');
        
        // Search for any booking-related content
        const bookingContent = await page.evaluate(() => {
            const body = document.body;
            const bodyText = body.textContent || '';
            
            // Look for specific booking numbers
            const bookingNumbers = [];
            const bookingNumberPattern = /\d{4}AL\d{2}/g;
            let match;
            while ((match = bookingNumberPattern.exec(bodyText)) !== null) {
                bookingNumbers.push(match[0]);
            }
            
            // Look for customer names
            const customerNames = [];
            const customerPattern = /Customer\d+\s+Test\d+/g;
            let customerMatch;
            while ((customerMatch = customerPattern.exec(bodyText)) !== null) {
                customerNames.push(customerMatch[0]);
            }
            
            // Look for tables
            const tables = document.querySelectorAll('table');
            const tableCount = tables.length;
            
            // Look for booking cards or items
            const bookingCards = document.querySelectorAll('.booking-card, .booking-item, [data-testid*="booking"]');
            const cardCount = bookingCards.length;
            
            return {
                bookingNumbers,
                customerNames,
                tableCount,
                cardCount,
                hasBookingContent: bookingNumbers.length > 0 || customerNames.length > 0
            };
        });
        
        console.log('📋 Found booking content:', bookingContent);
        
        if (bookingContent.hasBookingContent) {
            console.log('✅ Found booking content, proceeding with test');
            
            // Try to find a specific booking to test with
            let testBookingNumber = '2528AL20';
            if (bookingContent.bookingNumbers.length > 0 && !bookingContent.bookingNumbers.includes('2528AL20')) {
                testBookingNumber = bookingContent.bookingNumbers[0];
                console.log(`📍 Using booking number: ${testBookingNumber} instead of 2528AL20`);
            }
            
            // Look for the booking
            const bookingElement = await page.evaluate((bookingNum) => {
                const allElements = document.querySelectorAll('*');
                for (let element of allElements) {
                    const text = element.textContent || '';
                    if (text.includes(bookingNum) && element.tagName !== 'SCRIPT') {
                        // Try to find a clickable parent
                        let clickableParent = element;
                        while (clickableParent && clickableParent !== document.body) {
                            if (clickableParent.tagName === 'TR' || 
                                clickableParent.tagName === 'DIV' || 
                                clickableParent.tagName === 'BUTTON' ||
                                clickableParent.onclick ||
                                clickableParent.getAttribute('role') === 'button') {
                                return {
                                    found: true,
                                    tagName: clickableParent.tagName,
                                    className: clickableParent.className,
                                    text: clickableParent.textContent?.substring(0, 100)
                                };
                            }
                            clickableParent = clickableParent.parentElement;
                        }
                        return {
                            found: true,
                            tagName: element.tagName,
                            className: element.className,
                            text: element.textContent?.substring(0, 100)
                        };
                    }
                }
                return { found: false };
            }, testBookingNumber);
            
            if (bookingElement.found) {
                console.log('✅ Found booking element:', bookingElement);
                
                // Take screenshot before clicking
                await page.screenshot({ path: path.join(__dirname, 'step2-before-click.png'), fullPage: true });
                
                // Try to click on the booking
                await page.evaluate((bookingNum) => {
                    const allElements = document.querySelectorAll('*');
                    for (let element of allElements) {
                        const text = element.textContent || '';
                        if (text.includes(bookingNum) && element.tagName !== 'SCRIPT') {
                            // Try to find a clickable parent
                            let clickableParent = element;
                            while (clickableParent && clickableParent !== document.body) {
                                if (clickableParent.tagName === 'TR' || 
                                    clickableParent.tagName === 'DIV' || 
                                    clickableParent.tagName === 'BUTTON' ||
                                    clickableParent.onclick ||
                                    clickableParent.getAttribute('role') === 'button') {
                                    clickableParent.click();
                                    return true;
                                }
                                clickableParent = clickableParent.parentElement;
                            }
                            element.click();
                            return true;
                        }
                    }
                    return false;
                }, testBookingNumber);
                
                console.log('📍 Step 4: Wait for booking details to load');
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Take screenshot after clicking
                await page.screenshot({ path: path.join(__dirname, 'step3-after-click.png'), fullPage: true });
                
                console.log('📍 Step 5: Look for booking number input field');
                
                // Look for input fields
                const inputFields = await page.evaluate(() => {
                    const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input:not([type])');
                    const fields = [];
                    for (let input of inputs) {
                        if (input.value || input.placeholder) {
                            fields.push({
                                name: input.name,
                                value: input.value,
                                placeholder: input.placeholder,
                                type: input.type
                            });
                        }
                    }
                    return fields;
                });
                
                console.log('📋 Found input fields:', inputFields);
                
                // Look for booking number field
                const bookingNumberField = inputFields.find(field => 
                    field.name?.toLowerCase().includes('booking') ||
                    field.placeholder?.toLowerCase().includes('booking') ||
                    field.value?.includes('AL')
                );
                
                if (bookingNumberField) {
                    console.log('✅ Found booking number field:', bookingNumberField);
                    
                    // Clear console messages before the test
                    consoleMessages.length = 0;
                    pageErrors.length = 0;
                    
                    // Edit the field
                    const fieldSelector = `input[name="${bookingNumberField.name}"]`;
                    await page.click(fieldSelector, { clickCount: 3 });
                    
                    // Change the number (e.g., from 2528AL20 to 2528AL10)
                    const newValue = testBookingNumber.replace(/\d{2}$/, '10');
                    await page.type(fieldSelector, newValue);
                    
                    console.log(`📍 Step 6: Changed booking number from ${testBookingNumber} to ${newValue}`);
                    
                    // Look for save button
                    const saveButton = await page.$('button[type="submit"]') || 
                                      await page.$('button:contains("Save")') || 
                                      await page.$('button:contains("Update")') ||
                                      await page.$('button:contains("Submit")');
                    
                    if (saveButton) {
                        console.log('📍 Step 7: Click save button');
                        await saveButton.click();
                        
                        // Wait and monitor for errors
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        
                        console.log('📍 Step 8: Take screenshot after save');
                        await page.screenshot({ path: path.join(__dirname, 'step4-after-save.png'), fullPage: true });
                        
                        console.log('📍 Step 9: Hard refresh page');
                        await page.reload({ waitUntil: 'networkidle2' });
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        
                        console.log('📍 Step 10: Take final screenshot');
                        await page.screenshot({ path: path.join(__dirname, 'step5-final.png'), fullPage: true });
                        
                        // Check if the new value persists
                        const persistedValue = await page.evaluate((newVal) => {
                            const body = document.body;
                            const bodyText = body.textContent || '';
                            return bodyText.includes(newVal);
                        }, newValue);
                        
                        console.log('\n🔍 FINAL TEST REPORT:');
                        console.log('======================');
                        
                        console.log('\n📊 Console Messages During Save:');
                        if (consoleMessages.length === 0) {
                            console.log('✅ No console messages (clean save)');
                        } else {
                            consoleMessages.forEach(msg => console.log(`   ${msg}`));
                        }
                        
                        console.log('\n❌ Page Errors During Save:');
                        if (pageErrors.length === 0) {
                            console.log('✅ No page errors (clean save)');
                        } else {
                            pageErrors.forEach(error => console.log(`   ${error}`));
                        }
                        
                        console.log('\n💾 Save Operation:');
                        console.log(pageErrors.length === 0 ? '✅ SUCCEEDED' : '❌ FAILED');
                        
                        console.log('\n🔄 Data Persistence:');
                        if (persistedValue) {
                            console.log(`✅ CONFIRMED - Value ${newValue} persists after refresh`);
                        } else {
                            console.log(`❌ FAILED - Value ${newValue} did not persist`);
                        }
                        
                        console.log('\n🎯 OVERALL RESULT:');
                        const success = pageErrors.length === 0 && persistedValue;
                        console.log(success ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
                        
                        return { success, consoleMessages, pageErrors, persistedValue };
                    } else {
                        console.log('❌ Could not find save button');
                    }
                } else {
                    console.log('❌ Could not find booking number input field');
                }
            } else {
                console.log('❌ Could not find booking element to click');
            }
        } else {
            console.log('❌ No booking content found on page');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        await page.screenshot({ path: path.join(__dirname, 'error-screenshot.png'), fullPage: true });
    } finally {
        await browser.close();
    }
}

runSimpleTest().catch(console.error);