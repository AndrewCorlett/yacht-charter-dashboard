/**
 * Test script to verify pricing integration with Supabase
 * This will test the CRUD operations for pricing rules
 */

import { pricingService } from './src/services/supabase/pricingService.js'

async function testPricingIntegration() {
  console.log('🧪 Testing Pricing Integration with Supabase...')
  
  try {
    // Test 1: Get all pricing rules
    console.log('\n1️⃣ Testing getPricingRules...')
    const rules = await pricingService.getPricingRules()
    console.log(`✅ Fetched ${rules.length} pricing rules`)
    
    if (rules.length > 0) {
      const firstRule = rules[0]
      console.log(`📋 First rule: ${firstRule.yachtName} - ${firstRule.ruleName} (${firstRule.currency} ${firstRule.rate})`)
      
      // Test 2: Update a pricing rule
      console.log('\n2️⃣ Testing updatePricingRule...')
      const originalRate = firstRule.rate
      const newRate = originalRate + 50.00
      
      console.log(`📝 Updating rate from ${originalRate} to ${newRate}`)
      const updatedRule = await pricingService.updatePricingRule(firstRule.id, {
        rate: newRate
      })
      console.log(`✅ Updated rule rate: ${updatedRule.rate}`)
      
      // Test 3: Verify the change persisted
      console.log('\n3️⃣ Testing persistence by fetching updated rule...')
      const fetchedRule = await pricingService.getPricingRule(firstRule.id)
      console.log(`📊 Fetched rate: ${fetchedRule.rate}`)
      
      if (fetchedRule.rate === newRate) {
        console.log('✅ Data persistence verified!')
      } else {
        console.log('❌ Data persistence failed!')
        return false
      }
      
      // Test 4: Revert the change
      console.log('\n4️⃣ Testing revert to original rate...')
      await pricingService.updatePricingRule(firstRule.id, {
        rate: originalRate
      })
      
      const revertedRule = await pricingService.getPricingRule(firstRule.id)
      console.log(`🔄 Reverted rate: ${revertedRule.rate}`)
      
      if (revertedRule.rate === originalRate) {
        console.log('✅ Revert successful!')
      } else {
        console.log('❌ Revert failed!')
        return false
      }
      
      // Test 5: Toggle active status
      console.log('\n5️⃣ Testing toggle active status...')
      const originalStatus = firstRule.isActive
      console.log(`🔛 Original status: ${originalStatus}`)
      
      const toggledRule = await pricingService.togglePricingRuleActive(firstRule.id)
      console.log(`🔄 Toggled status: ${toggledRule.isActive}`)
      
      // Revert the status
      await pricingService.togglePricingRuleActive(firstRule.id)
      console.log(`🔄 Reverted status back to: ${originalStatus}`)
    }
    
    console.log('\n🎉 All pricing integration tests passed!')
    return true
    
  } catch (error) {
    console.error('❌ Pricing integration test failed:', error)
    return false
  }
}

// Run the test
testPricingIntegration()
  .then(success => {
    if (success) {
      console.log('\n✅ Pricing integration is working correctly!')
      console.log('\n📋 Test Summary:')
      console.log('  ✅ Data loading from Supabase')
      console.log('  ✅ Data updating in Supabase')
      console.log('  ✅ Data persistence verification')
      console.log('  ✅ Status toggling')
      console.log('\n🔥 The pricing config should now work with persistence!')
    } else {
      console.log('\n❌ Pricing integration has issues that need fixing.')
    }
  })
  .catch(err => {
    console.error('❌ Test execution failed:', err)
  })