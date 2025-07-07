import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runUpcomingChartersTest() {
    console.log('🚀 Starting Upcoming Charters Test...');
    
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
        
        console.log('📍 Step 2: Look for UPCOMING CHARTERS section');
        
        // Find the upcoming charters cards
        const charterCards = await page.evaluate(() => {
            const cards = [];
            const allElements = document.querySelectorAll('*');
            
            for (let element of allElements) {
                const text = element.textContent?.trim();
                if (text && text.includes('Spectre') && text.includes('TestName')) {
                    cards.push({
                        element: element,
                        text: text.substring(0, 100),
                        className: element.className,
                        tagName: element.tagName,
                        hasClick: element.onclick !== null,
                        position: element.getBoundingClientRect()
                    });
                }
            }
            
            return cards;
        });
        
        console.log('📋 Found charter cards:', charterCards.length);
        
        if (charterCards.length > 0) {
            console.log('📍 Step 3: Click on Spectre charter card');
            
            // Click on the charter card
            const clicked = await page.evaluate(() => {
                const allElements = document.querySelectorAll('*');
                for (let element of allElements) {
                    const text = element.textContent?.trim();
                    if (text && text.includes('Spectre') && text.includes('TestName')) {
                        // Find the clickable parent (likely a card container)
                        let clickableParent = element;
                        while (clickableParent && clickableParent !== document.body) {
                            if (clickableParent.classList.contains('card') || 
                                clickableParent.classList.contains('charter') ||
                                clickableParent.classList.contains('booking') ||
                                clickableParent.style.cursor === 'pointer' ||
                                clickableParent.onclick) {
                                clickableParent.click();
                                return { success: true, element: clickableParent.className };
                            }
                            clickableParent = clickableParent.parentElement;
                        }
                        
                        // If no clickable parent found, click the element itself
                        element.click();
                        return { success: true, element: element.className };
                    }
                }
                return { success: false };
            });
            
            console.log('📍 Click result:', clicked);
            
            if (clicked.success) {
                console.log('📍 Step 4: Wait for booking details to load');
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Take screenshot after clicking
                await page.screenshot({ path: path.join(__dirname, 'charter-after-click.png'), fullPage: true });
                
                console.log('📍 Step 5: Look for booking panel or edit form');
                
                // Check if booking panel opened
                const bookingPanel = await page.evaluate(() => {
                    // Look for booking panel
                    const panel = document.querySelector('.booking-panel, .charter-panel, .edit-panel, [data-testid*="booking-panel"]');
                    if (panel) {
                        return { found: true, className: panel.className };
                    }
                    
                    // Look for any modal or overlay that might contain booking details
                    const modal = document.querySelector('.modal, .overlay, .dialog, [role="dialog"]');
                    if (modal) {
                        return { found: true, className: modal.className, type: 'modal' };
                    }
                    
                    return { found: false };
                });
                
                console.log('📍 Booking panel check:', bookingPanel);
                
                if (bookingPanel.found) {
                    console.log('✅ Booking panel found, looking for input fields');
                    
                    // Look for input fields in the booking panel
                    const panelInputs = await page.evaluate(() => {
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
                    
                    console.log('📋 Found panel inputs:', panelInputs);
                    
                    // Look for booking number field
                    const bookingNumberField = panelInputs.find(field => 
                        field.name?.toLowerCase().includes('booking') ||
                        field.name?.toLowerCase().includes('number') ||
                        field.placeholder?.toLowerCase().includes('booking') ||
                        field.id?.toLowerCase().includes('booking') ||
                        field.value?.match(/\d{4}AL\d{2}/)
                    );
                    
                    if (bookingNumberField) {
                        console.log('✅ Found booking number field in panel:', bookingNumberField);
                        
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
                            await new Promise(resolve => setTimeout(resolve, 5000));
                            
                            console.log('📍 Step 9: Take screenshot after save');
                            await page.screenshot({ path: path.join(__dirname, 'charter-after-save.png'), fullPage: true });
                            
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
                            await page.screenshot({ path: path.join(__dirname, 'charter-final.png'), fullPage: true });
                            
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
                            
                            // Look for any buttons in the panel
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
                        console.log('❌ Could not find booking number input field in panel');
                        console.log('📋 Available panel inputs:', panelInputs);
                    }
                } else {
                    console.log('❌ No booking panel found after click');
                    
                    // Check if we're in a different view
                    const currentView = await page.evaluate(() => {
                        const title = document.title;
                        const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim());
                        return { title, headings };
                    });
                    
                    console.log('📋 Current view:', currentView);
                }
            } else {
                console.log('❌ Failed to click charter card');
            }
        } else {
            console.log('❌ No charter cards found');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        await page.screenshot({ path: path.join(__dirname, 'charter-error.png'), fullPage: true });
    } finally {
        await browser.close();
    }
}

runUpcomingChartersTest().catch(console.error);