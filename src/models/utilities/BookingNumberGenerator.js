/**
 * Booking Number Generator Utilities
 * 
 * Comprehensive booking number generation system with customizable
 * formats, sequence management, and collision detection.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

/**
 * Booking number format types
 */
export const BookingNumberFormat = {
  SEQUENTIAL: 'sequential',           // BK001, BK002, BK003...
  YEAR_SEQUENTIAL: 'year_sequential', // BK24001, BK24002...
  YEAR_MONTH_SEQ: 'year_month_seq',   // BK2401001, BK2401002...
  DATE_SEQUENTIAL: 'date_sequential', // BK20240624001
  YACHT_SEQUENTIAL: 'yacht_sequential', // SP001, DD002... (by yacht)
  YEAR_WEEK_YACHT_SEQ: 'year_week_yacht_seq', // 2520ZA06 (YYWWBCNN)
  CUSTOM: 'custom'                    // Custom format
}

/**
 * Booking number validation patterns
 */
export const ValidationPatterns = {
  [BookingNumberFormat.SEQUENTIAL]: /^[A-Z]{2,4}\d{3,6}$/,
  [BookingNumberFormat.YEAR_SEQUENTIAL]: /^[A-Z]{2,4}\d{2}\d{3,6}$/,
  [BookingNumberFormat.YEAR_MONTH_SEQ]: /^[A-Z]{2,4}\d{4}\d{3,6}$/,
  [BookingNumberFormat.DATE_SEQUENTIAL]: /^[A-Z]{2,4}\d{8}\d{3}$/,
  [BookingNumberFormat.YACHT_SEQUENTIAL]: /^[A-Z]{2,4}\d{3,6}$/,
  [BookingNumberFormat.YEAR_WEEK_YACHT_SEQ]: /^\d{2}\d{2}[A-Z]{2}\d{2}$/
}

/**
 * Yacht code mappings for yacht-specific booking numbers
 * Updated to match the specification: CM, SP, AL, DD, ZA
 * Supports multiple formats for yacht IDs (names, UUIDs, etc.)
 */
export const YachtCodes = {
  // Original yacht names (kebab-case)
  'calico-moon': 'CM',
  'spectre': 'SP',
  'alrisha': 'AL',
  'disk-drive': 'DD',
  'zavaria': 'ZA',
  
  // Alternative yacht names (various formats)
  'Calico Moon': 'CM',
  'Spectre': 'SP',
  'Alrisha': 'AL',
  'Disk Drive': 'DD',
  'Zavaria': 'ZA',
  
  // Lowercase versions
  'calico moon': 'CM',
  'spectre': 'SP',
  'alrisha': 'AL',
  'disk drive': 'DD',
  'zavaria': 'ZA'
}

/**
 * Get yacht code from yacht ID/name with flexible matching
 * @param {string} yachtId - Yacht ID or name
 * @returns {string} Yacht code (CM, SP, AL, DD, ZA)
 */
export function getYachtCode(yachtId) {
  if (!yachtId || typeof yachtId !== 'string') {
    throw new Error(`Invalid yacht ID: ${yachtId}`)
  }
  
  // Direct lookup first
  if (YachtCodes[yachtId]) {
    return YachtCodes[yachtId]
  }
  
  // Try case-insensitive lookup
  const lowerYachtId = yachtId.toLowerCase()
  for (const [key, code] of Object.entries(YachtCodes)) {
    if (key.toLowerCase() === lowerYachtId) {
      return code
    }
  }
  
  // Try partial matching for yacht names
  const normalizedYachtId = yachtId.toLowerCase().replace(/[^a-z]/g, '')
  const knownYachts = {
    'calicomoon': 'CM',
    'spectre': 'SP', 
    'alrisha': 'AL',
    'diskdrive': 'DD',
    'zavaria': 'ZA'
  }
  
  if (knownYachts[normalizedYachtId]) {
    return knownYachts[normalizedYachtId]
  }
  
  throw new Error(`Unknown yacht ID: ${yachtId}. Valid yacht IDs: ${Object.keys(YachtCodes).join(', ')}`)
}

/**
 * Calculate ISO 8601 week number for a given date
 * @param {Date} date - Date to calculate week for
 * @returns {number} ISO week number (1-53)
 */
