/**
 * Status Tracking Model
 * 
 * Manages booking status tracking with toggle fields, timestamps,
 * notes, and progress tracking for yacht charter bookings.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

import { parseISO, isValid, format } from 'date-fns'

/**
 * Status category enumeration
 */
export const StatusCategory = {
  BOOKING: 'booking',
  PAYMENT: 'payment',
  DOCUMENTATION: 'documentation',
  PREPARATION: 'preparation',
  OPERATIONAL: 'operational',
  COMPLETION: 'completion'
}

/**
 * Status priority enumeration
 */
export const StatusPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
}

/**
 * Status state enumeration
 */
export const StatusState = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold'
}

/**
 * Default status tracking fields for yacht charter bookings
 */
export const DefaultStatusFields = {
  // Booking Process
  INITIAL_INQUIRY: 'initial_inquiry',
  QUOTE_SENT: 'quote_sent',
  BOOKING_CONFIRMED: 'booking_confirmed',
  CONTRACT_SIGNED: 'contract_signed',
  
  // Payment Process
  DEPOSIT_RECEIVED: 'deposit_received',
  PAYMENT_SCHEDULE_SENT: 'payment_schedule_sent',
  FINAL_PAYMENT_RECEIVED: 'final_payment_received',
  REFUND_PROCESSED: 'refund_processed',
  
  // Documentation
  CREW_LIST_RECEIVED: 'crew_list_received',
  INSURANCE_VERIFIED: 'insurance_verified',
  PASSPORTS_VERIFIED: 'passports_verified',
  WAIVERS_SIGNED: 'waivers_signed',
  
  // Preparation
  YACHT_ASSIGNED: 'yacht_assigned',
  CREW_BRIEFED: 'crew_briefed',
  PROVISIONING_ORDERED: 'provisioning_ordered',
  SPECIAL_REQUESTS_ARRANGED: 'special_requests_arranged',
  
  // Pre-Charter
  WEATHER_CHECKED: 'weather_checked',
  YACHT_PREPARED: 'yacht_prepared',
  SAFETY_BRIEFING_READY: 'safety_briefing_ready',
  GUEST_COMMUNICATION_SENT: 'guest_communication_sent',
  
  // Charter Day
  GUESTS_CHECKED_IN: 'guests_checked_in',
  SAFETY_BRIEFING_COMPLETED: 'safety_briefing_completed',
  CHARTER_COMMENCED: 'charter_commenced',
  MIDDAY_CHECK: 'midday_check',
  
  // Post-Charter
  CHARTER_COMPLETED: 'charter_completed',
  YACHT_INSPECTED: 'yacht_inspected',
  FEEDBACK_REQUESTED: 'feedback_requested',
  FOLLOW_UP_COMPLETED: 'follow_up_completed'
}

/**
 * Status Tracking Model Class
 * 
 * Represents status tracking for a booking with toggle fields,
 * timestamps, notes, and progress calculation.
 */
