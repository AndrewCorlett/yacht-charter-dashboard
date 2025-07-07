import { useState, useEffect } from 'react'
import { pricingService } from '../../services/supabase/pricingService'
import YachtPricingConfigService from '../../services/supabase/yachtPricingConfigService'
import unifiedDataService from '../../services/UnifiedDataService'

function CharterCostSection({ yacht, startDate, endDate, onCostChange, forceRefresh, bookingId, onSave, initialCosts }) {
  const [costs, setCosts] = useState({
    charterCost: initialCosts?.charterCost || 0,
    deposit: initialCosts?.deposit || 0,
    securityDeposit: initialCosts?.securityDeposit || 0
  })
  
  const [originalCosts, setOriginalCosts] = useState({
    charterCost: initialCosts?.charterCost || 0,
    deposit: initialCosts?.deposit || 0,
    securityDeposit: initialCosts?.securityDeposit || 0
  })
  
  const [isOverridden, setIsOverridden] = useState({
    charterCost: false,
    deposit: false,
    securityDeposit: false
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Update costs when initialCosts prop changes
  useEffect(() => {
    if (initialCosts) {
      setCosts({
        charterCost: initialCosts.charterCost || 0,
        deposit: initialCosts.deposit || 0,
        securityDeposit: initialCosts.securityDeposit || 0
      })
      setOriginalCosts({
        charterCost: initialCosts.charterCost || 0,
        deposit: initialCosts.deposit || 0,
        securityDeposit: initialCosts.securityDeposit || 0
      })
    }
  }, [initialCosts])

  // Load pricing data when yacht or dates change, or when forced to refresh
  useEffect(() => {
    if (yacht && startDate && endDate) {
      loadPricingData()
    }
  }, [yacht, startDate, endDate, forceRefresh])

  // Notify parent of cost changes - use useCallback to prevent infinite loops
  useEffect(() => {
    if (onCostChange && (costs.charterCost > 0 || costs.deposit > 0 || costs.securityDeposit > 0)) {
      onCostChange(costs)
    }
  }, [costs.charterCost, costs.deposit, costs.securityDeposit])

  const loadPricingData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading pricing for yacht:', yacht, 'dates:', startDate, 'to', endDate)
      console.log('Yacht type:', typeof yacht, 'Start date type:', typeof startDate, 'End date type:', typeof endDate)
      
      if (!yacht || !startDate || !endDate) {
        console.log('Missing required data for pricing calculation:', {
          yacht: yacht || 'missing',
          startDate: startDate || 'missing', 
          endDate: endDate || 'missing'
        })
        const defaultCosts = getDefaultCosts()
        setCosts(defaultCosts)
        setOriginalCosts(defaultCosts)
        setLoading(false)
        return
      }

      try {
        // First, let's try to get the yacht ID from the yacht identifier (name or ID)
        const yachtId = await getYachtIdByName(yacht)
        
        if (yachtId) {
          // Try new yacht pricing configuration service first
          try {
            const calculatedCosts = await YachtPricingConfigService.calculateCharterCost(yachtId, startDate, endDate)
            console.log('Calculated costs from yacht pricing config:', calculatedCosts)
            
            if (calculatedCosts) {
              const costData = {
                charterCost: calculatedCosts.total_charter_cost || 0,
                deposit: calculatedCosts.deposit_amount || 0,
                securityDeposit: calculatedCosts.security_deposit_amount || 0
              }
              
              setCosts(costData)
              setOriginalCosts(costData)
              setIsOverridden({
                charterCost: false,
                deposit: false,
                securityDeposit: false
              })
              console.log('Using calculated costs from yacht pricing config:', costData)
              return
            }
          } catch (configError) {
            console.warn('Yacht pricing config not available, falling back to pricing rules:', configError)
          }
          
          // Fallback to old pricing rules system
          const pricingRules = await pricingService.getPricingRulesForYacht(yachtId)
          console.log('Found pricing rules:', pricingRules)
          
          if (pricingRules && pricingRules.length > 0) {
            // Find applicable pricing rule based on dates
            const applicableRule = findApplicablePricingRule(pricingRules, startDate, endDate)
            console.log('Applicable rule:', applicableRule)
            
            if (applicableRule) {
              const calculatedCosts = calculateCosts(applicableRule, startDate, endDate)
              setCosts(calculatedCosts)
              setOriginalCosts(calculatedCosts)
              setIsOverridden({
                charterCost: false,
                deposit: false,
                securityDeposit: false
              })
              console.log('Using calculated costs from pricing rules:', calculatedCosts)
              return
            }
          }
        }
        
        // Fallback: No rules found or yacht ID not found, calculate based on yacht name
        console.log('No pricing rules found, using fallback calculation')
        const yachtInfo = await getYachtInfo(yacht)
        const yachtName = yachtInfo?.name || yacht
        const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
        const baseRate = getBaseRateForYacht(yachtName)
        const charterCost = baseRate * days
        const deposit = charterCost * 0.3
        const securityDeposit = 500
        
        const calculatedCosts = {
          charterCost: Math.round(charterCost * 100) / 100,
          deposit: Math.round(deposit * 100) / 100,
          securityDeposit: Math.round(securityDeposit * 100) / 100
        }
        
        setCosts(calculatedCosts)
        setOriginalCosts(calculatedCosts)
        setIsOverridden({
          charterCost: false,
          deposit: false,
          securityDeposit: false
        })
        
      } catch (pricingError) {
        console.error('Error fetching pricing rules:', pricingError)
        // Use fallback calculation on pricing service error
        const days = startDate && endDate ? 
          Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) : 7
        
        const yachtInfo = await getYachtInfo(yacht)
        const yachtName = yachtInfo?.name || yacht
        const baseRate = getBaseRateForYacht(yachtName)
        const charterCost = baseRate * days
        const deposit = charterCost * 0.3
        const securityDeposit = 500
        
        const calculatedCosts = {
          charterCost: Math.round(charterCost * 100) / 100,
          deposit: Math.round(deposit * 100) / 100,
          securityDeposit: Math.round(securityDeposit * 100) / 100
        }
        
        setCosts(calculatedCosts)
        setOriginalCosts(calculatedCosts)
        setIsOverridden({
          charterCost: false,
          deposit: false,
          securityDeposit: false
        })
      }
      
    } catch (err) {
      console.error('Error loading pricing data:', err)
      setError('Failed to load pricing data, using defaults')
      
      // Use default values on error
      const defaultCosts = getDefaultCosts()
      setCosts(defaultCosts)
      setOriginalCosts(defaultCosts)
    } finally {
      setLoading(false)
    }
  }

  const getYachtInfo = async (yachtIdentifier) => {
    try {
      // Import yacht service to get yacht info by name or ID
      const yachtService = await import('../../services/supabase/YachtService')
      const yachts = await yachtService.default.getYachts()
      
      // Check if yachtIdentifier is already a UUID (contains hyphens)
      if (yachtIdentifier && yachtIdentifier.includes('-')) {
        // It's likely a UUID, find by ID
        const yacht = yachts.find(y => y.id === yachtIdentifier)
        return yacht ? { id: yacht.id, name: yacht.name } : null
      } else {
        // It's a yacht name, find by name
        const yacht = yachts.find(y => y.name === yachtIdentifier)
        return yacht ? { id: yacht.id, name: yacht.name } : null
      }
    } catch (error) {
      console.error('Error getting yacht info:', error)
      return null
    }
  }

  const getYachtIdByName = async (yachtIdentifier) => {
    const yachtInfo = await getYachtInfo(yachtIdentifier)
    return yachtInfo?.id || null
  }

  const getBaseRateForYacht = (yachtName) => {
    // Basic yacht pricing until database is ready
    const rates = {
      'Calico Moon': 250,
      'Spectre': 300,
      'Alrisha': 280,
      'Disk Drive': 320,
      'Zavaria': 290,
      'Mridula Sarwar': 270
    }
    return rates[yachtName] || 250
  }

  const findApplicablePricingRule = (rules, start, end) => {
    // Convert dates to Date objects for comparison
    const startDateObj = new Date(start)
    const endDateObj = new Date(end)
    
    // Find rule that overlaps with the booking period
    return rules.find(rule => {
      if (!rule.startDate || !rule.endDate) return false
      
      const ruleStart = new Date(rule.startDate)
      const ruleEnd = new Date(rule.endDate)
      
      // Check if booking period overlaps with rule period
      return startDateObj <= ruleEnd && endDateObj >= ruleStart && rule.isActive
    })
  }

  const calculateCosts = (rule, start, end) => {
    const startDateObj = new Date(start)
    const endDateObj = new Date(end)
    const days = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24))
    
    console.log('Calculating costs with rule:', rule)
    console.log('Days:', days)
    
    // Use charter total from rule if available, otherwise calculate from daily rate
    let charterCost
    if (rule.charterTotal && rule.charterTotal > 0) {
      // Use fixed charter total from pricing rule
      charterCost = rule.charterTotal
      console.log('Using fixed charter total:', charterCost)
    } else {
      // Calculate from daily rate
      const dailyRate = rule.rate || 0
      const multiplier = rule.seasonalMultiplier || 1
      charterCost = dailyRate * multiplier * days
      console.log('Calculated from daily rate:', dailyRate, 'x', multiplier, 'x', days, '=', charterCost)
    }
    
    // Use deposit amount from rule if available, otherwise calculate as percentage
    let deposit
    if (rule.depositAmount && rule.depositAmount > 0) {
      deposit = rule.depositAmount
      console.log('Using fixed deposit amount:', deposit)
    } else {
      deposit = charterCost * 0.3 // 30% default
      console.log('Calculated deposit as 30%:', deposit)
    }
    
    // Use security deposit from rule if available, otherwise use default
    let securityDeposit
    if (rule.securityDeposit && rule.securityDeposit > 0) {
      securityDeposit = rule.securityDeposit
      console.log('Using rule security deposit:', securityDeposit)
    } else {
      securityDeposit = 500 // Default fallback
      console.log('Using default security deposit:', securityDeposit)
    }
    
    const result = {
      charterCost: Math.round(charterCost * 100) / 100,
      deposit: Math.round(deposit * 100) / 100,
      securityDeposit: Math.round(securityDeposit * 100) / 100
    }
    
    console.log('Final calculated costs:', result)
    return result
  }

  const getDefaultCosts = () => {
    return {
      charterCost: 1500,
      deposit: 450,
      securityDeposit: 500
    }
  }

  const handleCostChange = (field, value) => {
    const numericValue = parseFloat(value) || 0
    
    setCosts(prev => ({
      ...prev,
      [field]: numericValue
    }))
    
    // Mark as overridden if different from original
    setIsOverridden(prev => ({
      ...prev,
      [field]: numericValue !== originalCosts[field]
    }))
  }

  const resetToDefault = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Resetting charter costs to pricing configuration...')
      
      // Get yacht ID and recalculate costs from pricing configuration
      const yachtId = await getYachtIdByName(yacht)
      
      if (yachtId && startDate && endDate) {
        try {
          // Try to get fresh pricing from configuration
          console.log('Fetching fresh pricing for yacht:', yachtId, 'dates:', startDate, 'to', endDate)
          const calculatedCosts = await YachtPricingConfigService.calculateCharterCost(yachtId, startDate, endDate)
          
          if (calculatedCosts) {
            const costData = {
              charterCost: calculatedCosts.total_charter_cost || 0,
              deposit: calculatedCosts.deposit_amount || 0,
              securityDeposit: calculatedCosts.security_deposit_amount || 0
            }
            
            setCosts(costData)
            setOriginalCosts(costData)
            setIsOverridden({
              charterCost: false,
              deposit: false,
              securityDeposit: false
            })
            console.log('Successfully reset to pricing configuration costs:', costData)
            
            // Show success feedback
            setError(null)
            return
          } else {
            console.warn('No pricing configuration found for this yacht and dates')
            setError('No pricing configuration found for this yacht and dates. Using fallback calculation.')
          }
        } catch (configError) {
          console.warn('Could not fetch pricing configuration:', configError)
          setError('Could not fetch pricing configuration. Using fallback calculation.')
        }
      } else {
        console.warn('Missing yacht ID or dates for pricing calculation:', {
          yacht: yacht || 'missing',
          yachtId: yachtId || 'missing',
          startDate: startDate || 'missing',
          endDate: endDate || 'missing'
        })
        setError('Missing yacht or date information for pricing calculation.')
      }
      
      // Fallback: reload pricing data from scratch
      console.log('Falling back to reload pricing data')
      await loadPricingData()
      
    } catch (error) {
      console.error('Error resetting to pricing configuration:', error)
      setError('Failed to reset pricing. Please try again.')
      
      // Fallback to originally loaded costs
      setCosts(originalCosts)
      setIsOverridden({
        charterCost: false,
        deposit: false,
        securityDeposit: false
      })
    } finally {
      setLoading(false)
    }
  }

  const hasAnyOverrides = Object.values(isOverridden).some(override => override)

  const handleSave = async () => {
    if (!bookingId) {
      console.warn('No booking ID provided, cannot save charter costs')
      setError('Cannot save: No booking ID provided')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSaveSuccess(false)
      
      console.log('Saving charter costs to booking:', bookingId, costs)
      
      // Prepare the update data with charter cost fields mapped to database schema
      const updateData = {
        total_amount: costs.charterCost,
        deposit_amount: costs.deposit,
        security_deposit: costs.securityDeposit
      }
      
      // Update the booking via UnifiedDataService
      await unifiedDataService.updateBooking(bookingId, updateData)
      
      // Show success feedback
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      
      // Call parent onSave callback if provided
      if (onSave) {
        onSave(costs)
      }
      
      console.log('Charter costs saved successfully')
      
    } catch (error) {
      console.error('Failed to save charter costs:', error)
      setError(`Failed to save charter costs: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Charter Costs</h3>
        <button
          onClick={resetToDefault}
          className="px-3 py-1 text-white text-sm rounded transition-colors bg-blue-600 hover:bg-blue-700"
          disabled={loading}
          title="Refresh costs from pricing configuration"
        >
          🔄 Refresh from Config
        </button>
      </div>

      {/* Orange "differs from default" indicator */}
      {hasAnyOverrides && (
        <div className="mb-4 p-2 bg-orange-900/30 border border-orange-600 rounded text-orange-300 text-sm">
          ⚠️ Differs from default
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded text-red-300 text-sm">
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-900/20 border border-green-500 rounded text-green-300 text-sm">
          ✓ Charter costs saved successfully
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-400">Loading pricing data...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Three-column grid layout for cost fields */}
          <div className="grid grid-cols-3 gap-4">
            {/* Charter Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Charter Cost (£)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costs.charterCost}
                onChange={(e) => handleCostChange('charterCost', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            {/* Deposit */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Deposit (£)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costs.deposit}
                onChange={(e) => handleCostChange('deposit', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            {/* Security Deposit */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Security Deposit (£)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costs.securityDeposit}
                onChange={(e) => handleCostChange('securityDeposit', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Cost Summary */}
          <div className="pt-3 border-t border-gray-700">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Total Charter Cost:</span>
              <span>£{costs.charterCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Total Deposits:</span>
              <span>£{(costs.deposit + costs.securityDeposit).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-medium text-white mt-2 pt-2 border-t border-gray-600">
              <span>Total Amount:</span>
              <span>£{(costs.charterCost + costs.deposit + costs.securityDeposit).toFixed(2)}</span>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className={`font-medium py-2 px-6 rounded transition-colors ${
                saving
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
              disabled={loading || saving || !bookingId}
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </div>
              ) : (
                'Save Charter Costs'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CharterCostSection