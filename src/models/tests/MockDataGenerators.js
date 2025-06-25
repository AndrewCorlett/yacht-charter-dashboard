/**
 * Mock Data Generators
 * 
 * Comprehensive mock data generators for testing all model types
 * with realistic and varied test data scenarios.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

import { format, addDays, addHours, subDays } from 'date-fns'
import { 
  BookingStatus, 
  BookingType 
} from '../core/BookingModel.js'
import { 
  CrewPosition, 
  ExperienceLevel 
} from '../core/CrewDetailsModel.js'
import { 
  DietaryRestriction, 
  CelebrationType 
} from '../core/CharterExperienceModel.js'
import { 
  StatusState, 
  StatusPriority, 
  StatusCategory 
} from '../core/StatusTrackingModel.js'

/**
 * Random data utilities
 */
class RandomUtils {
  /**
   * Generate random integer between min and max (inclusive)
   */
  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /**
   * Pick random item from array
   */
  static randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)]
  }

  /**
   * Pick multiple random items from array
   */
  static randomChoices(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  /**
   * Generate random boolean with optional probability
   */
  static randomBoolean(probability = 0.5) {
    return Math.random() < probability
  }

  /**
   * Generate random date within range
   */
  static randomDate(startDate, endDate) {
    const start = startDate.getTime()
    const end = endDate.getTime()
    return new Date(start + Math.random() * (end - start))
  }

  /**
   * Generate random future date
   */
  static randomFutureDate(daysFromNow = 365) {
    const now = new Date()
    const future = addDays(now, daysFromNow)
    return this.randomDate(now, future)
  }

  /**
   * Generate random past date
   */
  static randomPastDate(daysAgo = 365) {
    const now = new Date()
    const past = subDays(now, daysAgo)
    return this.randomDate(past, now)
  }

  /**
   * Generate random UUID
   */
  static randomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}

/**
 * Sample data collections
 */
const SampleData = {
  yachts: [
    { id: 'spectre', name: 'Spectre', maxGuests: 12 },
    { id: 'disk-drive', name: 'Disk Drive', maxGuests: 8 },
    { id: 'arriva', name: 'Arriva', maxGuests: 10 },
    { id: 'zambada', name: 'Zambada', maxGuests: 14 },
    { id: 'melba-so', name: 'Melba So', maxGuests: 6 },
    { id: 'swansea', name: 'Swansea', maxGuests: 16 }
  ],

  firstNames: [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
    'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
    'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Nancy', 'Daniel', 'Lisa',
    'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra', 'Donald', 'Donna'
  ],

  lastNames: [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker'
  ],

  emailDomains: [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'email.com',
    'company.com', 'business.co.uk', 'personal.net', 'mail.org'
  ],

  locations: [
    'Marina Bay, Singapore',
    'Puerto Banus, Marbella',
    'Monaco Harbor',
    'St. Tropez, France',
    'Mykonos, Greece',
    'Ibiza, Spain',
    'Cannes, France',
    'Portofino, Italy',
    'Newport, Rhode Island',
    'Martha\'s Vineyard'
  ],

  countries: [
    'United Kingdom', 'United States', 'Canada', 'Australia', 'Germany',
    'France', 'Italy', 'Spain', 'Netherlands', 'Sweden', 'Norway', 'Switzerland'
  ],

  cities: [
    'London', 'New York', 'Los Angeles', 'Toronto', 'Sydney', 'Melbourne',
    'Berlin', 'Munich', 'Paris', 'Lyon', 'Rome', 'Milan', 'Madrid', 'Barcelona',
    'Amsterdam', 'Stockholm', 'Oslo', 'Zurich', 'Geneva'
  ],

  cuisineTypes: [
    'Mediterranean', 'Italian', 'French', 'Asian Fusion', 'Seafood',
    'International', 'Vegetarian', 'Organic', 'Local Specialties'
  ],

  musicGenres: [
    'Jazz', 'Classical', 'Pop', 'Rock', 'Electronic', 'Ambient',
    'World Music', 'Blues', 'R&B', 'Acoustic'
  ],

  activities: [
    'Swimming', 'Snorkeling', 'Diving', 'Fishing', 'Water Sports',
    'Sunset Watching', 'Photography', 'Yoga', 'Spa Services', 'Island Hopping'
  ]
}