export class StatusTrackingModel {
  /**
   * Create a new StatusTrackingModel instance
   * 
   * @param {Object} data - Initial status tracking data
   * @param {string} [data.id] - UUID primary key
   * @param {string} data.booking_id - Reference to parent booking
   * @param {Object} [data.status_fields] - Object with status field states
   * @param {Object} [data.timestamps] - Object with status field timestamps
   * @param {Object} [data.notes] - Object with status field notes
   * @param {Object} [data.assigned_to] - Object with status field assignments
   * @param {Object} [data.priorities] - Object with status field priorities
   * @param {number} [data.overall_progress] - Overall completion percentage
   * @param {string} [data.current_phase] - Current phase of the booking process
   * @param {Array<Object>} [data.milestones] - Key milestones with dates
   * @param {Array<Object>} [data.alerts] - Active alerts and reminders
   * @param {string|Date} [data.created_at] - Creation timestamp
   * @param {string|Date} [data.modified_at] - Last modification timestamp
   */
  constructor(data = {}) {
    // Primary keys and references
    this.id = data.id || this._generateUUID()
    this.booking_id = data.booking_id || ''
    
    // Status Fields - Object with field names as keys and states as values
    this.status_fields = this._initializeStatusFields(data.status_fields)
    
    // Timestamps - Object with field names as keys and Date objects as values
    this.timestamps = this._initializeTimestamps(data.timestamps)
    
    // Notes - Object with field names as keys and note strings as values
    this.notes = this._initializeNotes(data.notes)
    
    // Assigned To - Object with field names as keys and user IDs as values
    this.assigned_to = this._initializeAssignments(data.assigned_to)
    
    // Priorities - Object with field names as keys and priority levels as values
    this.priorities = this._initializePriorities(data.priorities)
    
    // Progress Tracking
    this.overall_progress = this._parseNumber(data.overall_progress) || 0
    this.current_phase = data.current_phase || StatusCategory.BOOKING
    
    // Milestones - Array of milestone objects
    this.milestones = Array.isArray(data.milestones) ? data.milestones : []
    
    // Alerts - Array of alert objects
    this.alerts = Array.isArray(data.alerts) ? data.alerts : []
    
    // System Fields
    this.created_at = this._parseDate(data.created_at) || new Date()
    this.modified_at = this._parseDate(data.modified_at) || new Date()
    
    // Validation errors storage
    this._errors = new Map()
    
    // Auto-calculate progress on initialization
    this._calculateProgress()
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
    const parsed = parseFloat(value)
    return isNaN(parsed) ? null : parsed
  }

  /**
   * Initialize status fields with default values
   * @param {Object} statusFields - Status fields object
   * @returns {Object} Initialized status fields
   * @private
   */
  _initializeStatusFields(statusFields = {}) {
    const fields = {}
    
    // Initialize all default fields
    Object.values(DefaultStatusFields).forEach(field => {
      fields[field] = statusFields[field] || StatusState.PENDING
    })
    
    // Add any additional custom fields
    Object.keys(statusFields).forEach(field => {
      if (!fields.hasOwnProperty(field)) {
        fields[field] = statusFields[field]
      }
    })
    
    return fields
  }

  /**
   * Initialize timestamps object
   * @param {Object} timestamps - Timestamps object
   * @returns {Object} Initialized timestamps
   * @private
   */
  _initializeTimestamps(timestamps = {}) {
    const ts = {}
    
    Object.keys(timestamps).forEach(field => {
      ts[field] = this._parseDate(timestamps[field])
    })
    
    return ts
  }

  /**
   * Initialize notes object
   * @param {Object} notes - Notes object
   * @returns {Object} Initialized notes
   * @private
   */
  _initializeNotes(notes = {}) {
    return { ...notes }
  }

  /**
   * Initialize assignments object
   * @param {Object} assignments - Assignments object
   * @returns {Object} Initialized assignments
   * @private
   */
  _initializeAssignments(assignments = {}) {
    return { ...assignments }
  }

  /**
   * Initialize priorities object
   * @param {Object} priorities - Priorities object
   * @returns {Object} Initialized priorities
   * @private
   */
  _initializePriorities(priorities = {}) {
    const priors = {}
    
    Object.values(DefaultStatusFields).forEach(field => {
      priors[field] = priorities[field] || StatusPriority.MEDIUM
    })
    
    return priors
  }

  /**
   * Calculate overall progress based on completed status fields
   * @private
   */
  _calculateProgress() {
    const totalFields = Object.keys(this.status_fields).length
    if (totalFields === 0) {
      this.overall_progress = 0
      return
    }
    
    const completedFields = Object.values(this.status_fields)
      .filter(state => state === StatusState.COMPLETED).length
    
    this.overall_progress = Math.round((completedFields / totalFields) * 100)
  }