export function getISOWeek(date) {
  // Clone date to avoid modifying original
  const targetDate = new Date(date.getTime())
  
  // Set to Thursday of the week (ISO 8601 standard)
  const dayNumber = (targetDate.getDay() + 6) % 7 // Monday = 0, Sunday = 6
  targetDate.setDate(targetDate.getDate() - dayNumber + 3)
  
  // January 4th is always in the first week of the year
  const jan4 = new Date(targetDate.getFullYear(), 0, 4)
  
  // Calculate the difference in days and divide by 7
  const weekNumber = Math.round(((targetDate.getTime() - jan4.getTime()) / 86400000 - 3 + (jan4.getDay() + 6) % 7) / 7) + 1
  
  return weekNumber
}

/**
 * Find the highest sequence number from existing numbers
 * @param {Array<number>} existingNumbers - Array of existing numbers
 * @returns {number} Highest sequence number, or 0 if none exist
 */
export function findHighestSequence(existingNumbers) {
  if (!existingNumbers || existingNumbers.length === 0) {
    return 0
  }
  return Math.max(...existingNumbers)
}

/**
 * Get next sequence number using max-increment logic
 * @param {Array<number>} existingNumbers - Array of existing numbers
 * @returns {number} Next sequence number (highest + 1)
 */
export function getNextSequenceNumber(existingNumbers) {
  const highest = findHighestSequence(existingNumbers)
  return highest + 1
}

/**
 * Booking Number Generator Class
 * 
 * Provides flexible booking number generation with multiple formats,
 * sequence tracking, and validation capabilities.
 */
export class BookingNumberGenerator {
  /**
   * Create a new BookingNumberGenerator instance
   * 
   * @param {Object} [config] - Generator configuration
   * @param {string} [config.format] - Number format type
   * @param {string} [config.prefix] - Default prefix (e.g., 'BK')
   * @param {number} [config.sequenceLength] - Sequence number length
   * @param {Object} [config.customFormat] - Custom format configuration
   * @param {Function} [config.sequenceProvider] - Function to get/set sequence numbers
   */
  constructor(config = {}) {
    this.format = config.format || BookingNumberFormat.YEAR_MONTH_SEQ
    this.prefix = config.prefix || 'BK'
    this.sequenceLength = config.sequenceLength || 3
    this.customFormat = config.customFormat || null
    this.sequenceProvider = config.sequenceProvider || this._defaultSequenceProvider
    
    // In-memory sequence storage (for default provider)
    this._sequences = new Map()
    
    // Existing booking numbers cache for collision detection
    this._existingNumbers = new Set()
  }

  /**
   * Default sequence provider (in-memory storage)
   * @param {string} key - Sequence key
   * @param {number} [value] - Value to set (if provided)
   * @returns {Promise<number>} Current sequence value
   * @private
   */
  async _defaultSequenceProvider(key, value = null) {
    if (value !== null) {
      this._sequences.set(key, value)
      return value
    }
    
    const current = this._sequences.get(key) || 0
    const next = current + 1
    this._sequences.set(key, next)
    return next
  }

  /**
   * Generate a unique booking number
   * @param {Object} [options] - Generation options
   * @param {string} [options.yachtId] - Yacht ID (for yacht-specific formats)
   * @param {Date} [options.date] - Date for date-based formats
   * @param {string} [options.customPrefix] - Override default prefix
   * @param {number} [options.retryCount] - Maximum retry attempts for collision avoidance
   * @returns {Promise<string>} Generated booking number
   */
  async generateBookingNumber(options = {}) {
    const {
      yachtId = null,
      date = new Date(),
      customPrefix = null,
      retryCount = 10
    } = options

    let attempts = 0
    let bookingNumber = ''

    do {
      attempts++
      
      switch (this.format) {
        case BookingNumberFormat.SEQUENTIAL:
          bookingNumber = await this._generateSequential(customPrefix)
          break
          
        case BookingNumberFormat.YEAR_SEQUENTIAL:
          bookingNumber = await this._generateYearSequential(date, customPrefix)
          break
          
        case BookingNumberFormat.YEAR_MONTH_SEQ:
          bookingNumber = await this._generateYearMonthSequential(date, customPrefix)
          break
          
        case BookingNumberFormat.DATE_SEQUENTIAL:
          bookingNumber = await this._generateDateSequential(date, customPrefix)
          break
          
        case BookingNumberFormat.YACHT_SEQUENTIAL:
          bookingNumber = await this._generateYachtSequential(yachtId, customPrefix)
          break
          
        case BookingNumberFormat.YEAR_WEEK_YACHT_SEQ:
          bookingNumber = await this._generateYearWeekYachtSequential(date, yachtId, options)
          break
          
        case BookingNumberFormat.CUSTOM:
          bookingNumber = await this._generateCustom(options)
          break
          
        default:
          throw new Error(`Unsupported booking number format: ${this.format}`)
      }
      
      // Check for collisions
      if (!this._existingNumbers.has(bookingNumber)) {
        this._existingNumbers.add(bookingNumber)
        return bookingNumber
      }
      
    } while (attempts < retryCount)

    throw new Error(`Unable to generate unique booking number after ${retryCount} attempts`)
  }

