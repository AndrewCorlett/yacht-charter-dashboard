/**
 * Booking Color Utilities
 * 
 * Centralized logic for determining booking colors based on toggle states.
 * This ensures consistent color representation across SITREP and Calendar components.
 * 
 * Color Rules:
 * - Orange: Booking confirmed only (tentative)
 * - Blue: Deposit paid
 * - Green: Full payment made
 * - Gray: Cancelled/Refunded
 * 
 * @created 2025-06-29
 */

import { PAYMENT_STATUS_COLORS } from '../data/mockData.js'

/**
 * Determine booking payment status from toggle states
 * @param {Object} booking - Booking object with toggle states
 * @returns {string} Payment status string
 */
export function getBookingPaymentStatus(booking) {
  if (!booking) return 'pending'
  
  // Check for cancellation first
  if (booking.bookingStatus === 'cancelled' || booking.booking_status === 'cancelled') {
    return 'cancelled'
  }
  
  // Check payment progression: Full Payment > Deposit > Confirmed > Pending
  if (booking.finalPaymentPaid || booking.final_payment_paid) {
    return 'full_payment'
  }
  
  if (booking.depositPaid || booking.deposit_paid) {
    return 'deposit_paid'
  }
  
  if (booking.bookingConfirmed || booking.booking_confirmed) {
    return 'tentative'
  }
  
  // Default to pending if no statuses are set
  return 'pending'
}

/**
 * Get booking color based on toggle states
 * @param {Object} booking - Booking object with toggle states
 * @returns {string} Hex color code
 */
export function getBookingColor(booking) {
  const paymentStatus = getBookingPaymentStatus(booking)
  return PAYMENT_STATUS_COLORS[paymentStatus] || PAYMENT_STATUS_COLORS['pending']
}

/**
 * Get booking status info (status + color) for display
 * @param {Object} booking - Booking object with toggle states
 * @returns {Object} Status info with paymentStatus, color, label
 */
export function getBookingStatusInfo(booking) {
  const paymentStatus = getBookingPaymentStatus(booking)
  const color = PAYMENT_STATUS_COLORS[paymentStatus] || PAYMENT_STATUS_COLORS['pending']
  
  // Human-readable labels
  const statusLabels = {
    'pending': 'Pending',
    'tentative': 'Tentative',
    'deposit_paid': 'Deposit Paid',
    'full_payment': 'Full Payment',
    'cancelled': 'Cancelled',
    'refunded': 'Refunded'
  }
  
  return {
    paymentStatus,
    color,
    label: statusLabels[paymentStatus] || 'Unknown'
  }
}

/**
 * Get priority level for booking status (used for sorting/filtering)
 * @param {Object} booking - Booking object
 * @returns {number} Priority level (higher = more important)
 */
export function getBookingStatusPriority(booking) {
  const paymentStatus = getBookingPaymentStatus(booking)
  
  const priorities = {
    'pending': 1,
    'tentative': 2,
    'deposit_paid': 3,
    'full_payment': 4,
    'cancelled': 0,
    'refunded': 0
  }
  
  return priorities[paymentStatus] || 1
}

/**
 * Convert hex color to rgba with specified alpha
 * @param {string} hex - Hex color code
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} RGBA color string
 */
export function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Get CSS class names for booking status
 * @param {Object} booking - Booking object
 * @param {Object} options - Options for styling
 * @returns {Object} CSS class names and inline styles
 */
export function getBookingStyles(booking, options = {}) {
  const { opacity = 0.2, hoverOpacity = 0.3, borderOpacity = 0.4 } = options
  const color = getBookingColor(booking)
  
  return {
    backgroundColor: hexToRgba(color, opacity),
    borderColor: hexToRgba(color, borderOpacity),
    hoverBackgroundColor: hexToRgba(color, hoverOpacity),
    color: color, // Full color for text/borders
    // CSS classes for common patterns
    bgClass: `bg-[${color}]`,
    borderClass: `border-[${color}]`
  }
}

/**
 * Check if booking has overdue tasks (placeholder for future implementation)
 * @param {Object} booking - Booking object
 * @returns {boolean} Has overdue tasks
 */
export function hasOverdueTasks(booking) {
  // For now, return the existing field if available
  return booking?.hasOverdueTasks || false
}

/**
 * Get booking display properties for components
 * @param {Object} booking - Booking object
 * @returns {Object} All display properties needed for UI components
 */
export function getBookingDisplayProps(booking) {
  const statusInfo = getBookingStatusInfo(booking)
  const styles = getBookingStyles(booking)
  const priority = getBookingStatusPriority(booking)
  const overdue = hasOverdueTasks(booking)
  
  return {
    ...statusInfo,
    ...styles,
    priority,
    hasOverdueTasks: overdue,
    // Additional helper properties
    isConfirmed: statusInfo.paymentStatus !== 'pending',
    isFullyPaid: statusInfo.paymentStatus === 'full_payment',
    needsAttention: overdue || statusInfo.paymentStatus === 'pending'
  }
}

export default {
  getBookingPaymentStatus,
  getBookingColor,
  getBookingStatusInfo,
  getBookingStatusPriority,
  getBookingStyles,
  getBookingDisplayProps,
  hexToRgba,
  hasOverdueTasks
}