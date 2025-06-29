/**
 * Supabase Services Index
 * Central export point for all Supabase-related services
 * 
 * @created 2025-06-26
 */

// Core client and configuration
export { 
  supabase as default,
  supabaseConfig,
  supabaseAuth,
  checkSupabaseConnection,
  TABLES,
  queryHelpers,
  RealtimeSubscription
} from './supabaseClient.js'

// Service imports
import bookingService from './BookingService.js'
import customerService from './CustomerService.js'
import yachtService from './YachtService.js'
import fileUploadService from './FileUploadService.js'
import offlineQueueService from './OfflineQueueService.js'

// Export services
export {
  bookingService,
  customerService,
  yachtService,
  fileUploadService,
  offlineQueueService
}

// Export classes for extending
export { BookingService } from './BookingService.js'
export { CustomerService } from './CustomerService.js'
export { YachtService } from './YachtService.js'
export { FileUploadService } from './FileUploadService.js'
export { OfflineQueueService } from './OfflineQueueService.js'

// Error types for better error handling
export class SupabaseError extends Error {
  constructor(message, code = null, details = null) {
    super(message)
    this.name = 'SupabaseError'
    this.code = code
    this.details = details
  }
}

export class AuthenticationError extends SupabaseError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTH_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class ValidationError extends SupabaseError {
  constructor(message, errors = {}) {
    super(message, 'VALIDATION_ERROR', errors)
    this.name = 'ValidationError'
  }
}

export class ConflictError extends SupabaseError {
  constructor(message, conflicts = []) {
    super(message, 'CONFLICT_ERROR', conflicts)
    this.name = 'ConflictError'
  }
}

export class NetworkError extends SupabaseError {
  constructor(message = 'Network error occurred') {
    super(message, 'NETWORK_ERROR')
    this.name = 'NetworkError'
  }
}

// Service initialization helper
export async function initializeServices() {
  try {
    // Check connection
    const connectionStatus = await checkSupabaseConnection()
    
    if (!connectionStatus.connected) {
      console.warn('Supabase connection failed:', connectionStatus.error)
      return {
        success: false,
        error: connectionStatus.error,
        services: {
          bookingService,
          customerService,
          yachtService,
          fileUploadService,
          offlineQueueService
        }
      }
    }

    console.log('✅ Supabase services initialized successfully')
    
    return {
      success: true,
      services: {
        bookingService,
        customerService,
        yachtService,
        fileUploadService,
        offlineQueueService
      }
    }
  } catch (error) {
    console.error('Failed to initialize Supabase services:', error)
    return {
      success: false,
      error: error.message,
      services: {
        bookingService,
        customerService,
        yachtService,
        fileUploadService,
        offlineQueueService
      }
    }
  }
}

// Cleanup helper for unmounting
export function cleanupServices() {
  // Clean up all subscriptions
  bookingService.cleanup()
  
  console.log('✅ Supabase services cleaned up')
}

// Service status helper
export function getServicesStatus() {
  return {
    supabaseEnabled: supabaseConfig.enabled,
    useMockData: supabaseConfig.useMockData,
    hasAuth: supabaseConfig.hasAuth,
    offlineQueue: offlineQueueService.getQueueStatus(),
    isOnline: navigator.onLine
  }
}