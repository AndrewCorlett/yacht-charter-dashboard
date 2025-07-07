import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runCalendarBookingTest() {
    console.log('🚀 Starting Calendar Booking Test...');
    
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
        
        console.log('📍 Step 2: Look for calendar booking entries');
        
        // Find calendar booking entries
        const calendarEntries = await page.evaluate(() => {
            const allDivs = document.querySelectorAll('div');
            const bookingEntries = [];
            
            for (let div of allDivs) {
                const text = div.textContent?.trim();
                if (text && (text.includes('Spectre') || text.includes('Alrisha') || text.includes('Zavaria'))) {
                    // Check if it's clickable
                    const isClickable = div.onclick || 
                                      div.style.cursor === 'pointer' ||
                                      div.className.includes('clickable') ||
                                      div.getAttribute('role') === 'button';
                    
                    bookingEntries.push({
                        text: text.substring(0, 50),
                        className: div.className,
                        isClickable: isClickable,
                        hasChildren: div.children.length > 0
                    });
                }
            }
            
            return bookingEntries;
        });
        
        console.log('📋 Found calendar entries:', calendarEntries);
        
        if (calendarEntries.length > 0) {
            console.log('📍 Step 3: Click on first calendar entry');
            
            // Click on the first calendar entry
            const clicked = await page.evaluate(() => {
                const allDivs = document.querySelectorAll('div');
                for (let div of allDivs) {
                    const text = div.textContent?.trim();
                    if (text && (text.includes('Spectre') || text.includes('Alrisha') || text.includes('Zavaria'))) {
                        div.click();
                        return { success: true, text: text.substring(0, 50) };
                    }
                }
                return { success: false };
            });
            
            console.log('📍 Click result:', clicked);
            
            if (clicked.success) {
                console.log('📍 Step 4: Wait for booking details to load');
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Take screenshot after clicking
                await page.screenshot({ path: path.join(__dirname, 'calendar-after-click.png'), fullPage: true });
                
                console.log('📍 Step 5: Look for booking form or details');
                
                // Look for form inputs
                const formInputs = await page.evaluate(() => {
                    const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input:not([type])');
                    const fields = [];
                    
                    for (let input of inputs) {
                        if (input.offsetParent !== null) { // visible
                            fields.push({
                                name: input.name,
                                value: input.value,
                                placeholder: input.placeholder,
                                type: input.type,
                                id: input.id
                            });
                        }
                    }
                    
                    return fields;
                });
                
                console.log('📋 Found form inputs:', formInputs);
                
                // Look specifically for booking number field
                const bookingNumberField = formInputs.find(field => 
                    field.name?.toLowerCase().includes('booking') ||
                    field.placeholder?.toLowerCase().includes('booking') ||
                    field.id?.toLowerCase().includes('booking') ||
                    field.value?.match(/\d{4}AL\d{2}/)
                );
                
                if (bookingNumberField) {
                    console.log('✅ Found booking number field:', bookingNumberField);
                    
                    // Clear console messages before the test
                    consoleMessages.length = 0;
                    pageErrors.length = 0;
                    
                    console.log('📍 Step 6: Edit booking number field');
                    
                    // Create field selector
                    let fieldSelector = '';
                    if (bookingNumberField.name) {
                        fieldSelector = `input[name="${bookingNumberField.name}"]`;
                    } else if (bookingNumberField.id) {
                        fieldSelector = `input[id="${bookingNumberField.id}"]`;
                    } else {
                        fieldSelector = `input[placeholder="${bookingNumberField.placeholder}"]`;
                    }
                    
                    // Clear and edit the field
                    await page.click(fieldSelector, { clickCount: 3 });
                    
                    // Create a new booking number (change last 2 digits)
                    const originalValue = bookingNumberField.value;
                    const newValue = originalValue ? 
                        originalValue.replace(/\d{2}$/, '10') : 
                        '2528AL10';
                    
                    await page.type(fieldSelector, newValue);
                    
                    console.log(`📍 Step 7: Changed booking number from "${originalValue}" to "${newValue}"`);
                    
                    // Look for save button
                    const saveButton = await page.$('button[type="submit"]') || 
                                      await page.$('button:contains("Save")') || 
                                      await page.$('button:contains("Update")') ||
                                      await page.$('button:contains("Submit")');
                    
                    if (saveButton) {
                        console.log('📍 Step 8: Click save button');
                        await saveButton.click();
                        
                        // Wait and monitor for errors
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        
                        console.log('📍 Step 9: Take screenshot after save');
                        await page.screenshot({ path: path.join(__dirname, 'calendar-after-save.png'), fullPage: true });
                        
                        console.log('📍 Step 10: Hard refresh page');
                        await page.reload({ waitUntil: 'networkidle2' });
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        
                        console.log('📍 Step 11: Check if change persisted');
                        
                        // Check if the new value persists
                        const persistedValue = await page.evaluate((newVal) => {
                            const body = document.body;
                            const bodyText = body.textContent || '';
                            return bodyText.includes(newVal);
                        }, newValue);
                        
                        console.log('📍 Step 12: Take final screenshot');
                        await page.screenshot({ path: path.join(__dirname, 'calendar-final.png'), fullPage: true });
                        
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
                        console.log(success ? '✅ ALL TESTS PASSED - FIXES ARE WORKING!' : '❌ SOME TESTS FAILED');
                        
                        return { success, consoleMessages, pageErrors, persistedValue };
                        
                    } else {
                        console.log('❌ Could not find save button');
                        
                        // Look for any buttons
                        const allButtons = await page.evaluate(() => {
                            const buttons = document.querySelectorAll('button');
                            const buttonInfo = [];
                            for (let button of buttons) {
                                if (button.offsetParent !== null) {
                                    buttonInfo.push({
                                        text: button.textContent?.trim(),
                                        type: button.type,
                                        className: button.className
                                    });
                                }
                            }
                            return buttonInfo;
                        });
                        
                        console.log('📋 Available buttons:', allButtons);
                    }
                } else {
                    console.log('❌ Could not find booking number input field');
                    console.log('📋 Available form inputs:', formInputs);
                }
            } else {
                console.log('❌ Failed to click calendar entry');
            }
        } else {
            console.log('❌ No calendar entries found');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        await page.screenshot({ path: path.join(__dirname, 'calendar-error.png'), fullPage: true });
    } finally {
        await browser.close();
    }
}

runCalendarBookingTest().catch(console.error);