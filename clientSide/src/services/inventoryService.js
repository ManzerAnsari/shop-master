/**
 * Inventory Service
 * Handles inventory-specific operations and analytics
 */

import api from "../lib/axios";

export const inventoryService = {
  /**
   * Get all products with inventory data
   * @returns {Promise<Array>} List of products with inventory info
   */
  getAll: async () => {
    const response = await api.get("/products");
    return response.data;
  },

  /**
   * Get single product inventory
   * @param {string} id - Product ID
   * @returns {Promise<Object>} Product with inventory data
   */
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  /**
   * Update product stock
   * @param {string} id - Product ID
   * @param {number} stock - New stock quantity
   * @returns {Promise<Object>} Updated product
   */
  updateStock: async (id, stock) => {
    const response = await api.put(`/products/${id}`, { stock });
    return response.data;
  },

  /**
   * Adjust stock (increment/decrement)
   * @param {string} id - Product ID
   * @param {number} adjustment - Amount to adjust (positive or negative)
   * @returns {Promise<Object>} Updated product
   */
  adjustStock: async (id, adjustment) => {
    // Get current product
    const product = await inventoryService.getById(id);
    const newStock = Math.max(0, product.stock + adjustment);

    // Update with new stock
    return inventoryService.updateStock(id, newStock);
  },

  /**
   * Get low stock products
   * @param {number} threshold - Stock threshold (default: 10)
   * @returns {Promise<Array>} Products with stock below threshold
   */
  getLowStock: async (threshold = 10) => {
    const data = await inventoryService.getAll({ limit: 1000 });
    const products = data.products || data;
    const productsArray = Array.isArray(products) ? products : [];
    return productsArray.filter(
      (product) => product.stock <= threshold && product.stock > 0
    );
  },

  /**
   * Get out of stock products
   * @returns {Promise<Array>} Products with zero stock
   */
  getOutOfStock: async () => {
    const data = await inventoryService.getAll({ limit: 1000 });
    const products = data.products || data;
    const productsArray = Array.isArray(products) ? products : [];
    return productsArray.filter((product) => product.stock === 0);
  },

  /**
   * Get inventory summary statistics
   * @returns {Promise<Object>} Inventory statistics
   */
  getSummary: async () => {
    const products = await inventoryService.getAll();

    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + p.stock * p.price, 0);
    const lowStockCount = products.filter(
      (p) => p.stock <= 10 && p.stock > 0
    ).length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;
    const totalItems = products.reduce((sum, p) => sum + p.stock, 0);

    return {
      totalProducts,
      totalValue,
      totalItems,
      lowStockCount,
      outOfStockCount,
      averageStockPerProduct:
        totalProducts > 0 ? totalItems / totalProducts : 0,
    };
  },

  /**
   * Get inventory value by category
   * @returns {Promise<Object>} Value breakdown by category
   */
  getValueByCategory: async () => {
    const products = await inventoryService.getAll();

    const categoryValues = {};
    products.forEach((product) => {
      const category = product.category || "Uncategorized";
      const value = product.stock * product.price;

      if (!categoryValues[category]) {
        categoryValues[category] = {
          category,
          value: 0,
          count: 0,
          items: 0,
        };
      }

      categoryValues[category].value += value;
      categoryValues[category].count += 1;
      categoryValues[category].items += product.stock;
    });

    return Object.values(categoryValues);
  },

  /**
   * Get products needing reorder
   * @param {number} reorderPoint - Reorder threshold
   * @returns {Promise<Array>} Products below reorder point
   */
  getNeedingReorder: async (reorderPoint = 15) => {
    const products = await inventoryService.getAll();
    return products.filter((product) => product.stock <= reorderPoint);
  },

  /**
   * Bulk update stock for multiple products
   * @param {Array<{id: string, stock: number}>} updates - Array of stock updates
   * @returns {Promise<Array>} Updated products
   */
  bulkUpdateStock: async (updates) => {
    const promises = updates.map(({ id, stock }) =>
      inventoryService.updateStock(id, stock)
    );
    return Promise.all(promises);
  },

  /**
   * Get inventory turnover data
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @returns {Promise<Array>} Products with turnover metrics
   */
  getTurnoverData: async (startDate, endDate) => {
    // This would require sales data integration
    // For now, return products with current stock
    const products = await inventoryService.getAll();

    return products.map((product) => ({
      ...product,
      turnoverRate: 0, // Would calculate from sales data
      daysOfStock: 0, // Would calculate from sales velocity
    }));
  },

  /**
   * Search inventory by name or SKU
   * @param {string} query - Search query
   * @returns {Promise<Array>} Matching products
   */
  search: async (query) => {
    const products = await inventoryService.getAll();
    const lowerQuery = query.toLowerCase();

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(lowerQuery) ||
        (product.sku && product.sku.toLowerCase().includes(lowerQuery))
    );
  },

  /**
   * Get inventory alerts
   * @returns {Promise<Object>} Inventory alerts and warnings
   */
  getAlerts: async () => {
    const products = await inventoryService.getAll();

    const alerts = {
      critical: [], // Out of stock
      warning: [], // Low stock
      info: [], // Approaching reorder point
    };

    products.forEach((product) => {
      if (product.stock === 0) {
        alerts.critical.push({
          type: "out_of_stock",
          product,
          message: `${product.name} is out of stock`,
          severity: "critical",
        });
      } else if (product.stock <= 5) {
        alerts.warning.push({
          type: "low_stock",
          product,
          message: `${product.name} has only ${product.stock} items left`,
          severity: "warning",
        });
      } else if (product.stock <= 15) {
        alerts.info.push({
          type: "approaching_reorder",
          product,
          message: `${product.name} is approaching reorder point`,
          severity: "info",
        });
      }
    });

    return alerts;
  },

  /**
   * Get inventory history (would require backend support)
   * @param {string} productId - Product ID
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Array>} Inventory change history
   */
  getHistory: async (productId, startDate, endDate) => {
    // This would require a dedicated inventory history endpoint
    // For now, return empty array
    return [];
  },

  /**
   * Export inventory data
   * @param {string} format - Export format ('csv' or 'json')
   * @returns {Promise<Blob>} Exported data
   */
  export: async (format = "csv") => {
    const products = await inventoryService.getAll();

    if (format === "json") {
      const blob = new Blob([JSON.stringify(products, null, 2)], {
        type: "application/json",
      });
      return blob;
    }

    // CSV format
    const headers = [
      "ID",
      "Name",
      "SKU",
      "Category",
      "Stock",
      "Price",
      "Value",
    ];
    const rows = products.map((p) => [
      p._id,
      p.name,
      p.sku || "",
      p.category || "",
      p.stock,
      p.price,
      p.stock * p.price,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n"
    );

    const blob = new Blob([csv], { type: "text/csv" });
    return blob;
  },

  /**
   * Download inventory export
   * @param {string} format - Export format
   * @param {string} filename - File name
   */
  downloadExport: async (format = "csv", filename = "inventory") => {
    const blob = await inventoryService.export(format);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};

export default inventoryService;
