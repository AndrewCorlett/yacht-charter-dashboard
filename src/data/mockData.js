/**
 * Mock Data for Development and Testing
 * 
 * Contains sample charter bookings and yacht data for testing
 * the calendar integration and booking management features.
 * 
 * @author AI Agent
 * @created 2025-06-27
 */

import { addDays, subDays, format } from 'date-fns'

// Sample Charter Bookings for Calendar Testing
export const sampleCharters = [
  {
    id: 'charter-001',
    bookingCode: 'SC-2025-001',
    yachtName: 'Calico Moon',
    customerName: 'John Smith',
    customerEmail: 'john.smith@email.com',
    customerPhone: '+44 7123 456789',
    startDate: '2025-06-28',
    endDate: '2025-06-29',
    paymentStatus: 'deposit-paid',
    totalPrice: 2500,
    hasOverdueTasks: false,
    notes: 'Weekend getaway charter'
  },
  {
    id: 'charter-002', 
    bookingCode: 'SC-2025-002',
    yachtName: 'Spectre',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.j@email.com',
    customerPhone: '+44 7234 567890',
    startDate: '2025-07-01',
    endDate: '2025-07-07',
    paymentStatus: 'full-paid',
    totalPrice: 4200,
    hasOverdueTasks: false,
    notes: 'Week-long family charter'
  },
  {
    id: 'charter-003',
    bookingCode: 'SC-2025-003',
    yachtName: 'Alrisha', 
    customerName: 'Mike Wilson',
    customerEmail: 'mike.wilson@email.com',
    customerPhone: '+44 7345 678901',
    startDate: '2025-07-05',
    endDate: '2025-07-08',
    paymentStatus: 'tentative',
    totalPrice: 1800,
    hasOverdueTasks: true,
    notes: 'Corporate team building event'
  },
  {
    id: 'charter-004',
    bookingCode: 'SC-2025-004',
    yachtName: 'Disk Drive',
    customerName: 'Emma Thompson',
    customerEmail: 'emma.t@email.com', 
    customerPhone: '+44 7456 789012',
    startDate: '2025-07-10',
    endDate: '2025-07-14',
    paymentStatus: 'deposit-paid',
    totalPrice: 3200,
    hasOverdueTasks: false,
    notes: 'Anniversary celebration charter'
  },
  {
    id: 'charter-005',
    bookingCode: 'SC-2025-005',
    yachtName: 'Zavaria',
    customerName: 'David Brown',
    customerEmail: 'david.brown@email.com',
    customerPhone: '+44 7567 890123',
    startDate: '2025-07-15',
    endDate: '2025-07-17',
    paymentStatus: 'full-paid',
    totalPrice: 2100,
    hasOverdueTasks: false,
    notes: 'Birthday party charter'
  },
  {
    id: 'charter-test-today',
    bookingCode: 'SC-2025-TEST',
    yachtName: 'Spectre',
    customerName: 'Test Customer Today',
    customerEmail: 'test.today@example.com',
    customerPhone: '+44 7000 000001',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    paymentStatus: 'deposit-paid',
    totalPrice: 3500,
    hasOverdueTasks: false,
    notes: 'Test booking starting today for 1 week'
  },
  {
    id: 'charter-test-upcoming',
    bookingCode: 'SC-2025-UP01',
    yachtName: 'Calico Moon',
    customerName: 'Upcoming Charter Customer',
    customerEmail: 'upcoming@example.com',
    customerPhone: '+44 7000 000002',
    startDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
    paymentStatus: 'tentative',
    totalPrice: 2200,
    hasOverdueTasks: true,
    notes: 'Upcoming charter with overdue tasks'
  },
  {
    id: 'charter-test-paid',
    bookingCode: 'SC-2025-PAID',
    yachtName: 'Alrisha',
    customerName: 'Fully Paid Customer',
    customerEmail: 'paid@example.com',
    customerPhone: '+44 7000 000003',
    startDate: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 12), 'yyyy-MM-dd'),
    paymentStatus: 'full-paid',
    totalPrice: 2800,
    hasOverdueTasks: false,
    notes: 'Fully paid charter booking'
  }
]

