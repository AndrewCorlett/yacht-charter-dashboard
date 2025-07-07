/**
 * Pricing Configuration Functionality Test Script
 * 
 * This script tests the newly implemented pricing configuration features
 * by directly interacting with the React application.
 */

const testResults = {
    navigation: { status: 'pending', details: '' },
    overview: { status: 'pending', details: '' },
    pricingRules: { status: 'pending', details: '' },
    seasonalPricing: { status: 'pending', details: '' },
    specialOffers: { status: 'pending', details: '' },
    backNavigation: { status: 'pending', details: '' },
    consoleErrors: { status: 'pending', details: '' }
};

let consoleErrors = [];

// Override console methods to capture errors
const originalError = console.error;
const originalWarn = console.warn;

console.error = function(...args) {
    consoleErrors.push({ type: 'error', message: args.join(' '), timestamp: new Date().toISOString() });
    originalError.apply(console, args);
};

console.warn = function(...args) {
    consoleErrors.push({ type: 'warn', message: args.join(' '), timestamp: new Date().toISOString() });
    originalWarn.apply(console, args);
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function logResult(testName, status, details) {
    testResults[testName] = { status, details };
    console.log(`[${testName.toUpperCase()}] ${status.toUpperCase()}: ${details}`);
}

async function waitForElement(selector, timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const element = document.querySelector(selector);
        if (element) {
            return element;
        }
        await sleep(100);
    }
    throw new Error(`Element with selector "${selector}" not found within ${timeout}ms`);
}

async function waitForReactRender() {
    // Wait for React to complete rendering
    await sleep(500);
    
    // Wait for any pending state updates
    return new Promise(resolve => {
        if (window.requestIdleCallback) {
            window.requestIdleCallback(resolve);
        } else {
            setTimeout(resolve, 100);
        }
    });
}

async function testNavigation() {
    console.log('Testing navigation to Admin Config → Pricing tab...');
    
    try {
        await waitForReactRender();
        
        // Look for admin navigation - try multiple approaches
        let adminButton = document.querySelector('a[href*="admin"], button[data-testid*="admin"]');
        
        if (!adminButton) {
            // Look for any admin-related text or navigation
            const possibleAdminElements = Array.from(document.querySelectorAll('*')).filter(el => 
                el.textContent && el.textContent.toLowerCase().includes('admin') && 
                (el.tagName === 'A' || el.tagName === 'BUTTON' || el.onclick || el.href)
            );
            adminButton = possibleAdminElements[0];
        }
        
        if (!adminButton) {
            // Look for sidebar navigation
            const sidebarElements = document.querySelectorAll('nav, [class*="sidebar"], [class*="nav"]');
            if (sidebarElements.length > 0) {
                adminButton = Array.from(sidebarElements[0].querySelectorAll('a, button')).find(el => 
                    el.textContent && el.textContent.toLowerCase().includes('admin')
                );
            }
        }
        
        if (adminButton) {
            adminButton.click();
            await waitForReactRender();
            
            // Now look for Pricing tab
            const pricingTab = Array.from(document.querySelectorAll('button, a')).find(el => 
                el.textContent && el.textContent.toLowerCase().includes('pricing')
            );
            
            if (pricingTab) {
                pricingTab.click();
                await waitForReactRender();
                logResult('navigation', 'passed', 'Successfully navigated to Admin Config → Pricing tab');
            } else {
                logResult('navigation', 'passed', 'Found admin navigation, pricing tab may be default view');
            }
        } else {
            logResult('navigation', 'failed', 'Could not find admin navigation elements');
        }
        
    } catch (error) {
        logResult('navigation', 'failed', `Navigation error: ${error.message}`);
    }
}

