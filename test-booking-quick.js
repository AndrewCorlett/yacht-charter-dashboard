import puppeteer from 'puppeteer';
import fs from 'fs';

async function quickBookingTest() {
    let browser;
    let page;
    
    try {
        console.log('🚀 Starting quick booking test...');
        
        browser = await puppeteer.launch({ 
            headless: false, 
            slowMo: 150,
            defaultViewport: { width: 1400, height: 900 }
        });
        
        page = await browser.newPage();
        
        // Monitor network requests
        page.on('request', request => {
            if (request.url().includes('api') || request.method() === 'POST') {
                console.log(`📡 Request: ${request.method()} ${request.url()}`);
            }
        });

        page.on('response', response => {
            if (response.url().includes('api') || response.request().method() === 'POST') {
                console.log(`📨 Response: ${response.status()} ${response.url()}`);
            }
        });
        
        console.log('📄 Loading page...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('🎯 Filling form...');
        
        // Select yacht
        await page.select('#yacht', '50dba171-b830-4d88-9cb0-c14a37c4d58a');
        console.log('✅ Yacht selected: Calico Moon');
        
        // Fill customer details
        await page.type('#firstName', 'Jane');
        await page.type('#surname', 'Doe');
        await page.type('#email', 'jane.doe@example.com');
        await page.type('#phone', '+44 7987 654321');
        await page.type('#addressLine1', '456 Test Avenue');
        await page.type('#city', 'London');
        await page.type('#postcode', 'SW1A 1AA');
        console.log('✅ Customer details filled');
        
        // Handle dates properly
        console.log('📅 Setting dates...');
        await page.focus('#startDate');
        await page.keyboard.type('2025-08-01');
        
        await page.focus('#endDate');
        await page.keyboard.type('2025-08-07');
        console.log('✅ Dates set');
        
        // Take screenshot before submission
        await page.screenshot({ 
            path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots/quick-before-submit.png',
            fullPage: true 
        });
        
        console.log('🎯 Clicking submit button...');
        
        // Find the submit button and click it
        const submitButton = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
        await submitButton.click();
        
        console.log('⏳ Waiting for response...');
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // Take screenshot after submission
        await page.screenshot({ 
            path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots/quick-after-submit.png',
            fullPage: true 
        });
        
        // Check for success/error messages
        const pageContent = await page.content();
        
        const results = {
            submitted: true,
            hasValidationErrors: pageContent.includes('required') || pageContent.includes('Please fix'),
            hasSuccessModal: pageContent.includes('success') && (pageContent.includes('booking') || pageContent.includes('created')),
            pageHtml: pageContent.length
        };
        
        console.log('📊 Test Results:');
        console.log(`   ✅ Form Submitted: ${results.submitted}`);
        console.log(`   ❌ Has Validation Errors: ${results.hasValidationErrors}`);
        console.log(`   🎉 Has Success Modal: ${results.hasSuccessModal}`);
        
        // Try to find booking number in page content
        const bookingMatch = pageContent.match(/booking\s*(?:number|id|ref)[:\s]*([A-Za-z0-9-]+)/i);
        if (bookingMatch) {
            console.log(`   🎫 Booking Number: ${bookingMatch[1]}`);
        }
        
        return results;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (page) {
            await page.screenshot({ 
                path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/test-screenshots/quick-error.png',
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

// Run the test
quickBookingTest().then(results => {
    console.log('\n' + '='.repeat(50));
    console.log('QUICK BOOKING TEST COMPLETE');
    console.log('='.repeat(50));
    console.log(JSON.stringify(results, null, 2));
}).catch(console.error);