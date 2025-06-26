/**
 * Mock Charter Data
 * 
 * Centralized mock data for the SIT REP widget and other charter-related components.
 * 
 * @author AI Agent
 * @created 2025-06-26
 */

/**
 * Charter type definition (JSDoc for type safety in JS)
 * @typedef {Object} Charter
 * @property {string} id - Unique charter identifier
 * @property {string} yachtName - Name of the yacht
 * @property {string} startDate - Start date in ISO format
 * @property {string} endDate - End date in ISO format
 * @property {"active" | "upcoming"} status - Charter status
 * @property {string} calendarColor - Hex color or Tailwind color token
 * @property {"tentative" | "unavailable" | "full-paid" | "deposit-paid"} paymentStatus - Payment/booking status
 * @property {boolean} hasOverdueTasks - Whether booking has overdue tasks requiring attention
 */

/**
 * Color coding definitions for SIT REP widget
 */
export const COLOR_CODES = {
  TENTATIVE: "#F97316",     // orange-500 - Booking confirmed but deposit not paid
  UNAVAILABLE: "#EF4444",   // red-500 - Yacht unavailable
  FULL_PAID: "#10B981",     // green-500 - Full balance paid
  DEPOSIT_PAID: "#3B82F6",  // blue-500 - Deposit only paid
  OVERDUE_STROKE: "#DC2626" // red-600 - Red outline for overdue tasks
}

/**
 * Color key legend for display in widget
 */
export const COLOR_KEY_LEGEND = [
  { color: COLOR_CODES.TENTATIVE, label: "Tentative", description: "Confirmed, no deposit" },
  { color: COLOR_CODES.DEPOSIT_PAID, label: "Deposit Paid", description: "Deposit received" },
  { color: COLOR_CODES.FULL_PAID, label: "Full Payment", description: "Balance paid" },
  { color: COLOR_CODES.UNAVAILABLE, label: "Unavailable", description: "Yacht unavailable" }
]

/**
 * Mock charter data for development and testing
 * @type {Charter[]}
 */
const mockCharters = [
  // Boats currently out
  {
    id: "c1",
    yachtName: "Calico Moon",
    startDate: "2025-06-20T10:00:00.000Z",
    endDate: "2025-06-27T16:00:00.000Z",
    status: "active",
    paymentStatus: "deposit-paid",
    hasOverdueTasks: false,
    calendarColor: "#3B82F6" // blue-500
  },
  {
    id: "c2",
    yachtName: "Spectre",
    startDate: "2025-06-22T12:00:00.000Z",
    endDate: "2025-06-29T18:00:00.000Z",
    status: "active",
    paymentStatus: "full-paid",
    hasOverdueTasks: true,
    calendarColor: "#10B981" // green-500
  },

  // Upcoming charters
  {
    id: "c3",
    yachtName: "Alrisha",
    startDate: "2025-07-05T09:00:00.000Z",
    endDate: "2025-07-12T15:00:00.000Z",
    status: "upcoming",
    paymentStatus: "tentative",
    hasOverdueTasks: false,
    calendarColor: "#F59E0B" // amber-500
  },
  {
    id: "c4",
    yachtName: "Disk Drive",
    startDate: "2025-07-10T08:00:00.000Z",
    endDate: "2025-07-17T14:00:00.000Z",
    status: "upcoming",
    paymentStatus: "deposit-paid",
    hasOverdueTasks: false,
    calendarColor: "#8B5CF6" // purple-500
  },
  {
    id: "c5",
    yachtName: "Zavaria",
    startDate: "2025-07-15T11:00:00.000Z",
    endDate: "2025-07-22T17:00:00.000Z",
    status: "upcoming",
    paymentStatus: "full-paid",
    hasOverdueTasks: false,
    calendarColor: "#EC4899" // pink-500
  },
  {
    id: "c6",
    yachtName: "Mridula Sarwar",
    startDate: "2025-07-25T09:00:00.000Z",
    endDate: "2025-08-01T16:00:00.000Z",
    status: "upcoming",
    paymentStatus: "unavailable",
    hasOverdueTasks: false,
    calendarColor: "#EF4444" // red-500
  }
]

export { mockCharters }
export default mockCharters