  /**
   * Generate sequential booking number (BK001, BK002...)
   * @param {string} [customPrefix] - Custom prefix
   * @returns {Promise<string>} Generated number
   * @private
   */
  async _generateSequential(customPrefix = null) {
    const prefix = customPrefix || this.prefix
    const sequence = await this.sequenceProvider('sequential')
    return `${prefix}${sequence.toString().padStart(this.sequenceLength, '0')}`
  }

  /**
   * Generate year-based sequential number (BK24001, BK24002...)
   * @param {Date} date - Reference date
   * @param {string} [customPrefix] - Custom prefix
   * @returns {Promise<string>} Generated number
   * @private
   */
  async _generateYearSequential(date, customPrefix = null) {
    const prefix = customPrefix || this.prefix
    const year = date.getFullYear().toString().slice(-2)
    const sequenceKey = `year_${year}`
    const sequence = await this.sequenceProvider(sequenceKey)
    return `${prefix}${year}${sequence.toString().padStart(this.sequenceLength, '0')}`
  }

  /**
   * Generate year-month sequential number (BK2401001, BK2401002...)
   * @param {Date} date - Reference date
   * @param {string} [customPrefix] - Custom prefix
   * @returns {Promise<string>} Generated number
   * @private
   */
  async _generateYearMonthSequential(date, customPrefix = null) {
    const prefix = customPrefix || this.prefix
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const sequenceKey = `year_month_${year}${month}`
    const sequence = await this.sequenceProvider(sequenceKey)
    return `${prefix}${year}${month}${sequence.toString().padStart(this.sequenceLength, '0')}`
  }

  /**
   * Generate date-based sequential number (BK20240624001)
   * @param {Date} date - Reference date
   * @param {string} [customPrefix] - Custom prefix
   * @returns {Promise<string>} Generated number
   * @private
   */
  async _generateDateSequential(date, customPrefix = null) {
    const prefix = customPrefix || this.prefix
    const year = date.getFullYear().toString()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const dateStr = `${year}${month}${day}`
    const sequenceKey = `date_${dateStr}`
    const sequence = await this.sequenceProvider(sequenceKey)
    return `${prefix}${dateStr}${sequence.toString().padStart(3, '0')}`
  }

  /**
   * Generate yacht-specific sequential number (SP001, DD002...)
   * @param {string} yachtId - Yacht identifier
   * @param {string} [customPrefix] - Custom prefix (overrides yacht code)
   * @returns {Promise<string>} Generated number
   * @private
   */
  async _generateYachtSequential(yachtId, customPrefix = null) {
    if (!yachtId && !customPrefix) {
      throw new Error('Yacht ID required for yacht-sequential format')
    }
    
    const prefix = customPrefix || YachtCodes[yachtId] || yachtId.substring(0, 2).toUpperCase()
    const sequenceKey = `yacht_${yachtId || 'unknown'}`
    const sequence = await this.sequenceProvider(sequenceKey)
    return `${prefix}${sequence.toString().padStart(this.sequenceLength, '0')}`
  }

