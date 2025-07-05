/**
 * Pricing Service
 * 
 * Handles CRUD operations for yacht pricing rules using Supabase
 * 
 * @created 2025-06-29
 */

import { supabase } from '../../lib/supabase'

export const pricingService = {
  /**
   * Get all pricing rules
   */
  async getPricingRules() {
    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    const { data, error } = await supabase
      .from('pricing_rules')
      .select(`
        *,
        yachts (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pricing rules:', error)
      throw error
    }

    // Transform the data to match the frontend format
    return data.map(rule => ({
      id: rule.id,
      yachtId: rule.yacht_id,
      yachtName: rule.yachts?.name || 'Unknown Yacht',
      ruleName: rule.rule_name,
      ruleType: rule.seasonal_multiplier !== 1.00 ? 'seasonal' : 'base',
      rate: parseFloat(rule.base_rate),
      currency: 'GBP', // Default currency
      rateType: 'day',
      startDate: rule.start_date,
      endDate: rule.end_date,
      minHours: (rule.minimum_days || 1) * 24, // Convert days to hours
      minDays: rule.minimum_days || 1,
      seasonalMultiplier: parseFloat(rule.seasonal_multiplier || 1.00),
      priority: rule.seasonal_multiplier !== 1.00 ? 2 : 1, // Higher priority for seasonal rates
      isActive: rule.is_active,
      createdAt: rule.created_at,
      updatedAt: rule.updated_at
    }))
  },

  /**
   * Get pricing rule by ID
   */
  async getPricingRule(id) {
    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    const { data, error } = await supabase
      .from('pricing_rules')
      .select(`
        *,
        yachts (
          id,
          name
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching pricing rule:', error)
      throw error
    }

    // Transform the data to match the frontend format
    return {
      id: data.id,
      yachtId: data.yacht_id,
      yachtName: data.yachts?.name || 'Unknown Yacht',
      ruleName: data.rule_name,
      ruleType: data.seasonal_multiplier !== 1.00 ? 'seasonal' : 'base',
      rate: parseFloat(data.base_rate),
      currency: 'GBP',
      rateType: 'day',
      startDate: data.start_date,
      endDate: data.end_date,
      minHours: (data.minimum_days || 1) * 24,
      minDays: data.minimum_days || 1,
      seasonalMultiplier: parseFloat(data.seasonal_multiplier || 1.00),
      priority: data.seasonal_multiplier !== 1.00 ? 2 : 1,
      isActive: data.is_active,
      // Enhanced fields for charter costs
      charterTotal: data.charter_total ? parseFloat(data.charter_total) : null,
      depositAmount: data.deposit_amount ? parseFloat(data.deposit_amount) : null,
      securityDeposit: data.security_deposit ? parseFloat(data.security_deposit) : null,
      seasonType: data.season_type,
      seasonStartDate: data.season_start_date,
      seasonEndDate: data.season_end_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  },

  /**
   * Create new pricing rule
   */
  async createPricingRule(ruleData) {
    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    // Transform frontend data to database format
    const dbData = {
      yacht_id: ruleData.yachtId,
      rule_name: ruleData.ruleName,
      start_date: ruleData.startDate,
      end_date: ruleData.endDate,
      base_rate: ruleData.rate,
      seasonal_multiplier: ruleData.seasonalMultiplier || 1.00,
      minimum_days: ruleData.minDays || Math.ceil((ruleData.minHours || 24) / 24),
      is_active: ruleData.isActive !== undefined ? ruleData.isActive : true
    }

    const { data, error } = await supabase
      .from('pricing_rules')
      .insert([dbData])
      .select(`
        *,
        yachts (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('Error creating pricing rule:', error)
      throw error
    }

    return {
      id: data.id,
      yachtId: data.yacht_id,
      yachtName: data.yachts?.name || 'Unknown Yacht',
      ruleName: data.rule_name,
      ruleType: data.seasonal_multiplier !== 1.00 ? 'seasonal' : 'base',
      rate: parseFloat(data.base_rate),
      currency: 'GBP',
      rateType: 'day',
      startDate: data.start_date,
      endDate: data.end_date,
      minHours: (data.minimum_days || 1) * 24,
      minDays: data.minimum_days || 1,
      seasonalMultiplier: parseFloat(data.seasonal_multiplier || 1.00),
      priority: data.seasonal_multiplier !== 1.00 ? 2 : 1,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  },

  /**
   * Update pricing rule
   */
  async updatePricingRule(id, updates) {
    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    // Transform frontend data to database format
    const dbUpdates = {}
    
    if (updates.yachtId !== undefined) dbUpdates.yacht_id = updates.yachtId
    if (updates.ruleName !== undefined) dbUpdates.rule_name = updates.ruleName
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate
    if (updates.rate !== undefined) dbUpdates.base_rate = updates.rate
    if (updates.seasonalMultiplier !== undefined) dbUpdates.seasonal_multiplier = updates.seasonalMultiplier
    if (updates.minDays !== undefined) dbUpdates.minimum_days = updates.minDays
    if (updates.minHours !== undefined) dbUpdates.minimum_days = Math.ceil(updates.minHours / 24)
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive

    const { data, error } = await supabase
      .from('pricing_rules')
      .update(dbUpdates)
      .eq('id', id)
      .select(`
        *,
        yachts (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('Error updating pricing rule:', error)
      throw error
    }

    return {
      id: data.id,
      yachtId: data.yacht_id,
      yachtName: data.yachts?.name || 'Unknown Yacht',
      ruleName: data.rule_name,
      ruleType: data.seasonal_multiplier !== 1.00 ? 'seasonal' : 'base',
      rate: parseFloat(data.base_rate),
      currency: 'GBP',
      rateType: 'day',
      startDate: data.start_date,
      endDate: data.end_date,
      minHours: (data.minimum_days || 1) * 24,
      minDays: data.minimum_days || 1,
      seasonalMultiplier: parseFloat(data.seasonal_multiplier || 1.00),
      priority: data.seasonal_multiplier !== 1.00 ? 2 : 1,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  },

  /**
   * Delete pricing rule
   */
  async deletePricingRule(id) {
    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    const { error } = await supabase
      .from('pricing_rules')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting pricing rule:', error)
      throw error
    }

    return true
  },

  /**
   * Toggle pricing rule active status
   */
  async togglePricingRuleActive(id) {
    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    // First get the current status
    const { data: currentRule, error: fetchError } = await supabase
      .from('pricing_rules')
      .select('is_active')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching pricing rule status:', fetchError)
      throw fetchError
    }

    // Toggle the status
    return this.updatePricingRule(id, { isActive: !currentRule.is_active })
  },

  /**
   * Get pricing rules for a specific yacht
   */
  async getPricingRulesForYacht(yachtId) {
    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    const { data, error } = await supabase
      .from('pricing_rules')
      .select(`
        *,
        yachts (
          id,
          name
        )
      `)
      .eq('yacht_id', yachtId)
      .eq('is_active', true)
      .order('seasonal_multiplier', { ascending: false }) // Seasonal rates first

    if (error) {
      console.error('Error fetching pricing rules for yacht:', error)
      throw error
    }

    return data.map(rule => ({
      id: rule.id,
      yachtId: rule.yacht_id,
      yachtName: rule.yachts?.name || 'Unknown Yacht',
      ruleName: rule.rule_name,
      ruleType: rule.seasonal_multiplier !== 1.00 ? 'seasonal' : 'base',
      rate: parseFloat(rule.base_rate),
      currency: 'GBP',
      rateType: 'day',
      startDate: rule.start_date,
      endDate: rule.end_date,
      minHours: (rule.minimum_days || 1) * 24,
      minDays: rule.minimum_days || 1,
      seasonalMultiplier: parseFloat(rule.seasonal_multiplier || 1.00),
      priority: rule.seasonal_multiplier !== 1.00 ? 2 : 1,
      isActive: rule.is_active,
      // Enhanced fields for charter costs
      charterTotal: rule.charter_total ? parseFloat(rule.charter_total) : null,
      depositAmount: rule.deposit_amount ? parseFloat(rule.deposit_amount) : null,
      securityDeposit: rule.security_deposit ? parseFloat(rule.security_deposit) : null,
      seasonType: rule.season_type,
      seasonStartDate: rule.season_start_date,
      seasonEndDate: rule.season_end_date,
      createdAt: rule.created_at,
      updatedAt: rule.updated_at
    }))
  }
}

export default pricingService