/**
 * WebSocket Service
 * Handles real-time communication using Socket.IO
 */

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

class WebSocketService {
  constructor() {
    this.io = null;
    this.connections = new Map(); // userId -> socket
    this.rooms = new Map(); // roomId -> Set of socketIds
  }

  /**
   * Initialize WebSocket server
   * @param {Object} httpServer - HTTP server instance
   * @param {Object} options - Socket.IO options
   */
  initialize(httpServer, options = {}) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      ...options,
    });

    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Connection handling
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('✅ WebSocket server initialized');
  }

  /**
   * Handle new socket connection
   * @param {Object} socket - Socket instance
   */
  handleConnection(socket) {
    const userId = socket.userId;
    
    console.log(`🔌 User connected: ${userId} (${socket.id})`);
    
    // Store connection
    this.connections.set(userId, socket);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to real-time updates',
      userId,
      timestamp: new Date(),
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${userId} (${reason})`);
      this.connections.delete(userId);
    });

    // Handle heartbeat
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    // Handle custom events
    this.setupEventHandlers(socket);
  }

  /**
   * Set up custom event handlers
   * @param {Object} socket - Socket instance
   */
  setupEventHandlers(socket) {
    // Request sync
    socket.on('request_sync', async (data) => {
      try {
        const syncData = await this.getSyncData(socket.userId, data.lastUpdate);
        socket.emit('sync_data', syncData);
      } catch (error) {
        socket.emit('sync_error', { message: error.message });
      }
    });

    // Join room
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Set());
      }
      this.rooms.get(roomId).add(socket.id);
      console.log(`📍 User ${socket.userId} joined room: ${roomId}`);
    });

    // Leave room
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      if (this.rooms.has(roomId)) {
        this.rooms.get(roomId).delete(socket.id);
      }
      console.log(`📍 User ${socket.userId} left room: ${roomId}`);
    });
  }

  /**
   * Broadcast sale event to all connected clients
   * @param {Object} saleData - Sale information
   */
  broadcastSale(saleData) {
    if (!this.io) {
      console.warn('⚠️ WebSocket not initialized');
      return;
    }

    const event = {
      type: 'sale_completed',
      data: saleData,
      timestamp: new Date(),
      eventId: `sale_${saleData._id}_${Date.now()}`,
    };

    this.io.emit('sale_update', event);
    console.log(`📢 Broadcasted sale: ${saleData._id}`);
  }

  /**
   * Broadcast inventory update
   * @param {Object} productData - Product information
   */
  broadcastInventoryUpdate(productData) {
    if (!this.io) {
      console.warn('⚠️ WebSocket not initialized');
      return;
    }

    const event = {
      type: 'inventory_updated',
      data: productData,
      timestamp: new Date(),
      eventId: `inventory_${productData._id}_${Date.now()}`,
    };

    this.io.emit('inventory_update', event);
    console.log(`📢 Broadcasted inventory update: ${productData._id}`);
  }

  /**
   * Send message to specific user
   * @param {string} userId - Target user ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  sendToUser(userId, event, data) {
    if (!this.io) {
      console.warn('⚠️ WebSocket not initialized');
      return;
    }

    this.io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date(),
    });
    
    console.log(`📨 Sent ${event} to user: ${userId}`);
  }

  /**
   * Send message to room
   * @param {string} roomId - Room ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  sendToRoom(roomId, event, data) {
    if (!this.io) {
      console.warn('⚠️ WebSocket not initialized');
      return;
    }

    this.io.to(roomId).emit(event, {
      ...data,
      timestamp: new Date(),
    });
    
    console.log(`📨 Sent ${event} to room: ${roomId}`);
  }

  /**
   * Broadcast notification
   * @param {Object} notification - Notification data
   */
  broadcastNotification(notification) {
    if (!this.io) {
      console.warn('⚠️ WebSocket not initialized');
      return;
    }

    const event = {
      type: 'notification',
      data: notification,
      timestamp: new Date(),
      eventId: `notification_${Date.now()}`,
    };

    this.io.emit('notification', event);
    console.log(`🔔 Broadcasted notification: ${notification.type}`);
  }

  /**
   * Get active connections count
   * @returns {number} Number of active connections
   */
  getActiveConnections() {
    return this.connections.size;
  }

  /**
   * Get connected user IDs
   * @returns {Array<string>} Array of user IDs
   */
  getConnectedUsers() {
    return Array.from(this.connections.keys());
  }

  /**
   * Check if user is connected
   * @param {string} userId - User ID
   * @returns {boolean}
   */
  isUserConnected(userId) {
    return this.connections.has(userId);
  }

  /**
   * Get sync data for reconnection
   * @param {string} userId - User ID
   * @param {Date} lastUpdate - Last update timestamp
   * @returns {Promise<Object>} Sync data
   */
  async getSyncData(userId, lastUpdate) {
    // This would fetch missed updates from database
    // For now, return empty sync data
    return {
      sales: [],
      inventoryUpdates: [],
      notifications: [],
      lastSync: new Date(),
    };
  }

  /**
   * Close WebSocket server
   */
  close() {
    if (this.io) {
      this.io.close();
      this.connections.clear();
      this.rooms.clear();
      console.log('🔌 WebSocket server closed');
    }
  }
}

// Export singleton instance
const websocketService = new WebSocketService();
export default websocketService;