  /**
   * Generate year-week-yacht sequential number (2520ZA06)
   * Format: YYWWBCNN where:
   * - YY: Last 2 digits of charter start year
   * - WW: ISO week number (zero-padded)
   * - BC: Boat code (uppercase)
   * - NN: Sequential booking number for yacht within year (max-increment, zero-padded)
   * @param {Date} date - Charter start date
   * @param {string} yachtId - Yacht identifier
   * @param {Object} options - Additional options including existing bookings provider
   * @returns {Promise<string>} Generated booking code
   * @private
   */
  async _generateYearWeekYachtSequential(date, yachtId, options = {}) {
    if (!date) {
      throw new Error('Charter start date required for year-week-yacht format')
    }
    
    if (!yachtId) {
      throw new Error('Yacht ID required for year-week-yacht format')
    }
    
    // Get yacht code using flexible matching
    const boatCode = getYachtCode(yachtId)
    
    // Calculate YY (last 2 digits of year)
    const year = date.getFullYear()
    const yy = year.toString().slice(-2)
    
    // Calculate WW (ISO week number, zero-padded)
    const weekNumber = getISOWeek(date)
    const ww = weekNumber.toString().padStart(2, '0')
    
    // Get existing booking numbers for this yacht and year for max-increment logic
    const existingNumbers = await this._getExistingBookingNumbers(yy, boatCode, options)
    
    // Get next sequence number using max-increment logic
    const sequenceNumber = getNextSequenceNumber(existingNumbers)
    const nn = sequenceNumber.toString().padStart(2, '0')
    
    // Construct the booking code: YYWWBCNN
    const bookingCode = `${yy}${ww}${boatCode}${nn}`
    
    return bookingCode
  }

  /**
   * Get existing booking numbers for max-increment logic
   * @param {string} yy - Year (2 digits)
   * @param {string} boatCode - Boat code (2 letters)
   * @param {Object} options - Options including existingBookingsProvider
   * @returns {Promise<Array<number>>} Array of existing sequence numbers
   * @private
   */
  async _getExistingBookingNumbers(yy, boatCode, options = {}) {
    // If an existing bookings provider is given, use it
    if (options.existingBookingsProvider && typeof options.existingBookingsProvider === 'function') {
      try {
        const existingCodes = await options.existingBookingsProvider(yy, boatCode)
        return this._extractSequenceNumbers(existingCodes, yy, boatCode)
      } catch (error) {
        console.warn('[BookingNumberGenerator] Error fetching existing bookings:', error)
        return []
      }
    }
    
    // Fallback: check our internal existing numbers cache
    const pattern = new RegExp(`^${yy}\\d{2}${boatCode}(\\d{2})$`)
    const existingSequenceNumbers = []
    
    for (const existingNumber of this._existingNumbers) {
      const match = existingNumber.match(pattern)
      if (match) {
        const sequenceNum = parseInt(match[1], 10)
        if (!isNaN(sequenceNum)) {
          existingSequenceNumbers.push(sequenceNum)
        }
      }
    }
    
    return existingSequenceNumbers
  }

  /**
   * Extract sequence numbers from booking codes
   * @param {Array<string>} bookingCodes - Array of booking codes
   * @param {string} yy - Year (2 digits)
   * @param {string} boatCode - Boat code (2 letters)
   * @returns {Array<number>} Array of sequence numbers
   * @private
   */
  _extractSequenceNumbers(bookingCodes, yy, boatCode) {
    const pattern = new RegExp(`^${yy}\\d{2}${boatCode}(\\d{2})$`)
    const sequenceNumbers = []
    
    for (const code of bookingCodes) {
      if (typeof code === 'string') {
        const match = code.match(pattern)
        if (match) {
          const sequenceNum = parseInt(match[1], 10)
          if (!isNaN(sequenceNum)) {
            sequenceNumbers.push(sequenceNum)
          }
        }
      }
    }
    
    return sequenceNumbers
  }

  /**
   * Generate custom format booking number
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Generated number
   * @private
   */
  async _generateCustom(options) {
    if (!this.customFormat || !this.customFormat.template) {
      throw new Error('Custom format template not configured')
    }

    const { template, tokens } = this.customFormat
    let result = template

    // Process tokens
    for (const [token, config] of Object.entries(tokens)) {
      const placeholder = `{${token}}`
      let value = ''

      switch (config.type) {
        case 'prefix':
          value = config.value || this.prefix
          break
          
        case 'year':
          value = (options.date || new Date()).getFullYear().toString()
          if (config.length === 2) value = value.slice(-2)
          break
          
        case 'month':
          value = ((options.date || new Date()).getMonth() + 1).toString().padStart(2, '0')
          break
          
        case 'day':
          value = (options.date || new Date()).getDate().toString().padStart(2, '0')
          break
          
        case 'yacht_code':
          value = YachtCodes[options.yachtId] || options.yachtId?.substring(0, 2).toUpperCase() || 'XX'
          break
          
        case 'sequence':
          const sequenceKey = config.key || 'custom'
          const sequence = await this.sequenceProvider(sequenceKey)
          value = sequence.toString().padStart(config.length || this.sequenceLength, '0')
          break
          
        case 'random':
          value = this._generateRandomString(config.length || 3, config.charset || '0123456789')
          break
          
        default:
          if (typeof config.generator === 'function') {
            value = await config.generator(options)
          }
      }

      result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value)
    }

