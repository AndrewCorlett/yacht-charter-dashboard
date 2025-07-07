#!/usr/bin/env node

/**
 * Test Runner Script for Comprehensive Booking Workflow Test
 * 
 * This script executes the comprehensive booking workflow test with
 * proper setup and configuration.
 * 
 * Usage:
 *   node run-booking-workflow-test.js
 * 
 * @author AI Agent
 * @created 2025-07-05
 */

const { runComprehensiveBookingTest } = require('./test-comprehensive-booking-workflow')

// Enhanced logging
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

async function main() {
  try {
    log('Starting Comprehensive Booking Workflow Test Suite', 'info')
    log('This test will validate the complete booking creation workflow', 'info')
    
    // Pre-flight checks
    log('Performing pre-flight checks...', 'info')
    
    // Check if development server is running
    const serverCheck = await checkDevelopmentServer()
    if (!serverCheck) {
      log('Development server is not running. Please start it with: npm run dev', 'error')
      process.exit(1)
    }
    
    log('Pre-flight checks passed', 'success')
    
    // Execute the test
    await runComprehensiveBookingTest()
    
    log('Comprehensive Booking Workflow Test completed successfully', 'success')
    
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error')
    if (error.stack) {
      log(`Stack trace: ${error.stack}`, 'error')
    }
    process.exit(1)
  }
}

// Check if development server is running
async function checkDevelopmentServer() {
  try {
    const fetch = require('node-fetch').default || require('node-fetch')
    const response = await fetch('http://localhost:5173', { 
      method: 'GET',
      timeout: 5000 
    })
    return response.ok
  } catch (error) {
    return false
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('Test execution interrupted by user', 'warn')
  process.exit(1)
})

process.on('SIGTERM', () => {
  log('Test execution terminated', 'warn')
  process.exit(1)
})

// Run the test
if (require.main === module) {
  main()
}