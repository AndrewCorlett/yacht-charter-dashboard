import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runManualTestGuide() {
    console.log('🚀 Starting Manual Test Guide...');
    
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
        await page.screenshot({ path: path.join(__dirname, 'manual-step1-initial.png'), fullPage: true });
        
        console.log('\n🔍 MANUAL TEST INSTRUCTIONS:');
        console.log('=============================');
        console.log('1. Look at the browser window that opened');
        console.log('2. Find any booking with "Customer1 Test1" or a booking number like "2528AL20"');
        console.log('3. Click on it to open the booking details');
        console.log('4. Edit the booking number (change last 2 digits from 20 to 10)');
        console.log('5. Click save');
        console.log('6. Check the browser console for any errors');
        console.log('7. Refresh the page and check if the change persisted');
        console.log('');
        console.log('🔍 CONSOLE MONITORING:');
        console.log('This script will monitor console messages and errors...');
        console.log('Press Ctrl+C when you want to stop monitoring');
        
        // Keep the browser open and monitor console
        let monitoring = true;
        
        // Handle Ctrl+C
        process.on('SIGINT', () => {
            console.log('\n📍 Stopping monitoring...');
            monitoring = false;
        });
        
        // Monitor for 5 minutes or until Ctrl+C
        let monitoringTime = 0;
        const maxMonitoringTime = 300000; // 5 minutes
        
        while (monitoring && monitoringTime < maxMonitoringTime) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            monitoringTime += 1000;
            
            // Every 10 seconds, check if there are new console messages
            if (monitoringTime % 10000 === 0) {
                const minutes = Math.floor(monitoringTime / 60000);
                const seconds = Math.floor((monitoringTime % 60000) / 1000);
                console.log(`⏱️  Monitoring for ${minutes}m ${seconds}s... (${consoleMessages.length} messages, ${pageErrors.length} errors)`);
            }
        }
        
        console.log('\n📍 Step 3: Take final screenshot');
        await page.screenshot({ path: path.join(__dirname, 'manual-step2-final.png'), fullPage: true });
        
        console.log('\n🔍 FINAL CONSOLE REPORT:');
        console.log('=========================');
        
        console.log('\n📊 All Console Messages:');
        if (consoleMessages.length === 0) {
            console.log('✅ No console messages recorded');
        } else {
            consoleMessages.forEach((msg, i) => console.log(`   ${i + 1}. ${msg}`));
        }
        
        console.log('\n❌ All Page Errors:');
        if (pageErrors.length === 0) {
            console.log('✅ No page errors recorded');
        } else {
            pageErrors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
        }
        
        console.log('\n🎯 MONITORING RESULT:');
        console.log(pageErrors.length === 0 ? '✅ NO ERRORS DETECTED' : '❌ ERRORS DETECTED');
        
        console.log('\n📸 Screenshots saved:');
        console.log('   Initial: manual-step1-initial.png');
        console.log('   Final: manual-step2-final.png');
        
        return { consoleMessages, pageErrors };
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        await page.screenshot({ path: path.join(__dirname, 'manual-error.png'), fullPage: true });
    } finally {
        await browser.close();
    }
}

runManualTestGuide().catch(console.error);