  /**
   * Validate all status tracking data
   * @returns {boolean} True if valid, false otherwise
   */
  validate() {
    this._errors.clear()

    // Required field validation
    if (!this.booking_id?.trim()) {
      this._errors.set('booking_id', 'Booking reference is required')
    }

    // Status field validation
    Object.entries(this.status_fields).forEach(([field, state]) => {
      if (!Object.values(StatusState).includes(state)) {
        this._errors.set(`status_fields.${field}`, 'Invalid status state')
      }
    })

    // Priority validation
    Object.entries(this.priorities).forEach(([field, priority]) => {
      if (!Object.values(StatusPriority).includes(priority)) {
        this._errors.set(`priorities.${field}`, 'Invalid priority level')
      }
    })

    // Current phase validation
    if (!Object.values(StatusCategory).includes(this.current_phase)) {
      this._errors.set('current_phase', 'Invalid current phase')
    }

    // Progress validation
    if (this.overall_progress < 0 || this.overall_progress > 100) {
      this._errors.set('overall_progress', 'Progress must be between 0 and 100')
    }

    // Milestones validation
    this.milestones.forEach((milestone, index) => {
      if (!milestone.name || typeof milestone.name !== 'string') {
        this._errors.set(`milestones.${index}.name`, 'Milestone name is required')
      }
      if (milestone.date && !this._parseDate(milestone.date)) {
        this._errors.set(`milestones.${index}.date`, 'Invalid milestone date')
      }
    })

    return this._errors.size === 0
  }

  /**
   * Update a status field
   * @param {string} field - Field name
   * @param {string} state - New state
   * @param {string} [note] - Optional note
   * @param {string} [assignedTo] - Optional user assignment
   * @returns {boolean} True if updated successfully
   */
  updateStatus(field, state, note = null, assignedTo = null) {
    if (!Object.values(StatusState).includes(state)) {
      return false
    }

    const previousState = this.status_fields[field]
    this.status_fields[field] = state
    
    // Update timestamp
    this.timestamps[field] = new Date()
    
    // Update note if provided
    if (note) {
      this.notes[field] = note
    }
    
    // Update assignment if provided
    if (assignedTo) {
      this.assigned_to[field] = assignedTo
    }
    
    // Recalculate progress
    this._calculateProgress()
    
    // Update modification timestamp
    this.modified_at = new Date()
    
    // Create milestone for completed items
    if (state === StatusState.COMPLETED && previousState !== StatusState.COMPLETED) {
      this.addMilestone({
        name: `${field.replace(/_/g, ' ').toUpperCase()} completed`,
        date: new Date(),
        category: this._getFieldCategory(field)
      })
    }
    
    return true
  }

  /**
   * Get the category for a status field
   * @param {string} field - Field name
   * @returns {string} Category name
   * @private
   */
  _getFieldCategory(field) {
    const categoryMap = {
      'initial_inquiry': StatusCategory.BOOKING,
      'quote_sent': StatusCategory.BOOKING,
      'booking_confirmed': StatusCategory.BOOKING,
      'contract_signed': StatusCategory.BOOKING,
      'deposit_received': StatusCategory.PAYMENT,
      'payment_schedule_sent': StatusCategory.PAYMENT,
      'final_payment_received': StatusCategory.PAYMENT,
      'refund_processed': StatusCategory.PAYMENT,
      'crew_list_received': StatusCategory.DOCUMENTATION,
      'insurance_verified': StatusCategory.DOCUMENTATION,
      'passports_verified': StatusCategory.DOCUMENTATION,
      'waivers_signed': StatusCategory.DOCUMENTATION,
      'yacht_assigned': StatusCategory.PREPARATION,
      'crew_briefed': StatusCategory.PREPARATION,
      'provisioning_ordered': StatusCategory.PREPARATION,
      'special_requests_arranged': StatusCategory.PREPARATION,
      'weather_checked': StatusCategory.OPERATIONAL,
      'yacht_prepared': StatusCategory.OPERATIONAL,
      'safety_briefing_ready': StatusCategory.OPERATIONAL,
      'guest_communication_sent': StatusCategory.OPERATIONAL,
      'guests_checked_in': StatusCategory.OPERATIONAL,
      'safety_briefing_completed': StatusCategory.OPERATIONAL,
      'charter_commenced': StatusCategory.OPERATIONAL,
      'midday_check': StatusCategory.OPERATIONAL,
      'charter_completed': StatusCategory.COMPLETION,
      'yacht_inspected': StatusCategory.COMPLETION,
      'feedback_requested': StatusCategory.COMPLETION,
      'follow_up_completed': StatusCategory.COMPLETION
    }
    
    return categoryMap[field] || StatusCategory.BOOKING
  }

