/**
 * Date Helper Functions Tests
 * 
 * Purpose: Test all date utility functions for yacht charter calendar
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

import { describe, it, expect } from 'vitest'
import { 
  generateDateRange, 
  formatDate, 
  isSameDayHelper, 
  getWeekStart 
} from '../../utils/dateHelpers'

describe('dateHelpers', () => {
  describe('generateDateRange', () => {
    it('should generate correct number of dates', () => {
      const startDate = new Date(2025, 6, 1) // July 1, 2025
      const result = generateDateRange(startDate, 7)
      
      expect(result).toHaveLength(7)
      expect(result[0]).toEqual(startDate)
      expect(result[6]).toEqual(new Date(2025, 6, 7))
    })

    it('should handle month boundaries', () => {
      const startDate = new Date(2025, 5, 28) // June 28, 2025
      const result = generateDateRange(startDate, 5)
      
      expect(result).toHaveLength(5)
      expect(result[0]).toEqual(new Date(2025, 5, 28))
      expect(result[4]).toEqual(new Date(2025, 6, 2)) // July 2
    })
  })

  describe('formatDate', () => {
    it('should format date with default format', () => {
      const date = new Date(2025, 6, 1) // July 1, 2025 (Tuesday)
      const result = formatDate(date)
      
      expect(result).toBe('Tue 01/07/25')
    })

    it('should format date with custom format', () => {
      const date = new Date(2025, 6, 1)
      const result = formatDate(date, 'yyyy-MM-dd')
      
      expect(result).toBe('2025-07-01')
    })
  })

  describe('isSameDayHelper', () => {
    it('should return true for same dates', () => {
      const date1 = new Date(2025, 6, 1, 10, 30)
      const date2 = new Date(2025, 6, 1, 15, 45)
      
      expect(isSameDayHelper(date1, date2)).toBe(true)
    })

    it('should return false for different dates', () => {
      const date1 = new Date(2025, 6, 1)
      const date2 = new Date(2025, 6, 2)
      
      expect(isSameDayHelper(date1, date2)).toBe(false)
    })
  })

  describe('getWeekStart', () => {
    it('should return Monday for dates in the same week', () => {
      const wednesday = new Date(2025, 6, 2) // July 2, 2025 (Wednesday)
      const result = getWeekStart(wednesday)
      
      // Should return June 30, 2025 (Monday)
      expect(result).toEqual(new Date(2025, 5, 30))
    })

    it('should return same date if already Monday', () => {
      const monday = new Date(2025, 5, 30) // June 30, 2025 (Monday)
      const result = getWeekStart(monday)
      
      expect(result).toEqual(monday)
    })
  })
})