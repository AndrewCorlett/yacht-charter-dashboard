/**
 * Mock Data for Yacht Charter Dashboard
 * 
 * Purpose: Temporary data structures for testing calendar functionality
 * 
 * Design Decisions:
 * - Matches yacht names from dashboard image
 * - Includes variety of booking lengths and statuses
 * - Date ranges set for current/future dates
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

import { addDays, format } from 'date-fns'

export const yachts = [
  { id: 'spectre', name: 'Spectre' },
  { id: 'disk-drive', name: 'Disk Drive' },
  { id: 'arriva', name: 'Arriva' },
  { id: 'zambada', name: 'Zambada' },
  { id: 'melba-so', name: 'Melba So' },
  { id: 'swansea', name: 'Swansea' }
]

const today = new Date()

export const mockBookings = [
  {
    id: 'booking-1',
    yachtId: 'spectre',
    customerName: 'Smith Family',
    customerNo: 'C2401',
    tripNo: 'SP-001',
    startDate: format(today, 'yyyy-MM-dd'),
    endDate: format(addDays(today, 3), 'yyyy-MM-dd'),
    status: 'confirmed',
    type: 'charter'
  },
  {
    id: 'booking-2',
    yachtId: 'disk-drive',
    customerName: 'Johnson Corp',
    customerNo: 'C2402',
    tripNo: 'DD-001',
    startDate: format(addDays(today, 2), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 5), 'yyyy-MM-dd'),
    status: 'confirmed',
    type: 'charter'
  },
  {
    id: 'booking-3',
    yachtId: 'arriva',
    customerName: 'Owner Use',
    customerNo: 'OWNER',
    tripNo: 'AR-OWN',
    startDate: format(addDays(today, 1), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 2), 'yyyy-MM-dd'),
    status: 'unavailable',
    type: 'owner'
  },
  {
    id: 'booking-4',
    yachtId: 'zambada',
    customerName: 'Williams Party',
    customerNo: 'C2403',
    tripNo: 'ZM-001',
    startDate: format(addDays(today, 7), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 14), 'yyyy-MM-dd'),
    status: 'confirmed',
    type: 'charter'
  },
  {
    id: 'booking-5',
    yachtId: 'melba-so',
    customerName: 'Maintenance',
    customerNo: 'MAINT',
    tripNo: 'MS-MNT',
    startDate: format(addDays(today, 3), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 4), 'yyyy-MM-dd'),
    status: 'unavailable',
    type: 'maintenance'
  },
  {
    id: 'booking-6',
    yachtId: 'swansea',
    customerName: 'Thompson Group',
    customerNo: 'C2404',
    tripNo: 'SW-001',
    startDate: format(addDays(today, 5), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 9), 'yyyy-MM-dd'),
    status: 'confirmed',
    type: 'charter'
  },
  {
    id: 'booking-7',
    yachtId: 'spectre',
    customerName: 'Davis Family',
    customerNo: 'C2405',
    tripNo: 'SP-002',
    startDate: format(addDays(today, 10), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 12), 'yyyy-MM-dd'),
    status: 'confirmed',
    type: 'charter'
  },
  {
    id: 'booking-8',
    yachtId: 'disk-drive',
    customerName: 'Ocean Adventures',
    customerNo: 'C2406',
    tripNo: 'DD-002',
    startDate: format(addDays(today, 12), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 17), 'yyyy-MM-dd'),
    status: 'confirmed',
    type: 'charter'
  },
  {
    id: 'booking-9',
    yachtId: 'arriva',
    customerName: 'Miller & Associates',
    customerNo: 'C2407',
    tripNo: 'AR-001',
    startDate: format(addDays(today, 8), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 11), 'yyyy-MM-dd'),
    status: 'confirmed',
    type: 'charter'
  },
  {
    id: 'booking-10',
    yachtId: 'melba-so',
    customerName: 'Robinson Party',
    customerNo: 'C2408',
    tripNo: 'MS-001',
    startDate: format(addDays(today, 15), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 20), 'yyyy-MM-dd'),
    status: 'confirmed',
    type: 'charter'
  },
  {
    id: 'booking-11',
    yachtId: 'swansea',
    customerName: 'Cardiff',
    customerNo: 'C2409',
    tripNo: 'SW-002',
    startDate: format(addDays(today, 1), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 8), 'yyyy-MM-dd'),
    status: 'confirmed',
    type: 'charter'
  }
]