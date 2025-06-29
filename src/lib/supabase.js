import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check for environment variables but don't throw error immediately
const hasRequiredEnvVars = !!(supabaseUrl && supabaseAnonKey)
const shouldUseSupabase = import.meta.env.VITE_USE_SUPABASE === 'true'

if (shouldUseSupabase && !hasRequiredEnvVars) {
  console.warn('Supabase configuration missing, falling back to mock data')
  console.warn('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

// Singleton pattern to ensure only one client instance
let supabaseInstance = null

export const supabase = (() => {
  // Only create client if we have required environment variables
  if (!supabaseInstance && hasRequiredEnvVars && shouldUseSupabase) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window?.localStorage
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  }
  return supabaseInstance
})()

// Configuration helper (consistent with supabaseClient.js)
export const supabaseConfig = {
  enabled: !!(supabase && shouldUseSupabase),
  hasRequiredEnvVars,
  shouldUseSupabase,
  url: supabaseUrl
}

// Only create admin client when needed and service role key is available
export const getSupabaseAdmin = () => {
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    console.warn('Service role key not available, using regular client')
    return supabase
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Database helper functions
export const db = {
  // Check if Supabase is available
  isAvailable() {
    return !!(supabase && supabaseConfig.enabled)
  },

  // Get all bookings
  async getBookings() {
    if (!this.isAvailable()) {
      throw new Error('Supabase client not available - check configuration')
    }
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get booking by ID
  async getBooking(id) {
    if (!this.isAvailable()) {
      throw new Error('Supabase client not available - check configuration')
    }
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Create new booking
  async createBooking(booking) {
    if (!this.isAvailable()) {
      throw new Error('Supabase client not available - check configuration')
    }
    
    // Transform camelCase fields to snake_case for database
    const transformedBooking = this.transformFieldNames(booking)
    
    const { data, error } = await supabase
      .from('bookings')
      .insert([transformedBooking])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update booking
  async updateBooking(id, updates) {
    if (!this.isAvailable()) {
      throw new Error('Supabase client not available - check configuration')
    }
    
    // Transform camelCase fields to snake_case for database
    const transformedUpdates = this.transformFieldNames(updates)
    
    const { data, error } = await supabase
      .from('bookings')
      .update(transformedUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Transform frontend camelCase field names to database snake_case
  transformFieldNames(data) {
    const fieldMappings = {
      // Financial fields
      'balanceDue': 'balance_due',
      'totalAmount': 'total_amount',
      'depositAmount': 'deposit_amount',
      'baseRate': 'base_rate',
      
      // Customer fields
      'firstName': 'customer_first_name',
      'surname': 'customer_surname',
      'email': 'customer_email',
      'phone': 'customer_phone',
      'street': 'customer_street',
      'city': 'customer_city',
      'postcode': 'customer_postcode',
      'country': 'customer_country',
      
      // Yacht fields
      'yacht': 'yacht_id',
      'yachtName': 'yacht_name',
      'yachtType': 'yacht_type',
      'yachtLocation': 'yacht_location',
      
      // Booking details
      'tripType': 'charter_type',
      'charterType': 'charter_type',
      'startDate': 'start_date',
      'endDate': 'end_date',
      'portOfDeparture': 'port_of_departure',
      'portOfArrival': 'port_of_arrival',
      'yachtId': 'yacht_id',
      'customerId': 'customer_id',
      'bookingNumber': 'booking_number',
      
      // Status fields
      'bookingStatus': 'booking_status',
      'paymentStatus': 'payment_status',
      'bookingConfirmed': 'booking_confirmed',
      'depositPaid': 'deposit_paid',
      'finalPaymentPaid': 'final_payment_paid',
      'contractSent': 'contract_sent',
      'contractSigned': 'contract_signed',
      'depositInvoiceSent': 'deposit_invoice_sent',
      'receiptIssued': 'receipt_issued',
      
      // Timestamp fields
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      
      // File fields
      'crewExperienceFileName': 'crew_experience_file_name',
      'crewExperienceFileUrl': 'crew_experience_file_url',
      'crewExperienceFileSize': 'crew_experience_file_size',
      
      // Notes
      'specialRequirements': 'special_requirements',
      'notes': 'notes'
    }
    
    const transformed = {}
    
    for (const [key, value] of Object.entries(data)) {
      // Skip nested status object - we use flattened fields instead
      if (key === 'status' && typeof value === 'object') {
        continue
      }
      
      // Handle crewExperienceFile - never pass this field directly to database
      if (key === 'crewExperienceFile') {
        // If it's an object, decompose it into individual fields
        if (value && typeof value === 'object') {
          if (value.name) {
            transformed.crew_experience_file_name = value.name
          }
          if (value.url) {
            transformed.crew_experience_file_url = value.url
          }
          if (value.size) {
            transformed.crew_experience_file_size = value.size
          }
        }
        // Always skip the original crewExperienceFile field regardless of value
        continue
      }
      
      // Handle documentStates - this is also not a database field
      if (key === 'documentStates') {
        continue
      }
      
      // Skip fields that don't exist in database
      const dbFieldName = fieldMappings[key] || key
      
      // Only include fields that exist in the database schema
      const validDatabaseFields = [
        'id', 'booking_number', 'ical_uid', 'customer_first_name', 'customer_surname', 
        'customer_email', 'customer_phone', 'customer_street', 'customer_city', 
        'customer_postcode', 'customer_country', 'yacht_id', 'yacht_name', 
        'yacht_type', 'yacht_location', 'charter_type', 'start_date', 'end_date',
        'port_of_departure', 'port_of_arrival', 'booking_status', 'payment_status',
        'booking_confirmed', 'deposit_paid', 'final_payment_paid', 'contract_sent', 
        'contract_signed', 'deposit_invoice_sent', 'receipt_issued', 'base_rate',
        'total_amount', 'deposit_amount', 'balance_due', 'crew_experience_file_name',
        'crew_experience_file_url', 'crew_experience_file_size', 'special_requirements',
        'notes', 'created_at', 'updated_at', 'created_by', 'updated_by'
      ];
      
      if (validDatabaseFields.includes(dbFieldName)) {
        transformed[dbFieldName] = value
      }
    }
    
    return transformed
  },

  // Delete booking
  async deleteBooking(id) {
    if (!this.isAvailable()) {
      throw new Error('Supabase client not available - check configuration')
    }
    
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // Get all yachts
  async getYachts() {
    if (!this.isAvailable()) {
      throw new Error('Supabase client not available - check configuration')
    }
    
    const { data, error } = await supabase
      .from('yachts')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Get yacht by ID
  async getYacht(id) {
    if (!this.isAvailable()) {
      throw new Error('Supabase client not available - check configuration')
    }
    
    const { data, error } = await supabase
      .from('yachts')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Real-time subscriptions
  subscribeToBookings(callback) {
    if (!this.isAvailable()) {
      console.warn('Supabase real-time not available - using mock data mode')
      return null
    }
    
    return supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        callback
      )
      .subscribe()
  },

  subscribeToYachts(callback) {
    if (!this.isAvailable()) {
      console.warn('Supabase real-time not available - using mock data mode')
      return null
    }
    
    return supabase
      .channel('yachts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'yachts' },
        callback
      )
      .subscribe()
  }
}

export default supabase