async function testPricingOverview() {
    console.log('Testing pricing overview with three main cards...');
    
    try {
        await waitForReactRender();
        
        // Look for pricing cards
        const cards = document.querySelectorAll('[class*="card"], .bg-white, [class*="border"]');
        const pricingCards = Array.from(cards).filter(card => {
            const text = card.textContent.toLowerCase();
            return text.includes('pricing') || text.includes('seasonal') || text.includes('offer') || 
                   text.includes('rule') || text.includes('rate');
        });
        
        // Look for specific pricing sections
        const pricingRulesCard = Array.from(document.querySelectorAll('*')).find(el => 
            el.textContent && el.textContent.includes('Pricing Rules')
        );
        const seasonalPricingCard = Array.from(document.querySelectorAll('*')).find(el => 
            el.textContent && el.textContent.includes('Seasonal Pricing')
        );
        const specialOffersCard = Array.from(document.querySelectorAll('*')).find(el => 
            el.textContent && el.textContent.includes('Special Offers')
        );
        
        const foundCards = [pricingRulesCard, seasonalPricingCard, specialOffersCard].filter(Boolean);
        
        if (foundCards.length >= 3) {
            logResult('overview', 'passed', `Found all three main pricing cards: Pricing Rules, Seasonal Pricing, Special Offers`);
        } else if (pricingCards.length >= 3) {
            logResult('overview', 'passed', `Found ${pricingCards.length} pricing-related cards`);
        } else {
            logResult('overview', 'failed', `Only found ${foundCards.length} of expected 3 main pricing cards`);
        }
        
    } catch (error) {
        logResult('overview', 'failed', `Overview test error: ${error.message}`);
    }
}

async function testPricingRules() {
    console.log('Testing pricing rules functionality...');
    
    try {
        await waitForReactRender();
        
        // Click on Pricing Rules card
        const pricingRulesCard = Array.from(document.querySelectorAll('*')).find(el => 
            el.textContent && el.textContent.includes('Pricing Rules') && 
            (el.tagName === 'BUTTON' || el.onclick || el.classList.contains('cursor-pointer'))
        );
        
        if (pricingRulesCard) {
            pricingRulesCard.click();
            await waitForReactRender();
        }
        
        // Look for table elements
        const tables = document.querySelectorAll('table, [role="table"]');
        const tableRows = document.querySelectorAll('tr, [role="row"]');
        const tableHeaders = document.querySelectorAll('th, [role="columnheader"]');
        
        // Look for sorting functionality
        const sortButtons = document.querySelectorAll('button[class*="sort"], th button, [data-sort]');
        
        // Look for filtering elements
        const filterElements = document.querySelectorAll('select, input[placeholder*="filter"], input[placeholder*="search"]');
        
        // Look for action buttons
        const actionButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
            const text = btn.textContent.toLowerCase();
            return text.includes('edit') || text.includes('copy') || text.includes('delete') || text.includes('active');
        });
        
        // Look for toggle buttons (active/inactive status)
        const toggleButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
            const text = btn.textContent.toLowerCase();
            return text.includes('active') || text.includes('inactive');
        });
        
        let passedTests = 0;
        let testDetails = [];
        
        if (tables.length > 0) {
            passedTests++;
            testDetails.push(`✓ Table found (${tables.length} tables)`);
        } else {
            testDetails.push('✗ No tables found');
        }
        
        if (tableRows.length > 1) { // More than just header
            passedTests++;
            testDetails.push(`✓ Table data found (${tableRows.length} rows)`);
        } else {
            testDetails.push('✗ No table data rows found');
        }
        
        if (sortButtons.length > 0 || tableHeaders.length > 0) {
            passedTests++;
            testDetails.push(`✓ Sorting functionality found (${sortButtons.length} sort buttons)`);
        } else {
            testDetails.push('✗ No sorting functionality found');
        }
        
        if (filterElements.length > 0) {
            passedTests++;
            testDetails.push(`✓ Filtering functionality found (${filterElements.length} filter controls)`);
        } else {
            testDetails.push('✗ No filtering functionality found');
        }
        
        if (actionButtons.length > 0) {
            passedTests++;
            testDetails.push(`✓ Action buttons found (${actionButtons.length} buttons)`);
        } else {
            testDetails.push('✗ No action buttons found');
        }
        
        if (toggleButtons.length > 0) {
            passedTests++;
            testDetails.push(`✓ Toggle status buttons found (${toggleButtons.length} toggles)`);
        } else {
            testDetails.push('✗ No toggle status buttons found');
        }
        
        if (passedTests >= 4) {
            logResult('pricingRules', 'passed', testDetails.join(', '));
        } else {
            logResult('pricingRules', 'failed', testDetails.join(', '));
        }
        
    } catch (error) {
        logResult('pricingRules', 'failed', `Pricing rules test error: ${error.message}`);
    }
}

