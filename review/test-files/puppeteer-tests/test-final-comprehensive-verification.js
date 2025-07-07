/**
 * Final Comprehensive Booking System Verification
 * 
 * This script performs a complete verification of the booking system after all fixes:
 * 1. Database connectivity and schema validation
 * 2. Complete booking data summary and statistics
 * 3. Data integrity checks across all bookings
 * 4. Booking number uniqueness and format validation
 * 5. Yacht association verification
 * 6. Customer data consistency checks
 * 7. Anomaly detection and data corruption checks
 * 8. Overall system health report
 * 
 * @author AI Agent
 * @created 2025-07-05
 * @version 1.0
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Mock fetch if not available
if (typeof fetch === 'undefined') {
  global.fetch = (await import('node-fetch')).default
}

// Environment configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set')
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// Verification results tracking
const verificationResults = {
  startTime: new Date(),
  endTime: null,
  database: {
    connected: false,
    tablesAccessible: false,
    schemaValid: false
  },
  bookings: {
    total: 0,
    valid: 0,
    invalid: 0,
    details: []
  },
  bookingNumbers: {
    total: 0,
    unique: 0,
    duplicates: [],
    formatCorrect: 0,
    formatIncorrect: 0,
    formats: {}
  },
  yachts: {
    total: 0,
    referenced: 0,
    orphaned: 0,
    details: []
  },
  customers: {
    total: 0,
    complete: 0,
    incomplete: 0,
    issues: []
  },
  anomalies: [],
  errors: [],
  overallHealth: 'unknown'
}

// Logging utility
function log(message, level = 'info') {
  const timestamp = new Date().toISOString()
  const prefix = {
    info: '✅',
    warn: '⚠️',
    error: '❌',
    debug: '🔍'
  }[level] || 'ℹ️'
  
  console.log(`[${timestamp}] ${prefix} ${message}`)
  
  if (level === 'error') {
    verificationResults.errors.push({
      timestamp,
      message,
      level
    })
  }
}

// Database connectivity check
async function checkDatabaseConnectivity() {
  try {
    log('Checking database connectivity...')
    
    // Test basic connection
    const { data, error } = await supabase.from('bookings').select('count', { count: 'exact', head: true })
    
    if (error) {
      throw error
    }
    
    verificationResults.database.connected = true
    verificationResults.database.tablesAccessible = true
    log('Database connection: SUCCESSFUL')
    
    return true
  } catch (error) {
    log(`Database connection failed: ${error.message}`, 'error')
    verificationResults.database.connected = false
    return false
  }
}

// Schema validation
async function validateDatabaseSchema() {
  try {
    log('Validating database schema...')
    
    // Check bookings table structure
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1)
    
    if (bookingsError) throw bookingsError
    
    // Check yachts table structure
    const { data: yachts, error: yachtsError } = await supabase
      .from('yachts')
      .select('*')
      .limit(1)
    
    if (yachtsError) throw yachtsError
    
    // Validate required fields exist
    const requiredBookingFields = [
      'id', 'booking_number', 'customer_first_name', 'customer_surname', 'yacht_id', 
      'start_date', 'end_date', 'created_at'
    ]
    
    if (bookings && bookings.length > 0) {
      const bookingKeys = Object.keys(bookings[0])
      const missingFields = requiredBookingFields.filter(field => !bookingKeys.includes(field))
      
      if (missingFields.length > 0) {
        throw new Error(`Missing booking fields: ${missingFields.join(', ')}`)
      }
    }
    
    verificationResults.database.schemaValid = true
    log('Database schema: VALID')
    
    return true
  } catch (error) {
    log(`Schema validation failed: ${error.message}`, 'error')
    verificationResults.database.schemaValid = false
    return false
  }
}

// Get complete booking summary
async function getBookingSummary() {
  try {
    log('Retrieving complete booking summary...')
    
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    verificationResults.bookings.total = bookings?.length || 0
    verificationResults.bookings.details = bookings || []
    
    log(`Total bookings found: ${verificationResults.bookings.total}`)
    
    // Log recent bookings
    if (bookings && bookings.length > 0) {
      log('Recent bookings:')
      bookings.slice(0, 5).forEach((booking, index) => {
        const yachtName = booking.yacht_name || 'Unknown Yacht'
        const customerName = `${booking.customer_first_name || ''} ${booking.customer_surname || ''}`.trim() || 'Unknown Customer'
        log(`  ${index + 1}. ${booking.booking_number} - ${customerName} (${yachtName})`)
      })
    }
    
    return bookings || []
  } catch (error) {
    log(`Failed to retrieve booking summary: ${error.message}`, 'error')
    return []
  }
}

// Verify data integrity
async function verifyDataIntegrity(bookings) {
  try {
    log('Verifying data integrity across all bookings...')
    
    let validCount = 0
    let invalidCount = 0
    
    bookings.forEach(booking => {
      const issues = []
      
      // Check required fields
      if (!booking.booking_number) issues.push('Missing booking number')
      if (!booking.customer_first_name && !booking.customer_surname) issues.push('Missing customer name')
      if (!booking.yacht_id) issues.push('Missing yacht ID')
      if (!booking.start_date) issues.push('Missing start date')
      if (!booking.end_date) issues.push('Missing end date')
      
      // Check data types and formats
      if (booking.start_date && isNaN(Date.parse(booking.start_date))) {
        issues.push('Invalid start date format')
      }
      if (booking.end_date && isNaN(Date.parse(booking.end_date))) {
        issues.push('Invalid end date format')
      }
      
      // Check date logic
      if (booking.start_date && booking.end_date) {
        const startDate = new Date(booking.start_date)
        const endDate = new Date(booking.end_date)
        if (startDate >= endDate) {
          issues.push('End date must be after start date')
        }
      }
      
      // Check email format if present
      if (booking.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.customer_email)) {
        issues.push('Invalid email format')
      }
      
      if (issues.length === 0) {
        validCount++
      } else {
        invalidCount++
        verificationResults.anomalies.push({
          type: 'data_integrity',
          bookingNumber: booking.booking_number,
          issues
        })
      }
    })
    
    verificationResults.bookings.valid = validCount
    verificationResults.bookings.invalid = invalidCount
    
    log(`Data integrity check: ${validCount} valid, ${invalidCount} invalid`)
    
    return { validCount, invalidCount }
  } catch (error) {
    log(`Data integrity check failed: ${error.message}`, 'error')
    return { validCount: 0, invalidCount: 0 }
  }
}

// Check booking number uniqueness and format
async function verifyBookingNumbers(bookings) {
  try {
    log('Verifying booking number uniqueness and format...')
    
    const bookingNumbers = bookings.map(b => b.booking_number).filter(Boolean)
    const uniqueNumbers = new Set(bookingNumbers)
    
    verificationResults.bookingNumbers.total = bookingNumbers.length
    verificationResults.bookingNumbers.unique = uniqueNumbers.size
    
    // Find duplicates
    const duplicates = []
    const seen = new Set()
    bookingNumbers.forEach(num => {
      if (seen.has(num)) {
        duplicates.push(num)
      }
      seen.add(num)
    })
    
    verificationResults.bookingNumbers.duplicates = [...new Set(duplicates)]
    
    // Check formats
    const formatPatterns = {
      'YYWWBCNN': /^\d{2}\d{2}[A-Z]{2}\d{2}$/,
      'BK_Format': /^BK\d+$/,
      'Other': /^.+$/
    }
    
    let formatCorrect = 0
    let formatIncorrect = 0
    
    bookingNumbers.forEach(num => {
      let formatFound = false
      
      for (const [formatName, pattern] of Object.entries(formatPatterns)) {
        if (pattern.test(num)) {
          verificationResults.bookingNumbers.formats[formatName] = 
            (verificationResults.bookingNumbers.formats[formatName] || 0) + 1
          
          if (formatName === 'YYWWBCNN') {
            formatCorrect++
          } else if (formatName === 'BK_Format') {
            formatIncorrect++
            verificationResults.anomalies.push({
              type: 'booking_number_format',
              bookingNumber: num,
              issue: 'Using old BK format instead of YYWWBCNN'
            })
          }
          
          formatFound = true
          break
        }
      }
      
      if (!formatFound) {
        formatIncorrect++
        verificationResults.anomalies.push({
          type: 'booking_number_format',
          bookingNumber: num,
          issue: 'Unknown format'
        })
      }
    })
    
    verificationResults.bookingNumbers.formatCorrect = formatCorrect
    verificationResults.bookingNumbers.formatIncorrect = formatIncorrect
    
    log(`Booking numbers: ${verificationResults.bookingNumbers.total} total, ${verificationResults.bookingNumbers.unique} unique`)
    log(`Duplicates found: ${verificationResults.bookingNumbers.duplicates.length}`)
    log(`Format check: ${formatCorrect} correct (YYWWBCNN), ${formatIncorrect} incorrect`)
    
    // Log format distribution
    Object.entries(verificationResults.bookingNumbers.formats).forEach(([format, count]) => {
      log(`  ${format}: ${count} bookings`)
    })
    
    return true
  } catch (error) {
    log(`Booking number verification failed: ${error.message}`, 'error')
    return false
  }
}

// Verify yacht associations
async function verifyYachtAssociations(bookings) {
  try {
    log('Verifying yacht associations...')
    
    // Get all yachts
    const { data: yachts, error } = await supabase
      .from('yachts')
      .select('id, name')
    
    if (error) throw error
    
    verificationResults.yachts.total = yachts?.length || 0
    verificationResults.yachts.details = yachts || []
    
    // Check yacht references in bookings
    const referencedYachtIds = new Set()
    const orphanedBookings = []
    
    bookings.forEach(booking => {
      if (booking.yacht_id) {
        referencedYachtIds.add(booking.yacht_id)
        
        // Check if yacht exists
        const yachtExists = yachts?.find(y => y.id === booking.yacht_id)
        if (!yachtExists) {
          orphanedBookings.push(booking.booking_number)
          verificationResults.anomalies.push({
            type: 'yacht_association',
            bookingNumber: booking.booking_number,
            issue: `References non-existent yacht ID: ${booking.yacht_id}`
          })
        }
      }
    })
    
    verificationResults.yachts.referenced = referencedYachtIds.size
    verificationResults.yachts.orphaned = orphanedBookings.length
    
    log(`Yacht associations: ${verificationResults.yachts.total} yachts, ${verificationResults.yachts.referenced} referenced`)
    log(`Orphaned bookings: ${verificationResults.yachts.orphaned}`)
    
    // Log yacht utilization
    if (yachts && yachts.length > 0) {
      log('Yacht utilization:')
      yachts.forEach(yacht => {
        const bookingCount = bookings.filter(b => b.yacht_id === yacht.id).length
        log(`  ${yacht.name}: ${bookingCount} bookings`)
      })
    }
    
    return true
  } catch (error) {
    log(`Yacht association verification failed: ${error.message}`, 'error')
    return false
  }
}

// Verify customer data consistency
async function verifyCustomerData(bookings) {
  try {
    log('Verifying customer data consistency...')
    
    let completeCount = 0
    let incompleteCount = 0
    const customerIssues = []
    
    bookings.forEach(booking => {
      const issues = []
      
      // Check required customer fields
      if ((!booking.customer_first_name || booking.customer_first_name.trim().length === 0) && 
          (!booking.customer_surname || booking.customer_surname.trim().length === 0)) {
        issues.push('Missing customer name')
      }
      
      if (!booking.customer_email || booking.customer_email.trim().length === 0) {
        issues.push('Missing email')
      }
      
      if (!booking.customer_phone || booking.customer_phone.trim().length === 0) {
        issues.push('Missing phone number')
      }
      
      // Check address fields
      if (!booking.customer_street || booking.customer_street.trim().length === 0) {
        issues.push('Missing address line 1')
      }
      
      if (!booking.customer_city || booking.customer_city.trim().length === 0) {
        issues.push('Missing city')
      }
      
      if (!booking.customer_postcode || booking.customer_postcode.trim().length === 0) {
        issues.push('Missing postcode')
      }
      
      if (issues.length === 0) {
        completeCount++
      } else {
        incompleteCount++
        customerIssues.push({
          bookingNumber: booking.booking_number,
          issues
        })
      }
    })
    
    verificationResults.customers.total = bookings.length
    verificationResults.customers.complete = completeCount
    verificationResults.customers.incomplete = incompleteCount
    verificationResults.customers.issues = customerIssues
    
    log(`Customer data: ${completeCount} complete, ${incompleteCount} incomplete`)
    
    // Log common issues
    if (customerIssues.length > 0) {
      const issueStats = {}
      customerIssues.forEach(item => {
        item.issues.forEach(issue => {
          issueStats[issue] = (issueStats[issue] || 0) + 1
        })
      })
      
      log('Common customer data issues:')
      Object.entries(issueStats).forEach(([issue, count]) => {
        log(`  ${issue}: ${count} occurrences`)
      })
    }
    
    return true
  } catch (error) {
    log(`Customer data verification failed: ${error.message}`, 'error')
    return false
  }
}

// Detect anomalies and corruption
async function detectAnomalies(bookings) {
  try {
    log('Detecting anomalies and data corruption...')
    
    // Check for future dates that are too far
    const currentDate = new Date()
    const maxFutureDate = new Date()
    maxFutureDate.setFullYear(currentDate.getFullYear() + 2)
    
    bookings.forEach(booking => {
      if (booking.start_date) {
        const startDate = new Date(booking.start_date)
        if (startDate > maxFutureDate) {
          verificationResults.anomalies.push({
            type: 'date_anomaly',
            bookingNumber: booking.booking_number,
            issue: `Start date too far in future: ${booking.start_date}`
          })
        }
      }
      
      if (booking.end_date) {
        const endDate = new Date(booking.end_date)
        if (endDate > maxFutureDate) {
          verificationResults.anomalies.push({
            type: 'date_anomaly',
            bookingNumber: booking.booking_number,
            issue: `End date too far in future: ${booking.end_date}`
          })
        }
      }
      
      // Check for suspiciously long bookings (more than 30 days)
      if (booking.start_date && booking.end_date) {
        const duration = (new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24)
        if (duration > 30) {
          verificationResults.anomalies.push({
            type: 'duration_anomaly',
            bookingNumber: booking.booking_number,
            issue: `Unusually long booking: ${duration} days`
          })
        }
      }
      
      // Check for duplicate customer names with different details
      const customerFullName = `${booking.customer_first_name || ''} ${booking.customer_surname || ''}`.trim()
      const similarBookings = bookings.filter(b => {
        const otherFullName = `${b.customer_first_name || ''} ${b.customer_surname || ''}`.trim()
        return otherFullName === customerFullName && 
               b.id !== booking.id &&
               (b.customer_email !== booking.customer_email || b.customer_phone !== booking.customer_phone)
      })
      
      if (similarBookings.length > 0) {
        verificationResults.anomalies.push({
          type: 'customer_inconsistency',
          bookingNumber: booking.booking_number,
          issue: `Customer name matches other bookings but with different contact details`
        })
      }
    })
    
    log(`Anomalies detected: ${verificationResults.anomalies.length}`)
    
    return true
  } catch (error) {
    log(`Anomaly detection failed: ${error.message}`, 'error')
    return false
  }
}

// Calculate overall system health
function calculateSystemHealth() {
  try {
    log('Calculating overall system health...')
    
    const scores = {
      database: 0,
      dataIntegrity: 0,
      bookingNumbers: 0,
      yachtAssociations: 0,
      customerData: 0,
      anomalies: 0
    }
    
    // Database health (30 points)
    if (verificationResults.database.connected) scores.database += 15
    if (verificationResults.database.schemaValid) scores.database += 15
    
    // Data integrity (20 points)
    if (verificationResults.bookings.total > 0) {
      const integrityRatio = verificationResults.bookings.valid / verificationResults.bookings.total
      scores.dataIntegrity = Math.round(integrityRatio * 20)
    }
    
    // Booking numbers (20 points)
    if (verificationResults.bookingNumbers.total > 0) {
      const uniquenessScore = (verificationResults.bookingNumbers.unique / verificationResults.bookingNumbers.total) * 10
      const formatScore = (verificationResults.bookingNumbers.formatCorrect / verificationResults.bookingNumbers.total) * 10
      scores.bookingNumbers = Math.round(uniquenessScore + formatScore)
    }
    
    // Yacht associations (10 points)
    if (verificationResults.yachts.orphaned === 0) {
      scores.yachtAssociations = 10
    } else {
      scores.yachtAssociations = Math.max(0, 10 - verificationResults.yachts.orphaned)
    }
    
    // Customer data (10 points)
    if (verificationResults.customers.total > 0) {
      const completenessRatio = verificationResults.customers.complete / verificationResults.customers.total
      scores.customerData = Math.round(completenessRatio * 10)
    }
    
    // Anomalies (10 points - deducted for each anomaly)
    scores.anomalies = Math.max(0, 10 - verificationResults.anomalies.length)
    
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0)
    
    // Determine health status
    let healthStatus = 'critical'
    if (totalScore >= 90) healthStatus = 'excellent'
    else if (totalScore >= 80) healthStatus = 'good'
    else if (totalScore >= 70) healthStatus = 'fair'
    else if (totalScore >= 60) healthStatus = 'poor'
    
    verificationResults.overallHealth = healthStatus
    
    log(`Overall system health: ${healthStatus.toUpperCase()} (${totalScore}/100)`)
    log('Health score breakdown:')
    Object.entries(scores).forEach(([category, score]) => {
      log(`  ${category}: ${score} points`)
    })
    
    return { healthStatus, totalScore, scores }
  } catch (error) {
    log(`Health calculation failed: ${error.message}`, 'error')
    verificationResults.overallHealth = 'unknown'
    return { healthStatus: 'unknown', totalScore: 0, scores: {} }
  }
}

// Generate final report
function generateFinalReport() {
  try {
    log('Generating final verification report...')
    
    verificationResults.endTime = new Date()
    const duration = (verificationResults.endTime - verificationResults.startTime) / 1000
    
    console.log('\n' + '='.repeat(80))
    console.log('               FINAL BOOKING SYSTEM VERIFICATION REPORT')
    console.log('='.repeat(80))
    console.log(`Report Generated: ${verificationResults.endTime.toISOString()}`)
    console.log(`Verification Duration: ${duration.toFixed(2)} seconds`)
    console.log(`Overall System Health: ${verificationResults.overallHealth.toUpperCase()}`)
    console.log('='.repeat(80))
    
    // Database Status
    console.log('\n🔹 DATABASE STATUS')
    console.log(`   Connected: ${verificationResults.database.connected ? '✅ YES' : '❌ NO'}`)
    console.log(`   Schema Valid: ${verificationResults.database.schemaValid ? '✅ YES' : '❌ NO'}`)
    console.log(`   Tables Accessible: ${verificationResults.database.tablesAccessible ? '✅ YES' : '❌ NO'}`)
    
    // Booking Summary
    console.log('\n🔹 BOOKING SUMMARY')
    console.log(`   Total Bookings: ${verificationResults.bookings.total}`)
    console.log(`   Valid Bookings: ${verificationResults.bookings.valid}`)
    console.log(`   Invalid Bookings: ${verificationResults.bookings.invalid}`)
    
    // Booking Numbers
    console.log('\n🔹 BOOKING NUMBERS')
    console.log(`   Total Numbers: ${verificationResults.bookingNumbers.total}`)
    console.log(`   Unique Numbers: ${verificationResults.bookingNumbers.unique}`)
    console.log(`   Duplicates: ${verificationResults.bookingNumbers.duplicates.length}`)
    console.log(`   Correct Format (YYWWBCNN): ${verificationResults.bookingNumbers.formatCorrect}`)
    console.log(`   Incorrect Format: ${verificationResults.bookingNumbers.formatIncorrect}`)
    
    if (Object.keys(verificationResults.bookingNumbers.formats).length > 0) {
      console.log('   Format Distribution:')
      Object.entries(verificationResults.bookingNumbers.formats).forEach(([format, count]) => {
        console.log(`     ${format}: ${count}`)
      })
    }
    
    // Yacht Associations
    console.log('\n🔹 YACHT ASSOCIATIONS')
    console.log(`   Total Yachts: ${verificationResults.yachts.total}`)
    console.log(`   Referenced Yachts: ${verificationResults.yachts.referenced}`)
    console.log(`   Orphaned Bookings: ${verificationResults.yachts.orphaned}`)
    
    // Customer Data
    console.log('\n🔹 CUSTOMER DATA')
    console.log(`   Total Customers: ${verificationResults.customers.total}`)
    console.log(`   Complete Profiles: ${verificationResults.customers.complete}`)
    console.log(`   Incomplete Profiles: ${verificationResults.customers.incomplete}`)
    
    // Anomalies
    console.log('\n🔹 ANOMALIES & ISSUES')
    console.log(`   Total Anomalies: ${verificationResults.anomalies.length}`)
    console.log(`   Errors Encountered: ${verificationResults.errors.length}`)
    
    if (verificationResults.anomalies.length > 0) {
      console.log('   Anomaly Types:')
      const anomalyTypes = {}
      verificationResults.anomalies.forEach(anomaly => {
        anomalyTypes[anomaly.type] = (anomalyTypes[anomaly.type] || 0) + 1
      })
      Object.entries(anomalyTypes).forEach(([type, count]) => {
        console.log(`     ${type}: ${count}`)
      })
    }
    
    // Recommendations
    console.log('\n🔹 RECOMMENDATIONS')
    
    if (verificationResults.bookingNumbers.duplicates.length > 0) {
      console.log('   ⚠️  Resolve duplicate booking numbers')
    }
    
    if (verificationResults.bookingNumbers.formatIncorrect > 0) {
      console.log('   ⚠️  Update booking numbers to use YYWWBCNN format')
    }
    
    if (verificationResults.yachts.orphaned > 0) {
      console.log('   ⚠️  Fix orphaned yacht references')
    }
    
    if (verificationResults.customers.incomplete > 0) {
      console.log('   ⚠️  Complete missing customer data')
    }
    
    if (verificationResults.anomalies.length > 0) {
      console.log('   ⚠️  Investigate and resolve detected anomalies')
    }
    
    if (verificationResults.overallHealth === 'excellent') {
      console.log('   ✅ System is in excellent condition - no immediate action required')
    } else if (verificationResults.overallHealth === 'good') {
      console.log('   ✅ System is in good condition - minor improvements recommended')
    } else {
      console.log('   ⚠️  System requires attention - review and fix identified issues')
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('                         VERIFICATION COMPLETE')
    console.log('='.repeat(80))
    
    return verificationResults
  } catch (error) {
    log(`Report generation failed: ${error.message}`, 'error')
    return verificationResults
  }
}

// Main verification function
async function runComprehensiveVerification() {
  try {
    console.log('🚀 Starting Final Comprehensive Booking System Verification...\n')
    
    // Step 1: Database connectivity
    const dbConnected = await checkDatabaseConnectivity()
    if (!dbConnected) {
      throw new Error('Database connection failed - cannot proceed with verification')
    }
    
    // Step 2: Schema validation
    await validateDatabaseSchema()
    
    // Step 3: Get booking data
    const bookings = await getBookingSummary()
    
    if (bookings.length === 0) {
      log('No bookings found in database', 'warn')
      verificationResults.overallHealth = 'no_data'
      return generateFinalReport()
    }
    
    // Step 4: Data integrity verification
    await verifyDataIntegrity(bookings)
    
    // Step 5: Booking number verification
    await verifyBookingNumbers(bookings)
    
    // Step 6: Yacht association verification
    await verifyYachtAssociations(bookings)
    
    // Step 7: Customer data verification
    await verifyCustomerData(bookings)
    
    // Step 8: Anomaly detection
    await detectAnomalies(bookings)
    
    // Step 9: Calculate overall health
    calculateSystemHealth()
    
    // Step 10: Generate final report
    const report = generateFinalReport()
    
    return report
    
  } catch (error) {
    log(`Verification failed: ${error.message}`, 'error')
    verificationResults.overallHealth = 'failed'
    return generateFinalReport()
  }
}

// Run verification if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveVerification()
    .then(report => {
      const exitCode = report.overallHealth === 'excellent' || report.overallHealth === 'good' ? 0 : 1
      process.exit(exitCode)
    })
    .catch(error => {
      console.error('❌ Verification script failed:', error.message)
      process.exit(1)
    })
}

export { runComprehensiveVerification, verificationResults }