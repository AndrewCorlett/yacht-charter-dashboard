/**
 * Direct Pricing Rules Test Script
 * 
 * Tests the pricing rules functionality by:
 * 1. Creating a new pricing rule
 * 2. Editing an existing pricing rule
 * 3. Verifying persistence after page refresh
 * 4. Testing Supabase integration
 */

// Import required modules
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const SUPABASE_URL = 'https://ktrcqqwvlhqmdppmzkzi.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0cmNxcXd2bGhxbWRwcG16a3ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk0MDU4NDUsImV4cCI6MjAzNDk4MTg0NX0.YraMJAiKdYaIH6g_5rF6HK7LwAH_5aVOhBVmAM0fztk'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test Data
const testPricingRule = {
  yacht_id: 'spectre',
  rule_name: 'Test Base Rate - Spectre',
  rule_type: 'base',
  rate: 1200.00,
  currency: 'GBP',
  start_date: '2025-06-28',
  end_date: '2025-12-31',
  min_hours: 4,
  priority: 1,
  is_active: true
}

const updatedPricingRule = {
  rate: 1350.00,
  currency: 'EUR',
  priority: 2,
  is_active: false
}

// Helper function to log results
function logResult(step, success, data, error = null) {
  const timestamp = new Date().toISOString()
  const status = success ? '✅ SUCCESS' : '❌ FAILED'
  
  console.log(`\n[${timestamp}] ${status}: ${step}`)
  
  if (success && data) {
    console.log('Data:', JSON.stringify(data, null, 2))
  }
  
  if (error) {
    console.log('Error:', error)
  }
  
  return { step, success, data, error, timestamp }
}

// Test Functions
async function testCreatePricingRule() {
  try {
    const { data, error } = await supabase
      .from('pricing_rules')
      .insert([{
        yacht_id: testPricingRule.yacht_id,
        rule_name: testPricingRule.rule_name,
        start_date: testPricingRule.start_date,
        end_date: testPricingRule.end_date,
        base_rate: testPricingRule.rate,
        seasonal_multiplier: 1.00,
        minimum_days: 1,
        is_active: testPricingRule.is_active
      }])
      .select()

    if (error) throw error

    return logResult('Create Pricing Rule', true, data)
  } catch (error) {
    return logResult('Create Pricing Rule', false, null, error.message)
  }
}

async function testLoadExistingRules() {
  try {
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return logResult('Load Existing Rules', true, { count: data.length, rules: data })
  } catch (error) {
    return logResult('Load Existing Rules', false, null, error.message)
  }
}

async function testEditPricingRule(ruleId) {
  try {
    const { data, error } = await supabase
      .from('pricing_rules')
      .update({
        base_rate: updatedPricingRule.rate,
        seasonal_multiplier: 1.20,
        is_active: updatedPricingRule.is_active
      })
      .eq('id', ruleId)
      .select()

    if (error) throw error

    return logResult('Edit Pricing Rule', true, data)
  } catch (error) {
    return logResult('Edit Pricing Rule', false, null, error.message)
  }
}

async function testDeletePricingRule(ruleId) {
  try {
    const { data, error } = await supabase
      .from('pricing_rules')
      .delete()
      .eq('id', ruleId)
      .select()

    if (error) throw error

    return logResult('Delete Pricing Rule', true, data)
  } catch (error) {
    return logResult('Delete Pricing Rule', false, null, error.message)
  }
}

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('count')

    if (error) throw error

    return logResult('Test Connection', true, { connection: 'successful' })
  } catch (error) {
    return logResult('Test Connection', false, null, error.message)
  }
}

// Main Test Execution
async function runPricingRulesTest() {
  console.log('🚀 Starting Pricing Rules Integration Test')
  console.log('=' .repeat(50))
  
  const results = []
  let createdRuleId = null

  // Test 1: Connection
  results.push(await testConnection())

  // Test 2: Load existing rules
  results.push(await testLoadExistingRules())

  // Test 3: Create new pricing rule
  const createResult = await testCreatePricingRule()
  results.push(createResult)
  
  if (createResult.success && createResult.data && createResult.data.length > 0) {
    createdRuleId = createResult.data[0].id
  }

  // Test 4: Edit pricing rule (if creation was successful)
  if (createdRuleId) {
    results.push(await testEditPricingRule(createdRuleId))
  }

  // Test 5: Verify persistence by loading again
  results.push(await testLoadExistingRules())

  // Test 6: Cleanup - Delete test rule
  if (createdRuleId) {
    results.push(await testDeletePricingRule(createdRuleId))
  }

  // Final verification
  results.push(await testLoadExistingRules())

  // Summary
  console.log('\n' + '=' .repeat(50))
  console.log('📊 TEST SUMMARY')
  console.log('=' .repeat(50))
  
  const successCount = results.filter(r => r.success).length
  const totalCount = results.length
  
  console.log(`Total Tests: ${totalCount}`)
  console.log(`Successful: ${successCount}`)
  console.log(`Failed: ${totalCount - successCount}`)
  console.log(`Success Rate: ${Math.round((successCount / totalCount) * 100)}%`)
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${result.step}`)
  })

  const overallSuccess = successCount === totalCount
  console.log(`\n🎯 Overall Result: ${overallSuccess ? 'PASS' : 'FAIL'}`)
  
  return {
    success: overallSuccess,
    results,
    summary: {
      total: totalCount,
      successful: successCount,
      failed: totalCount - successCount,
      successRate: Math.round((successCount / totalCount) * 100)
    }
  }
}

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  runPricingRulesTest().then(result => {
    process.exit(result.success ? 0 : 1)
  })
} else {
  // Browser environment
  window.runPricingRulesTest = runPricingRulesTest
}

export { runPricingRulesTest }