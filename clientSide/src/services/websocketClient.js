/**
 * WebSocket Client Service
 * Handles real-time communication with the server
 */

import { io } from 'socket.io-client';

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnecting = false;
    this.listeners = new Map();
    this.eventQueue = [];
    this.lastEventId = null;
  }

  /**
   * Connect to WebSocket server
   * @param {string} token - Authentication token
   * @param {Object} options - Connection options
   */
  connect(token, options = {}) {
    if (this.socket) {
      console.warn('WebSocket already connected');
      return;
    }

    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    this.socket = io(serverUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      ...options,
    });

    this.setupEventHandlers();
    console.log('🔌 Connecting to WebSocket server...');
  }

  /**
   * Set up socket event handlers
   */
  setupEventHandlers() {
    // Connection events
    this.socket.on('connect', () => {
      this.connected = true;
      this.reconnecting = false;
      console.log('✅ WebSocket connected:', this.socket.id);
      this.emit('connection_status', { connected: true });
      
      // Request sync if reconnecting
      if (this.lastEventId) {
        this.requestSync();
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log('🔌 WebSocket disconnected:', reason);
      this.emit('connection_status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      this.emit('connection_error', { error: error.message });
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.reconnecting = true;
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
      this.emit('reconnecting', { attempt: attemptNumber });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      this.emit('reconnected', { attempts: attemptNumber });
    });

    // Server events
    this.socket.on('connected', (data) => {
      console.log('📡 Server confirmation:', data);
    });

    this.socket.on('pong', (data) => {
      // Heartbeat response
    });

    // Real-time data events
    this.socket.on('sale_update', (event) => {
      this.handleEvent('sale_update', event);
    });

    this.socket.on('inventory_update', (event) => {
      this.handleEvent('inventory_update', event);
    });

    this.socket.on('notification', (event) => {
      this.handleEvent('notification', event);
    });

    this.socket.on('sync_data', (data) => {
      this.handleSyncData(data);
    });

    this.socket.on('sync_error', (error) => {
      console.error('❌ Sync error:', error);
    });
  }

  /**
   * Handle incoming event
   * @param {string} eventType - Event type
   * @param {Object} event - Event data
   */
  handleEvent(eventType, event) {
    // Store last event ID for sync
    if (event.eventId) {
      this.lastEventId = event.eventId;
    }

    // Add to queue for ordering
    this.eventQueue.push({ ...event, type: eventType });
    
    // Sort by timestamp
    this.eventQueue.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    // Process queue
    this.processEventQueue();
  }

  /**
   * Process event queue
   */
  processEventQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      this.emit(event.type, event);
    }
  }

  /**
   * Request sync for missed updates
   */
  requestSync() {
    if (!this.socket || !this.connected) {
      return;
    }

    this.socket.emit('request_sync', {
      lastEventId: this.lastEventId,
      lastUpdate: new Date(),
    });
    
    console.log('🔄 Requesting sync...');
  }

  /**
   * Handle sync data
   * @param {Object} data - Sync data
   */
  handleSyncData(data) {
    console.log('📥 Received sync data:', data);
    
    // Process missed sales
    if (data.sales && data.sales.length > 0) {
      data.sales.forEach(sale => {
        this.emit('sale_update', { data: sale, timestamp: sale.createdAt });
      });
    }

    // Process missed inventory updates
    if (data.inventoryUpdates && data.inventoryUpdates.length > 0) {
      data.inventoryUpdates.forEach(update => {
        this.emit('inventory_update', { data: update, timestamp: update.updatedAt });
      });
    }

    // Process missed notifications
    if (data.notifications && data.notifications.length > 0) {
      data.notifications.forEach(notification => {
        this.emit('notification', { data: notification, timestamp: notification.createdAt });
      });
    }
  }

  /**
   * Send heartbeat ping
   */
  ping() {
    if (this.socket && this.connected) {
      this.socket.emit('ping');
    }
  }

  /**
   * Join a room
   * @param {string} roomId - Room ID
   */
  joinRoom(roomId) {
    if (this.socket && this.connected) {
      this.socket.emit('join_room', roomId);
    }
  }

  /**
   * Leave a room
   * @param {string} roomId - Room ID
   */
  leaveRoom(roomId) {
    if (this.socket && this.connected) {
      this.socket.emit('leave_room', roomId);
    }
  }

  /**
   * Subscribe to event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event).add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.reconnecting = false;
      this.listeners.clear();
      this.eventQueue = [];
      console.log('🔌 WebSocket disconnected');
    }
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Check if reconnecting
   * @returns {boolean}
   */
  isReconnecting() {
    return this.reconnecting;
  }

  /**
   * Get connection status
   * @returns {Object}
   */
  getStatus() {
    return {
      connected: this.connected,
      reconnecting: this.reconnecting,
      socketId: this.socket?.id,
    };
  }
}

// Export singleton instance
const websocketClient = new WebSocketClient();
export default websocketClient;
