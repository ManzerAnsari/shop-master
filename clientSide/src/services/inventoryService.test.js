/**
 * Tests for Inventory Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import inventoryService from './inventoryService'
import api from '../lib/axios'

// Mock axios
vi.mock('../lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Inventory Service', () => {
  const mockProducts = [
    {
      _id: '1',
      name: 'Product 1',
      sku: 'SKU001',
      category: 'Electronics',
      stock: 50,
      price: 100,
    },
    {
      _id: '2',
      name: 'Product 2',
      sku: 'SKU002',
      category: 'Electronics',
      stock: 5,
      price: 200,
    },
    {
      _id: '3',
      name: 'Product 3',
      sku: 'SKU003',
      category: 'Clothing',
      stock: 0,
      price: 50,
    },
    {
      _id: '4',
      name: 'Product 4',
      sku: 'SKU004',
      category: 'Clothing',
      stock: 20,
      price: 75,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should fetch all products', async () => {
      api.get.mockResolvedValue({ data: mockProducts })

      const result = await inventoryService.getAll()

      expect(api.get).toHaveBeenCalledWith('/products')
      expect(result).toEqual(mockProducts)
    })
  })

  describe('getById', () => {
    it('should fetch single product by id', async () => {
      api.get.mockResolvedValue({ data: mockProducts[0] })

      const result = await inventoryService.getById('1')

      expect(api.get).toHaveBeenCalledWith('/products/1')
      expect(result).toEqual(mockProducts[0])
    })
  })

  describe('updateStock', () => {
    it('should update product stock', async () => {
      const updatedProduct = { ...mockProducts[0], stock: 60 }
      api.put.mockResolvedValue({ data: updatedProduct })

      const result = await inventoryService.updateStock('1', 60)

      expect(api.put).toHaveBeenCalledWith('/products/1', { stock: 60 })
      expect(result.stock).toBe(60)
    })
  })

  describe('adjustStock', () => {
    it('should increment stock', async () => {
      api.get.mockResolvedValue({ data: mockProducts[0] })
      api.put.mockResolvedValue({ data: { ...mockProducts[0], stock: 55 } })

      const result = await inventoryService.adjustStock('1', 5)

      expect(result.stock).toBe(55)
    })

    it('should decrement stock', async () => {
      api.get.mockResolvedValue({ data: mockProducts[0] })
      api.put.mockResolvedValue({ data: { ...mockProducts[0], stock: 45 } })

      const result = await inventoryService.adjustStock('1', -5)

      expect(result.stock).toBe(45)
    })

    it('should not allow negative stock', async () => {
      api.get.mockResolvedValue({ data: { ...mockProducts[0], stock: 5 } })
      api.put.mockResolvedValue({ data: { ...mockProducts[0], stock: 0 } })

      const result = await inventoryService.adjustStock('1', -10)

      expect(api.put).toHaveBeenCalledWith('/products/1', { stock: 0 })
    })
  })

  describe('getLowStock', () => {
    it('should return products with stock below threshold', async () => {
      api.get.mockResolvedValue({ data: mockProducts })

      const result = await inventoryService.getLowStock(10)

      expect(result).toHaveLength(1)
      expect(result[0]._id).toBe('2')
      expect(result[0].stock).toBe(5)
    })

    it('should use default threshold of 10', async () => {
      api.get.mockResolvedValue({ data: mockProducts })

      const result = await inventoryService.getLowStock()

      expect(result).toHaveLength(1)
    })

    it('should not include out of stock products', async () => {
      api.get.mockResolvedValue({ data: mockProducts })

      const result = await inventoryService.getLowStock(10)

      expect(result.every(p => p.stock > 0)).toBe(true)
    })
  })

  describe('getOutOfStock', () => {
    it('should return products with zero stock', async () => {
      api.get.mockResolvedValue({ data: mockProducts })

      const result = await inventoryService.getOutOfStock()

      expect(result).toHaveLength(1)
      expect(result[0]._id).toBe('3')
      expect(result[0].stock).toBe(0)
    })
  })

  describe('getSummary', () => {
    it('should calculate inventory statistics', async () => {
      api.get.mockResolvedValue({ data: mockProducts })

      const result = await inventoryService.getSummary()

      expect(result.totalProducts).toBe(4)
      expect(result.totalItems).toBe(75) // 50 + 5 + 0 + 20
      expect(result.totalValue).toBe(7500) // (50*100) + (5*200) + (0*50) + (20*75)
      expect(result.lowStockCount).toBe(1)
      expect(result.outOfStockCount).toBe(1)
      expect(result.averageStockPerProduct).toBe(18.75)
    })

    it('should handle empty inventory', async () => {
      api.get.mockResolvedValue({ data: [] })

      const result = await inventoryService.getSummary()

      expect(result.totalProducts).toBe(0)
      expect(result.averageStockPerProduct).toBe(0)
    })
  })

  describe('getValueByCategory', () => {
    it('should calculate value breakdown by category', async () => {
      api.get.mockResolvedValue({ data: mockProducts })

      const result = await inventoryService.getValueByCategory()

      expect(result).toHaveLength(2)
      
      const electronics = result.find(c => c.category === 'Electronics')
      expect(electronics.value).toBe(6000) // (50*100) + (5*200)
      expect(electronics.count).toBe(2)
      expect(electronics.items).toBe(55)

      const clothing = result.find(c => c.category === 'Clothing')
      expect(clothing.value).toBe(1500) // (0*50) + (20*75)
      expect(clothing.count).toBe(2)
      expect(clothing.items).toBe(20)
    })
  })

  describe('getNeedingReorder', () => {
    it('should return products below reorder point', async () => {
      api.get.mockResolvedValue({ data: mockProducts })

      const result = await inventoryService.getNeedingReorder(15)

      expect(result).toHaveLength(2) // Products with stock <= 15
      expect(result.map(p => p._id)).toContain('2')
      expect(result.map(p => p._id)).toContain('3')
    })
  })

  describe('bulkUpdateStock', () => {
    it('should update stock for multiple products', async () => {
      api.put.mockResolvedValue({ data: {} })

      const updates = [
        { id: '1', stock: 60 },
        { id: '2', stock: 10 },
      ]

      await inventoryService.bulkUpdateStock(updates)

      expect(api.put).toHaveBeenCalledTimes(2)
      expect(api.put).toHaveBeenCalledWith('/products/1', { stock: 60 })
      expect(api.put).toHaveBeenCalledWith('/products/2', { stock: 10 })
    })
  })

  describe('search', () => {
    it('should search by product name', async () => {
      api.get.mockResolvedValue({ data: mockProducts })

      const result = await inventoryService.search('Product 1')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Product 1')
    })

    it('should search by SKU', async () => {
      api.get.mockResolvedValue({ data: mockProducts })

      const result = await inventoryService.search('SKU002')

      expect(result).toHaveLength(1)
      expect(result[0].sku).toBe('SKU002')
    })

    it('should be case insensitive', async () => {
      api.get.mockResolvedValue({ data: mockProducts })

      const result = await inventoryService.search('product 1')

      expect(result).toHaveLength(1)
    })

    it('should return partial matches', async () => {
      api.get.mockResolvedValue({ data: mockProducts })

      const result = await inventoryService.search('Product')

      expect(result).toHaveLength(4)
    })
  })

  describe('getAlerts', () => {
    it('should categorize inventory alerts', async () => {
      api.get.mockResolvedValue({ data: mockProducts })

      const result = await inventoryService.getAlerts()

      expect(result.critical).toHaveLength(1) // Out of stock
      expect(result.critical[0].type).toBe('out_of_stock')
      expect(result.critical[0].severity).toBe('critical')

      expect(result.warning).toHaveLength(1) // Low stock (<=5)
      expect(result.warning[0].type).toBe('low_stock')
      expect(result.warning[0].severity).toBe('warning')

      expect(result.info).toHaveLength(0) // No products between 6-15
    })

    it('should include product details in alerts', async () => {
      api.get.mockResolvedValue({ data: mockProducts })

      const result = await inventoryService.getAlerts()

      expect(result.critical[0].product).toBeDefined()
      expect(result.critical[0].message).toContain('Product 3')
    })
  })

  describe('export', () => {
    it('should export as JSON', async () => {
      api.get.mockResolvedValue({ data: mockProducts })

      const blob = await inventoryService.export('json')

      expect(blob.type).toBe('application/json')
    })

    it('should export as CSV', async () => {
      api.get.mockResolvedValue({ data: mockProducts })

      const blob = await inventoryService.export('csv')

      expect(blob.type).toBe('text/csv')
    })

    it('should default to CSV format', async () => {
      api.get.mockResolvedValue({ data: mockProducts })

      const blob = await inventoryService.export()

      expect(blob.type).toBe('text/csv')
    })
  })

  describe('Property-Based Tests', () => {
    it('should maintain non-negative stock for any adjustment', async () => {
      const initialStock = 10
      const adjustments = [-5, -3, -8, 5, -20, 10]

      for (const adjustment of adjustments) {
        api.get.mockResolvedValue({ 
          data: { ...mockProducts[0], stock: initialStock } 
        })
        
        const expectedStock = Math.max(0, initialStock + adjustment)
        api.put.mockResolvedValue({ 
          data: { ...mockProducts[0], stock: expectedStock } 
        })

        const result = await inventoryService.adjustStock('1', adjustment)

        expect(result.stock).toBeGreaterThanOrEqual(0)
      }
    })

    it('should correctly calculate total value for any product set', async () => {
      const testSets = [
        [{ stock: 10, price: 100 }],
        [{ stock: 5, price: 50 }, { stock: 3, price: 30 }],
        [{ stock: 0, price: 100 }],
        [{ stock: 100, price: 1 }, { stock: 1, price: 100 }],
      ]

      for (const products of testSets) {
        const mockData = products.map((p, i) => ({
          _id: `${i}`,
          name: `Product ${i}`,
          ...p,
        }))

        api.get.mockResolvedValue({ data: mockData })

        const result = await inventoryService.getSummary()
        const expectedValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0)

        expect(result.totalValue).toBe(expectedValue)
      }
    })

    it('should filter low stock correctly for any threshold', async () => {
      api.get.mockResolvedValue({ data: mockProducts })

      const thresholds = [0, 5, 10, 20, 50, 100]

      for (const threshold of thresholds) {
        const result = await inventoryService.getLowStock(threshold)

        // All returned products should be <= threshold and > 0
        expect(result.every(p => p.stock <= threshold && p.stock > 0)).toBe(true)

        // No products above threshold should be included
        const allProducts = mockProducts.filter(p => p.stock > 0)
        const expectedCount = allProducts.filter(p => p.stock <= threshold).length
        expect(result.length).toBe(expectedCount)
      }
    })
  })
})
