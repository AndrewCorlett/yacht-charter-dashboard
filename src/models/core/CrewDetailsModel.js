/**
 * Crew Details Model
 * 
 * Manages crew member information linked to yacht charter bookings.
 * Includes personal details, experience, and emergency contact information.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

import { parseISO, isValid, isBefore, differenceInYears } from 'date-fns'

/**
 * Crew position enumeration
 */
export const CrewPosition = {
  CAPTAIN: 'captain',
  FIRST_MATE: 'first_mate',
  CHEF: 'chef',
  STEWARDESS: 'stewardess',
  DECKHAND: 'deckhand',
  ENGINEER: 'engineer',
  GUEST: 'guest'
}

/**
 * Experience level enumeration
 */
export const ExperienceLevel = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  PROFESSIONAL: 'professional'
}

/**
 * Crew Details Model Class
 * 
 * Represents crew member information with validation and
 * emergency contact management for yacht charters.
 */
export class CrewDetailsModel {
  /**
   * Create a new CrewDetailsModel instance
   * 
   * @param {Object} data - Initial crew member data
   * @param {string} [data.id] - UUID primary key
   * @param {string} data.booking_id - Reference to parent booking
   * @param {string} data.first_name - Crew member first name
   * @param {string} data.last_name - Crew member last name
   * @param {string|Date} data.date_of_birth - Date of birth
   * @param {string} data.position - Crew position from enum
   * @param {string} data.email - Contact email
   * @param {string} [data.phone] - Contact phone number
   * @param {string} [data.address_line_1] - Primary address
   * @param {string} [data.address_line_2] - Secondary address
   * @param {string} [data.city] - City
   * @param {string} [data.state_province] - State or province
   * @param {string} [data.postal_code] - Postal/ZIP code
   * @param {string} [data.country] - Country
   * @param {string} [data.nationality] - Nationality
   * @param {string} [data.passport_number] - Passport number
   * @param {string|Date} [data.passport_expiry] - Passport expiry date
   * @param {string} [data.experience_level] - Experience level from enum
   * @param {number} [data.years_experience] - Years of sailing experience
   * @param {string} [data.certifications] - Sailing certifications
   * @param {string} [data.medical_conditions] - Medical conditions/allergies
   * @param {string} [data.emergency_contact_name] - Emergency contact name
   * @param {string} [data.emergency_contact_phone] - Emergency contact phone
   * @param {string} [data.emergency_contact_relationship] - Relationship to crew member
   * @param {string} [data.special_requirements] - Special requirements/notes
   * @param {string|Date} [data.created_at] - Creation timestamp
   * @param {string|Date} [data.modified_at] - Last modification timestamp
   */
  constructor(data = {}) {
    // Primary keys and references
    this.id = data.id || this._generateUUID()
    this.booking_id = data.booking_id || ''
    
    // Personal Information
    this.first_name = data.first_name || ''
    this.last_name = data.last_name || ''
    this.date_of_birth = this._parseDate(data.date_of_birth)
    this.position = data.position || CrewPosition.GUEST
    
    // Contact Information
    this.email = data.email || ''
    this.phone = data.phone || ''
    
    // Address Information
    this.address_line_1 = data.address_line_1 || ''
    this.address_line_2 = data.address_line_2 || ''
    this.city = data.city || ''
    this.state_province = data.state_province || ''
    this.postal_code = data.postal_code || ''
    this.country = data.country || ''
    
    // Identity Information
    this.nationality = data.nationality || ''
    this.passport_number = data.passport_number || ''
    this.passport_expiry = this._parseDate(data.passport_expiry)
    
    // Experience Information
    this.experience_level = data.experience_level || ExperienceLevel.BEGINNER
    this.years_experience = this._parseNumber(data.years_experience)
    this.certifications = data.certifications || ''
    
    // Medical Information
    this.medical_conditions = data.medical_conditions || ''
    
    // Emergency Contact
    this.emergency_contact_name = data.emergency_contact_name || ''
    this.emergency_contact_phone = data.emergency_contact_phone || ''
    this.emergency_contact_relationship = data.emergency_contact_relationship || ''
    
    // Additional Information
    this.special_requirements = data.special_requirements || ''
    
    // System Fields
    this.created_at = this._parseDate(data.created_at) || new Date()
    this.modified_at = this._parseDate(data.modified_at) || new Date()
    
    // Validation errors storage
    this._errors = new Map()
  }

  /**
   * Generate a new UUID
   * @returns {string} RFC 4122 compliant UUID
   * @private
   */
  _generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  /**
   * Parse and validate date input
   * @param {string|Date|null} value - Input date
   * @returns {Date|null} Parsed date or null
   * @private
   */
  _parseDate(value) {
    if (!value) return null
    if (value instanceof Date) return value
    if (typeof value === 'string') {
      const parsed = parseISO(value)
      return isValid(parsed) ? parsed : null
    }
    return null
  }

  /**
   * Parse and validate number input
   * @param {string|number|null} value - Input number
   * @returns {number|null} Parsed number or null
   * @private
   */
  _parseNumber(value) {
    if (value === null || value === undefined || value === '') return null
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? null : parsed
  }