/**
 * Main mock data generator class
 */
export class MockDataGenerator {
  /**
   * Generate mock booking data
   */
  static generateBooking(overrides = {}) {
    const yacht = RandomUtils.randomChoice(SampleData.yachts)
    const customerFirstName = RandomUtils.randomChoice(SampleData.firstNames)
    const customerLastName = RandomUtils.randomChoice(SampleData.lastNames)
    const startDate = RandomUtils.randomFutureDate(90)
    const endDate = addDays(startDate, RandomUtils.randomInt(2, 14))

    const mockData = {
      id: RandomUtils.randomUUID(),
      ical_uid: `booking-${Date.now()}-${Math.random().toString(36).substring(2)}@seascape-yachts.com`,
      summary: `${customerFirstName} ${customerLastName} Charter - ${yacht.name}`,
      description: `Charter booking for ${customerFirstName} ${customerLastName} family on ${yacht.name}`,
      location: RandomUtils.randomChoice(SampleData.locations),
      start_datetime: startDate,
      end_datetime: endDate,
      yacht_id: yacht.id,
      customer_name: `${customerFirstName} ${customerLastName}`,
      booking_no: this.generateBookingNumber(),
      trip_no: `${yacht.id.substring(0, 2).toUpperCase()}-${RandomUtils.randomInt(100, 999)}`,
      customer_email: `${customerFirstName.toLowerCase()}.${customerLastName.toLowerCase()}@${RandomUtils.randomChoice(SampleData.emailDomains)}`,
      customer_phone: this.generatePhoneNumber(),
      total_value: RandomUtils.randomInt(2000, 15000),
      deposit_amount: null, // Will be calculated based on total_value
      status: RandomUtils.randomChoice(Object.values(BookingStatus)),
      type: RandomUtils.randomChoice(Object.values(BookingType)),
      notes: RandomUtils.randomBoolean(0.3) ? 'Special requirements noted during booking' : '',
      deposit_paid: RandomUtils.randomBoolean(0.6),
      final_payment_paid: RandomUtils.randomBoolean(0.4),
      created_at: RandomUtils.randomPastDate(30),
      modified_at: new Date()
    }

    // Calculate deposit amount (typically 30-50% of total)
    if (mockData.total_value) {
      const depositPercent = RandomUtils.randomInt(30, 50) / 100
      mockData.deposit_amount = Math.round(mockData.total_value * depositPercent)
    }

    return { ...mockData, ...overrides }
  }

