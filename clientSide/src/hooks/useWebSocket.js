/**
 * React Hook for WebSocket Connection
 * Provides easy access to real-time updates in React components
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import websocketClient from '../services/websocketClient'

/**
 * Hook for managing WebSocket connection
 * @param {string} token - Authentication token
 * @param {Object} options - Connection options
 * @returns {Object} WebSocket state and methods
 */
export function useWebSocket(token, options = {}) {
  const [connected, setConnected] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const [error, setError] = useState(null)
  const unsubscribersRef = useRef([])

  useEffect(() => {
    if (!token) return

    // Connect to WebSocket
    websocketClient.connect(token, options)

    // Subscribe to connection status
    const unsubStatus = websocketClient.on('connection_status', (data) => {
      setConnected(data.connected)
      if (!data.connected) {
        setError(data.reason)
      }
    })

    const unsubError = websocketClient.on('connection_error', (data) => {
      setError(data.error)
    })

    const unsubReconnecting = websocketClient.on('reconnecting', () => {
      setReconnecting(true)
    })

    const unsubReconnected = websocketClient.on('reconnected', () => {
      setReconnecting(false)
      setError(null)
    })

    unsubscribersRef.current.push(unsubStatus, unsubError, unsubReconnecting, unsubReconnected)

    // Cleanup on unmount
    return () => {
      unsubscribersRef.current.forEach(unsub => unsub())
      websocketClient.disconnect()
    }
  }, [token, options])

  return {
    connected,
    reconnecting,
    error,
    isConnected: websocketClient.isConnected(),
    isReconnecting: websocketClient.isReconnecting(),
  }
}

/**
 * Hook for subscribing to sale updates
 * @param {Function} callback - Called when sale update is received
 * @returns {Function} Unsubscribe function
 */
export function useSaleUpdates(callback) {
  useEffect(() => {
    if (!callback) return

    const unsubscribe = websocketClient.on('sale_update', callback)

    return () => {
      unsubscribe()
    }
  }, [callback])
}

/**
 * Hook for subscribing to inventory updates
 * @param {Function} callback - Called when inventory update is received
 * @returns {Function} Unsubscribe function
 */
export function useInventoryUpdates(callback) {
  useEffect(() => {
    if (!callback) return

    const unsubscribe = websocketClient.on('inventory_update', callback)

    return () => {
      unsubscribe()
    }
  }, [callback])
}

/**
 * Hook for subscribing to notifications
 * @param {Function} callback - Called when notification is received
 * @returns {Function} Unsubscribe function
 */
export function useNotifications(callback) {
  useEffect(() => {
    if (!callback) return

    const unsubscribe = websocketClient.on('notification', callback)

    return () => {
      unsubscribe()
    }
  }, [callback])
}

/**
 * Hook for managing WebSocket rooms
 * @param {string} roomId - Room to join
 * @returns {Object} Room management methods
 */
export function useWebSocketRoom(roomId) {
  useEffect(() => {
    if (!roomId) return

    websocketClient.joinRoom(roomId)

    return () => {
      websocketClient.leaveRoom(roomId)
    }
  }, [roomId])

  return {
    joinRoom: useCallback((id) => websocketClient.joinRoom(id), []),
    leaveRoom: useCallback((id) => websocketClient.leaveRoom(id), []),
  }
}

/**
 * Hook for real-time metrics
 * Aggregates sale updates into live metrics
 * @returns {Object} Live metrics state
 */
export function useLiveMetrics() {
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    transactionCount: 0,
    averageOrderValue: 0,
    lastUpdate: null,
  })

  const handleSaleUpdate = useCallback((event) => {
    const sale = event.data
    
    setMetrics(prev => {
      const newTransactionCount = prev.transactionCount + 1
      const newRevenue = prev.todayRevenue + sale.totalAmount
      const newAverage = newRevenue / newTransactionCount

      return {
        todayRevenue: newRevenue,
        transactionCount: newTransactionCount,
        averageOrderValue: newAverage,
        lastUpdate: new Date(event.timestamp),
      }
    })
  }, [])

  useSaleUpdates(handleSaleUpdate)

  const resetMetrics = useCallback(() => {
    setMetrics({
      todayRevenue: 0,
      transactionCount: 0,
      averageOrderValue: 0,
      lastUpdate: null,
    })
  }, [])

  return {
    ...metrics,
    resetMetrics,
  }
}

/**
 * Hook for tracking active connections
 * @returns {number} Number of active users
 */
export function useActiveUsers() {
  const [activeUsers, setActiveUsers] = useState(0)

  useEffect(() => {
    const unsubscribe = websocketClient.on('active_users_update', (data) => {
      setActiveUsers(data.count)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return activeUsers
}

/**
 * Hook for connection status indicator
 * @returns {Object} Connection status with visual indicators
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState({
    connected: false,
    reconnecting: false,
    error: null,
    statusText: 'Disconnected',
    statusColor: 'gray',
  })

  useEffect(() => {
    const updateStatus = () => {
      const wsStatus = websocketClient.getStatus()
      
      let statusText = 'Disconnected'
      let statusColor = 'gray'

      if (wsStatus.connected) {
        statusText = 'Connected'
        statusColor = 'green'
      } else if (wsStatus.reconnecting) {
        statusText = 'Reconnecting...'
        statusColor = 'yellow'
      }

      setStatus({
        ...wsStatus,
        statusText,
        statusColor,
      })
    }

    const unsubStatus = websocketClient.on('connection_status', updateStatus)
    const unsubReconnecting = websocketClient.on('reconnecting', updateStatus)
    const unsubReconnected = websocketClient.on('reconnected', updateStatus)

    // Initial status
    updateStatus()

    return () => {
      unsubStatus()
      unsubReconnecting()
      unsubReconnected()
    }
  }, [])

  return status
}

/**
 * Hook for heartbeat monitoring
 * Sends periodic pings to keep connection alive
 * @param {number} interval - Ping interval in milliseconds (default: 30000)
 */
export function useHeartbeat(interval = 30000) {
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      websocketClient.ping()
    }, interval)

    return () => {
      clearInterval(heartbeatInterval)
    }
  }, [interval])
}

export default useWebSocket
