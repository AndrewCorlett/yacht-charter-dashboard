import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runFinalTest() {
    console.log('🚀 Starting Final Comprehensive Test...');
    
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Monitor console messages
    const consoleMessages = [];
    page.on('console', msg => {
        const message = `${msg.type().toUpperCase()}: ${msg.text()}`;
        consoleMessages.push(message);
        console.log('🔍 Console:', message);
    });
    
    // Monitor page errors
    const pageErrors = [];
    page.on('pageerror', error => {
        pageErrors.push(error.message);
        console.error('❌ Page Error:', error.message);
    });
    
    try {
        console.log('📍 Step 1: Navigate to localhost:5173');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
        
        // Wait for app to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('📍 Step 2: Navigate to bookings list');
        
        // First, check if we need to navigate to bookings section
        const hasBookingsTable = await page.$('table');
        
        if (!hasBookingsTable) {
            console.log('📍 No table found, checking for navigation to bookings');
            
            // Try to find and click on bookings navigation
            const bookingsNavigation = await page.$('a[href*="booking"]') || 
                                     await page.$('button:contains("Booking")') || 
                                     await page.$('nav a:contains("Booking")');
            
            if (bookingsNavigation) {
                await bookingsNavigation.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                console.log('📍 Looking for bookings in the current view...');
            }
        }
        
        console.log('📍 Step 3: Looking for booking with Customer1 Test1 and booking number 2528AL20');
        
        // Look for the booking in the table or other booking display
        let bookingElement = null;
        
        // Try to find table first
        try {
            await page.waitForSelector('table', { timeout: 5000 });
            bookingElement = 'table';
        } catch (e) {
            // If no table, look for other booking displays
            try {
                await page.waitForSelector('.booking-card, .booking-item, [data-testid*="booking"]', { timeout: 5000 });
                bookingElement = '.booking-card, .booking-item, [data-testid*="booking"]';
            } catch (e2) {
                console.log('📍 No standard booking display found, checking entire page content');
            }
        }
        
        // Find the booking row or card
        let bookingRow = { found: false };
        
        if (bookingElement === 'table') {
            bookingRow = await page.evaluate(() => {
                const rows = document.querySelectorAll('table tbody tr');
                for (let row of rows) {
                    const cells = row.querySelectorAll('td');
                    if (cells.length > 0) {
                        const customerCell = cells[0];
                        const bookingCell = cells[1];
                        
                        if (customerCell && bookingCell) {
                            const customerText = customerCell.textContent.trim();
                            const bookingText = bookingCell.textContent.trim();
                            
                            console.log('Checking row:', { customer: customerText, booking: bookingText });
                            
                            if (customerText.includes('Customer1 Test1') && bookingText.includes('2528AL20')) {
                                return { found: true, rowIndex: Array.from(rows).indexOf(row) };
                            }
                        }
                    }
                }
                return { found: false };
            });
        } else {
            // Look for booking in other formats (cards, divs, etc.)
            bookingRow = await page.evaluate(() => {
                const allElements = document.querySelectorAll('*');
                for (let element of allElements) {
                    const text = element.textContent || '';
                    if (text.includes('Customer1 Test1') && text.includes('2528AL20')) {
                        return { found: true, element: element };
                    }
                }
                return { found: false };
            });
        }
        
        if (!bookingRow.found) {
            console.log('⚠️  Could not find booking with Customer1 Test1 and 2528AL20');
            
            // List all bookings for debugging
            const allBookings = await page.evaluate(() => {
                const rows = document.querySelectorAll('table tbody tr');
                const bookings = [];
                for (let row of rows) {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 2) {
                        bookings.push({
                            customer: cells[0].textContent.trim(),
                            booking: cells[1].textContent.trim()
                        });
                    }
                }
                return bookings;
            });
            
            console.log('📋 All available bookings:', allBookings);
            
            // Try to find any booking with similar pattern
            const similarBooking = await page.evaluate(() => {
                const rows = document.querySelectorAll('table tbody tr');
                for (let row of rows) {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 2) {
                        const bookingText = cells[1].textContent.trim();
                        if (bookingText.includes('2528AL')) {
                            return { found: true, rowIndex: Array.from(rows).indexOf(row) };
                        }
                    }
                }
                return { found: false };
            });
            
            if (similarBooking.found) {
                console.log('📍 Found similar booking, using that instead');
                bookingRow.found = true;
                bookingRow.rowIndex = similarBooking.rowIndex;
            } else {
                throw new Error('No booking found with pattern 2528AL');
            }
        }
        
        console.log('📍 Step 3: Click on booking to open details');
        await page.click(`table tbody tr:nth-child(${bookingRow.rowIndex + 1})`);
        
        // Wait for booking details to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('📍 Step 4: Edit booking number from 20 to 10');
        
        // Find and edit the booking number field
        await page.waitForSelector('input[name="bookingNumber"], input[placeholder*="booking"], input[value*="2528AL"]', { timeout: 5000 });
        
        const bookingNumberField = await page.$('input[name="bookingNumber"]') || 
                                  await page.$('input[placeholder*="booking"]') || 
                                  await page.$('input[value*="2528AL"]');
        
        if (!bookingNumberField) {
            throw new Error('Could not find booking number input field');
        }
        
        // Clear and enter new value
        await bookingNumberField.click({ clickCount: 3 });
        await bookingNumberField.type('2528AL10');
        
        console.log('📍 Step 5: Click save');
        
        // Find save button
        const saveButton = await page.$('button[type="submit"]') || 
                          await page.$('button:contains("Save")') || 
                          await page.$('button:contains("Update")');
        
        if (!saveButton) {
            throw new Error('Could not find save button');
        }
        
        // Clear console messages before save
        consoleMessages.length = 0;
        pageErrors.length = 0;
        
        await saveButton.click();
        
        console.log('📍 Step 6: Monitor console for 3 seconds after save');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Take screenshot after save
        const screenshotPath1 = path.join(__dirname, 'test-screenshot-after-save.png');
        await page.screenshot({ path: screenshotPath1, fullPage: true });
        console.log('📸 Screenshot saved:', screenshotPath1);
        
        console.log('📍 Step 7: Hard refresh the page');
        await page.reload({ waitUntil: 'networkidle2' });
        
        // Wait for page to fully load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('📍 Step 8: Check if booking number shows 2528AL10 after refresh');
        
        // Find the booking again and check if it shows the updated number
        const updatedBooking = await page.evaluate(() => {
            const rows = document.querySelectorAll('table tbody tr');
            for (let row of rows) {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    const bookingText = cells[1].textContent.trim();
                    if (bookingText.includes('2528AL10')) {
                        return { found: true, bookingNumber: bookingText };
                    }
                }
            }
            return { found: false };
        });
        
        console.log('📍 Step 9: Take final screenshot');
        const screenshotPath2 = path.join(__dirname, 'test-screenshot-final.png');
        await page.screenshot({ path: screenshotPath2, fullPage: true });
        console.log('📸 Final screenshot saved:', screenshotPath2);
        
        // Generate test report
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
        if (updatedBooking.found) {
            console.log('✅ CONFIRMED - Booking number changed to 2528AL10');
            console.log(`   Updated booking number: ${updatedBooking.bookingNumber}`);
        } else {
            console.log('❌ FAILED - Booking number did not persist');
        }
        
        console.log('\n📸 Screenshots:');
        console.log(`   After save: ${screenshotPath1}`);
        console.log(`   Final state: ${screenshotPath2}`);
        
        console.log('\n🎯 OVERALL RESULT:');
        const success = pageErrors.length === 0 && updatedBooking.found;
        console.log(success ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
        
        return {
            success,
            consoleMessages,
            pageErrors,
            persistenceConfirmed: updatedBooking.found,
            screenshots: [screenshotPath1, screenshotPath2]
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        // Take error screenshot
        const errorScreenshotPath = path.join(__dirname, 'test-screenshot-error.png');
        await page.screenshot({ path: errorScreenshotPath, fullPage: true });
        console.log('📸 Error screenshot saved:', errorScreenshotPath);
        
        return {
            success: false,
            error: error.message,
            consoleMessages,
            pageErrors,
            screenshots: [errorScreenshotPath]
        };
    } finally {
        await browser.close();
    }
}

// Run the test
runFinalTest().then(result => {
    console.log('\n🏁 Test completed');
    if (result.success) {
        console.log('🎉 All fixes are working correctly!');
    } else {
        console.log('🔧 Further debugging may be needed');
    }
}).catch(error => {
    console.error('💥 Test runner failed:', error);
});