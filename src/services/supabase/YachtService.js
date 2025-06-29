/**
 * Yacht Service
 * Handles yacht-related operations by extracting data from unified bookings table
 * Provides yacht availability, statistics, and booking management
 * 
 * @created 2025-06-26
 */

import { supabase, supabaseConfig, TABLES, queryHelpers } from './supabaseClient.js'

class YachtService {
  /**
   * Get all yachts from yachts table
   * @returns {Promise<Array>} Array of yachts
   */
  async getYachts() {
    if (!supabase) {
      console.error('Supabase client not available in YachtService.getYachts()')
      console.error('Environment check:', {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'present' : 'missing',
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing',
        VITE_USE_SUPABASE: import.meta.env.VITE_USE_SUPABASE
      })
      throw new Error('Supabase not initialized')
    }

    try {
      // Get all yachts from the yachts table
      const { data, error } = await supabase
        .from('yachts')
        .select('id, name, length_feet, cabins, berths, daily_rate, weekly_rate, location')
        .order('name', { ascending: true })

      queryHelpers.handleError(error, 'getYachts')

      // Return yacht data directly from yachts table
      return (data || []).map(yacht => ({
        id: yacht.id,
        name: yacht.name,
        length: yacht.length_feet,
        cabins: yacht.cabins,
        berths: yacht.berths,
        daily_rate: yacht.daily_rate,
        weekly_rate: yacht.weekly_rate,
        location: yacht.location,
        status: 'active'
      }))
    } catch (error) {
      console.error('Get yachts error:', error)
      throw error
    }
  }

  /**
   * Get yacht by ID with booking information
   * @param {string} yachtId - Yacht ID
   * @returns {Promise<Object>} Yacht details with bookings
   */
  async getYacht(yachtId) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      // Get all bookings for this yacht
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .select('*')
        .eq('yacht_id', yachtId)
        .order('start_date', { ascending: true })

      queryHelpers.handleError(error, 'getYacht')

      if (!data || data.length === 0) {
        return null
      }

      // Extract yacht info from bookings
      const yacht = {
        id: yachtId,
        name: data[0].yacht_name || yachtId,
        type: 'Sailing Yacht',
        capacity: 8,
        bookings: data,
        statistics: this.calculateYachtStatistics(data)
      }

