/**
 * Event Emitter Module
 * 
 * Standalone event emitter to avoid circular dependencies between 
 * UnifiedDataService and charterService.
 * 
 * @author AI Agent
 * @created 2025-06-26
 */

/**
 * Simple event emitter for real-time updates
 * In production, this would be replaced with WebSocket or Server-Sent Events
 */
class SimpleEventEmitter {
  constructor() {
    this.events = {}
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler to remove
   */
  off(event, callback) {
    if (!this.events[event]) return
    
    this.events[event] = this.events[event].filter(cb => cb !== callback)
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {...any} args - Arguments to pass to handlers
   */
  emit(event, ...args) {
    if (!this.events[event]) return
    
    this.events[event].forEach(callback => {
      try {
        callback(...args)
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error)
      }
    })
  }
}

// Create global event emitter instance
export const eventEmitter = new SimpleEventEmitter()

export default eventEmitter