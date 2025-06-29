/**
 * Customer Service
 * Handles customer-related operations by extracting data from unified bookings table
 * Since customer data is embedded in bookings, this service provides customer-centric views
 * 
 * @created 2025-06-26
 */

import { supabase, supabaseConfig, TABLES, queryHelpers } from './supabaseClient.js'

class CustomerService {
  /**
   * Get all unique customers from bookings
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of unique customers
   */
  async getCustomers(options = {}) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      // Get all bookings to extract unique customers
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .select(`
          customer_first_name,
          customer_surname,
          customer_email,
          customer_phone,
          customer_mobile,
          customer_company,
          customer_address,
          customer_city,
          customer_postal_code,
          customer_country,
          customer_nationality,
          customer_date_of_birth,
          customer_passport_number,
          customer_emergency_contact_name,
          customer_emergency_contact_phone
        `)
        .order('customer_surname', { ascending: true })

      queryHelpers.handleError(error, 'getCustomers')

      // Group by email to get unique customers
      const uniqueCustomers = this.extractUniqueCustomers(data || [])
      
      // Apply search filter if provided
      let filteredCustomers = uniqueCustomers
      if (options.search) {
        const searchTerm = options.search.toLowerCase()
        filteredCustomers = uniqueCustomers.filter(customer => 
          customer.full_name.toLowerCase().includes(searchTerm) ||
          customer.email.toLowerCase().includes(searchTerm) ||
          (customer.company && customer.company.toLowerCase().includes(searchTerm))
        )
      }

