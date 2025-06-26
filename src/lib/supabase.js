import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required')
}

// Singleton pattern to ensure only one client instance
let supabaseInstance = null

export const supabase = (() => {
  if (!supabaseInstance) {
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
  // Get all bookings
  async getBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get booking by ID
  async getBooking(id) {
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
    const { data, error } = await supabase
      .from('bookings')
      .insert([booking])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update booking
  async updateBooking(id, updates) {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete booking
  async deleteBooking(id) {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // Get all yachts
  async getYachts() {
    const { data, error } = await supabase
      .from('yachts')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Get yacht by ID
  async getYacht(id) {
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