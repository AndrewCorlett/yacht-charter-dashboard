/**
 * Test script to verify document generation uses saved charter costs from booking
 * Tests that modified charter costs are used instead of default pricing config
 */

import DocumentAutoGenerator from './src/services/supabase/DocumentAutoGenerator.js'

// Test data with default charter costs
const defaultBookingData = {
  id: 'test-booking-1',
  booking_number: '2520ZA06',
  customer_first_name: 'Test',
  customer_surname: 'Customer',
  customer_email: 'test@example.com',
  customer_phone: '+44 1234 567890',
  customer_street: '123 Test Street',
  customer_city: 'Test City',
  customer_postcode: 'TC1 2ST',
  customer_country: 'United Kingdom',
  yacht_name: 'Zavaria',
  yacht_type: 'Sailing Yacht',
  yacht_location: 'Test Marina',
  yacht_id: 'zavaria',
  charter_type: 'bareboat',
  start_date: '2025-05-12',
  end_date: '2025-05-19',
  port_of_departure: 'Test Marina',
  port_of_arrival: 'Test Marina',
  // DEFAULT COSTS from pricing configuration
  total_amount: 1500.00,
  deposit_amount: 450.00,
  security_deposit: 500.00,
  deposit_paid: false,
  payment_status: 'pending'
}

// Test data with MODIFIED charter costs (manually changed by user)
const modifiedBookingData = {
  ...defaultBookingData,
  id: 'test-booking-2',
  // MODIFIED COSTS - user changed these in the Charter Costs widget
  total_amount: 2000.00,  // User increased from 1500 to 2000
  deposit_amount: 600.00, // User increased from 450 to 600
  security_deposit: 750.00 // User increased from 500 to 750
}

// Mock settings data
const mockSettingsData = {
  yachtOwner: {
    owner_name: 'SeaScape Yacht Charter',
    owner_email: 'info@seascapeyachtcharter.com',
    owner_phone: '+44 1234 567890',
    owner_address_line1: 'Test Marina',
    owner_city: 'Test City',
    owner_country: 'United Kingdom'
  },
  pricing: null // No pricing data to ensure we use booking costs
}

