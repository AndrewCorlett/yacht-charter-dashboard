/**
 * iCS Calendar Utilities
 * 
 * RFC 5545 compliant iCalendar utilities for booking integration.
 * Supports VEVENT generation, parsing, and calendar import/export.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

import { format, parseISO } from 'date-fns'

/**
 * iCS Event Status enumeration (RFC 5545 compliant)
 */
export const ICSStatus = {
  TENTATIVE: 'TENTATIVE',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED'
}

/**
 * iCS Event Classification enumeration
 */
export const ICSClassification = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
  CONFIDENTIAL: 'CONFIDENTIAL'
}

/**
 * iCS Frequency enumeration for recurring events
 */
export const ICSFrequency = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY'
}

/**
 * iCS Calendar Utilities Class
 * 
 * Provides comprehensive iCalendar support for yacht charter bookings
 * with RFC 5545 compliance and proper encoding.
 */
export class ICSCalendarUtils {
  /**
   * Generate RFC 5545 compliant UID
   * @param {string} [prefix='booking'] - UID prefix
   * @param {string} [domain='seascape-yachts.com'] - Domain for UID
   * @returns {string} RFC 5545 compliant UID
   */
  static generateUID(prefix = 'booking', domain = 'seascape-yachts.com') {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${prefix}-${timestamp}-${random}@${domain}`
  }

  /**
   * Format date for iCS (UTC format)
   * @param {Date|string} date - Date to format
   * @param {boolean} [isAllDay=false] - Whether this is an all-day event
   * @returns {string} iCS formatted date string
   */
  static formatICSDate(date, isAllDay = false) {
    if (!date) return ''
    
    const dateObj = date instanceof Date ? date : new Date(date)
    
    if (isAllDay) {
      return format(dateObj, 'yyyyMMdd')
    }
    
    // Convert to UTC and format
    const utcDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000))
    return format(utcDate, "yyyyMMdd'T'HHmmss'Z'")
  }

  /**
   * Parse iCS date string to Date object
   * @param {string} icsDate - iCS formatted date string
   * @returns {Date|null} Parsed Date object or null
   */
  static parseICSDate(icsDate) {
    if (!icsDate || typeof icsDate !== 'string') return null
    
    try {
      if (icsDate.includes('T')) {
        // DateTime format
        const cleaned = icsDate.replace(/[TZ]/g, '')
        const year = parseInt(cleaned.substring(0, 4))
        const month = parseInt(cleaned.substring(4, 6)) - 1
        const day = parseInt(cleaned.substring(6, 8))
        const hour = parseInt(cleaned.substring(8, 10)) || 0
        const minute = parseInt(cleaned.substring(10, 12)) || 0
        const second = parseInt(cleaned.substring(12, 14)) || 0
        
        return new Date(Date.UTC(year, month, day, hour, minute, second))
      } else {
        // Date only format
        const year = parseInt(icsDate.substring(0, 4))
        const month = parseInt(icsDate.substring(4, 6)) - 1
        const day = parseInt(icsDate.substring(6, 8))
        
        return new Date(year, month, day)
      }
    } catch (error) {
      console.warn('Error parsing iCS date:', error)
      return null
    }
  }

  /**
   * Escape special characters for iCS content
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  static escapeICSText(text) {
    if (!text || typeof text !== 'string') return ''
    
    return text
      .replace(/\\/g, '\\\\')  // Escape backslashes
      .replace(/;/g, '\\;')    // Escape semicolons
      .replace(/,/g, '\\,')    // Escape commas
      .replace(/\n/g, '\\n')   // Escape newlines
      .replace(/\r/g, '')      // Remove carriage returns
  }

  /**
   * Unescape iCS text content
   * @param {string} text - Escaped iCS text
   * @returns {string} Unescaped text
   */
  static unescapeICSText(text) {
    if (!text || typeof text !== 'string') return ''
    
    return text
      .replace(/\\n/g, '\n')   // Unescape newlines
      .replace(/\\,/g, ',')    // Unescape commas
      .replace(/\\;/g, ';')    // Unescape semicolons
      .replace(/\\\\/g, '\\')  // Unescape backslashes
  }

  /**
   * Fold long lines according to RFC 5545 (75 character limit)
   * @param {string} line - Line to fold
   * @returns {string} Folded line
   */
  static foldLine(line) {
    if (!line || line.length <= 75) return line
    
    const folded = []
    let remaining = line
    
    // First line can be 75 characters
    folded.push(remaining.substring(0, 75))
    remaining = remaining.substring(75)
    
    // Subsequent lines are prefixed with space and can be 74 characters
    while (remaining.length > 0) {
      folded.push(' ' + remaining.substring(0, 74))
      remaining = remaining.substring(74)
    }
    
    return folded.join('\r\n')
  }

  /**
   * Convert booking model to iCS VEVENT
   * @param {Object} booking - Booking model instance
   * @param {Object} [options] - Additional options
   * @returns {string} iCS VEVENT string
   */
  static bookingToVEvent(booking, options = {}) {
    const {
      includeDescription = true,
      includeLocation = true,
      classification = ICSClassification.PRIVATE,
      organizer = null,
      attendees = []
    } = options

    const lines = []
    
    // BEGIN VEVENT
    lines.push('BEGIN:VEVENT')
    
    // UID (required)
    lines.push(`UID:${booking.ical_uid || this.generateUID()}`)
    
    // DTSTAMP (required) - creation/modification time
    lines.push(`DTSTAMP:${this.formatICSDate(new Date())}`)
    
    // DTSTART (required)
    if (booking.start_datetime) {
      lines.push(`DTSTART:${this.formatICSDate(booking.start_datetime)}`)
    }
    
    // DTEND
    if (booking.end_datetime) {
      lines.push(`DTEND:${this.formatICSDate(booking.end_datetime)}`)
    }
    
    // SUMMARY (required)
    const summary = this.escapeICSText(booking.summary || `Charter - ${booking.customer_name}`)
    lines.push(this.foldLine(`SUMMARY:${summary}`))
    
    // DESCRIPTION
    if (includeDescription && booking.description) {
      const description = this.escapeICSText(booking.description)
      lines.push(this.foldLine(`DESCRIPTION:${description}`))
    }
    
    // LOCATION
    if (includeLocation && booking.location) {
      const location = this.escapeICSText(booking.location)
      lines.push(this.foldLine(`LOCATION:${location}`))
    }
    
    // STATUS
    const icsStatus = booking.toICS ? booking.toICS().status : ICSStatus.TENTATIVE
    lines.push(`STATUS:${icsStatus}`)
    
    // CLASS (classification)
    lines.push(`CLASS:${classification}`)
    
    // CREATED
    if (booking.created_at) {
      lines.push(`CREATED:${this.formatICSDate(booking.created_at)}`)
    }
    
    // LAST-MODIFIED
    if (booking.modified_at) {
      lines.push(`LAST-MODIFIED:${this.formatICSDate(booking.modified_at)}`)
    }
    
    // ORGANIZER
    if (organizer) {
      const orgLine = `ORGANIZER;CN="${this.escapeICSText(organizer.name)}":mailto:${organizer.email}`
      lines.push(this.foldLine(orgLine))
    }
    
    // ATTENDEES
    attendees.forEach(attendee => {
      const attLine = `ATTENDEE;CN="${this.escapeICSText(attendee.name)}";RSVP=TRUE:mailto:${attendee.email}`
      lines.push(this.foldLine(attLine))
    })
    
    // CATEGORIES
    lines.push('CATEGORIES:Yacht Charter,Booking')
    
    // PRIORITY (based on booking status)
    const priority = this._getEventPriority(booking.status)
    lines.push(`PRIORITY:${priority}`)
    
    // Custom properties for yacht charter
    lines.push(`X-YACHT-ID:${this.escapeICSText(booking.yacht_id || '')}`)
    lines.push(`X-BOOKING-NO:${this.escapeICSText(booking.booking_no || '')}`)
    lines.push(`X-CUSTOMER-EMAIL:${this.escapeICSText(booking.customer_email || '')}`)
    
    if (booking.total_value) {
      lines.push(`X-TOTAL-VALUE:${booking.total_value}`)
    }
    
    // END VEVENT
    lines.push('END:VEVENT')
    
    return lines.join('\r\n')
  }

  /**
   * Get event priority based on booking status
   * @param {string} status - Booking status
   * @returns {number} Priority level (1-9, 1 being highest)
   * @private
   */
  static _getEventPriority(status) {
    const priorityMap = {
      'confirmed': 5,      // Normal priority
      'pending': 7,        // Lower priority
      'cancelled': 9,      // Lowest priority
      'completed': 5,      // Normal priority
      'deposit_pending': 6, // Slightly lower priority
      'final_payment_pending': 6,
      'no_show': 8
    }
    
    return priorityMap[status] || 5
  }

  /**
   * Generate complete iCS calendar with multiple bookings
   * @param {Array} bookings - Array of booking models
   * @param {Object} [calendarInfo] - Calendar metadata
   * @returns {string} Complete iCS calendar string
   */
  static generateICSCalendar(bookings, calendarInfo = {}) {
    const {
      calendarName = 'Yacht Charter Bookings',
      description = 'Yacht charter booking calendar',
      timezone = 'UTC',
      prodId = '-//Seascape Yachts//Yacht Charter Dashboard//EN'
    } = calendarInfo

    const lines = []
    
    // BEGIN VCALENDAR
    lines.push('BEGIN:VCALENDAR')
    
    // VERSION (required)
    lines.push('VERSION:2.0')
    
    // PRODID (required)
    lines.push(`PRODID:${prodId}`)
    
    // CALSCALE
    lines.push('CALSCALE:GREGORIAN')
    
    // Calendar name and description
    lines.push(this.foldLine(`X-WR-CALNAME:${this.escapeICSText(calendarName)}`))
    lines.push(this.foldLine(`X-WR-CALDESC:${this.escapeICSText(description)}`))
    
    // Timezone
    lines.push(`X-WR-TIMEZONE:${timezone}`)
    
    // Add each booking as a VEVENT
    bookings.forEach(booking => {
      const vEvent = this.bookingToVEvent(booking)
      lines.push(vEvent)
    })
    
    // END VCALENDAR
    lines.push('END:VCALENDAR')
    
    return lines.join('\r\n')
  }

  /**
   * Parse iCS content to extract events
   * @param {string} icsContent - iCS calendar content
   * @returns {Array} Array of parsed event objects
   */
  static parseICSCalendar(icsContent) {
    if (!icsContent || typeof icsContent !== 'string') {
      return []
    }

    const events = []
    const lines = icsContent.split(/\r?\n/)
    let currentEvent = null
    let currentProperty = ''

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i]
      
      // Handle line folding (lines starting with space or tab)
      while (i + 1 < lines.length && /^[ \t]/.test(lines[i + 1])) {
        line += lines[i + 1].substring(1)
        i++
      }

      // Parse property and value
      const colonIndex = line.indexOf(':')
      if (colonIndex === -1) continue

      const property = line.substring(0, colonIndex).trim()
      const value = line.substring(colonIndex + 1).trim()

      if (property === 'BEGIN' && value === 'VEVENT') {
        currentEvent = {}
      } else if (property === 'END' && value === 'VEVENT' && currentEvent) {
        events.push(currentEvent)
        currentEvent = null
      } else if (currentEvent) {
        // Parse property parameters
        const [propName, ...paramParts] = property.split(';')
        const parameters = {}
        
        paramParts.forEach(param => {
          const [paramName, paramValue] = param.split('=')
          if (paramName && paramValue) {
            parameters[paramName] = paramValue.replace(/^"(.*)"$/, '$1')
          }
        })

        // Store the property
        currentEvent[propName] = {
          value: this.unescapeICSText(value),
          parameters
        }

        // Parse dates
        if (propName === 'DTSTART' || propName === 'DTEND' || 
            propName === 'CREATED' || propName === 'LAST-MODIFIED' || 
            propName === 'DTSTAMP') {
          currentEvent[propName].date = this.parseICSDate(value)
        }
      }
    }

    return events
  }

  /**
   * Convert parsed iCS event to booking data structure
   * @param {Object} icsEvent - Parsed iCS event object
   * @returns {Object} Booking data structure
   */
  static icsEventToBooking(icsEvent) {
    const booking = {
      ical_uid: icsEvent.UID?.value,
      summary: icsEvent.SUMMARY?.value,
      description: icsEvent.DESCRIPTION?.value,
      location: icsEvent.LOCATION?.value,
      start_datetime: icsEvent.DTSTART?.date,
      end_datetime: icsEvent.DTEND?.date,
      created_at: icsEvent.CREATED?.date,
      modified_at: icsEvent['LAST-MODIFIED']?.date,
      status: this._mapICSStatusToBookingStatus(icsEvent.STATUS?.value)
    }

    // Extract custom yacht charter properties
    if (icsEvent['X-YACHT-ID']) {
      booking.yacht_id = icsEvent['X-YACHT-ID'].value
    }
    
    if (icsEvent['X-BOOKING-NO']) {
      booking.booking_no = icsEvent['X-BOOKING-NO'].value
    }
    
    if (icsEvent['X-CUSTOMER-EMAIL']) {
      booking.customer_email = icsEvent['X-CUSTOMER-EMAIL'].value
    }
    
    if (icsEvent['X-TOTAL-VALUE']) {
      booking.total_value = parseFloat(icsEvent['X-TOTAL-VALUE'].value)
    }

    return booking
  }

  /**
   * Map iCS status to booking status
   * @param {string} icsStatus - iCS status value
   * @returns {string} Booking status
   * @private
   */
  static _mapICSStatusToBookingStatus(icsStatus) {
    const statusMap = {
      'TENTATIVE': 'pending',
      'CONFIRMED': 'confirmed',
      'CANCELLED': 'cancelled'
    }
    
    return statusMap[icsStatus] || 'pending'
  }

  /**
   * Generate iCS VALARM for booking reminder
   * @param {Object} alarmOptions - Alarm configuration
   * @returns {string} iCS VALARM string
   */
  static generateVAlarm(alarmOptions = {}) {
    const {
      trigger = '-PT24H',    // 24 hours before
      action = 'DISPLAY',
      description = 'Yacht Charter Reminder',
      repeat = 1,
      duration = 'PT15M'     // 15 minutes
    } = alarmOptions

    const lines = []
    
    lines.push('BEGIN:VALARM')
    lines.push(`ACTION:${action}`)
    lines.push(`TRIGGER:${trigger}`)
    lines.push(this.foldLine(`DESCRIPTION:${this.escapeICSText(description)}`))
    
    if (repeat > 1) {
      lines.push(`REPEAT:${repeat}`)
      lines.push(`DURATION:${duration}`)
    }
    
    lines.push('END:VALARM')
    
    return lines.join('\r\n')
  }

  /**
   * Create booking with alarm/reminder
   * @param {Object} booking - Booking model instance
   * @param {Object} [alarmOptions] - Alarm configuration
   * @returns {string} VEVENT with VALARM
   */
  static bookingToVEventWithAlarm(booking, alarmOptions = {}) {
    const vEvent = this.bookingToVEvent(booking)
    const vAlarm = this.generateVAlarm(alarmOptions)
    
    // Insert alarm before END:VEVENT
    const eventLines = vEvent.split('\r\n')
    const endIndex = eventLines.findIndex(line => line === 'END:VEVENT')
    
    if (endIndex !== -1) {
      eventLines.splice(endIndex, 0, vAlarm)
    }
    
    return eventLines.join('\r\n')
  }

  /**
   * Validate iCS content structure
   * @param {string} icsContent - iCS content to validate
   * @returns {Object} Validation result
   */
  static validateICSContent(icsContent) {
    const errors = []
    const warnings = []

    if (!icsContent || typeof icsContent !== 'string') {
      errors.push('Invalid iCS content: must be a string')
      return { isValid: false, errors, warnings }
    }

    // Check for required VCALENDAR structure
    if (!icsContent.includes('BEGIN:VCALENDAR')) {
      errors.push('Missing BEGIN:VCALENDAR')
    }
    
    if (!icsContent.includes('END:VCALENDAR')) {
      errors.push('Missing END:VCALENDAR')
    }
    
    if (!icsContent.includes('VERSION:2.0')) {
      errors.push('Missing or invalid VERSION')
    }
    
    if (!icsContent.includes('PRODID:')) {
      errors.push('Missing PRODID')
    }

    // Check for proper line endings
    if (icsContent.includes('\n') && !icsContent.includes('\r\n')) {
      warnings.push('Line endings should be CRLF (\\r\\n) for RFC compliance')
    }

    // Validate events
    const events = this.parseICSCalendar(icsContent)
    events.forEach((event, index) => {
      if (!event.UID) {
        errors.push(`Event ${index + 1}: Missing UID`)
      }
      
      if (!event.DTSTART) {
        errors.push(`Event ${index + 1}: Missing DTSTART`)
      }
      
      if (!event.SUMMARY) {
        warnings.push(`Event ${index + 1}: Missing SUMMARY`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      eventCount: events.length
    }
  }

  /**
   * Generate download-ready iCS file content
   * @param {Array} bookings - Array of booking models
   * @param {Object} [options] - File generation options
   * @returns {Object} File content and metadata
   */
  static generateICSFile(bookings, options = {}) {
    const {
      filename = 'yacht-charter-bookings.ics',
      calendarName = 'Yacht Charter Bookings',
      includeAlarms = false
    } = options

    let content
    
    if (includeAlarms) {
      // Generate calendar with alarms
      const lines = []
      lines.push('BEGIN:VCALENDAR')
      lines.push('VERSION:2.0')
      lines.push('PRODID:-//Seascape Yachts//Yacht Charter Dashboard//EN')
      lines.push('CALSCALE:GREGORIAN')
      lines.push(this.foldLine(`X-WR-CALNAME:${this.escapeICSText(calendarName)}`))
      
      bookings.forEach(booking => {
        const vEventWithAlarm = this.bookingToVEventWithAlarm(booking)
        lines.push(vEventWithAlarm)
      })
      
      lines.push('END:VCALENDAR')
      content = lines.join('\r\n')
    } else {
      content = this.generateICSCalendar(bookings, { calendarName })
    }

    return {
      content,
      filename,
      mimeType: 'text/calendar',
      size: content.length,
      encoding: 'utf-8'
    }
  }
}

export default ICSCalendarUtils