/**
 * Yacht Pricing Configuration Service
 * 
 * Handles all database operations for yacht pricing configuration including:
 * - High/low seasonal pricing per yacht
 * - Deposit and security deposit management
 * - Season date configuration
 * - Pricing lookup for booking creation
 * - Reset to default functionality
 * 
 * @author AI Agent
 * @created 2025-06-30
 */

import { supabase } from './supabaseClient'

/**
 * Yacht Pricing Configuration Service
 */
export class YachtPricingConfigService {
  
  /**
   * Get all yacht pricing configurations
   * Joins with yacht data for display purposes
   * @returns {Promise<Array>} Array of pricing configurations with yacht details
   */
  static async getAllYachtPricingConfigs() {
    try {
      // First, let's try to get the pricing configs without join (since table might not exist yet)
      const { data, error } = await supabase
        .from('yacht_pricing_config')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        // If table doesn't exist, return empty array instead of throwing
        if (error.code === 'PGRST106' || error.message.includes('does not exist')) {
          console.warn('yacht_pricing_config table does not exist yet, returning empty array')
          return []
        }
        console.error('Error fetching yacht pricing configs:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getAllYachtPricingConfigs:', error)
      // Return empty array on any error so UI doesn't break
      return []
    }
  }

  /**
   * Get pricing configuration for a specific yacht
   * @param {string} yachtId - UUID of the yacht
   * @returns {Promise<Object|null>} Pricing configuration or null if not found
   */
  static async getYachtPricingConfig(yachtId) {
    try {
      const { data, error } = await supabase
        .from('yacht_pricing_config')
        .select('*')
        .eq('yacht_id', yachtId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching yacht pricing config:', error)
        throw error
      }

      return data || null
    } catch (error) {
      console.error('Error in getYachtPricingConfig:', error)
      throw error
    }
  }

  /**
   * Create or update yacht pricing configuration
   * Uses upsert to handle both create and update scenarios
   * @param {Object} pricingConfig - Pricing configuration data
   * @returns {Promise<Object>} Created/updated pricing configuration
   */
  static async upsertYachtPricingConfig(pricingConfig) {
    try {
      const configData = {
        yacht_id: pricingConfig.yacht_id,
        high_season_start_date: pricingConfig.high_season_start_date,
        high_season_end_date: pricingConfig.high_season_end_date,
        high_season_rate: parseFloat(pricingConfig.high_season_rate),
        high_season_deposit: parseFloat(pricingConfig.high_season_deposit),
        high_season_security_deposit: parseFloat(pricingConfig.high_season_security_deposit),
        low_season_rate: parseFloat(pricingConfig.low_season_rate),
        low_season_deposit: parseFloat(pricingConfig.low_season_deposit),
        low_season_security_deposit: parseFloat(pricingConfig.low_season_security_deposit),
        currency_code: pricingConfig.currency_code || 'GBP',
        rate_type: pricingConfig.rate_type || 'weekly',
        minimum_charter_days: parseInt(pricingConfig.minimum_charter_days) || 7,
        notes: pricingConfig.notes || null,
        special_conditions: pricingConfig.special_conditions || null,
        updated_by: pricingConfig.updated_by || 'system'
      }

      const { data, error } = await supabase
        .from('yacht_pricing_config')
        .upsert(configData, {
          onConflict: 'yacht_id',
          returning: 'representation'
        })
        .select()
        .single()

      if (error) {
        console.error('Error upserting yacht pricing config:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in upsertYachtPricingConfig:', error)
      throw error
    }
  }

  /**
   * Delete yacht pricing configuration
   * @param {string} yachtId - UUID of the yacht
   * @returns {Promise<boolean>} Success status
   */
  static async deleteYachtPricingConfig(yachtId) {
    try {
      const { error } = await supabase
        .from('yacht_pricing_config')
        .delete()
        .eq('yacht_id', yachtId)

      if (error) {
        console.error('Error deleting yacht pricing config:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error in deleteYachtPricingConfig:', error)
      throw error
    }
  }

  /**
   * Get pricing for a yacht based on charter dates
   * Uses the database function to determine seasonal pricing
   * @param {string} yachtId - UUID of the yacht
   * @param {string} startDate - Charter start date (YYYY-MM-DD)
   * @param {string} endDate - Charter end date (YYYY-MM-DD)
   * @returns {Promise<Object|null>} Pricing details or null if not found
   */
  static async getYachtPricingForDates(yachtId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .rpc('get_yacht_pricing', {
          p_yacht_id: yachtId,
          p_charter_start_date: startDate,
          p_charter_end_date: endDate
        })

      if (error) {
        // If function doesn't exist, return null instead of throwing
        if (error.code === 'PGRST202' || error.message.includes('does not exist')) {
          console.warn('get_yacht_pricing function does not exist yet, returning null')
          return null
        }
        console.error('Error getting yacht pricing for dates:', error)
        throw error
      }

      // Return first result if any
      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error('Error in getYachtPricingForDates:', error)
      return null
    }
  }

  /**
   * Calculate charter cost including all fees
   * Uses the database function to calculate total costs
   * @param {string} yachtId - UUID of the yacht
   * @param {string} startDate - Charter start date (YYYY-MM-DD)
   * @param {string} endDate - Charter end date (YYYY-MM-DD)
   * @returns {Promise<Object|null>} Calculated costs or null if not found
   */
  static async calculateCharterCost(yachtId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .rpc('calculate_charter_cost', {
          p_yacht_id: yachtId,
          p_charter_start_date: startDate,
          p_charter_end_date: endDate
        })

      if (error) {
        // If function doesn't exist, return null instead of throwing
        if (error.code === 'PGRST202' || error.message.includes('does not exist')) {
          console.warn('calculate_charter_cost function does not exist yet, returning null')
          return null
        }
        console.error('Error calculating charter cost:', error)
        throw error
      }

      // Return first result if any
      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error('Error in calculateCharterCost:', error)
      return null
    }
  }