  /**
   * Mark multiple status fields as completed
   * @param {Array<string>} fields - Array of field names
   * @param {string} [note] - Optional note for all fields
   * @returns {boolean} True if all updates successful
   */
  markCompleted(fields, note = null) {
    let allSuccessful = true
    
    fields.forEach(field => {
      if (!this.updateStatus(field, StatusState.COMPLETED, note)) {
        allSuccessful = false
      }
    })
    
    return allSuccessful
  }

  /**
   * Get status fields by category
   * @param {string} category - Category name
   * @returns {Object} Object with field names and states for the category
   */
  getFieldsByCategory(category) {
    const fields = {}
    
    Object.keys(this.status_fields).forEach(field => {
      if (this._getFieldCategory(field) === category) {
        fields[field] = {
          state: this.status_fields[field],
          timestamp: this.timestamps[field],
          note: this.notes[field],
          assignedTo: this.assigned_to[field],
          priority: this.priorities[field]
        }
      }
    })
    
    return fields
  }

  /**
   * Get completion percentage for a category
   * @param {string} category - Category name
   * @returns {number} Completion percentage for the category
   */
  getCategoryProgress(category) {
    const categoryFields = this.getFieldsByCategory(category)
    const totalFields = Object.keys(categoryFields).length
    
    if (totalFields === 0) return 0
    
    const completedFields = Object.values(categoryFields)
      .filter(field => field.state === StatusState.COMPLETED).length
    
    return Math.round((completedFields / totalFields) * 100)
  }

  /**
   * Get pending status fields
   * @returns {Array<Object>} Array of pending status fields with details
   */
  getPendingFields() {
    return Object.keys(this.status_fields)
      .filter(field => this.status_fields[field] === StatusState.PENDING)
      .map(field => ({
        field,
        state: this.status_fields[field],
        priority: this.priorities[field],
        assignedTo: this.assigned_to[field],
        category: this._getFieldCategory(field)
      }))
  }

  /**
   * Get overdue fields (pending with high priority and old timestamps)
   * @param {number} [daysThreshold=7] - Days threshold for overdue
   * @returns {Array<Object>} Array of overdue fields
   */
  getOverdueFields(daysThreshold = 7) {
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold)
    
