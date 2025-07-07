// Test browser console to check for errors
import puppeteer from 'puppeteer';

async function testBrowserConsole() {
    console.log('Starting browser console test...');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', msg => {
        console.log('BROWSER CONSOLE:', msg.type(), msg.text());
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
        console.error('PAGE ERROR:', error);
    });
    
    // Listen for request failures
    page.on('requestfailed', request => {
        console.error('REQUEST FAILED:', request.url(), request.failure().errorText);
    });
    
    try {
        // Navigate to the application
        console.log('Navigating to localhost:5173...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
        
        // Wait for the page to load
        await page.waitForSelector('body', { timeout: 10000 });
        
        console.log('Page loaded successfully');
        
        // Check if form elements exist
        const formElements = await page.evaluate(() => {
            const yacht = document.querySelector('select[name="yacht"]');
            const firstName = document.querySelector('input[name="firstName"]');
            const surname = document.querySelector('input[name="surname"]');
            const email = document.querySelector('input[name="email"]');
            const phone = document.querySelector('input[name="phone"]');
            const address = document.querySelector('input[name="addressLine1"]');
            const city = document.querySelector('input[name="city"]');
            const postcode = document.querySelector('input[name="postcode"]');
            const startDate = document.querySelector('input[name="startDate"]');
            const endDate = document.querySelector('input[name="endDate"]');
            const quickCreateBtn = document.querySelector('button');
            
            return {
                yacht: yacht ? 'found' : 'not found',
                firstName: firstName ? 'found' : 'not found',
                surname: surname ? 'found' : 'not found',
                email: email ? 'found' : 'not found',
                phone: phone ? 'found' : 'not found',
                address: address ? 'found' : 'not found',
                city: city ? 'found' : 'not found',
                postcode: postcode ? 'found' : 'not found',
                startDate: startDate ? 'found' : 'not found',
                endDate: endDate ? 'found' : 'not found',
                quickCreateBtn: quickCreateBtn ? 'found' : 'not found'
            };
        });
        
        console.log('Form elements check:', formElements);
        
        // Try to manually fill one field to test
        console.log('Attempting to fill first name field...');
        await page.evaluate(() => {
            const firstNameInput = document.querySelector('input[name="firstName"]');
            if (firstNameInput) {
                firstNameInput.value = 'Jane';
                firstNameInput.dispatchEvent(new Event('input', { bubbles: true }));
                firstNameInput.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('First name filled with:', firstNameInput.value);
            }
        });
        
        // Wait and check if the value was set
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const firstNameValue = await page.evaluate(() => {
            const firstNameInput = document.querySelector('input[name="firstName"]');
            return firstNameInput ? firstNameInput.value : 'not found';
        });
        
        console.log('First name value after setting:', firstNameValue);
        
        // Keep browser open for manual testing
        console.log('Browser will stay open for manual testing for 60 seconds...');
        console.log('You can manually test the form now.');
        await new Promise(resolve => setTimeout(resolve, 60000));
        
    } catch (error) {
        console.error('Error during test:', error);
    } finally {
        await browser.close();
    }
}

testBrowserConsole().catch(console.error);