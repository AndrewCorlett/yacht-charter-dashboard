#!/usr/bin/env node

/**
 * Calendar Alignment Verification Script
 * 
 * Purpose: Verify that the yacht timeline calendar alignment fix is working correctly
 * 
 * This script will:
 * 1. Launch the dashboard
 * 2. Take screenshots of the calendar
 * 3. Analyze the header row alignment
 * 4. Verify yacht names are in proper vertical columns
 * 5. Confirm the grid structure is consistent
 * 6. Compare against the known misalignment patterns
 * 
 * Expected Result:
 * - Date column should be first (leftmost)
 * - Each yacht name should be in its own vertical column header
 * - No yacht names should appear in the date column
 * - Grid should be properly aligned
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const DASHBOARD_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = './screenshots/calendar-verification';
const VERIFICATION_REPORT_FILE = './calendar-verification-report.json';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyCalendarAlignment() {
    console.log('🔍 Starting Calendar Alignment Verification...');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1400, height: 900 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const report = {
        timestamp: new Date().toISOString(),
        testResults: [],
        screenshots: [],
        overallStatus: 'UNKNOWN',
        issues: [],
        recommendations: []
    };

    try {
        console.log('📱 Navigating to dashboard...');
        await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Wait for the calendar to load
        console.log('⏳ Waiting for calendar to load...');
        await page.waitForSelector('[data-testid="yacht-calendar"]', { timeout: 15000 });
        await page.waitForSelector('[data-testid="yacht-headers"]', { timeout: 15000 });
        
        // Take initial screenshot
        const initialScreenshot = path.join(SCREENSHOT_DIR, `initial-calendar-${new Date().toISOString().replace(/:/g, '-')}.png`);
        await page.screenshot({ path: initialScreenshot, fullPage: true });
        report.screenshots.push({ type: 'initial', path: initialScreenshot });
        console.log('📸 Initial screenshot taken');

        // Test 1: Verify Calendar Structure
        console.log('🧪 Test 1: Verifying calendar structure...');
        const calendarExists = await page.$('[data-testid="yacht-calendar"]');
        const headersExist = await page.$('[data-testid="yacht-headers"]');
        
        report.testResults.push({
            test: 'Calendar Structure',
            passed: !!(calendarExists && headersExist),
            details: {
                calendarExists: !!calendarExists,
                headersExist: !!headersExist
            }
        });

        // Test 2: Analyze Header Row Structure
        console.log('🧪 Test 2: Analyzing header row structure...');
        const headerAnalysis = await page.evaluate(() => {
            const headersContainer = document.querySelector('[data-testid="yacht-headers"]');
            if (!headersContainer) return { error: 'Headers container not found' };
            
            const gridContainer = headersContainer.querySelector('div[style*="grid-template-columns"]');
            if (!gridContainer) return { error: 'Grid container not found' };
            
            const cells = Array.from(gridContainer.children);
            const headerInfo = cells.map((cell, index) => ({
                index,
                text: cell.textContent.trim(),
                isFirstColumn: index === 0,
                hasDateText: cell.textContent.trim().toLowerCase() === 'date',
                isYachtName: cell.textContent.trim() !== 'Date' && cell.textContent.trim() !== ''
            }));
            
            return {
                totalColumns: cells.length,
                headers: headerInfo,
                firstColumnText: cells[0]?.textContent.trim(),
                gridStyle: gridContainer.getAttribute('style')
            };
        });

        report.testResults.push({
            test: 'Header Row Analysis',
            passed: headerAnalysis.firstColumnText === 'Date' && !headerAnalysis.error,
            details: headerAnalysis
        });

        // Test 3: Check for Yacht Names in Date Column
        console.log('🧪 Test 3: Checking for yacht names in date column...');
        const dateColumnAnalysis = await page.evaluate(() => {
            const scrollArea = document.getElementById('calendar-scroll-area');
            if (!scrollArea) return { error: 'Scroll area not found' };
            
            const gridContainer = scrollArea.querySelector('div[style*="grid-template-columns"]');
            if (!gridContainer) return { error: 'Grid container not found' };
            
            const allCells = Array.from(gridContainer.children);
            const dateColumnCells = [];
            
            // Analyze the grid structure to find date column cells
            const gridStyle = gridContainer.getAttribute('style');
            const columnsMatch = gridStyle.match(/grid-template-columns:\s*auto\s+repeat\((\d+),\s*1fr\)/);
            const yachtColumns = columnsMatch ? parseInt(columnsMatch[1]) : 6;
            const totalColumns = yachtColumns + 1; // +1 for date column
            
            // Get every nth cell starting from index 0 (date column)
            for (let i = 0; i < allCells.length; i += totalColumns) {
                const cell = allCells[i];
                if (cell) {
                    dateColumnCells.push({
                        index: i,
                        text: cell.textContent.trim(),
                        isDateFormat: /^\d{1,2}\/\d{1,2}|\w{3}\s+\d{1,2}/.test(cell.textContent.trim())
                    });
                }
            }
            
            const yachtNamesInDateColumn = dateColumnCells.filter(cell => 
                !cell.isDateFormat && 
                cell.text !== '' && 
                cell.text !== 'Date' &&
                !cell.text.match(/^\d+$/) // Not just numbers
            );
            
            return {
                totalDateCells: dateColumnCells.length,
                dateColumnCells: dateColumnCells.slice(0, 10), // First 10 for analysis
                yachtNamesInDateColumn,
                hasYachtNamesInDateColumn: yachtNamesInDateColumn.length > 0,
                gridColumns: totalColumns
            };
        });

        report.testResults.push({
            test: 'Date Column Purity',
            passed: !dateColumnAnalysis.hasYachtNamesInDateColumn && !dateColumnAnalysis.error,
            details: dateColumnAnalysis
        });

        // Test 4: Verify Yacht Column Alignment
        console.log('🧪 Test 4: Verifying yacht column alignment...');
        const yachtColumnAnalysis = await page.evaluate(() => {
            const headersContainer = document.querySelector('[data-testid="yacht-headers"]');
            const scrollArea = document.getElementById('calendar-scroll-area');
            
            if (!headersContainer || !scrollArea) return { error: 'Required containers not found' };
            
            const headerGrid = headersContainer.querySelector('div[style*="grid-template-columns"]');
            const contentGrid = scrollArea.querySelector('div[style*="grid-template-columns"]');
            
            if (!headerGrid || !contentGrid) return { error: 'Grid containers not found' };
            
            const headerCells = Array.from(headerGrid.children);
            const yachtHeaders = headerCells.slice(1); // Skip the "Date" header
            
            const yachtNames = yachtHeaders.map(cell => cell.textContent.trim());
            
            // Check if yacht names are typical yacht names (not dates or empty)
            const validYachtNames = yachtNames.filter(name => 
                name !== '' && 
                !name.match(/^\d+$/) && 
                name !== 'Date' &&
                name.length > 2
            );
            
            return {
                totalYachtHeaders: yachtHeaders.length,
                yachtNames,
                validYachtNames,
                hasValidYachtNames: validYachtNames.length > 0,
                headerGridStyle: headerGrid.getAttribute('style'),
                contentGridStyle: contentGrid.getAttribute('style'),
                gridsMatch: headerGrid.getAttribute('style') === contentGrid.getAttribute('style')
            };
        });

        report.testResults.push({
            test: 'Yacht Column Alignment',
            passed: yachtColumnAnalysis.hasValidYachtNames && yachtColumnAnalysis.gridsMatch && !yachtColumnAnalysis.error,
            details: yachtColumnAnalysis
        });

        // Test 5: Check for Diagonal Misalignment Patterns
        console.log('🧪 Test 5: Checking for diagonal misalignment patterns...');
        const diagonalCheck = await page.evaluate(() => {
            const scrollArea = document.getElementById('calendar-scroll-area');
            if (!scrollArea) return { error: 'Scroll area not found' };
            
            const gridContainer = scrollArea.querySelector('div[style*="grid-template-columns"]');
            if (!gridContainer) return { error: 'Grid container not found' };
            
            const allCells = Array.from(gridContainer.children);
            const suspiciousPatterns = [];
            
            // Look for yacht names in unexpected positions
            const knownYachtNames = ['Calico Moon', 'Spectre', 'Alrisha', 'Disk Drive', 'Zavaria', 'Mridula Sarwar'];
            
            allCells.forEach((cell, index) => {
                const text = cell.textContent.trim();
                if (knownYachtNames.some(yacht => text.includes(yacht))) {
                    const position = {
                        index,
                        text,
                        isInDateColumn: index % 7 === 0, // Assuming 7 columns (1 date + 6 yachts)
                        isInYachtColumn: index % 7 !== 0
                    };
                    suspiciousPatterns.push(position);
                }
            });
            
            return {
                suspiciousPatterns,
                hasDiagonalMisalignment: suspiciousPatterns.some(p => p.isInDateColumn),
                totalCellsChecked: allCells.length
            };
        });

        report.testResults.push({
            test: 'Diagonal Misalignment Check',
            passed: !diagonalCheck.hasDiagonalMisalignment && !diagonalCheck.error,
            details: diagonalCheck
        });

        // Take final verification screenshot
        const finalScreenshot = path.join(SCREENSHOT_DIR, `final-verification-${new Date().toISOString().replace(/:/g, '-')}.png`);
        await page.screenshot({ path: finalScreenshot, fullPage: true });
        report.screenshots.push({ type: 'final', path: finalScreenshot });
        console.log('📸 Final verification screenshot taken');

        // Determine overall status
        const allTestsPassed = report.testResults.every(test => test.passed);
        report.overallStatus = allTestsPassed ? 'PASSED' : 'FAILED';

        // Generate recommendations
        if (!allTestsPassed) {
            const failedTests = report.testResults.filter(test => !test.passed);
            failedTests.forEach(test => {
                switch (test.test) {
                    case 'Calendar Structure':
                        report.issues.push('Calendar structure is not properly loaded');
                        report.recommendations.push('Check if the React components are rendering correctly');
                        break;
                    case 'Header Row Analysis':
                        report.issues.push('Header row structure is incorrect');
                        report.recommendations.push('Verify the grid template columns in YachtTimelineCalendar.jsx');
                        break;
                    case 'Date Column Purity':
                        report.issues.push('Yacht names found in date column - diagonal misalignment detected');
                        report.recommendations.push('Fix the grid column mapping in the calendar component');
                        break;
                    case 'Yacht Column Alignment':
                        report.issues.push('Yacht columns are not properly aligned');
                        report.recommendations.push('Check the grid template columns consistency between header and content');
                        break;
                    case 'Diagonal Misalignment Check':
                        report.issues.push('Diagonal misalignment pattern detected');
                        report.recommendations.push('Review the calendar cell rendering logic');
                        break;
                }
            });
        } else {
            report.recommendations.push('Calendar alignment is working correctly');
        }

    } catch (error) {
        console.error('❌ Error during verification:', error);
        report.overallStatus = 'ERROR';
        report.issues.push(`Verification error: ${error.message}`);
        
        // Take error screenshot
        try {
            const errorScreenshot = path.join(SCREENSHOT_DIR, `error-${new Date().toISOString().replace(/:/g, '-')}.png`);
            await page.screenshot({ path: errorScreenshot, fullPage: true });
            report.screenshots.push({ type: 'error', path: errorScreenshot });
        } catch (screenshotError) {
            console.error('Failed to take error screenshot:', screenshotError);
        }
    } finally {
        await browser.close();
    }

    // Save report
    fs.writeFileSync(VERIFICATION_REPORT_FILE, JSON.stringify(report, null, 2));
    
    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('📊 CALENDAR ALIGNMENT VERIFICATION REPORT');
    console.log('='.repeat(60));
    console.log(`Overall Status: ${report.overallStatus}`);
    console.log(`Timestamp: ${report.timestamp}`);
    console.log('\nTest Results:');
    
    report.testResults.forEach(test => {
        const status = test.passed ? '✅ PASSED' : '❌ FAILED';
        console.log(`  ${status} - ${test.test}`);
    });
    
    if (report.issues.length > 0) {
        console.log('\n🚨 Issues Found:');
        report.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
    
    console.log('\n📸 Screenshots:');
    report.screenshots.forEach(screenshot => {
        console.log(`  ${screenshot.type}: ${screenshot.path}`);
    });
    
    console.log(`\n📋 Full report saved to: ${VERIFICATION_REPORT_FILE}`);
    console.log('='.repeat(60));
    
    return report;
}

// Run the verification
if (require.main === module) {
    verifyCalendarAlignment().catch(console.error);
}

module.exports = { verifyCalendarAlignment };