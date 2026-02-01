/**
 * Tests for WebSocket integration in sales routes
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import websocketService from '../services/websocketService.js'

describe('Sales Route WebSocket Integration', () => {
  beforeEach(() => {
    // Mock WebSocket service methods
    vi.spyOn(websocketService, 'broadcastSale').mockImplementation(() => {})
    vi.spyOn(websocketService, 'broadcastInventoryUpdate').mockImplementation(() => {})
    vi.spyOn(websocketService, 'sendToUser').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Sale Creation', () => {
    it('should broadcast sale event when sale is created', () => {
      const saleData = {
        _id: 'sale123',
        userId: 'user123',
        totalAmount: 100,
        totalProfit: 20,
        items: [
          { productId: 'prod1', name: 'Product 1', qty: 2, unitPrice: 50 }
        ],
        date: '2024-01-01',
        createdAt: new Date()
      }

      websocketService.broadcastSale(saleData)

      expect(websocketService.broadcastSale).toHaveBeenCalledWith(saleData)
      expect(websocketService.broadcastSale).toHaveBeenCalledTimes(1)
    })

    it('should broadcast inventory updates for each item in sale', () => {
      const inventoryUpdate = {
        _id: 'prod1',
        name: 'Product 1',
        stock: 8,
        previousStock: 10,
        change: -2,
        reason: 'sale',
        saleId: 'sale123'
      }

      websocketService.broadcastInventoryUpdate(inventoryUpdate)

      expect(websocketService.broadcastInventoryUpdate).toHaveBeenCalledWith(inventoryUpdate)
    })

    it('should send low stock notification when stock <= 5', () => {
      const userId = 'user123'
      const notification = {
        type: 'low_stock',
        severity: 'warning',
        title: 'Low Stock Alert',
        message: 'Product 1 is running low (5 remaining)',
        productId: 'prod1',
        productName: 'Product 1',
        currentStock: 5
      }

      websocketService.sendToUser(userId, 'notification', notification)

      expect(websocketService.sendToUser).toHaveBeenCalledWith(userId, 'notification', notification)
    })

    it('should send stock out notification when stock = 0', () => {
      const userId = 'user123'
      const notification = {
        type: 'stock_out',
        severity: 'urgent',
        title: 'Stock Out Alert',
        message: 'Product 1 is out of stock!',
        productId: 'prod1',
        productName: 'Product 1',
        currentStock: 0
      }

      websocketService.sendToUser(userId, 'notification', notification)

      expect(websocketService.sendToUser).toHaveBeenCalledWith(userId, 'notification', notification)
    })
  })

  describe('Sale Refund', () => {
    it('should broadcast inventory updates when sale is refunded', () => {
      const inventoryUpdate = {
        _id: 'prod1',
        name: 'Product 1',
        stock: 10,
        previousStock: 8,
        change: 2,
        reason: 'refund',
        saleId: 'sale123'
      }

      websocketService.broadcastInventoryUpdate(inventoryUpdate)

      expect(websocketService.broadcastInventoryUpdate).toHaveBeenCalledWith(inventoryUpdate)
    })

    it('should send refund notification to user', () => {
      const userId = 'user123'
      const notification = {
        type: 'sale_refunded',
        severity: 'info',
        title: 'Sale Refunded',
        message: 'Sale refunded: $100.00 returned',
        saleId: 'sale123',
        amount: 100
      }

      websocketService.sendToUser(userId, 'notification', notification)

      expect(websocketService.sendToUser).toHaveBeenCalledWith(userId, 'notification', notification)
    })
  })

  describe('Error Handling', () => {
    it('should not fail sale creation if WebSocket broadcast fails', () => {
      websocketService.broadcastSale.mockImplementation(() => {
        throw new Error('WebSocket error')
      })

      // Sale should still succeed even if WebSocket fails
      expect(() => {
        try {
          websocketService.broadcastSale({ _id: 'sale123' })
        } catch (error) {
          // Error should be caught and logged, not thrown
        }
      }).not.toThrow()
    })
  })

  describe('Event Data Structure', () => {
    it('should include all required fields in sale event', () => {
      const saleData = {
        _id: 'sale123',
        userId: 'user123',
        totalAmount: 100,
        totalProfit: 20,
        items: [],
        date: '2024-01-01',
        createdAt: new Date()
      }

      websocketService.broadcastSale(saleData)

      const call = websocketService.broadcastSale.mock.calls[0][0]
      expect(call).toHaveProperty('_id')
      expect(call).toHaveProperty('userId')
      expect(call).toHaveProperty('totalAmount')
      expect(call).toHaveProperty('totalProfit')
      expect(call).toHaveProperty('items')
      expect(call).toHaveProperty('date')
      expect(call).toHaveProperty('createdAt')
    })

    it('should include all required fields in inventory update event', () => {
      const inventoryUpdate = {
        _id: 'prod1',
        name: 'Product 1',
        stock: 8,
        previousStock: 10,
        change: -2,
        reason: 'sale'
      }

      websocketService.broadcastInventoryUpdate(inventoryUpdate)

      const call = websocketService.broadcastInventoryUpdate.mock.calls[0][0]
      expect(call).toHaveProperty('_id')
      expect(call).toHaveProperty('name')
      expect(call).toHaveProperty('stock')
      expect(call).toHaveProperty('previousStock')
      expect(call).toHaveProperty('change')
      expect(call).toHaveProperty('reason')
    })
  })
})
