#!/usr/bin/env node

/**
 * Test Environment Validation Script
 * 
 * This script validates that the test environment is properly set up
 * for running the comprehensive booking workflow test.
 * 
 * @author AI Agent
 * @created 2025-07-05
 */

import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

// Validation results
const validationResults = {
  timestamp: new Date().toISOString(),
  results: [],
  overallSuccess: true
}

// Logging utility
function log(message, level = 'info') {
  const timestamp = new Date().toISOString()
  const colors = {
    info: '\x1b[36m',    // cyan
    warn: '\x1b[33m',    // yellow
    error: '\x1b[31m',   // red
    success: '\x1b[32m', // green
    reset: '\x1b[0m'
  }
  
  const color = colors[level] || colors.info
  console.log(`${color}[${timestamp}] [${level.toUpperCase()}] ${message}${colors.reset}`)
}

// Validation check result
function addResult(name, passed, details = {}) {
  const result = {
    name,
    passed,
    details,
    timestamp: new Date().toISOString()
  }
  
  validationResults.results.push(result)
  
  if (!passed) {
    validationResults.overallSuccess = false
  }
  
  log(`${name}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'success' : 'error')
  
  if (!passed && details.error) {
    log(`  Error: ${details.error}`, 'error')
  }
  
  if (details.suggestion) {
    log(`  Suggestion: ${details.suggestion}`, 'warn')
  }
}

// Check if development server is running
async function checkDevelopmentServer() {
  try {
    const response = await fetch('http://localhost:5173', { 
      method: 'GET',
      timeout: 5000 
    })
    
    if (response.ok) {
      addResult('Development Server', true, { 
        url: 'http://localhost:5173',
        status: response.status 
      })
      return true
    } else {
      addResult('Development Server', false, { 
        error: `Server responded with status ${response.status}`,
        suggestion: 'Check if the development server is running properly'
      })
      return false
    }
  } catch (error) {
    addResult('Development Server', false, { 
      error: error.message,
      suggestion: 'Start the development server with: npm run dev'
    })
    return false
  }
}

// Check if Puppeteer is installed and working
async function checkPuppeteer() {
  try {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.goto('about:blank')
    await browser.close()
    
    addResult('Puppeteer Installation', true, { 
      version: 'Available and functional'
    })
    return true
  } catch (error) {
    addResult('Puppeteer Installation', false, { 
      error: error.message,
      suggestion: 'Install Puppeteer with: npm install puppeteer'
    })
    return false
  }
}

// Check if application loads correctly
async function checkApplicationLoad() {
  try {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    
    // Set up error tracking
    const pageErrors = []
    page.on('pageerror', error => {
      pageErrors.push(error.message)
    })
    
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    })
    
    // Check if React app loaded
    const reactLoaded = await page.evaluate(() => {
      return window.React || document.querySelector('[data-reactroot]') || document.getElementById('root')
    })
    
    await browser.close()
    
    if (reactLoaded && pageErrors.length === 0) {
      addResult('Application Load', true, { 
        pageErrors: pageErrors.length,
        reactDetected: !!reactLoaded
      })
      return true
    } else {
      addResult('Application Load', false, { 
        error: pageErrors.length > 0 ? pageErrors[0] : 'React not detected',
        pageErrors: pageErrors.length,
        suggestion: 'Check browser console for errors'
      })
      return false
    }
  } catch (error) {
    addResult('Application Load', false, { 
      error: error.message,
      suggestion: 'Verify application builds and runs without errors'
    })
    return false
  }
}

// Check if Quick Create form is accessible
async function checkQuickCreateForm() {
  try {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    })
    
    // Look for form elements
    const formElements = await page.evaluate(() => {
      const selectors = [
        'input[name="firstName"]',
        'input[name="surname"]',
        'input[name="email"]',
        'select[name="yacht"]',
        'input[name="startDate"]',
        'input[name="endDate"]',
        'button[type="submit"]'
      ]
      
      return selectors.map(selector => ({
        selector,
        found: !!document.querySelector(selector)
      }))
    })
    
    await browser.close()
    
    const missingElements = formElements.filter(el => !el.found)
    
    if (missingElements.length === 0) {
      addResult('Quick Create Form', true, { 
        elementsFound: formElements.length,
        missingElements: 0
      })
      return true
    } else {
      addResult('Quick Create Form', false, { 
        error: `Missing form elements: ${missingElements.map(el => el.selector).join(', ')}`,
        suggestion: 'Verify Quick Create form is properly rendered'
      })
      return false
    }
  } catch (error) {
    addResult('Quick Create Form', false, { 
      error: error.message,
      suggestion: 'Check if Quick Create form component is working'
    })
    return false
  }
}

// Check if yacht dropdown has data
async function checkYachtDropdown() {
  try {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    })
    
    // Wait for yacht dropdown to populate
    await page.waitForTimeout(3000)
    
    const yachtOptions = await page.evaluate(() => {
      const select = document.querySelector('select[name="yacht"]')
      if (!select) return null
      
      return Array.from(select.options).map(option => ({
        value: option.value,
        text: option.textContent.trim()
      }))
    })
    
    await browser.close()
    
    if (yachtOptions && yachtOptions.length > 1) {
      addResult('Yacht Dropdown Data', true, { 
        yachtCount: yachtOptions.length - 1, // Exclude placeholder
        yachts: yachtOptions.filter(y => y.value).map(y => y.text)
      })
      return true
    } else {
      addResult('Yacht Dropdown Data', false, { 
        error: yachtOptions ? 'No yacht options available' : 'Yacht dropdown not found',
        suggestion: 'Check database connection and yacht data'
      })
      return false
    }
  } catch (error) {
    addResult('Yacht Dropdown Data', false, { 
      error: error.message,
      suggestion: 'Verify yacht service and database connection'
    })
    return false
  }
}

// Check if required directories exist
async function checkDirectories() {
  try {
    const screenshotDir = './test-screenshots/comprehensive-booking-workflow'
    
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true })
    }
    
    const canWrite = fs.accessSync(screenshotDir, fs.constants.W_OK)
    
    addResult('Screenshot Directory', true, { 
      path: screenshotDir,
      writable: true
    })
    return true
  } catch (error) {
    addResult('Screenshot Directory', false, { 
      error: error.message,
      suggestion: 'Check file system permissions'
    })
    return false
  }
}

// Check if dependencies are installed
async function checkDependencies() {
  try {
    const packageJson = require('./package.json')
    const requiredDeps = ['puppeteer', 'react', 'react-dom']
    
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
    )
    
    if (missingDeps.length === 0) {
      addResult('Dependencies', true, { 
        required: requiredDeps,
        missing: []
      })
      return true
    } else {
      addResult('Dependencies', false, { 
        error: `Missing dependencies: ${missingDeps.join(', ')}`,
        suggestion: 'Install missing dependencies with npm install'
      })
      return false
    }
  } catch (error) {
    addResult('Dependencies', false, { 
      error: error.message,
      suggestion: 'Check package.json file exists'
    })
    return false
  }
}

// Generate validation report
async function generateValidationReport() {
  const report = {
    ...validationResults,
    summary: {
      totalChecks: validationResults.results.length,
      passedChecks: validationResults.results.filter(r => r.passed).length,
      failedChecks: validationResults.results.filter(r => !r.passed).length,
      successRate: Math.round((validationResults.results.filter(r => r.passed).length / validationResults.results.length) * 100)
    }
  }
  
  const reportPath = './test-environment-validation-report.json'
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  log('=== VALIDATION REPORT ===')
  log(`Total Checks: ${report.summary.totalChecks}`)
  log(`Passed Checks: ${report.summary.passedChecks}`)
  log(`Failed Checks: ${report.summary.failedChecks}`)
  log(`Success Rate: ${report.summary.successRate}%`)
  log(`Overall Result: ${report.overallSuccess ? 'READY' : 'NOT READY'}`)
  log(`Report saved to: ${reportPath}`)
  
  return report
}

// Main validation function
async function validateTestEnvironment() {
  try {
    log('Starting test environment validation...', 'info')
    
    // Run all validation checks
    await checkDependencies()
    await checkDirectories()
    await checkPuppeteer()
    await checkDevelopmentServer()
    await checkApplicationLoad()
    await checkQuickCreateForm()
    await checkYachtDropdown()
    
    // Generate report
    const report = await generateValidationReport()
    
    if (report.overallSuccess) {
      log('Test environment validation PASSED - Ready to run booking workflow test', 'success')
      return true
    } else {
      log('Test environment validation FAILED - Please fix issues before running test', 'error')
      return false
    }
    
  } catch (error) {
    log(`Validation failed: ${error.message}`, 'error')
    return false
  }
}

// Run validation
validateTestEnvironment()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    log(`Validation error: ${error.message}`, 'error')
    process.exit(1)
  })

export { validateTestEnvironment }