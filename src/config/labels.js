/**
 * UI Labels Configuration
 * 
 * Centralized label definitions for consistent UI text across the yacht charter dashboard.
 * This file defines all user-facing text, placeholders, and messages used throughout the application.
 * 
 * Usage:
 * import { LABELS } from '../config/labels.js'
 * const text = LABELS.YACHT.NAME
 * 
 * @author AI Agent
 * @created 2025-06-28
 */

export const LABELS = {
  // === YACHT RELATED LABELS ===
  YACHT: {
    NAME: '[Yacht Name]',
    TYPE: '[Yacht Type]',
    LOCATION: '[Yacht Location]',
    CAPACITY: '[Yacht Capacity]',
    LENGTH: '[Yacht Length]',
    SPECIFICATIONS: '[Yacht Specifications]',
    FEATURES: '[Yacht Features]',
    STATUS: '[Yacht Status]',
    AVAILABILITY: '[Yacht Availability]',
    CABINS: '[Cabins]',
    BERTHS: '[Berths]',
    ENGINE_TYPE: '[Engine Type]',
    YEAR_BUILT: '[Year Built]',
    MAX_POB: '[Maximum Persons on Board]',
    FUEL_CAPACITY: '[Fuel Capacity (Liters)]',
    WATER_CAPACITY: '[Water Capacity (Liters)]',
    DRAFT: '[Draft (Meters)]',
    BEAM: '[Beam (Meters)]',
    INSURANCE_POLICY: '[Insurance Policy Number]',
    INSURANCE_EXPIRY: '[Insurance Expiry Date]',
    DAILY_RATE: '[Daily Rate]',
    WEEKLY_RATE: '[Weekly Rate]',
    DESCRIPTION: '[Description]'
  },

  // === BOOKING RELATED LABELS ===
  BOOKING: {
    NUMBER: '[Booking Number]',
    STATUS: '[Booking Status]',
    CONFIRMED: '[Booking Confirmed]',
    START_DATE: '[Start Date]',
    END_DATE: '[End Date]',
    DURATION: '[Booking Duration]',
    CHARTER_TYPE: '[Charter Type]',
    PORT_DEPARTURE: '[Port of Departure]',
    PORT_ARRIVAL: '[Port of Arrival]',
    SPECIAL_REQUIREMENTS: '[Special Requirements]',
    NOTES: '[Booking Notes]',
    CREATED_DATE: '[Date Created]',
    MODIFIED_DATE: '[Date Modified]'
  },

  // === CUSTOMER RELATED LABELS ===
  CUSTOMER: {
    FIRST_NAME: '[Customer First Name]',
    SURNAME: '[Customer Surname]',
    FULL_NAME: '[Customer Full Name]',
    EMAIL: '[Customer Email]',
    PHONE: '[Customer Phone]',
    ADDRESS_LINE_1: '[Customer Address Line 1]',
    ADDRESS_LINE_2: '[Customer Address Line 2]',
    CITY: '[Customer City]',
    POSTCODE: '[Customer Postcode]',
    COUNTRY: '[Customer Country]',
    CUSTOMER_NUMBER: '[Customer Number]',
    EXPERIENCE_LEVEL: '[Customer Experience Level]'
  },

  // === PAYMENT RELATED LABELS ===
  PAYMENT: {
    STATUS: '[Payment Status]',
    TOTAL_AMOUNT: '[Total Amount]',
    DEPOSIT_AMOUNT: '[Deposit Amount]',
    BALANCE_DUE: '[Balance Due]',
    DEPOSIT_PAID: '[Deposit Paid]',
    FINAL_PAYMENT_PAID: '[Final Payment Paid]',
    PAYMENT_METHOD: '[Payment Method]',
    PAYMENT_DATE: '[Payment Date]',
    INVOICE_NUMBER: '[Invoice Number]',
    RECEIPT_NUMBER: '[Receipt Number]'
  },

  // === CONTRACT RELATED LABELS ===
  CONTRACT: {
    SENT: '[Contract Sent]',
    SIGNED: '[Contract Signed]',
    DATE_SENT: '[Contract Date Sent]',
    DATE_SIGNED: '[Contract Date Signed]',
    VERSION: '[Contract Version]',
    TEMPLATE: '[Contract Template]'
  },

  // === DOCUMENT RELATED LABELS ===
  DOCUMENT: {
    CONTRACT: '[Contract]',
    INITIAL_TERMS: '[Initial Terms]',
    DEPOSIT_INVOICE: '[Deposit Invoice]',
    DEPOSIT_RECEIPT: '[Deposit Receipt]',
    BALANCE_INVOICE: '[Remaining Balance Invoice]',
    BALANCE_RECEIPT: '[Remaining Balance Receipt]',
    HANDOVER_NOTES: '[Hand-over Notes]',
    CREW_EXPERIENCE: '[Crew Experience Document]',
    GENERATED_DATE: '[Document Generated Date]',
    DOWNLOADED_DATE: '[Document Downloaded Date]',
    UPDATED_DATE: '[Document Updated Date]'
  },

  // === PRICING RELATED LABELS ===
  PRICING: {
    HIGH_SEASON_RATE: '[High Season Rate]',
    LOW_SEASON_RATE: '[Low Season Rate]',
    BASE_RATE: '[Base Rate]',
    DAILY_RATE: '[Daily Rate]',
    WEEKLY_RATE: '[Weekly Rate]',
    SEASON_START: '[Season Start Date]',
    SEASON_END: '[Season End Date]',
    CURRENCY: '[Currency]',
    RATE_TYPE: '[Rate Type]'
  },

  // === STATUS LABELS ===
  STATUS: {
    TENTATIVE: '[Tentative]',
    CONFIRMED: '[Confirmed]',
    COMPLETED: '[Completed]',
    CANCELLED: '[Cancelled]',
    PENDING: '[Pending]',
    ACTIVE: '[Active]',
    INACTIVE: '[Inactive]',
    AVAILABLE: '[Available]',
    BOOKED: '[Booked]',
    MAINTENANCE: '[Maintenance]'
  },

  // === NAVIGATION LABELS ===
  NAVIGATION: {
    DASHBOARD: '[Dashboard]',
    BOOKINGS: '[Bookings]',
    CALENDAR: '[Calendar]',
    SETTINGS: '[Settings]',
    ADMIN: '[Admin]',
    PRICING: '[Pricing]',
    DOCUMENTS: '[Documents]',
    AUTOMATION: '[Automation]',
    BACK: '[Back]',
    HOME: '[Home]',
    SEASCAPE: '[Seascape]'
  },

  // === ACTION LABELS ===
  ACTION: {
    CREATE: '[Create]',
    EDIT: '[Edit]',
    UPDATE: '[Update]',
    DELETE: '[Delete]',
    SAVE: '[Save]',
    CANCEL: '[Cancel]',
    SUBMIT: '[Submit]',
    GENERATE: '[Generate]',
    DOWNLOAD: '[Download]',
    UPLOAD: '[Upload]',
    SEND: '[Send]',
    VIEW: '[View]',
    SEARCH: '[Search]',
    FILTER: '[Filter]',
    EXPORT: '[Export]',
    IMPORT: '[Import]',
    REFRESH: '[Refresh]'
  },

  // === FORM LABELS ===
  FORM: {
    REQUIRED: '[Required]',
    OPTIONAL: '[Optional]',
    PLACEHOLDER_TEXT: '[Enter text here]',
    SELECT_OPTION: '[Select an option]',
    CHOOSE_FILE: '[Choose file]',
    DATE_FORMAT: '[DD/MM/YYYY]',
    PHONE_FORMAT: '[+44 7XXX XXXXXX]',
    EMAIL_FORMAT: '[email@example.com]',
    VALIDATION_ERROR: '[Validation Error]',
    FIELD_REQUIRED: '[This field is required]',
    INVALID_FORMAT: '[Invalid format]'
  },

  // === TIME RELATED LABELS ===
  TIME: {
    TODAY: '[Today]',
    YESTERDAY: '[Yesterday]',
    TOMORROW: '[Tomorrow]',
    THIS_WEEK: '[This Week]',
    LAST_WEEK: '[Last Week]',
    NEXT_WEEK: '[Next Week]',
    THIS_MONTH: '[This Month]',
    LAST_MONTH: '[Last Month]',
    NEXT_MONTH: '[Next Month]',
    DURATION_DAYS: '[Duration (Days)]',
    CHECK_IN: '[Check-in]',
    CHECK_OUT: '[Check-out]'
  },

  // === SEASON LABELS ===
  SEASON: {
    HIGH_SEASON: '[High Season]',
    LOW_SEASON: '[Low Season]',
    PEAK_SEASON: '[Peak Season]',
    OFF_SEASON: '[Off Season]',
    SHOULDER_SEASON: '[Shoulder Season]'
  },

  // === FILE UPLOAD LABELS ===
  FILE: {
    UPLOAD: '[Upload File]',
    SIZE_LIMIT: '[File Size Limit]',
    ACCEPTED_FORMATS: '[Accepted File Formats]',
    FILE_NAME: '[File Name]',
    FILE_SIZE: '[File Size]',
    UPLOAD_SUCCESS: '[File uploaded successfully]',
    UPLOAD_ERROR: '[File upload failed]',
    REMOVE_FILE: '[Remove File]',
    REPLACE_FILE: '[Replace File]'
  },

  // === NOTIFICATION LABELS ===
  NOTIFICATION: {
    SUCCESS: '[Success]',
    ERROR: '[Error]',
    WARNING: '[Warning]',
    INFO: '[Information]',
    SAVED: '[Saved successfully]',
    DELETED: '[Deleted successfully]',
    UPDATED: '[Updated successfully]',
    CREATED: '[Created successfully]',
    FAILED: '[Operation failed]',
    LOADING: '[Loading...]',
    PROCESSING: '[Processing...]'
  },

  // === CHART/CALENDAR LABELS ===
  CHART: {
    NO_DATA: '[No data available]',
    LOADING_DATA: '[Loading data...]',
    TOTAL_BOOKINGS: '[Total Bookings]',
    REVENUE: '[Revenue]',
    OCCUPANCY_RATE: '[Occupancy Rate]',
    AVERAGE_BOOKING: '[Average Booking Value]'
  },

  // === SETTINGS SECTION LABELS ===
  SETTINGS: {
    GENERAL: '[General Settings]',
    PRICING: '[Pricing Settings]',
    DOCUMENTS: '[Document Settings]',
    AUTOMATION: '[Automation Settings]',
    NOTIFICATIONS: '[Notification Settings]',
    USER_PREFERENCES: '[User Preferences]',
    SYSTEM: '[System Settings]',
    YACHT_MANAGEMENT: '[Yacht Management]',
    FORMS_MANAGEMENT: '[Forms Management]'
  },

  // === COMMON UI LABELS ===
  COMMON: {
    YES: '[Yes]',
    NO: '[No]',
    NONE: '[None]',
    ALL: '[All]',
    UNKNOWN: '[Unknown]',
    NOT_AVAILABLE: '[N/A]',
    TO_BE_CONFIRMED: '[TBC]',
    IN_PROGRESS: '[In Progress]',
    COMPLETED: '[Completed]',
    DRAFT: '[Draft]',
    FINAL: '[Final]'
  },

  // === AUTOMATION LABELS ===
  AUTOMATION: {
    RULE: '[Automation Rule]',
    TRIGGER: '[Trigger]',
    ACTION: '[Automated Action]',
    CONDITION: '[Condition]',
    EMAIL_TEMPLATE: '[Email Template]',
    SCHEDULE: '[Schedule]',
    ENABLED: '[Enabled]',
    DISABLED: '[Disabled]'
  },

  // === YACHT OWNER LABELS ===
  OWNER: {
    NAME: '[Owner Name]',
    EMAIL: '[Owner Email]',
    PHONE: '[Owner Phone]',
    ADDRESS_LINE_1: '[Owner Address Line 1]',
    ADDRESS_LINE_2: '[Owner Address Line 2]',
    CITY: '[Owner City]',
    POSTCODE: '[Owner Postcode]',
    COUNTRY: '[Owner Country]',
    EMERGENCY_CONTACT_NAME: '[Emergency Contact Name]',
    EMERGENCY_CONTACT_PHONE: '[Emergency Contact Phone]',
    CONTACT_PREFERENCES: '[Contact Preferences]',
    NOTES: '[Owner Notes]',
    DETAILS: '[Owner Details]'
  },

  // === YACHT MANAGEMENT LABELS ===
  YACHT_MANAGEMENT: {
    SELECT_YACHT: '[Select Yacht]',
    YACHT_SELECTOR: '[Yacht Selector]',
    YACHT_DETAILS: '[Yacht Details]',
    OWNER_DETAILS: '[Owner Details]',
    CHARTER_COSTS: '[Charter Costs]',
    SPECIFICATIONS_EDITOR: '[Specifications Editor]',
    SEASONAL_PRICING: '[Seasonal Pricing]',
    MANAGE_YACHTS: '[Manage Yachts]'
  },

  // === CHARTER COSTS LABELS ===
  CHARTER_COSTS: {
    SEASON_TYPE: '[Season Type]',
    SEASON_NAME: '[Season Name]',
    HIGH_SEASON: '[High Season]',
    LOW_SEASON: '[Low Season]',
    OTHER_SEASON: '[Other Season]',
    SEASON_START_DATE: '[Season Start Date]',
    SEASON_END_DATE: '[Season End Date]',
    CHARTER_TOTAL: '[Charter Total]',
    DEPOSIT_AMOUNT: '[Deposit Amount]',
    SECURITY_DEPOSIT: '[Security Deposit]',
    PRICING_TABLE: '[Pricing Table]',
    ADD_SEASON: '[Add Season]',
    EDIT_SEASON: '[Edit Season]',
    DELETE_SEASON: '[Delete Season]'
  },

  // === FORMS MANAGEMENT LABELS ===
  FORMS_MANAGEMENT: {
    TEMPLATE_FORMS: '[Template Forms]',
    UPLOAD_TEMPLATE: '[Upload Template]',
    MANAGE_TEMPLATES: '[Manage Templates]',
    FORM_TYPE: '[Form Type]',
    ACTIVE_TEMPLATES: '[Active Templates]',
    CONTRACT_TEMPLATE: '[Contract Template]',
    INITIAL_TERMS_TEMPLATE: '[Initial Terms Template]',
    DEPOSIT_INVOICE_TEMPLATE: '[Deposit Invoice Template]',
    DEPOSIT_RECEIPT_TEMPLATE: '[Deposit Receipt Template]',
    BALANCE_INVOICE_TEMPLATE: '[Balance Invoice Template]',
    FILE_VERSION: '[File Version]',
    UPLOADED_AT: '[Uploaded At]',
    REPLACE_TEMPLATE: '[Replace Template]',
    DOWNLOAD_TEMPLATE: '[Download Template]',
    DELETE_TEMPLATE: '[Delete Template]'
  }
}