// Sample Yacht Fleet Data
export const sampleYachts = [
  {
    id: 'calico-moon',
    name: 'Calico Moon',
    type: 'Sailing Yacht',
    length: '12m',
    capacity: 8,
    location: 'Cardiff Marina',
    status: 'active'
  },
  {
    id: 'spectre',
    name: 'Spectre', 
    type: 'Motor Yacht',
    length: '15m',
    capacity: 10,
    location: 'Cardiff Marina',
    status: 'active'
  },
  {
    id: 'alrisha',
    name: 'Alrisha',
    type: 'Sailing Yacht', 
    length: '11m',
    capacity: 6,
    location: 'Cardiff Marina',
    status: 'active'
  },
  {
    id: 'disk-drive',
    name: 'Disk Drive',
    type: 'Motor Yacht',
    length: '14m', 
    capacity: 12,
    location: 'Cardiff Marina',
    status: 'active'
  },
  {
    id: 'zavaria',
    name: 'Zavaria',
    type: 'Sailing Yacht',
    length: '10m',
    capacity: 6,
    location: 'Cardiff Marina', 
    status: 'active'
  },
  {
    id: 'mridula-sarwar',
    name: 'Mridula Sarwar',
    type: 'Motor Yacht',
    length: '16m',
    capacity: 14,
    location: 'Cardiff Marina',
    status: 'active'
  }
]

// Generate additional sample charter data for different months
export const generateSampleCharters = (monthOffset = 0) => {
  const baseDate = new Date()
  baseDate.setMonth(baseDate.getMonth() + monthOffset)
  
  return [
    ...sampleCharters,
    // Add more dynamic charters based on current date
    {
      id: `charter-dynamic-001-${monthOffset}`,
      bookingCode: `SC-2025-T${String(monthOffset).padStart(2, '0')}1`,
      yachtName: 'Calico Moon',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '+44 7000 000000',
      startDate: format(addDays(baseDate, 5), 'yyyy-MM-dd'),
      endDate: format(addDays(baseDate, 7), 'yyyy-MM-dd'),
      paymentStatus: 'tentative',
      totalPrice: 1500,
      hasOverdueTasks: false,
      notes: 'Test booking for current month'
    }
  ]
}

// Color legend for SIT REP section - Updated to match requirements
export const COLOR_KEY_LEGEND = [
  { color: '#34C759', label: 'Full Balance Paid', status: 'full-paid', description: 'Charter fully paid' },
  { color: '#007AFF', label: 'Deposit Only Paid', status: 'deposit-paid', description: 'Deposit received' },
  { color: '#FF9500', label: 'Tentative', status: 'tentative', description: 'Confirmed but deposit not paid' },
  { color: '#DC2626', label: 'Yacht Unavailable', status: 'unavailable', description: 'Yacht not available' }
]

// Payment status to color mapping
export const PAYMENT_STATUS_COLORS = {
  // Unified model enum values (preferred)
  'pending': '#FF9500',        // Orange - Tentative (no deposit)
  'deposit_paid': '#007AFF',   // Blue - Deposit only paid  
  'full_payment': '#34C759',   // Green - Full balance paid
  'refunded': '#8E8E93',       // Gray - Refunded bookings
  
  // Legacy format compatibility
  'full-paid': '#34C759',      // Green - Full balance paid
  'deposit-paid': '#007AFF',   // Blue - Deposit only paid  
  'tentative': '#FF9500',      // Orange - Tentative (confirmed but deposit not paid)
  'unavailable': '#DC2626',    // Red - Yacht unavailable
  'cancelled': '#8E8E93',      // Gray - Cancelled
  'maintenance': '#AF52DE',    // Purple - Maintenance
  'owner-use': '#5856D6'       // Indigo - Owner use
}

// Legacy export for compatibility
export const mockCharters = sampleCharters

export default {
  sampleCharters,
  sampleYachts,
  generateSampleCharters,
  COLOR_KEY_LEGEND,
  mockCharters
}