      return filteredCustomers
    } catch (error) {
      console.error('Get customers error:', error)
      throw error
    }
  }

  /**
   * Get customer by email
   * @param {string} email - Customer email
   * @returns {Promise<Object>} Customer details with booking history
   */
  async getCustomerByEmail(email) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      // Get all bookings for this customer
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .select('*')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })

      queryHelpers.handleError(error, 'getCustomerByEmail')

      if (!data || data.length === 0) {
        return null
      }

      // Extract customer info from most recent booking
      const mostRecent = data[0]
      const customer = this.extractCustomerFromBooking(mostRecent)
      
      // Add booking history
      customer.booking_history = data.map(booking => ({
        id: booking.id,
        booking_number: booking.booking_number,
        yacht_name: booking.yacht_name,
        start_date: booking.start_date,
        end_date: booking.end_date,
        booking_status: booking.booking_status,
        payment_status: booking.payment_status,
        total_price: booking.total_price,
        created_at: booking.created_at
      }))

      // Calculate statistics
      customer.statistics = this.calculateCustomerStatistics(data)

      return customer
    } catch (error) {
      console.error('Get customer by email error:', error)
      throw error
    }
  }

  /**
   * Search customers
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Search results
   */
  async searchCustomers(searchTerm) {
    return await this.getCustomers({ search: searchTerm })
  }

  /**
   * Get customer booking history
   * @param {string} email - Customer email
   * @returns {Promise<Array>} Customer's bookings
   */
  async getCustomerBookings(email) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .select('*')
        .eq('customer_email', email)
        .order('start_date', { ascending: false })

      queryHelpers.handleError(error, 'getCustomerBookings')

      return data || []
    } catch (error) {
      console.error('Get customer bookings error:', error)
      throw error
    }
  }

  /**
   * Update customer information across all bookings
   * @param {string} email - Customer email
   * @param {Object} updates - Customer updates
   * @returns {Promise<Object>} Update result
   */
  async updateCustomer(email, updates) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      // Prepare customer field updates
      const customerUpdates = {}
      const allowedFields = [
        'customer_first_name',
        'customer_surname',
        'customer_phone',
        'customer_mobile',
        'customer_company',
        'customer_address',
        'customer_city',
        'customer_postal_code',
        'customer_country',
        'customer_nationality',
        'customer_date_of_birth',
        'customer_passport_number',
        'customer_emergency_contact_name',
        'customer_emergency_contact_phone'
      ]

      // Only include allowed customer fields
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          customerUpdates[key] = updates[key]
        }
      })

      // Update all bookings for this customer
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .update({
          ...customerUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('customer_email', email)
        .select()

      queryHelpers.handleError(error, 'updateCustomer')

      return {
        updated: data?.length || 0,
        customer: data?.length > 0 ? this.extractCustomerFromBooking(data[0]) : null
      }
    } catch (error) {
      console.error('Update customer error:', error)
      throw error
    }
  }

  /**
   * Get customer statistics
   * @param {string} email - Customer email
   * @returns {Promise<Object>} Customer statistics
   */
  async getCustomerStatistics(email) {
    const bookings = await this.getCustomerBookings(email)
    return this.calculateCustomerStatistics(bookings)
  }

  /**
   * Get top customers by revenue
   * @param {number} limit - Number of customers to return
   * @returns {Promise<Array>} Top customers
   */
  async getTopCustomers(limit = 10) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      // Get all bookings with customer and price info
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .select(`
          customer_email,
          customer_first_name,
          customer_surname,
          customer_company,
          total_price,
          booking_status
        `)
        .in('booking_status', ['confirmed', 'completed'])

      queryHelpers.handleError(error, 'getTopCustomers')

      // Aggregate by customer
      const customerRevenue = {}
      
      (data || []).forEach(booking => {
        const email = booking.customer_email
        if (!customerRevenue[email]) {
          customerRevenue[email] = {
            email,
            first_name: booking.customer_first_name,
            surname: booking.customer_surname,
            company: booking.customer_company,
            total_revenue: 0,
            booking_count: 0
          }
        }
        
        customerRevenue[email].total_revenue += booking.total_price || 0
        customerRevenue[email].booking_count += 1
      })

      // Sort by revenue and return top customers
      const topCustomers = Object.values(customerRevenue)
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, limit)
        .map(customer => ({
          ...customer,
          full_name: `${customer.first_name} ${customer.surname}`,
          average_booking_value: customer.total_revenue / customer.booking_count
        }))

      return topCustomers
    } catch (error) {
      console.error('Get top customers error:', error)
      throw error
    }
  }

  /**
   * Get customers by country
   * @param {string} country - Country name
   * @returns {Promise<Array>} Customers from country
   */
  async getCustomersByCountry(country) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .select(`
          customer_first_name,
          customer_surname,
          customer_email,
          customer_phone,
          customer_company,
          customer_country
        `)
        .eq('customer_country', country)

      queryHelpers.handleError(error, 'getCustomersByCountry')

      return this.extractUniqueCustomers(data || [])
    } catch (error) {
      console.error('Get customers by country error:', error)
      throw error
    }
  }

  /**
   * Helper: Extract unique customers from bookings
   */
  extractUniqueCustomers(bookings) {
    const customerMap = new Map()
    
    bookings.forEach(booking => {
      const email = booking.customer_email
      if (!email) return
      
      if (!customerMap.has(email)) {
        customerMap.set(email, this.extractCustomerFromBooking(booking))
      }
    })
    
    return Array.from(customerMap.values())
  }

  /**
   * Helper: Extract customer data from booking
   */
  extractCustomerFromBooking(booking) {
    return {
      email: booking.customer_email,
      first_name: booking.customer_first_name,
      surname: booking.customer_surname,
      full_name: `${booking.customer_first_name} ${booking.customer_surname}`,
      phone: booking.customer_phone,
      mobile: booking.customer_mobile,
      company: booking.customer_company,
      address: booking.customer_address,
      city: booking.customer_city,
      postal_code: booking.customer_postal_code,
      country: booking.customer_country,
      nationality: booking.customer_nationality,
      date_of_birth: booking.customer_date_of_birth,
      passport_number: booking.customer_passport_number,
      emergency_contact_name: booking.customer_emergency_contact_name,
      emergency_contact_phone: booking.customer_emergency_contact_phone
    }
  }

  /**
   * Helper: Calculate customer statistics
   */
  calculateCustomerStatistics(bookings) {
    const stats = {
      total_bookings: bookings.length,
      total_spent: 0,
      completed_bookings: 0,
      cancelled_bookings: 0,
      upcoming_bookings: 0,
      favorite_yacht: null,
      first_booking_date: null,
      last_booking_date: null,
      average_booking_value: 0,
      total_nights: 0
    }

    if (bookings.length === 0) return stats

    // Calculate stats
    const yachtCounts = {}
    const now = new Date()
    
    bookings.forEach(booking => {
      // Total spent
      stats.total_spent += booking.total_price || 0
      
      // Booking status counts
      if (booking.booking_status === 'completed') {
        stats.completed_bookings++
      } else if (booking.booking_status === 'cancelled') {
        stats.cancelled_bookings++
      } else if (new Date(booking.start_date) > now) {
        stats.upcoming_bookings++
      }
      
      // Yacht frequency
      if (booking.yacht_name) {
        yachtCounts[booking.yacht_name] = (yachtCounts[booking.yacht_name] || 0) + 1
      }
      
      // Date ranges
      const bookingDate = new Date(booking.created_at)
      if (!stats.first_booking_date || bookingDate < new Date(stats.first_booking_date)) {
        stats.first_booking_date = booking.created_at
      }
      if (!stats.last_booking_date || bookingDate > new Date(stats.last_booking_date)) {
        stats.last_booking_date = booking.created_at
      }
      
      // Total nights
      if (booking.start_date && booking.end_date) {
        const nights = Math.ceil(
          (new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24)
        )
        stats.total_nights += nights
      }
    })

    // Calculate averages
    stats.average_booking_value = stats.total_bookings > 0 
      ? Math.round(stats.total_spent / stats.total_bookings) 
      : 0

    // Find favorite yacht
    if (Object.keys(yachtCounts).length > 0) {
      stats.favorite_yacht = Object.entries(yachtCounts)
        .sort(([,a], [,b]) => b - a)[0][0]
    }

    return stats
  }
}

// Create singleton instance
const customerService = new CustomerService()

// Export both instance and class
export default customerService
export { CustomerService }