/**
 * Supabase Client Configuration
 * Provides centralized Supabase client instance and utility functions
 * 
 * @created 2025-06-26
 */

import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true'
const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true'

// Debug logging for production
console.log('Supabase initialization debug:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  useSupabase,
  useMockData,
  url: supabaseUrl ? `${supabaseUrl.slice(0, 20)}...` : 'missing'
})

// Validate configuration
if (useSupabase && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('Supabase configuration missing! Check your .env file')
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  console.error('Current values:', {
    VITE_SUPABASE_URL: supabaseUrl || 'undefined',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'present' : 'missing',
    VITE_USE_SUPABASE: useSupabase
  })
}

// Create Supabase client instance
export const supabase = useSupabase && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null

// Additional debug logging
console.log('Supabase client created:', !!supabase)

// Configuration helper
export const supabaseConfig = {
  enabled: useSupabase && !!supabase,
  useMockData,
  url: supabaseUrl,
  hasAuth: false // Will be updated based on auth status
}

// Connection status helper
export const checkSupabaseConnection = async () => {
  if (!supabase) {
    return {
      connected: false,
      error: 'Supabase client not initialized'
    }
  }

  try {
    // Simple test query
    const { error } = await supabase
      .from('bookings')
      .select('id')
      .limit(1)

    if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
      return {
        connected: true,
        error: 'Database connected but bookings table not found'
      }
    }

    return {
      connected: !error,
      error: error?.message || null
    }
  } catch (err) {
    return {
      connected: false,
      error: err.message
    }
  }
}

// Auth helper functions
export const supabaseAuth = {
  /**
   * Get current session
   */
  async getSession() {
    if (!supabase) return null
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  /**
   * Get current user
   */
  async getUser() {
    if (!supabase) return null
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  /**
   * Sign in with email
   */
  async signIn(email, password) {
    if (!supabase) throw new Error('Supabase not initialized')
    return await supabase.auth.signInWithPassword({ email, password })
  },

  /**
   * Sign out
   */
  async signOut() {
    if (!supabase) throw new Error('Supabase not initialized')
    return await supabase.auth.signOut()
  },

  /**
   * Subscribe to auth changes
   */
  onAuthStateChange(callback) {
    if (!supabase) return () => {}
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      supabaseConfig.hasAuth = !!session
      callback(event, session)
    })
    
    return () => subscription?.unsubscribe()
  }
}

// Table names constants
export const TABLES = {
  BOOKINGS: 'bookings',
  YACHTS: 'yachts',
  CUSTOMERS: 'customers',
  CREW_DOCUMENTS: 'crew-documents' // Storage bucket name
}

// Common query helpers
export const queryHelpers = {
  /**
   * Handle Supabase query errors
   */
  handleError(error, context = '') {
    if (error) {
      console.error(`Supabase error${context ? ` in ${context}` : ''}:`, error)
      
      // Determine error type
      if (error.message?.includes('JWT')) {
        throw new Error('Authentication required')
      } else if (error.message?.includes('violates foreign key')) {
        throw new Error('Invalid reference data')
      } else if (error.message?.includes('duplicate key')) {
        throw new Error('Record already exists')
      } else if (error.message?.includes('permission denied')) {
        throw new Error('Permission denied')
      } else {
        throw new Error(error.message || 'Database operation failed')
      }
    }
  },

  /**
   * Build date range filter
   */
  dateRangeFilter(query, field, startDate, endDate) {
    if (startDate) {
      query = query.gte(field, startDate.toISOString())
    }
    if (endDate) {
      query = query.lte(field, endDate.toISOString())
    }
    return query
  },

  /**
   * Build pagination
   */
  paginate(query, page = 1, pageSize = 50) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    return query.range(from, to)
  },

  /**
   * Build search filter
   */
  searchFilter(query, searchTerm, fields = []) {
    if (!searchTerm || fields.length === 0) return query
    
    // Build OR conditions for each field
    const orConditions = fields.map(field => 
      `${field}.ilike.%${searchTerm}%`
    ).join(',')
    
    return query.or(orConditions)
  }
}

// Real-time subscription helper
export class RealtimeSubscription {
  constructor(table, filter = null, callback = null) {
    this.table = table
    this.filter = filter
    this.callback = callback
    this.subscription = null
  }

  /**
   * Start subscription
   */
  subscribe() {
    if (!supabase || this.subscription) return

    let channel = supabase.channel(`${this.table}-changes`)

    // Configure subscription based on filter
    if (this.filter) {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.table,
          filter: this.filter
        },
        (payload) => this.handleChange(payload)
      )
    } else {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.table
        },
        (payload) => this.handleChange(payload)
      )
    }

    this.subscription = channel.subscribe()
  }

  /**
   * Handle change event
   */
  handleChange(payload) {
    if (this.callback) {
      this.callback(payload)
    }
  }

  /**
   * Unsubscribe
   */
  unsubscribe() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription)
      this.subscription = null
    }
  }
}

// Export default client
export default supabase