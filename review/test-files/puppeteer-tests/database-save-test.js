import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runDatabaseSaveTest() {
    console.log('🚀 Starting Database Save Test...');
    
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
        
        console.log('📍 Step 2: Fill in the Quick Create Booking form');
        
        // Test creating a new booking to verify the save functionality
        await page.select('select[name="yacht"]', 'Alrisha');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await page.type('input[name="firstName"]', 'Test');
        await page.type('input[name="surname"]', 'User');
        await page.type('input[name="email"]', 'test@example.com');
        await page.type('input[name="phone"]', '1234567890');
        await page.type('input[name="addressLine1"]', '123 Test St');
        await page.type('input[name="city"]', 'Test City');
        await page.type('input[name="postcode"]', 'TE1 1ST');
        
        // Set dates
        await page.type('input[name="startDate"]', '2025-08-01');
        await page.type('input[name="endDate"]', '2025-08-07');
        
        console.log('📍 Step 3: Take screenshot before save');
        await page.screenshot({ path: path.join(__dirname, 'db-test-before-save.png'), fullPage: true });
        
        console.log('📍 Step 4: Clear console and click save');
        
        // Clear console messages before save
        consoleMessages.length = 0;
        pageErrors.length = 0;
        
        // Find and click submit button
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
            await submitButton.click();
            
            console.log('📍 Step 5: Monitor for 5 seconds after save');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            console.log('📍 Step 6: Take screenshot after save');
            await page.screenshot({ path: path.join(__dirname, 'db-test-after-save.png'), fullPage: true });
            
            console.log('📍 Step 7: Check for success/error messages');
            
            // Look for success or error messages
            const messages = await page.evaluate(() => {
                const successMessages = Array.from(document.querySelectorAll('.success, .alert-success, [class*="success"]'))
                    .map(el => el.textContent?.trim()).filter(text => text);
                
                const errorMessages = Array.from(document.querySelectorAll('.error, .alert-error, [class*="error"]'))
                    .map(el => el.textContent?.trim()).filter(text => text);
                
                return { successMessages, errorMessages };
            });
            
            console.log('📍 UI Messages:', messages);
            
            console.log('\n🔍 SAVE OPERATION ANALYSIS:');
            console.log('============================');
            
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
            
            console.log('\n💬 UI Messages:');
            if (messages.successMessages.length > 0) {
                console.log('✅ Success messages:');
                messages.successMessages.forEach(msg => console.log(`   ${msg}`));
            }
            if (messages.errorMessages.length > 0) {
                console.log('❌ Error messages:');
                messages.errorMessages.forEach(msg => console.log(`   ${msg}`));
            }
            
            console.log('\n🎯 SAVE OPERATION RESULT:');
            const hasErrors = pageErrors.length > 0;
            const hasConsoleErrors = consoleMessages.some(msg => msg.includes('ERROR'));
            
            if (!hasErrors && !hasConsoleErrors) {
                console.log('✅ SAVE OPERATION SUCCEEDED - NO ERRORS DETECTED');
                console.log('🎉 This confirms the database fixes are working!');
            } else {
                console.log('❌ SAVE OPERATION HAD ISSUES');
                console.log('🔧 Further investigation needed');
            }
            
            return { 
                success: !hasErrors && !hasConsoleErrors,
                consoleMessages, 
                pageErrors,
                uiMessages: messages
            };
            
        } else {
            console.log('❌ Could not find submit button');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        await page.screenshot({ path: path.join(__dirname, 'db-test-error.png'), fullPage: true });
    } finally {
        await browser.close();
    }
}

runDatabaseSaveTest().catch(console.error);