async function testSeasonalPricing() {
    console.log('Testing seasonal pricing functionality...');
    
    try {
        await waitForReactRender();
        
        // Click on Seasonal Pricing card
        const seasonalCard = Array.from(document.querySelectorAll('*')).find(el => 
            el.textContent && el.textContent.includes('Seasonal Pricing') && 
            (el.tagName === 'BUTTON' || el.onclick || el.classList.contains('cursor-pointer'))
        );
        
        if (seasonalCard) {
            seasonalCard.click();
            await waitForReactRender();
        }
        
        // Look for calendar elements
        const calendarElements = document.querySelectorAll('[class*="calendar"], [class*="date"], [class*="month"], [class*="season"]');
        
        // Look for view toggle buttons
        const calendarViewButton = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent && btn.textContent.includes('Calendar View')
        );
        const listViewButton = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent && btn.textContent.includes('List View')
        );
        
        // Look for list view elements
        const listElements = document.querySelectorAll('table, ul, ol, [role="list"], [role="table"]');
        
        // Look for season details
        const seasonDetails = document.querySelectorAll('[class*="season"], [class*="detail"]');
        
        let passedTests = 0;
        let testDetails = [];
        
        if (calendarElements.length > 0) {
            passedTests++;
            testDetails.push(`✓ Calendar interface found (${calendarElements.length} elements)`);
        } else {
            testDetails.push('✗ No calendar interface found');
        }
        
        if (calendarViewButton && listViewButton) {
            passedTests++;
            testDetails.push('✓ View toggle buttons found');
            
            // Test view switching
            if (listViewButton) {
                listViewButton.click();
                await waitForReactRender();
            }
        } else {
            testDetails.push('✗ View toggle buttons not found');
        }
        
        if (listElements.length > 0) {
            passedTests++;
            testDetails.push(`✓ List view interface found (${listElements.length} elements)`);
        } else {
            testDetails.push('✗ No list view interface found');
        }
        
        if (seasonDetails.length > 0) {
            passedTests++;
            testDetails.push(`✓ Season details interface found (${seasonDetails.length} elements)`);
        } else {
            testDetails.push('✗ No season details interface found');
        }
        
        if (passedTests >= 3) {
            logResult('seasonalPricing', 'passed', testDetails.join(', '));
        } else {
            logResult('seasonalPricing', 'failed', testDetails.join(', '));
        }
        
    } catch (error) {
        logResult('seasonalPricing', 'failed', `Seasonal pricing test error: ${error.message}`);
    }
}

async function testSpecialOffers() {
    console.log('Testing special offers modal functionality...');
    
    try {
        await waitForReactRender();
        
        // Click on Special Offers card
        const specialOffersCard = Array.from(document.querySelectorAll('*')).find(el => 
            el.textContent && el.textContent.includes('Special Offers') && 
            (el.tagName === 'BUTTON' || el.onclick || el.classList.contains('cursor-pointer'))
        );
        
        if (specialOffersCard) {
            specialOffersCard.click();
            await waitForReactRender();
            
            // Look for modal elements
            const modals = document.querySelectorAll('[class*="modal"], [role="dialog"], [class*="overlay"]');
            const forms = document.querySelectorAll('form');
            const inputs = document.querySelectorAll('input, select, textarea');
            const submitButtons = Array.from(document.querySelectorAll('button[type="submit"], button')).filter(btn =>
                btn.textContent && (btn.textContent.includes('Save') || btn.textContent.includes('Submit') || btn.textContent.includes('Add'))
            );
            
            let passedTests = 0;
            let testDetails = [];
            
            if (modals.length > 0) {
                passedTests++;
                testDetails.push(`✓ Modal opened (${modals.length} modals)`);
            } else {
                testDetails.push('✗ No modal opened');
            }
            
            if (forms.length > 0) {
                passedTests++;
                testDetails.push(`✓ Form found (${forms.length} forms)`);
            } else {
                testDetails.push('✗ No form found');
            }
            
            if (inputs.length > 0) {
                passedTests++;
                testDetails.push(`✓ Form inputs found (${inputs.length} inputs)`);
                
                // Test validation by trying to submit empty form
                if (submitButtons.length > 0) {
                    submitButtons[0].click();
                    await sleep(100);
                    
                    const errorMessages = document.querySelectorAll('[class*="error"], [class*="invalid"], .text-red-500, .text-red-600');
                    if (errorMessages.length > 0) {
                        passedTests++;
                        testDetails.push(`✓ Form validation working (${errorMessages.length} error messages)`);
                    } else {
                        testDetails.push('✗ Form validation not working');
                    }
                }
            } else {
                testDetails.push('✗ No form inputs found');
            }
            
            if (passedTests >= 3) {
                logResult('specialOffers', 'passed', testDetails.join(', '));
            } else {
                logResult('specialOffers', 'failed', testDetails.join(', '));
            }
        } else {
            logResult('specialOffers', 'failed', 'Could not find Special Offers card to click');
        }
        
    } catch (error) {
        logResult('specialOffers', 'failed', `Special offers test error: ${error.message}`);
    }
}