  /**
   * Generate mock crew member data
   */
  static generateCrewMember(bookingId, overrides = {}) {
    const firstName = RandomUtils.randomChoice(SampleData.firstNames)
    const lastName = RandomUtils.randomChoice(SampleData.lastNames)
    const birthDate = RandomUtils.randomDate(
      new Date('1970-01-01'),
      new Date('2005-01-01')
    )

    const mockData = {
      id: RandomUtils.randomUUID(),
      booking_id: bookingId,
      first_name: firstName,
      last_name: lastName,
      date_of_birth: birthDate,
      position: RandomUtils.randomChoice(Object.values(CrewPosition)),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${RandomUtils.randomChoice(SampleData.emailDomains)}`,
      phone: this.generatePhoneNumber(),
      address_line_1: `${RandomUtils.randomInt(1, 999)} ${RandomUtils.randomChoice(['Main St', 'Oak Ave', 'Park Rd', 'High St', 'Church Lane'])}`,
      address_line_2: RandomUtils.randomBoolean(0.3) ? `Apt ${RandomUtils.randomInt(1, 99)}` : '',
      city: RandomUtils.randomChoice(SampleData.cities),
      state_province: RandomUtils.randomChoice(['CA', 'NY', 'TX', 'FL', 'London', 'Bavaria', 'Ile-de-France']),
      postal_code: this.generatePostalCode(),
      country: RandomUtils.randomChoice(SampleData.countries),
      nationality: RandomUtils.randomChoice(SampleData.countries),
      passport_number: this.generatePassportNumber(),
      passport_expiry: RandomUtils.randomFutureDate(1825), // Up to 5 years
      experience_level: RandomUtils.randomChoice(Object.values(ExperienceLevel)),
      years_experience: RandomUtils.randomInt(0, 25),
      certifications: RandomUtils.randomBoolean(0.4) ? 'RYA Day Skipper, VHF Radio License' : '',
      medical_conditions: RandomUtils.randomBoolean(0.2) ? 'None reported' : '',
      emergency_contact_name: `${RandomUtils.randomChoice(SampleData.firstNames)} ${RandomUtils.randomChoice(SampleData.lastNames)}`,
      emergency_contact_phone: this.generatePhoneNumber(),
      emergency_contact_relationship: RandomUtils.randomChoice(['Spouse', 'Parent', 'Sibling', 'Friend', 'Partner']),
      special_requirements: RandomUtils.randomBoolean(0.2) ? 'Vegetarian meals preferred' : '',
      created_at: RandomUtils.randomPastDate(30),
      modified_at: new Date()
    }

    return { ...mockData, ...overrides }
  }

  /**
   * Generate mock charter experience data
   */
  static generateCharterExperience(bookingId, overrides = {}) {
    const mockData = {
      id: RandomUtils.randomUUID(),
      booking_id: bookingId,
      dietary_restrictions: RandomUtils.randomBoolean(0.3) 
        ? RandomUtils.randomChoices(Object.values(DietaryRestriction), RandomUtils.randomInt(1, 3))
        : [],
      dietary_notes: RandomUtils.randomBoolean(0.3) ? 'Please ensure fresh ingredients and local specialties' : '',
      food_allergies: RandomUtils.randomBoolean(0.2) ? [
        {
          id: RandomUtils.randomUUID(),
          allergen: RandomUtils.randomChoice(['Nuts', 'Shellfish', 'Dairy', 'Gluten']),
          severity: RandomUtils.randomChoice(['mild', 'moderate', 'severe']),
          notes: 'Please be very careful with cross-contamination',
          created_at: new Date()
        }
      ] : [],
      preferred_cuisine: RandomUtils.randomChoice(SampleData.cuisineTypes),
      alcohol_service: RandomUtils.randomBoolean(0.8),
      alcohol_preferences: RandomUtils.randomBoolean(0.6) ? 'Premium wines and champagne, craft cocktails' : '',
      celebration_type: RandomUtils.randomBoolean(0.4) ? RandomUtils.randomChoice(Object.values(CelebrationType)) : '',
      celebration_details: RandomUtils.randomBoolean(0.4) ? 'Anniversary celebration - 25 years married' : '',
      guest_count: RandomUtils.randomInt(2, 12),
      child_count: RandomUtils.randomInt(0, 4),
      special_requests: RandomUtils.randomBoolean(0.5) ? [
        {
          id: RandomUtils.randomUUID(),
          description: RandomUtils.randomChoice([
            'Professional photographer for sunset shots',
            'Yoga instructor for morning sessions',
            'Special decoration for celebration',
            'Marine biologist guide for diving'
          ]),
          priority: RandomUtils.randomChoice(['low', 'medium', 'high']),
          category: 'entertainment',
          created_at: new Date()
        }
      ] : [],
      music_preferences: RandomUtils.randomChoice(SampleData.musicGenres),
      activity_preferences: RandomUtils.randomChoices(SampleData.activities, RandomUtils.randomInt(2, 5)).join(', '),
      photography_allowed: RandomUtils.randomBoolean(0.9),
      social_media_consent: RandomUtils.randomBoolean(0.7),
      previous_charters: RandomUtils.randomBoolean(0.3) ? [
        {
          id: RandomUtils.randomUUID(),
          date: RandomUtils.randomPastDate(365),
          yacht: RandomUtils.randomChoice(SampleData.yachts).name,
          location: RandomUtils.randomChoice(SampleData.locations),
          rating: RandomUtils.randomInt(3, 5),
          notes: 'Excellent service, looking forward to returning',
          created_at: new Date()
        }
      ] : [],
      how_heard_about_us: RandomUtils.randomChoice([
        'Google Search', 'Referral from friend', 'Social Media', 'Yacht show',
        'Travel agent', 'Previous customer', 'Website', 'Magazine advertisement'
      ]),
      expectations: 'Looking forward to a relaxing and memorable experience with family',
      concerns: RandomUtils.randomBoolean(0.2) ? 'Weather conditions and sea sickness' : '',
      budget_range_min: RandomUtils.randomInt(3000, 8000),
      budget_range_max: null, // Will be calculated
      flexible_dates: RandomUtils.randomBoolean(0.6),
      preferred_weather: RandomUtils.randomChoices(['Sunny', 'Calm seas', 'Light winds', 'Clear skies'], RandomUtils.randomInt(1, 3)),
      accessibility_requirements: RandomUtils.randomBoolean(0.1) ? 'Wheelchair accessible areas needed' : '',
      communication_preferences: RandomUtils.randomChoice(['Email', 'Phone', 'Text message', 'WhatsApp']),
      created_at: RandomUtils.randomPastDate(30),
      modified_at: new Date()
    }

    // Calculate max budget (typically 20-50% higher than min)
    if (mockData.budget_range_min) {
      const increase = RandomUtils.randomInt(20, 50) / 100
      mockData.budget_range_max = Math.round(mockData.budget_range_min * (1 + increase))
    }

    return { ...mockData, ...overrides }
  }

  /**
   * Generate mock status tracking data
   */
  static generateStatusTracking(bookingId, overrides = {}) {
    const statusFields = {}
    const timestamps = {}
    const notes = {}
    const assignedTo = {}
    const priorities = {}

    // Generate random status for each default field
    const defaultFields = [
      'initial_inquiry', 'quote_sent', 'booking_confirmed', 'contract_signed',
      'deposit_received', 'payment_schedule_sent', 'final_payment_received',
      'crew_list_received', 'insurance_verified', 'passports_verified',
      'yacht_assigned', 'crew_briefed', 'provisioning_ordered'
    ]

    const progressStage = RandomUtils.randomInt(1, 4) // 1=early, 2=mid, 3=late, 4=complete
    
    defaultFields.forEach((field, index) => {
      const fieldStage = Math.floor(index / (defaultFields.length / 4)) + 1
      
      if (fieldStage <= progressStage) {
        statusFields[field] = RandomUtils.randomChoice([StatusState.COMPLETED, StatusState.IN_PROGRESS])
        timestamps[field] = RandomUtils.randomPastDate(30)
        
        if (RandomUtils.randomBoolean(0.3)) {
          notes[field] = 'Completed successfully'
        }
      } else {
        statusFields[field] = StatusState.PENDING
      }
      
      assignedTo[field] = RandomUtils.randomChoice(['john.doe', 'jane.smith', 'admin', 'crew.manager'])
      priorities[field] = RandomUtils.randomChoice(Object.values(StatusPriority))
    })

    const mockData = {
      id: RandomUtils.randomUUID(),
      booking_id: bookingId,
      status_fields: statusFields,
      timestamps: timestamps,
      notes: notes,
      assigned_to: assignedTo,
      priorities: priorities,
      overall_progress: RandomUtils.randomInt(10, 90),
      current_phase: RandomUtils.randomChoice(Object.values(StatusCategory)),
      milestones: RandomUtils.randomBoolean(0.6) ? [
        {
          id: RandomUtils.randomUUID(),
          name: 'Booking Confirmed',
          date: RandomUtils.randomPastDate(14),
          category: StatusCategory.BOOKING,
          description: 'Customer signed contract and paid deposit',
          created_at: new Date()
        }
      ] : [],
      alerts: RandomUtils.randomBoolean(0.3) ? [
        {
          id: RandomUtils.randomUUID(),
          message: 'Final payment due in 7 days',
          type: 'warning',
          dueDate: addDays(new Date(), 7),
          active: true,
          created_at: new Date()
        }
      ] : [],
      created_at: RandomUtils.randomPastDate(30),
      modified_at: new Date()
    }

    return { ...mockData, ...overrides }
  }

  /**
   * Generate complete booking package with all related models
   */
  static generateBookingPackage(overrides = {}) {
    const booking = this.generateBooking(overrides.booking)
    const crewCount = RandomUtils.randomInt(2, 8)
    const crew = Array.from({ length: crewCount }, () => 
      this.generateCrewMember(booking.id, overrides.crew)
    )
    const experience = this.generateCharterExperience(booking.id, overrides.experience)
    const status = this.generateStatusTracking(booking.id, overrides.status)

    return {
      booking,
      crew,
      experience,
      status
    }
  }

  /**
   * Generate multiple booking packages
   */
  static generateBookingPackages(count, overrides = {}) {
    return Array.from({ length: count }, () => this.generateBookingPackage(overrides))
  }

  /**
   * Generate booking number in realistic format
   */
  static generateBookingNumber() {
    const year = new Date().getFullYear().toString().slice(-2)
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0')
    const sequence = RandomUtils.randomInt(100, 999)
    return `BK${year}${month}${sequence}`
  }

  /**
   * Generate realistic phone number
   */
  static generatePhoneNumber() {
    const formats = [
      () => `+44 ${RandomUtils.randomInt(1000, 9999)} ${RandomUtils.randomInt(100000, 999999)}`,
      () => `+1 ${RandomUtils.randomInt(200, 999)} ${RandomUtils.randomInt(200, 999)} ${RandomUtils.randomInt(1000, 9999)}`,
      () => `+33 ${RandomUtils.randomInt(1, 9)} ${RandomUtils.randomInt(10, 99)} ${RandomUtils.randomInt(10, 99)} ${RandomUtils.randomInt(10, 99)} ${RandomUtils.randomInt(10, 99)}`
    ]
    
    return RandomUtils.randomChoice(formats)()
  }

  /**
   * Generate realistic postal code
   */
  static generatePostalCode() {
    const formats = [
      () => `${RandomUtils.randomInt(10000, 99999)}`, // US ZIP
      () => `SW${RandomUtils.randomInt(1, 9)}${RandomUtils.randomChoice(['A', 'B', 'C'])} ${RandomUtils.randomInt(1, 9)}${RandomUtils.randomChoice(['A', 'B', 'C'])}${RandomUtils.randomChoice(['A', 'B', 'C'])}`, // UK
      () => `${RandomUtils.randomInt(10000, 99999)}` // General
    ]
    
    return RandomUtils.randomChoice(formats)()
  }

  /**
   * Generate realistic passport number
   */
  static generatePassportNumber() {
    const formats = [
      () => `${RandomUtils.randomInt(100000000, 999999999)}`, // 9 digits
      () => `${RandomUtils.randomChoice(['A', 'B', 'C', 'P'])}${RandomUtils.randomInt(10000000, 99999999)}`, // Letter + 8 digits
      () => `${RandomUtils.randomInt(100000000, 999999999)}` // Standard format
    ]
    
    return RandomUtils.randomChoice(formats)()
  }

  /**
   * Generate test data for specific scenarios
   */
  static generateTestScenarios() {
    return {
      // Scenario 1: Complete confirmed booking
      confirmedBooking: this.generateBookingPackage({
        booking: { status: BookingStatus.CONFIRMED, deposit_paid: true },
        status: { overall_progress: 75 }
      }),

      // Scenario 2: Pending booking with issues
      pendingBookingWithIssues: this.generateBookingPackage({
        booking: { status: BookingStatus.PENDING, deposit_paid: false },
        status: { 
          overall_progress: 25,
          alerts: [{
            id: RandomUtils.randomUUID(),
            message: 'Deposit payment overdue',
            type: 'error',
            active: true,
            created_at: new Date()
          }]
        }
      }),

      // Scenario 3: Luxury charter with special requirements
      luxuryCharter: this.generateBookingPackage({
        booking: { total_value: 25000, type: BookingType.CHARTER },
        experience: {
          preferred_cuisine: 'French',
          alcohol_service: true,
          celebration_type: CelebrationType.ANNIVERSARY,
          special_requests: [
            {
              id: RandomUtils.randomUUID(),
              description: 'Private chef specializing in French cuisine',
              priority: 'high',
              category: 'catering'
            },
            {
              id: RandomUtils.randomUUID(),
              description: 'Professional photographer for event',
              priority: 'medium',
              category: 'entertainment'
            }
          ]
        }
      }),

      // Scenario 4: Family charter with children
      familyCharter: this.generateBookingPackage({
        experience: {
          child_count: 3,
          guest_count: 6,
          dietary_restrictions: [DietaryRestriction.NUT_ALLERGY],
          activity_preferences: 'Swimming, Snorkeling, Water Sports',
          special_requests: [
            {
              id: RandomUtils.randomUUID(),
              description: 'Child-safe swimming equipment',
              priority: 'high',
              category: 'safety'
            }
          ]
        }
      }),

      // Scenario 5: Corporate charter
      corporateCharter: this.generateBookingPackage({
        booking: { 
          type: BookingType.CHARTER,
          customer_name: 'TechCorp International',
          total_value: 15000
        },
        experience: {
          guest_count: 10,
          celebration_type: CelebrationType.CORPORATE,
          preferred_cuisine: 'International',
          alcohol_service: true,
          special_requests: [
            {
              id: RandomUtils.randomUUID(),
              description: 'AV equipment for presentations',
              priority: 'high',
              category: 'business'
            }
          ]
        }
      })
    }
  }
}

/**
 * Specialized generators for testing specific features
 */
export class SpecializedGenerators {
  /**
   * Generate data with validation errors
   */
  static generateInvalidData() {
    return {
      booking: {
        summary: '', // Required field missing
        customer_email: 'invalid-email', // Invalid format
        start_datetime: '2024-07-18T10:00:00Z',
        end_datetime: '2024-07-15T16:00:00Z', // End before start
        total_value: -1000 // Negative value
      },
      crew: {
        first_name: '', // Required field missing
        email: 'invalid-email', // Invalid format
        date_of_birth: '2030-01-01', // Future date
        position: 'invalid_position' // Invalid enum value
      },
      experience: {
        guest_count: -1, // Negative value
        budget_range_min: 1000,
        budget_range_max: 500 // Max less than min
      }
    }
  }

  /**
   * Generate edge case data
   */
  static generateEdgeCases() {
    return {
      emptyData: {},
      nullValues: {
        booking: {
          summary: null,
          start_datetime: null,
          end_datetime: null,
          total_value: null
        }
      },
      extremeValues: {
        booking: {
          total_value: 999999999,
          deposit_amount: 1
        },
        experience: {
          guest_count: 1000,
          budget_range_min: 1,
          budget_range_max: 999999999
        }
      }
    }
  }

  /**
   * Generate realistic conflict scenarios
   */
  static generateConflictScenarios() {
    const baseDate = new Date('2024-08-15T10:00:00Z')
    
    return {
      dateConflict: [
        MockDataGenerator.generateBooking({
          yacht_id: 'spectre',
          start_datetime: baseDate,
          end_datetime: addDays(baseDate, 3)
        }),
        MockDataGenerator.generateBooking({
          yacht_id: 'spectre',
          start_datetime: addDays(baseDate, 1), // Overlaps with first booking
          end_datetime: addDays(baseDate, 4)
        })
      ],
      capacityConflict: MockDataGenerator.generateBookingPackage({
        booking: { yacht_id: 'melba-so' }, // 6 guest capacity
        experience: { guest_count: 12 } // Exceeds capacity
      })
    }
  }
}

export default MockDataGenerator