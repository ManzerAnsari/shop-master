/**
 * Tests for WebSocket React Hooks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import {
  useWebSocket,
  useSaleUpdates,
  useInventoryUpdates,
  useNotifications,
  useLiveMetrics,
  useConnectionStatus,
} from './useWebSocket'
import websocketClient from '../services/websocketClient'

// Mock the websocketClient
vi.mock('../services/websocketClient', () => ({
  default: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(() => vi.fn()), // Returns unsubscribe function
    isConnected: vi.fn(() => false),
    isReconnecting: vi.fn(() => false),
    getStatus: vi.fn(() => ({ connected: false, reconnecting: false })),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    ping: vi.fn(),
  },
}))

describe('useWebSocket Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should connect to WebSocket with token', () => {
    const token = 'test-token'
    renderHook(() => useWebSocket(token))

    expect(websocketClient.connect).toHaveBeenCalledWith(token, {})
  })

  it('should not connect without token', () => {
    renderHook(() => useWebSocket(null))

    expect(websocketClient.connect).not.toHaveBeenCalled()
  })

  it('should disconnect on unmount', () => {
    const token = 'test-token'
    const { unmount } = renderHook(() => useWebSocket(token))

    unmount()

    expect(websocketClient.disconnect).toHaveBeenCalled()
  })

  it('should subscribe to connection status events', () => {
    const token = 'test-token'
    renderHook(() => useWebSocket(token))

    expect(websocketClient.on).toHaveBeenCalledWith('connection_status', expect.any(Function))
    expect(websocketClient.on).toHaveBeenCalledWith('connection_error', expect.any(Function))
    expect(websocketClient.on).toHaveBeenCalledWith('reconnecting', expect.any(Function))
    expect(websocketClient.on).toHaveBeenCalledWith('reconnected', expect.any(Function))
  })
})

describe('useSaleUpdates Hook', () => {
  it('should subscribe to sale updates', () => {
    const callback = vi.fn()
    renderHook(() => useSaleUpdates(callback))

    expect(websocketClient.on).toHaveBeenCalledWith('sale_update', callback)
  })

  it('should unsubscribe on unmount', () => {
    const callback = vi.fn()
    const unsubscribe = vi.fn()
    websocketClient.on.mockReturnValue(unsubscribe)

    const { unmount } = renderHook(() => useSaleUpdates(callback))
    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })

  it('should not subscribe without callback', () => {
    vi.clearAllMocks()
    renderHook(() => useSaleUpdates(null))

    expect(websocketClient.on).not.toHaveBeenCalled()
  })
})

describe('useInventoryUpdates Hook', () => {
  it('should subscribe to inventory updates', () => {
    const callback = vi.fn()
    renderHook(() => useInventoryUpdates(callback))

    expect(websocketClient.on).toHaveBeenCalledWith('inventory_update', callback)
  })

  it('should unsubscribe on unmount', () => {
    const callback = vi.fn()
    const unsubscribe = vi.fn()
    websocketClient.on.mockReturnValue(unsubscribe)

    const { unmount } = renderHook(() => useInventoryUpdates(callback))
    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })
})

describe('useNotifications Hook', () => {
  it('should subscribe to notifications', () => {
    const callback = vi.fn()
    renderHook(() => useNotifications(callback))

    expect(websocketClient.on).toHaveBeenCalledWith('notification', callback)
  })

  it('should unsubscribe on unmount', () => {
    const callback = vi.fn()
    const unsubscribe = vi.fn()
    websocketClient.on.mockReturnValue(unsubscribe)

    const { unmount } = renderHook(() => useNotifications(callback))
    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })
})

describe('useLiveMetrics Hook', () => {
  it('should initialize with zero metrics', () => {
    const { result } = renderHook(() => useLiveMetrics())

    expect(result.current.todayRevenue).toBe(0)
    expect(result.current.transactionCount).toBe(0)
    expect(result.current.averageOrderValue).toBe(0)
    expect(result.current.lastUpdate).toBeNull()
  })

  it('should update metrics when sale event is received', async () => {
    let saleCallback
    websocketClient.on.mockImplementation((event, callback) => {
      if (event === 'sale_update') {
        saleCallback = callback
      }
      return vi.fn()
    })

    const { result } = renderHook(() => useLiveMetrics())

    // Simulate sale event
    act(() => {
      saleCallback({
        data: {
          totalAmount: 100,
        },
        timestamp: new Date(),
      })
    })

    await waitFor(() => {
      expect(result.current.todayRevenue).toBe(100)
      expect(result.current.transactionCount).toBe(1)
      expect(result.current.averageOrderValue).toBe(100)
    })
  })

  it('should calculate average order value correctly', async () => {
    let saleCallback
    websocketClient.on.mockImplementation((event, callback) => {
      if (event === 'sale_update') {
        saleCallback = callback
      }
      return vi.fn()
    })

    const { result } = renderHook(() => useLiveMetrics())

    // First sale: $100
    act(() => {
      saleCallback({
        data: { totalAmount: 100 },
        timestamp: new Date(),
      })
    })

    // Second sale: $200
    act(() => {
      saleCallback({
        data: { totalAmount: 200 },
        timestamp: new Date(),
      })
    })

    await waitFor(() => {
      expect(result.current.todayRevenue).toBe(300)
      expect(result.current.transactionCount).toBe(2)
      expect(result.current.averageOrderValue).toBe(150)
    })
  })

  it('should reset metrics when resetMetrics is called', async () => {
    let saleCallback
    websocketClient.on.mockImplementation((event, callback) => {
      if (event === 'sale_update') {
        saleCallback = callback
      }
      return vi.fn()
    })

    const { result } = renderHook(() => useLiveMetrics())

    // Add a sale
    act(() => {
      saleCallback({
        data: { totalAmount: 100 },
        timestamp: new Date(),
      })
    })

    // Reset metrics
    act(() => {
      result.current.resetMetrics()
    })

    await waitFor(() => {
      expect(result.current.todayRevenue).toBe(0)
      expect(result.current.transactionCount).toBe(0)
      expect(result.current.averageOrderValue).toBe(0)
    })
  })
})

describe('useConnectionStatus Hook', () => {
  it('should return initial disconnected status', () => {
    const { result } = renderHook(() => useConnectionStatus())

    expect(result.current.connected).toBe(false)
    expect(result.current.statusText).toBe('Disconnected')
    expect(result.current.statusColor).toBe('gray')
  })

  it('should update status when connected', async () => {
    let statusCallback
    websocketClient.on.mockImplementation((event, callback) => {
      if (event === 'connection_status') {
        statusCallback = callback
      }
      return vi.fn()
    })

    websocketClient.getStatus.mockReturnValue({
      connected: true,
      reconnecting: false,
    })

    const { result } = renderHook(() => useConnectionStatus())

    act(() => {
      statusCallback()
    })

    await waitFor(() => {
      expect(result.current.statusText).toBe('Connected')
      expect(result.current.statusColor).toBe('green')
    })
  })

  it('should show reconnecting status', async () => {
    let reconnectingCallback
    websocketClient.on.mockImplementation((event, callback) => {
      if (event === 'reconnecting') {
        reconnectingCallback = callback
      }
      return vi.fn()
    })

    websocketClient.getStatus.mockReturnValue({
      connected: false,
      reconnecting: true,
    })

    const { result } = renderHook(() => useConnectionStatus())

    act(() => {
      reconnectingCallback()
    })

    await waitFor(() => {
      expect(result.current.statusText).toBe('Reconnecting...')
      expect(result.current.statusColor).toBe('yellow')
    })
  })
})

describe('Property-Based Tests', () => {
  describe('Revenue Accumulation Correctness', () => {
    it('should accumulate revenue correctly for any sequence of sales', async () => {
      let saleCallback
      websocketClient.on.mockImplementation((event, callback) => {
        if (event === 'sale_update') {
          saleCallback = callback
        }
        return vi.fn()
      })

      const { result } = renderHook(() => useLiveMetrics())

      // Generate random sales
      const sales = Array.from({ length: 100 }, () => ({
        totalAmount: Math.random() * 1000,
      }))

      const expectedTotal = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)

      // Process all sales
      for (const sale of sales) {
        act(() => {
          saleCallback({
            data: sale,
            timestamp: new Date(),
          })
        })
      }

      await waitFor(() => {
        expect(result.current.todayRevenue).toBeCloseTo(expectedTotal, 2)
        expect(result.current.transactionCount).toBe(100)
      })
    })
  })

  describe('Average Order Value Consistency', () => {
    it('should maintain correct average for any sequence of sales', async () => {
      let saleCallback
      websocketClient.on.mockImplementation((event, callback) => {
        if (event === 'sale_update') {
          saleCallback = callback
        }
        return vi.fn()
      })

      const { result } = renderHook(() => useLiveMetrics())

      // Generate random sales
      const sales = Array.from({ length: 50 }, () => ({
        totalAmount: Math.floor(Math.random() * 500) + 1,
      }))

      const expectedTotal = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
      const expectedAverage = expectedTotal / sales.length

      // Process all sales
      for (const sale of sales) {
        act(() => {
          saleCallback({
            data: sale,
            timestamp: new Date(),
          })
        })
      }

      await waitFor(() => {
        expect(result.current.averageOrderValue).toBeCloseTo(expectedAverage, 2)
      })
    })
  })
})