    return result
  }

  /**
   * Generate random string for custom formats
   * @param {number} length - String length
   * @param {string} charset - Character set to use
   * @returns {string} Random string
   * @private
   */
  _generateRandomString(length, charset) {
    let result = ''
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return result
  }

  /**
   * Validate booking number format
   * @param {string} bookingNumber - Number to validate
   * @param {string} [format] - Expected format (defaults to generator format)
   * @returns {Object} Validation result
   */
  validateBookingNumber(bookingNumber, format = null) {
    const targetFormat = format || this.format
    
    if (!bookingNumber || typeof bookingNumber !== 'string') {
      return {
        isValid: false,
        error: 'Booking number must be a non-empty string'
      }
    }

    // Check against pattern
    const pattern = ValidationPatterns[targetFormat]
    if (pattern && !pattern.test(bookingNumber)) {
      return {
        isValid: false,
        error: `Booking number does not match expected format for ${targetFormat}`
      }
    }

    // Check for existing collision
    if (this._existingNumbers.has(bookingNumber)) {
      return {
        isValid: false,
        error: 'Booking number already exists'
      }
    }

    return {
      isValid: true,
      format: targetFormat
    }
  }

  /**
   * Parse booking number components
   * @param {string} bookingNumber - Number to parse
   * @returns {Object} Parsed components
   */
  parseBookingNumber(bookingNumber) {
    if (!bookingNumber || typeof bookingNumber !== 'string') {
      return { isValid: false, error: 'Invalid booking number' }
    }

    const result = {
      isValid: true,
      original: bookingNumber,
      components: {}
    }

    // Try to match against known formats
    for (const [formatName, pattern] of Object.entries(ValidationPatterns)) {
      if (pattern.test(bookingNumber)) {
        result.detectedFormat = formatName
        break
      }
    }

    // Extract common components
    const prefixMatch = bookingNumber.match(/^([A-Z]+)/)
    if (prefixMatch) {
      result.components.prefix = prefixMatch[1]
      const remaining = bookingNumber.substring(prefixMatch[1].length)
      
      // Try to parse year/month/sequence based on format
      switch (result.detectedFormat) {
        case BookingNumberFormat.YEAR_SEQUENTIAL:
          if (remaining.length >= 5) {
            result.components.year = '20' + remaining.substring(0, 2)
            result.components.sequence = parseInt(remaining.substring(2))
          }
          break
          
        case BookingNumberFormat.YEAR_MONTH_SEQ:
          if (remaining.length >= 7) {
            result.components.year = '20' + remaining.substring(0, 2)
            result.components.month = parseInt(remaining.substring(2, 4))
            result.components.sequence = parseInt(remaining.substring(4))
          }
          break
          
        case BookingNumberFormat.DATE_SEQUENTIAL:
          if (remaining.length >= 11) {
            result.components.year = remaining.substring(0, 4)
            result.components.month = parseInt(remaining.substring(4, 6))
            result.components.day = parseInt(remaining.substring(6, 8))
            result.components.sequence = parseInt(remaining.substring(8))
          }
          break
          
        case BookingNumberFormat.SEQUENTIAL:
        case BookingNumberFormat.YACHT_SEQUENTIAL:
          result.components.sequence = parseInt(remaining)
          break
      }
    }

    return result
  }

  /**
   * Register existing booking numbers to prevent collisions
   * @param {Array<string>} bookingNumbers - Array of existing booking numbers
   */
  registerExistingNumbers(bookingNumbers) {
    if (Array.isArray(bookingNumbers)) {
      bookingNumbers.forEach(number => {
        if (number && typeof number === 'string') {
          this._existingNumbers.add(number)
        }
      })
    }
  }

  /**
   * Clear existing numbers cache
   */
  clearExistingNumbers() {
    this._existingNumbers.clear()
  }

  /**
   * Get next sequence number for a given key
   * @param {string} sequenceKey - Sequence key
   * @returns {Promise<number>} Next sequence number
   */
  async getNextSequence(sequenceKey) {
    return await this.sequenceProvider(sequenceKey)
  }

  /**
   * Set sequence number for a given key
   * @param {string} sequenceKey - Sequence key
   * @param {number} value - Sequence value
   * @returns {Promise<number>} Set sequence number
   */
  async setSequence(sequenceKey, value) {
    return await this.sequenceProvider(sequenceKey, value)
  }

  /**
   * Reset all sequences
   */
  resetSequences() {
    this._sequences.clear()
  }

  /**
   * Generate multiple booking numbers in batch
   * @param {number} count - Number of booking numbers to generate
   * @param {Object} [options] - Generation options
   * @returns {Promise<Array<string>>} Array of generated booking numbers
   */
  async generateBatch(count, options = {}) {
    const bookingNumbers = []
    
    for (let i = 0; i < count; i++) {
      const number = await this.generateBookingNumber(options)
      bookingNumbers.push(number)
    }
    
    return bookingNumbers
  }

  /**
   * Create a custom format configuration
   * @param {string} template - Format template with tokens
   * @param {Object} tokens - Token definitions
   * @returns {Object} Custom format configuration
   * @static
   */
  static createCustomFormat(template, tokens) {
    return {
      template,
      tokens
    }
  }

  /**
   * Create a database-backed sequence provider
   * @param {Function} dbGetSequence - Function to get sequence from database
   * @param {Function} dbSetSequence - Function to set sequence in database
   * @returns {Function} Database sequence provider
   * @static
   */
  static createDatabaseSequenceProvider(dbGetSequence, dbSetSequence) {
    return async (key, value = null) => {
      if (value !== null) {
        await dbSetSequence(key, value)
        return value
      }
      
      const current = await dbGetSequence(key) || 0
      const next = current + 1
      await dbSetSequence(key, next)
      return next
    }
  }
}