    return Object.keys(this.status_fields)
      .filter(field => {
        const state = this.status_fields[field]
        const timestamp = this.timestamps[field]
        const priority = this.priorities[field]
        
        return (state === StatusState.PENDING || state === StatusState.IN_PROGRESS) &&
               timestamp && timestamp < thresholdDate &&
               (priority === StatusPriority.HIGH || priority === StatusPriority.URGENT)
      })
      .map(field => ({
        field,
        state: this.status_fields[field],
        timestamp: this.timestamps[field],
        priority: this.priorities[field],
        assignedTo: this.assigned_to[field],
        category: this._getFieldCategory(field),
        daysPending: Math.floor((new Date() - this.timestamps[field]) / (1000 * 60 * 60 * 24))
      }))
  }

  /**
   * Add a milestone
   * @param {Object} milestone - Milestone object
   * @param {string} milestone.name - Milestone name
   * @param {string|Date} milestone.date - Milestone date
   * @param {string} [milestone.category] - Milestone category
   * @param {string} [milestone.description] - Milestone description
   * @returns {boolean} True if added successfully
   */
  addMilestone(milestone) {
    if (!milestone.name || !milestone.date) {
      return false
    }

    const milestoneEntry = {
      id: this._generateUUID(),
      name: milestone.name.trim(),
      date: this._parseDate(milestone.date),
      category: milestone.category || StatusCategory.BOOKING,
      description: milestone.description || '',
      created_at: new Date()
    }

    this.milestones.push(milestoneEntry)
    this.milestones.sort((a, b) => new Date(a.date) - new Date(b.date))
    this.modified_at = new Date()
    return true
  }

  /**
   * Add an alert
   * @param {Object} alert - Alert object
   * @param {string} alert.message - Alert message
   * @param {string} [alert.type] - Alert type (info, warning, error)
   * @param {string|Date} [alert.dueDate] - Due date for the alert
   * @returns {boolean} True if added successfully
   */
  addAlert(alert) {
    if (!alert.message) {
      return false
    }

    const alertEntry = {
      id: this._generateUUID(),
      message: alert.message.trim(),
      type: alert.type || 'info',
      dueDate: alert.dueDate ? this._parseDate(alert.dueDate) : null,
      active: true,
      created_at: new Date()
    }

    this.alerts.push(alertEntry)
    this.modified_at = new Date()
    return true
  }

  /**
   * Dismiss an alert
   * @param {string} alertId - Alert ID to dismiss
   * @returns {boolean} True if dismissed successfully
   */
  dismissAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.active = false
      alert.dismissed_at = new Date()
      this.modified_at = new Date()
      return true
    }
    return false
  }

  /**
   * Get active alerts
   * @returns {Array<Object>} Array of active alerts
   */
  getActiveAlerts() {
    return this.alerts.filter(alert => alert.active)
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
   * Check if status tracking has any validation errors
   * @returns {boolean} True if there are errors
   */
  hasErrors() {
    return this._errors.size > 0
  }

  /**
   * Update status tracking data and trigger validation
   * @param {Object} updates - Fields to update
   * @returns {boolean} True if update was successful and valid
   */
  update(updates) {
    Object.keys(updates).forEach(key => {
      if (key in this) {
        if (key.includes('date') || key.includes('_at')) {
          this[key] = this._parseDate(updates[key])
        } else if (key === 'overall_progress') {
          this[key] = this._parseNumber(updates[key])
        } else {
          this[key] = updates[key]
        }
      }
    })

    this.modified_at = new Date()
    this._calculateProgress()
    return this.validate()
  }

  /**
   * Convert status tracking to database-ready format
   * @returns {Object} Database-formatted status tracking data
   */
  toDatabase() {
    return {
      id: this.id,
      booking_id: this.booking_id,
      status_fields: JSON.stringify(this.status_fields),
      timestamps: JSON.stringify(this._serializeTimestamps()),
      notes: JSON.stringify(this.notes),
      assigned_to: JSON.stringify(this.assigned_to),
      priorities: JSON.stringify(this.priorities),
      overall_progress: this.overall_progress,
      current_phase: this.current_phase,
      milestones: JSON.stringify(this._serializeMilestones()),
      alerts: JSON.stringify(this._serializeAlerts()),
      created_at: this.created_at?.toISOString(),
      modified_at: this.modified_at?.toISOString()
    }
  }

  /**
   * Serialize timestamps for database storage
   * @returns {Object} Serialized timestamps
   * @private
   */
  _serializeTimestamps() {
    const serialized = {}
    Object.keys(this.timestamps).forEach(field => {
      if (this.timestamps[field]) {
        serialized[field] = this.timestamps[field].toISOString()
      }
    })
    return serialized
  }

  /**
   * Serialize milestones for database storage
   * @returns {Array} Serialized milestones
   * @private
   */
  _serializeMilestones() {
    return this.milestones.map(milestone => ({
      ...milestone,
      date: milestone.date?.toISOString(),
      created_at: milestone.created_at?.toISOString()
    }))
  }

  /**
   * Serialize alerts for database storage
   * @returns {Array} Serialized alerts
   * @private
   */
  _serializeAlerts() {
    return this.alerts.map(alert => ({
      ...alert,
      dueDate: alert.dueDate?.toISOString(),
      created_at: alert.created_at?.toISOString(),
      dismissed_at: alert.dismissed_at?.toISOString()
    }))
  }

  /**
   * Convert status tracking to frontend-friendly format
   * @returns {Object} Frontend-formatted status tracking data
   */
  toFrontend() {
    return {
      id: this.id,
      bookingId: this.booking_id,
      statusFields: this.status_fields,
      timestamps: this.timestamps,
      notes: this.notes,
      assignedTo: this.assigned_to,
      priorities: this.priorities,
      progress: {
        overall: this.overall_progress,
        byCategory: Object.values(StatusCategory).reduce((acc, category) => {
          acc[category] = this.getCategoryProgress(category)
          return acc
        }, {})
      },
      currentPhase: this.current_phase,
      milestones: this.milestones,
      alerts: {
        active: this.getActiveAlerts(),
        all: this.alerts
      },
      pending: this.getPendingFields(),
      overdue: this.getOverdueFields(),
      createdAt: this.created_at,
      modifiedAt: this.modified_at
    }
  }

  /**
   * Create a copy of the status tracking with new ID
   * @returns {StatusTrackingModel} New status tracking instance
   */
  clone() {
    const data = this.toDatabase()
    delete data.id
    // Parse JSON fields back to objects/arrays
    data.status_fields = JSON.parse(data.status_fields)
    data.timestamps = JSON.parse(data.timestamps)
    data.notes = JSON.parse(data.notes)
    data.assigned_to = JSON.parse(data.assigned_to)
    data.priorities = JSON.parse(data.priorities)
    data.milestones = JSON.parse(data.milestones)
    data.alerts = JSON.parse(data.alerts)
    return new StatusTrackingModel(data)
  }

  /**
   * Create StatusTrackingModel from database record
   * @param {Object} dbRecord - Database record
   * @returns {StatusTrackingModel} New status tracking instance
   */
  static fromDatabase(dbRecord) {
    // Parse JSON fields
    const data = { ...dbRecord }
    try {
      data.status_fields = JSON.parse(data.status_fields || '{}')
      data.timestamps = JSON.parse(data.timestamps || '{}')
      data.notes = JSON.parse(data.notes || '{}')
      data.assigned_to = JSON.parse(data.assigned_to || '{}')
      data.priorities = JSON.parse(data.priorities || '{}')
      data.milestones = JSON.parse(data.milestones || '[]')
      data.alerts = JSON.parse(data.alerts || '[]')
    } catch (error) {
      console.warn('Error parsing JSON fields from database:', error)
    }
    
    return new StatusTrackingModel(data)
  }

  /**
   * Create StatusTrackingModel from frontend form data
   * @param {Object} formData - Form data
   * @param {string} bookingId - Parent booking ID
   * @returns {StatusTrackingModel} New status tracking instance
   */
  static fromFrontend(formData, bookingId) {
    const mappedData = {
      booking_id: bookingId,
      status_fields: formData.statusFields || {},
      timestamps: formData.timestamps || {},
      notes: formData.notes || {},
      assigned_to: formData.assignedTo || {},
      priorities: formData.priorities || {},
      current_phase: formData.currentPhase,
      milestones: formData.milestones || [],
      alerts: formData.alerts || []
    }

    return new StatusTrackingModel(mappedData)
  }

  /**
   * Create a new status tracking instance with default fields for a booking
   * @param {string} bookingId - Parent booking ID
   * @returns {StatusTrackingModel} New status tracking instance with defaults
   */
  static createDefault(bookingId) {
    return new StatusTrackingModel({
      booking_id: bookingId,
      current_phase: StatusCategory.BOOKING
    })
  }
}

export default StatusTrackingModel