  /**
   * Validate all crew member data
   * @returns {boolean} True if valid, false otherwise
   */
  validate() {
    this._errors.clear()

    // Required field validation
    if (!this.booking_id?.trim()) {
      this._errors.set('booking_id', 'Booking reference is required')
    }

    if (!this.first_name?.trim()) {
      this._errors.set('first_name', 'First name is required')
    }

    if (!this.last_name?.trim()) {
      this._errors.set('last_name', 'Last name is required')
    }

    if (!this.date_of_birth) {
      this._errors.set('date_of_birth', 'Date of birth is required')
    } else {
      // Age validation (must be at least 18 for crew, 0+ for guests)
      const age = this.getAge()
      if (this.position !== CrewPosition.GUEST && age < 18) {
        this._errors.set('date_of_birth', 'Crew members must be at least 18 years old')
      }
      
      // Future date validation
      if (!isBefore(this.date_of_birth, new Date())) {
        this._errors.set('date_of_birth', 'Date of birth cannot be in the future')
      }
    }

    if (!this.email?.trim()) {
      this._errors.set('email', 'Email address is required')
    } else if (!this._isValidEmail(this.email)) {
      this._errors.set('email', 'Invalid email format')
    }

    // Position validation
    if (!Object.values(CrewPosition).includes(this.position)) {
      this._errors.set('position', 'Invalid crew position')
    }

    // Experience level validation
    if (!Object.values(ExperienceLevel).includes(this.experience_level)) {
      this._errors.set('experience_level', 'Invalid experience level')
    }

    // Phone validation (if provided)
    if (this.phone && !this._isValidPhone(this.phone)) {
      this._errors.set('phone', 'Invalid phone number format')
    }

    // Emergency contact phone validation (if provided)
    if (this.emergency_contact_phone && !this._isValidPhone(this.emergency_contact_phone)) {
      this._errors.set('emergency_contact_phone', 'Invalid emergency contact phone format')
    }

    // Passport expiry validation
    if (this.passport_expiry && isBefore(this.passport_expiry, new Date())) {
      this._errors.set('passport_expiry', 'Passport has expired')
    }

    // Years experience validation
    if (this.years_experience !== null && this.years_experience < 0) {
      this._errors.set('years_experience', 'Years of experience cannot be negative')
    }

    // Validate emergency contact completeness
    const hasEmergencyName = Boolean(this.emergency_contact_name?.trim())
    const hasEmergencyPhone = Boolean(this.emergency_contact_phone?.trim())
    
    if (hasEmergencyName && !hasEmergencyPhone) {
      this._errors.set('emergency_contact_phone', 'Emergency contact phone is required when name is provided')
    }
    
    if (hasEmergencyPhone && !hasEmergencyName) {
      this._errors.set('emergency_contact_name', 'Emergency contact name is required when phone is provided')
    }

    return this._errors.size === 0
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   * @private
   */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate phone number format
   * @param {string} phone - Phone to validate
   * @returns {boolean} True if valid
   * @private
   */
  _isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    return phoneRegex.test(cleaned) && cleaned.length >= 10
  }

  /**
   * Get crew member's current age
   * @returns {number} Age in years
   */
  getAge() {
    if (!this.date_of_birth) return 0
    return differenceInYears(new Date(), this.date_of_birth)
  }

  /**
   * Get full name
   * @returns {string} Combined first and last name
   */
  getFullName() {
    return `${this.first_name} ${this.last_name}`.trim()
  }

  /**
   * Get formatted address
   * @returns {string} Formatted address string
   */
  getFormattedAddress() {
    const parts = [
      this.address_line_1,
      this.address_line_2,
      this.city,
      this.state_province,
      this.postal_code,
      this.country
    ].filter(part => part?.trim())
    
    return parts.join(', ')
  }

  /**
   * Check if passport is valid and not expired
   * @returns {boolean} True if passport is valid
   */
  hasValidPassport() {
    return Boolean(this.passport_number?.trim() && 
                  this.passport_expiry && 
                  !isBefore(this.passport_expiry, new Date()))
  }

  /**
   * Check if emergency contact information is complete
   * @returns {boolean} True if emergency contact is complete
   */
  hasCompleteEmergencyContact() {
    return Boolean(this.emergency_contact_name?.trim() && 
                  this.emergency_contact_phone?.trim())
  }

  /**
   * Check if crew member is a professional crew member
   * @returns {boolean} True if professional crew
   */
  isProfessionalCrew() {
    return [
      CrewPosition.CAPTAIN,
      CrewPosition.FIRST_MATE,
      CrewPosition.CHEF,
      CrewPosition.STEWARDESS,
      CrewPosition.DECKHAND,
      CrewPosition.ENGINEER
    ].includes(this.position)
  }

  /**
   * Get all validation errors
   * @returns {Object} Object with field names as keys and error messages as values
   */
  getErrors() {
    return Object.fromEntries(this._errors)
  }

  /**
   * Get specific field error
   * @param {string} field - Field name
   * @returns {string|null} Error message or null
   */
  getError(field) {
    return this._errors.get(field) || null
  }