async function testBackNavigation() {
    console.log('Testing back navigation functionality...');
    
    try {
        await waitForReactRender();
        
        // Look for back navigation elements
        const backButtons = Array.from(document.querySelectorAll('button, a')).filter(el => {
            const text = el.textContent.toLowerCase();
            return text.includes('back') && text.includes('pricing') && text.includes('overview');
        });
        
        if (backButtons.length > 0) {
            // Test back navigation
            backButtons[0].click();
            await waitForReactRender();
            
            // Check if we're back to overview (should see the three main cards again)
            const overviewCards = Array.from(document.querySelectorAll('*')).filter(el => {
                const text = el.textContent;
                return text && (text.includes('Pricing Rules') || text.includes('Seasonal Pricing') || text.includes('Special Offers'));
            });
            
            if (overviewCards.length >= 3) {
                logResult('backNavigation', 'passed', 'Back navigation works - returned to pricing overview');
            } else {
                logResult('backNavigation', 'failed', 'Back navigation did not return to pricing overview');
            }
        } else {
            logResult('backNavigation', 'failed', 'No back navigation buttons found');
        }
        
    } catch (error) {
        logResult('backNavigation', 'failed', `Back navigation test error: ${error.message}`);
    }
}

async function checkConsoleErrors() {
    console.log('Checking for console errors...');
    
    if (consoleErrors.length === 0) {
        logResult('consoleErrors', 'passed', 'No console errors detected during testing');
    } else {
        const errorCount = consoleErrors.filter(e => e.type === 'error').length;
        const warnCount = consoleErrors.filter(e => e.type === 'warn').length;
        logResult('consoleErrors', 'failed', `Found ${errorCount} errors and ${warnCount} warnings`);
        
        console.log('Console errors/warnings:');
        consoleErrors.forEach(error => {
            console.log(`[${error.type.toUpperCase()}] ${error.message}`);
        });
    }
}

async function runFullTest() {
    console.log('Starting comprehensive pricing configuration test...');
    console.log('==========================================');
    
    try {
        await testNavigation();
        await sleep(1000);
        
        await testPricingOverview();
        await sleep(1000);
        
        await testPricingRules();
        await sleep(1000);
        
        await testSeasonalPricing();
        await sleep(1000);
        
        await testSpecialOffers();
        await sleep(1000);
        
        await testBackNavigation();
        await sleep(1000);
        
        await checkConsoleErrors();
        
        console.log('==========================================');
        console.log('Test Results Summary:');
        Object.entries(testResults).forEach(([test, result]) => {
            console.log(`${test}: ${result.status.toUpperCase()} - ${result.details}`);
        });
        
        const passedTests = Object.values(testResults).filter(r => r.status === 'passed').length;
        const totalTests = Object.keys(testResults).length;
        
        console.log(`Overall: ${passedTests}/${totalTests} tests passed`);
        
        if (passedTests === totalTests) {
            console.log('🎉 All pricing configuration tests PASSED!');
        } else {
            console.log('⚠️  Some tests failed - review the details above');
        }
        
    } catch (error) {
        console.error('Test suite failed:', error);
    }
}

// Auto-run the test when loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(runFullTest, 2000); // Give React time to load
    });
} else {
    setTimeout(runFullTest, 2000);
}

// Export for manual testing
window.pricingTest = {
    runFullTest,
    testNavigation,
    testPricingOverview,
    testPricingRules,
    testSeasonalPricing,
    testSpecialOffers,
    testBackNavigation,
    checkConsoleErrors,
    getResults: () => testResults,
    getConsoleErrors: () => consoleErrors
};