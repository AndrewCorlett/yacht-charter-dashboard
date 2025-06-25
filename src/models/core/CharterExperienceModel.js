/**
 * Charter Experience Model
 * 
 * Manages charter experience information including special requirements,
 * dietary needs, celebrations, and previous charter history.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

import { parseISO, isValid } from 'date-fns'

/**
 * Dietary restriction enumeration
 */
export const DietaryRestriction = {
  NONE: 'none',
  VEGETARIAN: 'vegetarian',
  VEGAN: 'vegan',
  GLUTEN_FREE: 'gluten_free',
  DAIRY_FREE: 'dairy_free',
  NUT_ALLERGY: 'nut_allergy',
  SEAFOOD_ALLERGY: 'seafood_allergy',
  KOSHER: 'kosher',
  HALAL: 'halal',
  OTHER: 'other'
}

/**
 * Celebration type enumeration
 */
export const CelebrationType = {
  BIRTHDAY: 'birthday',
  ANNIVERSARY: 'anniversary',
  WEDDING: 'wedding',
  ENGAGEMENT: 'engagement',
  CORPORATE: 'corporate',
  GRADUATION: 'graduation',
  REUNION: 'reunion',
  OTHER: 'other'
}

/**
 * Previous charter rating enumeration
 */
export const CharterRating = {
  EXCELLENT: 5,
  VERY_GOOD: 4,
  GOOD: 3,
  FAIR: 2,
  POOR: 1
}

/**
 * Charter Experience Model Class
 * 
 * Represents the charter experience preferences and requirements
 * for a booking, including dietary needs and special occasions.
 */