      return yacht
    } catch (error) {
      console.error('Get yacht error:', error)
      throw error
    }
  }

  /**
   * Get yacht availability
   * @param {string} yachtId - Yacht ID
   * @param {Date} startDate - Start of period
   * @param {Date} endDate - End of period
   * @returns {Promise<Object>} Availability information
   */
  async getYachtAvailability(yachtId, startDate, endDate) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      // Get bookings that overlap with the requested period
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .select('*')
        .eq('yacht_id', yachtId)
        .lte('start_date', endDate.toISOString())
        .gte('end_date', startDate.toISOString())
        .in('booking_status', ['confirmed', 'tentative'])
        .order('start_date', { ascending: true })

      queryHelpers.handleError(error, 'getYachtAvailability')

      // Calculate available periods
      const bookings = data || []
      const availablePeriods = this.calculateAvailablePeriods(
        startDate, 
        endDate, 
        bookings
      )

      return {
        yacht_id: yachtId,
        period_start: startDate,
        period_end: endDate,
        bookings: bookings,
        available_periods: availablePeriods,
        is_fully_available: bookings.length === 0,
        total_available_days: availablePeriods.reduce((sum, period) => {
          const days = Math.ceil(
            (period.end - period.start) / (1000 * 60 * 60 * 24)
          )
          return sum + days
        }, 0)
      }
    } catch (error) {
      console.error('Get yacht availability error:', error)
      throw error
    }
  }

  /**
   * Check if yacht is available for specific dates
   * @param {string} yachtId - Yacht ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} excludeBookingId - Optional booking ID to exclude
   * @returns {Promise<boolean>} True if available
   */
  async isYachtAvailable(yachtId, startDate, endDate, excludeBookingId = null) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      let query = supabase
        .from(TABLES.BOOKINGS)
        .select('id')
        .eq('yacht_id', yachtId)
        .lte('start_date', endDate.toISOString())
        .gte('end_date', startDate.toISOString())
        .in('booking_status', ['confirmed', 'tentative'])

      if (excludeBookingId) {
        query = query.neq('id', excludeBookingId)
      }

      const { data, error } = await query

      queryHelpers.handleError(error, 'isYachtAvailable')

      return !data || data.length === 0
    } catch (error) {
      console.error('Check yacht availability error:', error)
      throw error
    }
  }

  /**
   * Get yacht booking calendar
   * @param {string} yachtId - Yacht ID
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Promise<Object>} Calendar data
   */
  async getYachtCalendar(yachtId, year, month) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const availability = await this.getYachtAvailability(
      yachtId, 
      startDate, 
      endDate
    )

    // Format for calendar display
    const calendarDays = []
    const daysInMonth = endDate.getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      const dateStr = date.toISOString().split('T')[0]
      
      // Check if this day has any bookings
      const dayBookings = availability.bookings.filter(booking => {
        const bookingStart = new Date(booking.start_date)
        const bookingEnd = new Date(booking.end_date)
        return date >= bookingStart && date <= bookingEnd
      })

      calendarDays.push({
        date: dateStr,
        day: day,
        is_available: dayBookings.length === 0,
        bookings: dayBookings.map(b => ({
          id: b.id,
          booking_number: b.booking_number,
          customer_name: `${b.customer_first_name} ${b.customer_surname}`,
          status: b.booking_status
        }))
      })
    }

    return {
      yacht_id: yachtId,
      year: year,
      month: month,
      days: calendarDays,
      summary: {
        total_days: daysInMonth,
        available_days: calendarDays.filter(d => d.is_available).length,
        booked_days: calendarDays.filter(d => !d.is_available).length,
        occupancy_rate: Math.round(
          (calendarDays.filter(d => !d.is_available).length / daysInMonth) * 100
        )
      }
    }
  }

  /**
   * Get yacht statistics
   * @param {string} yachtId - Yacht ID
   * @returns {Promise<Object>} Yacht statistics
   */
  async getYachtStatistics(yachtId) {
    const bookings = await this.getYachtBookings(yachtId)
    return this.calculateYachtStatistics(bookings)
  }

  /**
   * Get yacht bookings
   * @param {string} yachtId - Yacht ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Yacht bookings
   */
  async getYachtBookings(yachtId, options = {}) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      let query = supabase
        .from(TABLES.BOOKINGS)
        .select('*')
        .eq('yacht_id', yachtId)

      // Apply filters
      if (options.status) {
        query = query.eq('booking_status', options.status)
      }

      if (options.startDate) {
        query = query.gte('start_date', options.startDate.toISOString())
      }

      if (options.endDate) {
        query = query.lte('end_date', options.endDate.toISOString())
      }

      query = query.order('start_date', { ascending: false })

      const { data, error } = await query

      queryHelpers.handleError(error, 'getYachtBookings')

      return data || []
    } catch (error) {
      console.error('Get yacht bookings error:', error)
      throw error
    }
  }

  /**
   * Get yacht revenue report
   * @param {string} yachtId - Yacht ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Revenue report
   */
  async getYachtRevenueReport(yachtId, startDate, endDate) {
    const bookings = await this.getYachtBookings(yachtId, {
      startDate,
      endDate,
      status: 'confirmed'
    })

    const report = {
      yacht_id: yachtId,
      period: {
        start: startDate,
        end: endDate
      },
      total_revenue: 0,
      total_bookings: bookings.length,
      average_booking_value: 0,
      occupancy_days: 0,
      revenue_by_month: {}
    }

    bookings.forEach(booking => {
      // Total revenue
      report.total_revenue += booking.total_price || 0

      // Occupancy days
      if (booking.start_date && booking.end_date) {
        const days = Math.ceil(
          (new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24)
        )
        report.occupancy_days += days
      }

      // Revenue by month
      const month = new Date(booking.start_date).toISOString().slice(0, 7)
      report.revenue_by_month[month] = (report.revenue_by_month[month] || 0) + (booking.total_price || 0)
    })

    // Calculate average
    report.average_booking_value = report.total_bookings > 0
      ? Math.round(report.total_revenue / report.total_bookings)
      : 0

    return report
  }

  /**
   * Get all yachts with availability for date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Available yachts
   */
  async getAvailableYachts(startDate, endDate) {
    const yachts = await this.getYachts()
    const availableYachts = []

    for (const yacht of yachts) {
      const isAvailable = await this.isYachtAvailable(
        yacht.id,
        startDate,
        endDate
      )

      if (isAvailable) {
        availableYachts.push(yacht)
      }
    }

    return availableYachts
  }

  /**
   * Helper: Calculate available periods
   */
  calculateAvailablePeriods(periodStart, periodEnd, bookings) {
    if (bookings.length === 0) {
      return [{
        start: periodStart,
        end: periodEnd,
        days: Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24))
      }]
    }

    const availablePeriods = []
    let currentStart = periodStart

    // Sort bookings by start date
    const sortedBookings = bookings.sort((a, b) => 
      new Date(a.start_date) - new Date(b.start_date)
    )

    sortedBookings.forEach(booking => {
      const bookingStart = new Date(booking.start_date)
      const bookingEnd = new Date(booking.end_date)

      // If there's a gap before this booking
      if (currentStart < bookingStart) {
        availablePeriods.push({
          start: currentStart,
          end: new Date(bookingStart.getTime() - 24 * 60 * 60 * 1000),
          days: Math.ceil((bookingStart - currentStart) / (1000 * 60 * 60 * 24))
        })
      }

      // Update current start to end of this booking
      currentStart = new Date(bookingEnd.getTime() + 24 * 60 * 60 * 1000)
    })

    // Check if there's availability after the last booking
    if (currentStart < periodEnd) {
      availablePeriods.push({
        start: currentStart,
        end: periodEnd,
        days: Math.ceil((periodEnd - currentStart) / (1000 * 60 * 60 * 24))
      })
    }

    return availablePeriods
  }

  /**
   * Helper: Calculate yacht statistics
   */
  calculateYachtStatistics(bookings) {
    const stats = {
      total_bookings: bookings.length,
      total_revenue: 0,
      confirmed_bookings: 0,
      cancelled_bookings: 0,
      upcoming_bookings: 0,
      total_charter_days: 0,
      average_booking_length: 0,
      average_booking_value: 0,
      occupancy_rate: 0,
      repeat_customers: 0
    }

    if (bookings.length === 0) return stats

    const now = new Date()
    const customerEmails = new Set()
    const customerBookingCounts = {}

    bookings.forEach(booking => {
      // Revenue
      stats.total_revenue += booking.total_price || 0

      // Status counts
      if (booking.booking_status === 'confirmed') {
        stats.confirmed_bookings++
      } else if (booking.booking_status === 'cancelled') {
        stats.cancelled_bookings++
      }

      if (new Date(booking.start_date) > now) {
        stats.upcoming_bookings++
      }

      // Charter days
      if (booking.start_date && booking.end_date) {
        const days = Math.ceil(
          (new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24)
        )
        stats.total_charter_days += days
      }

      // Track customers
      if (booking.customer_email) {
        customerEmails.add(booking.customer_email)
        customerBookingCounts[booking.customer_email] = 
          (customerBookingCounts[booking.customer_email] || 0) + 1
      }
    })

    // Calculate averages
    stats.average_booking_length = stats.total_bookings > 0
      ? Math.round(stats.total_charter_days / stats.total_bookings)
      : 0

    stats.average_booking_value = stats.total_bookings > 0
      ? Math.round(stats.total_revenue / stats.total_bookings)
      : 0

    // Calculate repeat customers
    stats.repeat_customers = Object.values(customerBookingCounts)
      .filter(count => count > 1).length

    // Calculate occupancy rate (assuming 365 days per year)
    const firstBooking = bookings.reduce((min, b) => 
      new Date(b.created_at) < new Date(min.created_at) ? b : min
    )
    const daysSinceFirst = Math.ceil(
      (now - new Date(firstBooking.created_at)) / (1000 * 60 * 60 * 24)
    )
    stats.occupancy_rate = daysSinceFirst > 0
      ? Math.round((stats.total_charter_days / daysSinceFirst) * 100)
      : 0

    return stats
  }
}

// Create singleton instance
const yachtService = new YachtService()

// Export both instance and class
export default yachtService
export { YachtService }