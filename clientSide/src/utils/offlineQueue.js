/**
 * Offline Queue Utility
 * Handles queuing of operations when network is unavailable
 */

class OfflineQueue {
  constructor(storageKey = 'offline_queue') {
    this.storageKey = storageKey;
    this.queue = this.loadQueue();
    this.isOnline = navigator.onLine;
    this.listeners = [];

    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  /**
   * Load queue from localStorage
   * @returns {Array}
   */
  loadQueue() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      return [];
    }
  }

  /**
   * Save queue to localStorage
   */
  saveQueue() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Add operation to queue
   * @param {Object} operation - Operation to queue
   * @param {string} operation.type - Operation type
   * @param {Object} operation.data - Operation data
   * @param {Function} operation.execute - Function to execute when online
   */
  add(operation) {
    const queueItem = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...operation,
    };

    this.queue.push(queueItem);
    this.saveQueue();

    // Try to process immediately if online
    if (this.isOnline) {
      this.processQueue();
    }

    return queueItem.id;
  }

  /**
   * Remove operation from queue
   * @param {string} id - Operation ID
   */
  remove(id) {
    this.queue = this.queue.filter(item => item.id !== id);
    this.saveQueue();
  }

  /**
   * Get all queued operations
   * @returns {Array}
   */
  getAll() {
    return [...this.queue];
  }

  /**
   * Get queue size
   * @returns {number}
   */
  size() {
    return this.queue.length;
  }

  /**
   * Clear all queued operations
   */
  clear() {
    this.queue = [];
    this.saveQueue();
  }

  /**
   * Process queued operations
   */
  async processQueue() {
    if (!this.isOnline || this.queue.length === 0) {
      return;
    }

    const itemsToProcess = [...this.queue];
    
    for (const item of itemsToProcess) {
      try {
        // Execute the operation
        if (typeof item.execute === 'function') {
          await item.execute(item.data);
        }
        
        // Remove from queue on success
        this.remove(item.id);
        
        // Notify listeners
        this.notifyListeners('processed', item);
      } catch (error) {
        console.error('Failed to process queued operation:', error);
        
        // Keep in queue for retry
        // Optionally: implement retry limit and remove after X failures
        this.notifyListeners('error', { item, error });
      }
    }
  }

  /**
   * Handle online event
   */
  handleOnline() {
    console.log('Network connection restored');
    this.isOnline = true;
    this.notifyListeners('online');
    this.processQueue();
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    console.log('Network connection lost');
    this.isOnline = false;
    this.notifyListeners('offline');
  }

  /**
   * Add event listener
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.push(listener);
  }

  /**
   * Remove event listener
   * @param {Function} listener - Listener function
   */
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners
   * @param {string} event - Event type
   * @param {*} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * Check if online
   * @returns {boolean}
   */
  isNetworkOnline() {
    return this.isOnline;
  }
}

// Export singleton instance
const offlineQueue = new OfflineQueue('scanner_offline_queue');
export default offlineQueue;