export class CharterExperienceModel {
  /**
   * Create a new CharterExperienceModel instance
   * 
   * @param {Object} data - Initial charter experience data
   * @param {string} [data.id] - UUID primary key
   * @param {string} data.booking_id - Reference to parent booking
   * @param {Array<string>} [data.dietary_restrictions] - List of dietary restrictions
   * @param {string} [data.dietary_notes] - Additional dietary information
   * @param {Array<Object>} [data.food_allergies] - Specific food allergies with severity
   * @param {string} [data.preferred_cuisine] - Preferred cuisine type
   * @param {boolean} [data.alcohol_service] - Whether alcohol service is requested
   * @param {string} [data.alcohol_preferences] - Specific alcohol preferences
   * @param {string} [data.celebration_type] - Type of celebration from enum
   * @param {string} [data.celebration_details] - Details about the celebration
   * @param {number} [data.guest_count] - Expected number of guests
   * @param {number} [data.child_count] - Number of children
   * @param {Array<Object>} [data.special_requests] - List of special requests
   * @param {string} [data.music_preferences] - Music preferences
   * @param {string} [data.activity_preferences] - Preferred activities
   * @param {boolean} [data.photography_allowed] - Whether photography is allowed
   * @param {boolean} [data.social_media_consent] - Consent for social media posts
   * @param {Array<Object>} [data.previous_charters] - Previous charter history
   * @param {string} [data.how_heard_about_us] - How they heard about the service
   * @param {string} [data.expectations] - Charter expectations
   * @param {string} [data.concerns] - Any concerns or worries
   * @param {number} [data.budget_range_min] - Minimum budget range
   * @param {number} [data.budget_range_max] - Maximum budget range
   * @param {boolean} [data.flexible_dates] - Whether dates are flexible
   * @param {Array<string>} [data.preferred_weather] - Preferred weather conditions
   * @param {string} [data.accessibility_requirements] - Accessibility needs
   * @param {string} [data.communication_preferences] - How they prefer to be contacted
   * @param {string|Date} [data.created_at] - Creation timestamp
   * @param {string|Date} [data.modified_at] - Last modification timestamp
   */
  constructor(data = {}) {
    // Primary keys and references
    this.id = data.id || this._generateUUID()
    this.booking_id = data.booking_id || ''
    
    // Dietary Information
    this.dietary_restrictions = Array.isArray(data.dietary_restrictions) 
      ? data.dietary_restrictions 
      : []
    this.dietary_notes = data.dietary_notes || ''
    this.food_allergies = Array.isArray(data.food_allergies) 
      ? data.food_allergies 
      : []
    this.preferred_cuisine = data.preferred_cuisine || ''
    
    // Alcohol Service
    this.alcohol_service = Boolean(data.alcohol_service)
    this.alcohol_preferences = data.alcohol_preferences || ''
    
    // Celebration Information
    this.celebration_type = data.celebration_type || ''
    this.celebration_details = data.celebration_details || ''
    
    // Guest Information
    this.guest_count = this._parseNumber(data.guest_count)
    this.child_count = this._parseNumber(data.child_count) || 0
    
    // Special Requests and Preferences
    this.special_requests = Array.isArray(data.special_requests) 
      ? data.special_requests 
      : []
    this.music_preferences = data.music_preferences || ''
    this.activity_preferences = data.activity_preferences || ''
    
    // Media and Privacy
    this.photography_allowed = Boolean(data.photography_allowed)
    this.social_media_consent = Boolean(data.social_media_consent)
    
    // Experience and History
    this.previous_charters = Array.isArray(data.previous_charters) 
      ? data.previous_charters 
      : []
    this.how_heard_about_us = data.how_heard_about_us || ''
    
    // Expectations and Concerns
    this.expectations = data.expectations || ''
    this.concerns = data.concerns || ''
    
    // Budget and Flexibility
    this.budget_range_min = this._parseNumber(data.budget_range_min)
    this.budget_range_max = this._parseNumber(data.budget_range_max)
    this.flexible_dates = Boolean(data.flexible_dates)
    
    // Weather and Conditions
    this.preferred_weather = Array.isArray(data.preferred_weather) 
      ? data.preferred_weather 
      : []
    
    // Accessibility and Communication
    this.accessibility_requirements = data.accessibility_requirements || ''
    this.communication_preferences = data.communication_preferences || ''
    
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
   * Validate all charter experience data
   * @returns {boolean} True if valid, false otherwise
   */
  validate() {
    this._errors.clear()

    // Required field validation
    if (!this.booking_id?.trim()) {
      this._errors.set('booking_id', 'Booking reference is required')
    }

    // Guest count validation
    if (this.guest_count !== null && this.guest_count < 1) {
      this._errors.set('guest_count', 'Guest count must be at least 1')
    }

    if (this.child_count !== null && this.child_count < 0) {
      this._errors.set('child_count', 'Child count cannot be negative')
    }

    // Dietary restrictions validation
    for (const restriction of this.dietary_restrictions) {
      if (!Object.values(DietaryRestriction).includes(restriction)) {
        this._errors.set('dietary_restrictions', 'Invalid dietary restriction')
        break
      }
    }

    // Food allergies validation
    for (const allergy of this.food_allergies) {
      if (!allergy.allergen || typeof allergy.allergen !== 'string') {
        this._errors.set('food_allergies', 'Allergen name is required')
        break
      }
      if (allergy.severity && !['mild', 'moderate', 'severe'].includes(allergy.severity)) {
        this._errors.set('food_allergies', 'Invalid allergy severity level')
        break
      }
    }

    // Celebration type validation
    if (this.celebration_type && !Object.values(CelebrationType).includes(this.celebration_type)) {
      this._errors.set('celebration_type', 'Invalid celebration type')
    }

    // Budget range validation
    if (this.budget_range_min !== null && this.budget_range_min < 0) {
      this._errors.set('budget_range_min', 'Budget minimum cannot be negative')
    }

    if (this.budget_range_max !== null && this.budget_range_max < 0) {
      this._errors.set('budget_range_max', 'Budget maximum cannot be negative')
    }

    if (this.budget_range_min !== null && this.budget_range_max !== null && 
        this.budget_range_min > this.budget_range_max) {
      this._errors.set('budget_range_max', 'Maximum budget must be greater than minimum')
    }

    // Previous charters validation
    for (const charter of this.previous_charters) {
      if (charter.rating && !Object.values(CharterRating).includes(charter.rating)) {
        this._errors.set('previous_charters', 'Invalid charter rating')
        break
      }
      if (charter.date && !this._parseDate(charter.date)) {
        this._errors.set('previous_charters', 'Invalid charter date format')
        break
      }
    }

    // Special requests validation
    for (const request of this.special_requests) {
      if (!request.description || typeof request.description !== 'string') {
        this._errors.set('special_requests', 'Special request description is required')
        break
      }
    }

    return this._errors.size === 0
  }

  /**
   * Add a dietary restriction
   * @param {string} restriction - Dietary restriction from enum
   * @returns {boolean} True if added successfully
   */
  addDietaryRestriction(restriction) {
    if (!Object.values(DietaryRestriction).includes(restriction)) {
      return false
    }
    
    if (!this.dietary_restrictions.includes(restriction)) {
      this.dietary_restrictions.push(restriction)
      this.modified_at = new Date()
    }
    
    return true
  }

  /**
   * Remove a dietary restriction
   * @param {string} restriction - Dietary restriction to remove
   * @returns {boolean} True if removed successfully
   */
  removeDietaryRestriction(restriction) {
    const index = this.dietary_restrictions.indexOf(restriction)
    if (index > -1) {
      this.dietary_restrictions.splice(index, 1)
      this.modified_at = new Date()
      return true
    }
    return false
  }

  /**
   * Add a food allergy
   * @param {Object} allergy - Allergy object with allergen and severity
   * @param {string} allergy.allergen - Name of the allergen
   * @param {string} [allergy.severity] - Severity level (mild, moderate, severe)
   * @param {string} [allergy.notes] - Additional notes
   * @returns {boolean} True if added successfully
   */
  addFoodAllergy(allergy) {
    if (!allergy.allergen || typeof allergy.allergen !== 'string') {
      return false
    }

    const allergyEntry = {
      id: this._generateUUID(),
      allergen: allergy.allergen.trim(),
      severity: allergy.severity || 'moderate',
      notes: allergy.notes || '',
      created_at: new Date()
    }

    this.food_allergies.push(allergyEntry)
    this.modified_at = new Date()
    return true
  }

  /**
   * Remove a food allergy
   * @param {string} allergyId - ID of the allergy to remove
   * @returns {boolean} True if removed successfully
   */
  removeFoodAllergy(allergyId) {
    const index = this.food_allergies.findIndex(allergy => allergy.id === allergyId)
    if (index > -1) {
      this.food_allergies.splice(index, 1)
      this.modified_at = new Date()
      return true
    }
    return false
  }

  /**
   * Add a special request
   * @param {Object} request - Special request object
   * @param {string} request.description - Request description
   * @param {string} [request.priority] - Priority level (low, medium, high)
   * @param {string} [request.category] - Request category
   * @returns {boolean} True if added successfully
   */
  addSpecialRequest(request) {
    if (!request.description || typeof request.description !== 'string') {
      return false
    }

    const requestEntry = {
      id: this._generateUUID(),
      description: request.description.trim(),
      priority: request.priority || 'medium',
      category: request.category || 'general',
      created_at: new Date()
    }

    this.special_requests.push(requestEntry)
    this.modified_at = new Date()
    return true
  }

  /**
   * Remove a special request
   * @param {string} requestId - ID of the request to remove
   * @returns {boolean} True if removed successfully
   */
  removeSpecialRequest(requestId) {
    const index = this.special_requests.findIndex(request => request.id === requestId)
    if (index > -1) {
      this.special_requests.splice(index, 1)
      this.modified_at = new Date()
      return true
    }
    return false
  }

  /**
   * Add previous charter experience
   * @param {Object} charter - Previous charter object
   * @param {string|Date} charter.date - Charter date
   * @param {string} charter.yacht - Yacht name
   * @param {string} [charter.location] - Charter location
   * @param {number} [charter.rating] - Rating from 1-5
   * @param {string} [charter.notes] - Experience notes
   * @returns {boolean} True if added successfully
   */
  addPreviousCharter(charter) {
    if (!charter.date || !charter.yacht) {
      return false
    }

    const charterEntry = {
      id: this._generateUUID(),
      date: this._parseDate(charter.date),
      yacht: charter.yacht.trim(),
      location: charter.location || '',
      rating: charter.rating || null,
      notes: charter.notes || '',
      created_at: new Date()
    }

    this.previous_charters.push(charterEntry)
    this.modified_at = new Date()
    return true
  }

  /**
   * Get dietary restrictions summary
   * @returns {Object} Summary of dietary information
   */
  getDietarySummary() {
    return {
      restrictions: this.dietary_restrictions,
      hasRestrictions: this.dietary_restrictions.length > 0,
      allergies: this.food_allergies,
      hasAllergies: this.food_allergies.length > 0,
      notes: this.dietary_notes,
      alcoholService: this.alcohol_service,
      alcoholPreferences: this.alcohol_preferences
    }
  }

  /**
   * Get celebration summary
   * @returns {Object} Summary of celebration information
   */
  getCelebrationSummary() {
    return {
      type: this.celebration_type,
      details: this.celebration_details,
      hasCelebration: Boolean(this.celebration_type),
      guestCount: this.guest_count,
      childCount: this.child_count
    }
  }

  /**
   * Get experience level based on previous charters
   * @returns {string} Experience level description
   */
  getExperienceLevel() {
    const charterCount = this.previous_charters.length
    
    if (charterCount === 0) return 'First-time charterer'
    if (charterCount <= 2) return 'Occasional charterer'
    if (charterCount <= 5) return 'Regular charterer'
    return 'Experienced charterer'
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
   * Check if charter experience has any validation errors
   * @returns {boolean} True if there are errors
   */
  hasErrors() {
    return this._errors.size > 0
  }

  /**
   * Update charter experience data and trigger validation
   * @param {Object} updates - Fields to update
   * @returns {boolean} True if update was successful and valid
   */
  update(updates) {
    Object.keys(updates).forEach(key => {
      if (key in this) {
        if (key.includes('date') || key.includes('_at')) {
          this[key] = this._parseDate(updates[key])
        } else if (key.includes('count') || key.includes('budget')) {
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
   * Convert charter experience to database-ready format
   * @returns {Object} Database-formatted charter experience data
   */
  toDatabase() {
    return {
      id: this.id,
      booking_id: this.booking_id,
      dietary_restrictions: JSON.stringify(this.dietary_restrictions),
      dietary_notes: this.dietary_notes,
      food_allergies: JSON.stringify(this.food_allergies),
      preferred_cuisine: this.preferred_cuisine,
      alcohol_service: this.alcohol_service,
      alcohol_preferences: this.alcohol_preferences,
      celebration_type: this.celebration_type,
      celebration_details: this.celebration_details,
      guest_count: this.guest_count,
      child_count: this.child_count,
      special_requests: JSON.stringify(this.special_requests),
      music_preferences: this.music_preferences,
      activity_preferences: this.activity_preferences,
      photography_allowed: this.photography_allowed,
      social_media_consent: this.social_media_consent,
      previous_charters: JSON.stringify(this.previous_charters),
      how_heard_about_us: this.how_heard_about_us,
      expectations: this.expectations,
      concerns: this.concerns,
      budget_range_min: this.budget_range_min,
      budget_range_max: this.budget_range_max,
      flexible_dates: this.flexible_dates,
      preferred_weather: JSON.stringify(this.preferred_weather),
      accessibility_requirements: this.accessibility_requirements,
      communication_preferences: this.communication_preferences,
      created_at: this.created_at?.toISOString(),
      modified_at: this.modified_at?.toISOString()
    }
  }

  /**
   * Convert charter experience to frontend-friendly format
   * @returns {Object} Frontend-formatted charter experience data
   */
  toFrontend() {
    return {
      id: this.id,
      bookingId: this.booking_id,
      dietary: this.getDietarySummary(),
      celebration: this.getCelebrationSummary(),
      preferences: {
        cuisine: this.preferred_cuisine,
        music: this.music_preferences,
        activities: this.activity_preferences,
        weather: this.preferred_weather
      },
      privacy: {
        photographyAllowed: this.photography_allowed,
        socialMediaConsent: this.social_media_consent
      },
      experience: {
        level: this.getExperienceLevel(),
        previousCharters: this.previous_charters,
        howHeardAboutUs: this.how_heard_about_us
      },
      planning: {
        expectations: this.expectations,
        concerns: this.concerns,
        budgetRange: {
          min: this.budget_range_min,
          max: this.budget_range_max
        },
        flexibleDates: this.flexible_dates
      },
      accessibility: {
        requirements: this.accessibility_requirements,
        communicationPreferences: this.communication_preferences
      },
      specialRequests: this.special_requests,
      createdAt: this.created_at,
      modifiedAt: this.modified_at
    }
  }

  /**
   * Create a copy of the charter experience with new ID
   * @returns {CharterExperienceModel} New charter experience instance
   */
  clone() {
    const data = this.toDatabase()
    delete data.id
    // Parse JSON fields back to arrays/objects
    data.dietary_restrictions = JSON.parse(data.dietary_restrictions)
    data.food_allergies = JSON.parse(data.food_allergies)
    data.special_requests = JSON.parse(data.special_requests)
    data.previous_charters = JSON.parse(data.previous_charters)
    data.preferred_weather = JSON.parse(data.preferred_weather)
    return new CharterExperienceModel(data)
  }

  /**
   * Create CharterExperienceModel from database record
   * @param {Object} dbRecord - Database record
   * @returns {CharterExperienceModel} New charter experience instance
   */
  static fromDatabase(dbRecord) {
    // Parse JSON fields
    const data = { ...dbRecord }
    try {
      data.dietary_restrictions = JSON.parse(data.dietary_restrictions || '[]')
      data.food_allergies = JSON.parse(data.food_allergies || '[]')
      data.special_requests = JSON.parse(data.special_requests || '[]')
      data.previous_charters = JSON.parse(data.previous_charters || '[]')
      data.preferred_weather = JSON.parse(data.preferred_weather || '[]')
    } catch (error) {
      console.warn('Error parsing JSON fields from database:', error)
    }
    
    return new CharterExperienceModel(data)
  }

  /**
   * Create CharterExperienceModel from frontend form data
   * @param {Object} formData - Form data
   * @param {string} bookingId - Parent booking ID
   * @returns {CharterExperienceModel} New charter experience instance
   */
  static fromFrontend(formData, bookingId) {
    const mappedData = {
      booking_id: bookingId,
      dietary_restrictions: formData.dietaryRestrictions || [],
      dietary_notes: formData.dietaryNotes,
      food_allergies: formData.foodAllergies || [],
      preferred_cuisine: formData.preferredCuisine,
      alcohol_service: formData.alcoholService,
      alcohol_preferences: formData.alcoholPreferences,
      celebration_type: formData.celebrationType,
      celebration_details: formData.celebrationDetails,
      guest_count: formData.guestCount,
      child_count: formData.childCount,
      special_requests: formData.specialRequests || [],
      music_preferences: formData.musicPreferences,
      activity_preferences: formData.activityPreferences,
      photography_allowed: formData.photographyAllowed,
      social_media_consent: formData.socialMediaConsent,
      previous_charters: formData.previousCharters || [],
      how_heard_about_us: formData.howHeardAboutUs,
      expectations: formData.expectations,
      concerns: formData.concerns,
      budget_range_min: formData.budgetRangeMin,
      budget_range_max: formData.budgetRangeMax,
      flexible_dates: formData.flexibleDates,
      preferred_weather: formData.preferredWeather || [],
      accessibility_requirements: formData.accessibilityRequirements,
      communication_preferences: formData.communicationPreferences
    }

    return new CharterExperienceModel(mappedData)
  }
}

export default CharterExperienceModel