  /**
   * Check if crew member has any validation errors
   * @returns {boolean} True if there are errors
   */
  hasErrors() {
    return this._errors.size > 0
  }

  /**
   * Update crew member data and trigger validation
   * @param {Object} updates - Fields to update
   * @returns {boolean} True if update was successful and valid
   */
  update(updates) {
    Object.keys(updates).forEach(key => {
      if (key in this) {
        if (key.includes('date') || key.includes('_at')) {
          this[key] = this._parseDate(updates[key])
        } else if (key.includes('years_experience')) {
          this[key] = this._parseNumber(updates[key])
        } else {
          this[key] = updates[key]
        }
      }
    })

    this.modified_at = new Date()
    return this.validate()
  }

  /**
   * Convert crew member to database-ready format
   * @returns {Object} Database-formatted crew data
   */
  toDatabase() {
    return {
      id: this.id,
      booking_id: this.booking_id,
      first_name: this.first_name,
      last_name: this.last_name,
      date_of_birth: this.date_of_birth?.toISOString().split('T')[0],
      position: this.position,
      email: this.email,
      phone: this.phone,
      address_line_1: this.address_line_1,
      address_line_2: this.address_line_2,
      city: this.city,
      state_province: this.state_province,
      postal_code: this.postal_code,
      country: this.country,
      nationality: this.nationality,
      passport_number: this.passport_number,
      passport_expiry: this.passport_expiry?.toISOString().split('T')[0],
      experience_level: this.experience_level,
      years_experience: this.years_experience,
      certifications: this.certifications,
      medical_conditions: this.medical_conditions,
      emergency_contact_name: this.emergency_contact_name,
      emergency_contact_phone: this.emergency_contact_phone,
      emergency_contact_relationship: this.emergency_contact_relationship,
      special_requirements: this.special_requirements,
      created_at: this.created_at?.toISOString(),
      modified_at: this.modified_at?.toISOString()
    }
  }

  /**
   * Convert crew member to frontend-friendly format
   * @returns {Object} Frontend-formatted crew data
   */
  toFrontend() {
    return {
      id: this.id,
      bookingId: this.booking_id,
      firstName: this.first_name,
      lastName: this.last_name,
      fullName: this.getFullName(),
      dateOfBirth: this.date_of_birth,
      age: this.getAge(),
      position: this.position,
      email: this.email,
      phone: this.phone,
      address: {
        line1: this.address_line_1,
        line2: this.address_line_2,
        city: this.city,
        stateProvince: this.state_province,
        postalCode: this.postal_code,
        country: this.country,
        formatted: this.getFormattedAddress()
      },
      nationality: this.nationality,
      passport: {
        number: this.passport_number,
        expiry: this.passport_expiry,
        isValid: this.hasValidPassport()
      },
      experience: {
        level: this.experience_level,
        years: this.years_experience,
        certifications: this.certifications
      },
      medical: {
        conditions: this.medical_conditions
      },
      emergencyContact: {
        name: this.emergency_contact_name,
        phone: this.emergency_contact_phone,
        relationship: this.emergency_contact_relationship,
        isComplete: this.hasCompleteEmergencyContact()
      },
      specialRequirements: this.special_requirements,
      isProfessionalCrew: this.isProfessionalCrew(),
      createdAt: this.created_at,
      modifiedAt: this.modified_at
    }
  }

  /**
   * Create a copy of the crew member with new ID
   * @returns {CrewDetailsModel} New crew member instance
   */
  clone() {
    const data = this.toDatabase()
    delete data.id
    return new CrewDetailsModel(data)
  }

  /**
   * Create CrewDetailsModel from database record
   * @param {Object} dbRecord - Database record
   * @returns {CrewDetailsModel} New crew member instance
   */
  static fromDatabase(dbRecord) {
    return new CrewDetailsModel(dbRecord)
  }

  /**
   * Create CrewDetailsModel from frontend form data
   * @param {Object} formData - Form data
   * @param {string} bookingId - Parent booking ID
   * @returns {CrewDetailsModel} New crew member instance
   */
  static fromFrontend(formData, bookingId) {
    const mappedData = {
      booking_id: bookingId,
      first_name: formData.firstName,
      last_name: formData.lastName,
      date_of_birth: formData.dateOfBirth,
      position: formData.position,
      email: formData.email,
      phone: formData.phone,
      address_line_1: formData.addressLine1,
      address_line_2: formData.addressLine2,
      city: formData.city,
      state_province: formData.stateProvince,
      postal_code: formData.postalCode,
      country: formData.country,
      nationality: formData.nationality,
      passport_number: formData.passportNumber,
      passport_expiry: formData.passportExpiry,
      experience_level: formData.experienceLevel,
      years_experience: formData.yearsExperience,
      certifications: formData.certifications,
      medical_conditions: formData.medicalConditions,
      emergency_contact_name: formData.emergencyContactName,
      emergency_contact_phone: formData.emergencyContactPhone,
      emergency_contact_relationship: formData.emergencyContactRelationship,
      special_requirements: formData.specialRequirements
    }

    return new CrewDetailsModel(mappedData)
  }
}

export default CrewDetailsModel