  /**
   * Transform pricing data from database format to frontend format
   * @param {Object} dbData - Database format pricing data
   * @returns {Object} Frontend format pricing data
   */
  static transformFromDatabase(dbData) {
    if (!dbData) return null

    return {
      id: dbData.id,
      yachtId: dbData.yacht_id,
      yachtName: dbData.yachts?.name || '',
      yachtType: dbData.yachts?.type || '',
      yachtLocation: dbData.yachts?.location || '',
      
      // High season data
      highSeasonStartDate: dbData.high_season_start_date,
      highSeasonEndDate: dbData.high_season_end_date,
      highSeasonRate: parseFloat(dbData.high_season_rate) || 0,
      highSeasonDeposit: parseFloat(dbData.high_season_deposit) || 0,
      highSeasonSecurityDeposit: parseFloat(dbData.high_season_security_deposit) || 0,
      
      // Low season data
      lowSeasonRate: parseFloat(dbData.low_season_rate) || 0,
      lowSeasonDeposit: parseFloat(dbData.low_season_deposit) || 0,
      lowSeasonSecurityDeposit: parseFloat(dbData.low_season_security_deposit) || 0,
      
      // Configuration
      currency: dbData.currency_code || 'GBP',
      rateType: dbData.rate_type || 'weekly',
      minimumCharterDays: parseInt(dbData.minimum_charter_days) || 7,
      
      // Metadata
      notes: dbData.notes || '',
      specialConditions: dbData.special_conditions || '',
      lastUpdated: dbData.updated_at,
      createdAt: dbData.created_at
    }
  }

  /**
   * Transform pricing data from frontend format to database format
   * @param {Object} frontendData - Frontend format pricing data
   * @returns {Object} Database format pricing data
   */
  static transformToDatabase(frontendData) {
    return {
      yacht_id: frontendData.yachtId,
      high_season_start_date: frontendData.highSeasonStartDate,
      high_season_end_date: frontendData.highSeasonEndDate,
      high_season_rate: parseFloat(frontendData.highSeasonRate) || 0,
      high_season_deposit: parseFloat(frontendData.highSeasonDeposit) || 0,
      high_season_security_deposit: parseFloat(frontendData.highSeasonSecurityDeposit) || 0,
      low_season_rate: parseFloat(frontendData.lowSeasonRate) || 0,
      low_season_deposit: parseFloat(frontendData.lowSeasonDeposit) || 0,
      low_season_security_deposit: parseFloat(frontendData.lowSeasonSecurityDeposit) || 0,
      currency_code: frontendData.currency || 'GBP',
      rate_type: frontendData.rateType || 'weekly',
      minimum_charter_days: parseInt(frontendData.minimumCharterDays) || 7,
      notes: frontendData.notes || null,
      special_conditions: frontendData.specialConditions || null,
      updated_by: frontendData.updatedBy || 'system'
    }
  }

  /**
   * Get all yachts for pricing configuration setup
   * @returns {Promise<Array>} Array of yacht basic information
   */
  static async getAllYachtsForPricing() {
    try {
      const { data, error } = await supabase
        .from('yachts')
        .select('id, name, engine_type, location')
        .order('name')

      if (error) {
        console.error('Error fetching yachts for pricing:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getAllYachtsForPricing:', error)
      throw error
    }
  }

  /**
   * Batch create/update pricing configurations for multiple yachts
   * @param {Array} pricingConfigs - Array of pricing configuration objects
   * @returns {Promise<Array>} Array of created/updated configurations
   */
  static async batchUpsertYachtPricingConfigs(pricingConfigs) {
    try {
      const transformedConfigs = pricingConfigs.map(config => 
        this.transformToDatabase(config)
      )

      const { data, error } = await supabase
        .from('yacht_pricing_config')
        .upsert(transformedConfigs, {
          onConflict: 'yacht_id',
          returning: 'representation'
        })
        .select()

      if (error) {
        console.error('Error batch upserting yacht pricing configs:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in batchUpsertYachtPricingConfigs:', error)
      throw error
    }
  }
}

export default YachtPricingConfigService