// Export individual sections for easier access
export const YACHT_LABELS = LABELS.YACHT
export const BOOKING_LABELS = LABELS.BOOKING
export const CUSTOMER_LABELS = LABELS.CUSTOMER
export const PAYMENT_LABELS = LABELS.PAYMENT
export const CONTRACT_LABELS = LABELS.CONTRACT
export const DOCUMENT_LABELS = LABELS.DOCUMENT
export const PRICING_LABELS = LABELS.PRICING
export const STATUS_LABELS = LABELS.STATUS
export const NAVIGATION_LABELS = LABELS.NAVIGATION
export const ACTION_LABELS = LABELS.ACTION
export const FORM_LABELS = LABELS.FORM
export const TIME_LABELS = LABELS.TIME
export const SEASON_LABELS = LABELS.SEASON
export const FILE_LABELS = LABELS.FILE
export const NOTIFICATION_LABELS = LABELS.NOTIFICATION
export const CHART_LABELS = LABELS.CHART
export const SETTINGS_LABELS = LABELS.SETTINGS
export const COMMON_LABELS = LABELS.COMMON
export const AUTOMATION_LABELS = LABELS.AUTOMATION
export const OWNER_LABELS = LABELS.OWNER
export const YACHT_MANAGEMENT_LABELS = LABELS.YACHT_MANAGEMENT
export const CHARTER_COSTS_LABELS = LABELS.CHARTER_COSTS
export const FORMS_MANAGEMENT_LABELS = LABELS.FORMS_MANAGEMENT

export default LABELS