async function testDocumentGeneration() {
  console.log('=== Testing Document Generation with Charter Costs ===\n')
  
  const documentAutoGenerator = new DocumentAutoGenerator()
  
  // Test 1: Document generation with DEFAULT costs
  console.log('Test 1: Document generation with DEFAULT charter costs')
  console.log('Default costs:', {
    total_amount: defaultBookingData.total_amount,
    deposit_amount: defaultBookingData.deposit_amount,
    security_deposit: defaultBookingData.security_deposit
  })
  
  try {
    const defaultDocumentData = documentAutoGenerator.prepareDocumentData(
      'balanceInvoice', 
      defaultBookingData, 
      mockSettingsData
    )
    
    console.log('Generated amounts for DEFAULT costs:')
    console.log('- Total Amount:', defaultDocumentData.total_amount)
    console.log('- Deposit Amount:', defaultDocumentData.deposit_amount)
    console.log('- Security Deposit:', defaultDocumentData.security_deposit)
    console.log('- Amount Due:', defaultDocumentData.amount_due)
    console.log('- Remaining Balance:', defaultDocumentData.remaining_balance)
    
  } catch (error) {
    console.error('Error generating document with default costs:', error.message)
  }
  
  console.log('\n' + '='.repeat(60) + '\n')
  
  // Test 2: Document generation with MODIFIED costs
  console.log('Test 2: Document generation with MODIFIED charter costs')
  console.log('Modified costs:', {
    total_amount: modifiedBookingData.total_amount,
    deposit_amount: modifiedBookingData.deposit_amount,
    security_deposit: modifiedBookingData.security_deposit
  })
  
  try {
    const modifiedDocumentData = documentAutoGenerator.prepareDocumentData(
      'balanceInvoice', 
      modifiedBookingData, 
      mockSettingsData
    )
    
    console.log('Generated amounts for MODIFIED costs:')
    console.log('- Total Amount:', modifiedDocumentData.total_amount)
    console.log('- Deposit Amount:', modifiedDocumentData.deposit_amount)
    console.log('- Security Deposit:', modifiedDocumentData.security_deposit)
    console.log('- Amount Due:', modifiedDocumentData.amount_due)
    console.log('- Remaining Balance:', modifiedDocumentData.remaining_balance)
    
  } catch (error) {
    console.error('Error generating document with modified costs:', error.message)
  }
  
  console.log('\n' + '='.repeat(60) + '\n')
  
  // Test 3: Verify the amounts are different (proving it uses booking costs)
  console.log('Test 3: Verification that costs are correctly used from booking data')
  
  const defaultAmounts = documentAutoGenerator.calculateAmounts('balanceInvoice', defaultBookingData)
  const modifiedAmounts = documentAutoGenerator.calculateAmounts('balanceInvoice', modifiedBookingData)
  
  console.log('Comparison:')
  console.log('| Field            | Default | Modified | Different? |')
  console.log('|------------------|---------|----------|------------|')
  console.log(`| Total Amount     | £${defaultAmounts.total_amount}  | £${modifiedAmounts.total_amount}   | ${defaultAmounts.total_amount !== modifiedAmounts.total_amount ? '✅ YES' : '❌ NO'} |`)
  console.log(`| Deposit Amount   | £${defaultAmounts.deposit_amount}   | £${modifiedAmounts.deposit_amount}    | ${defaultAmounts.deposit_amount !== modifiedAmounts.deposit_amount ? '✅ YES' : '❌ NO'} |`)
  console.log(`| Security Deposit | £${defaultAmounts.security_deposit}   | £${modifiedAmounts.security_deposit}    | ${defaultAmounts.security_deposit !== modifiedAmounts.security_deposit ? '✅ YES' : '❌ NO'} |`)
  console.log(`| Amount Due       | £${defaultAmounts.amount_due}  | £${modifiedAmounts.amount_due}   | ${defaultAmounts.amount_due !== modifiedAmounts.amount_due ? '✅ YES' : '❌ NO'} |`)
  
  console.log('\n=== Test Results ===')
  
  const allTestsPass = 
    defaultAmounts.total_amount !== modifiedAmounts.total_amount &&
    defaultAmounts.deposit_amount !== modifiedAmounts.deposit_amount &&
    defaultAmounts.security_deposit !== modifiedAmounts.security_deposit &&
    defaultAmounts.amount_due !== modifiedAmounts.amount_due
  
  if (allTestsPass) {
    console.log('✅ SUCCESS: Document generation correctly uses saved charter costs from booking data!')
    console.log('✅ Modified charter costs are properly reflected in generated documents.')
    console.log('✅ Documents will show user-modified costs instead of default pricing configuration.')
  } else {
    console.log('❌ FAILURE: Document generation is not using saved charter costs correctly.')
    console.log('❌ This means documents may show incorrect pricing information.')
  }
  
  // Test 4: Test with deposit paid scenario
  console.log('\n=== Test 4: Balance Invoice with Deposit Paid ===')
  
  const paidDepositBooking = {
    ...modifiedBookingData,
    deposit_paid: true
  }
  
  const paidDepositAmounts = documentAutoGenerator.calculateAmounts('balanceInvoice', paidDepositBooking)
  console.log('With deposit paid, remaining balance should be:', `£${(2000 - 600).toFixed(2)}`)
  console.log('Calculated remaining balance:', `£${paidDepositAmounts.remaining_balance}`)
  console.log('Calculation correct:', paidDepositAmounts.remaining_balance === '1400.00' ? '✅ YES' : '❌ NO')
}

// Run the test
testDocumentGeneration().then(() => {
  console.log('\n=== All document generation tests completed ===')
}).catch(error => {
  console.error('Test suite failed:', error)
})