/**
 * Predefined booking number generators for common use cases
 */
export class PredefinedGenerators {
  /**
   * Create a simple sequential generator (BK001, BK002...)
   * @param {string} [prefix='BK'] - Number prefix
   * @returns {BookingNumberGenerator} Configured generator
   */
  static createSimpleSequential(prefix = 'BK') {
    return new BookingNumberGenerator({
      format: BookingNumberFormat.SEQUENTIAL,
      prefix,
      sequenceLength: 3
    })
  }

  /**
   * Create a year-month sequential generator (BK2401001, BK2401002...)
   * @param {string} [prefix='BK'] - Number prefix
   * @returns {BookingNumberGenerator} Configured generator
   */
  static createYearMonthSequential(prefix = 'BK') {
    return new BookingNumberGenerator({
      format: BookingNumberFormat.YEAR_MONTH_SEQ,
      prefix,
      sequenceLength: 3
    })
  }

  /**
   * Create a yacht-specific generator (SP001, DD002...)
   * @returns {BookingNumberGenerator} Configured generator
   */
  static createYachtSpecific() {
    return new BookingNumberGenerator({
      format: BookingNumberFormat.YACHT_SEQUENTIAL,
      sequenceLength: 3
    })
  }

  /**
   * Create a date-based generator (BK20240624001)
   * @param {string} [prefix='BK'] - Number prefix
   * @returns {BookingNumberGenerator} Configured generator
   */
  static createDateBased(prefix = 'BK') {
    return new BookingNumberGenerator({
      format: BookingNumberFormat.DATE_SEQUENTIAL,
      prefix
    })
  }

  /**
   * Create a custom yacht charter generator
   * @returns {BookingNumberGenerator} Configured generator
   */
  static createYachtCharterCustom() {
    const customFormat = BookingNumberGenerator.createCustomFormat(
      '{prefix}{year}{month}-{yacht_code}-{sequence}',
      {
        prefix: { type: 'prefix', value: 'YC' },
        year: { type: 'year', length: 2 },
        month: { type: 'month' },
        yacht_code: { type: 'yacht_code' },
        sequence: { type: 'sequence', length: 3, key: 'yacht_charter' }
      }
    )

    return new BookingNumberGenerator({
      format: BookingNumberFormat.CUSTOM,
      customFormat
    })
  }
}

export default BookingNumberGenerator