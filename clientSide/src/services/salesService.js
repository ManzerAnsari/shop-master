/**
 * Sales Service
 * Handles sales operations and analytics
 */

import api from "../lib/axios";

export const salesService = {
  /**
   * Get all sales
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date filter
   * @param {string} params.endDate - End date filter
   * @param {number} params.limit - Limit results
   * @returns {Promise<Array>} List of sales
   */
  getAll: async (params = {}) => {
    const response = await api.get("/sales", { params });
    return response.data;
  },

  /**
   * Get single sale by ID
   * @param {string} id - Sale ID
   * @returns {Promise<Object>} Sale details
   */
  getById: async (id) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  /**
   * Create new sale
   * @param {Object} saleData - Sale information
   * @param {Array} saleData.items - Sale items
   * @param {string} saleData.date - Sale date
   * @returns {Promise<Object>} Created sale
   */
  create: async (saleData) => {
    const response = await api.post("/sales", saleData);
    return response.data;
  },

  /**
   * Delete sale (refund)
   * @param {string} id - Sale ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  delete: async (id) => {
    const response = await api.delete(`/sales/${id}`);
    return response.data;
  },

  /**
   * Get sales summary for date range
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Object>} Sales summary
   */
  getSummary: async (startDate, endDate) => {
    const data = await salesService.getAll({
      startDate,
      endDate,
      limit: 10000,
    });
    const sales = data.sales || data;
    const salesArray = Array.isArray(sales) ? sales : [];

    const totalRevenue = salesArray.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );
    const totalProfit = salesArray.reduce(
      (sum, sale) => sum + sale.totalProfit,
      0
    );
    const totalTransactions = salesArray.length;
    const averageOrderValue =
      totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return {
      totalRevenue,
      totalProfit,
      totalTransactions,
      averageOrderValue,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    };
  },

  /**
   * Get today's sales
   * @returns {Promise<Array>} Today's sales
   */
  getToday: async () => {
    const today = new Date().toISOString().split("T")[0];
    return salesService.getAll({ startDate: today, endDate: today });
  },

  /**
   * Get sales by date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Sales in date range
   */
  getByDateRange: async (startDate, endDate) => {
    return salesService.getAll({ startDate, endDate });
  },

  /**
   * Get top selling products
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @param {number} limit - Number of products to return
   * @returns {Promise<Array>} Top selling products
   */
  getTopProducts: async (startDate, endDate, limit = 10) => {
    const data = await salesService.getAll({
      startDate,
      endDate,
      limit: 10000,
    });
    const sales = data.sales || data;
    const salesArray = Array.isArray(sales) ? sales : [];

    const productSales = {};

    salesArray.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const key = item.productId || item.name;
        if (!productSales[key]) {
          productSales[key] = {
            productId: item.productId,
            name: item.name,
            totalQuantity: 0,
            totalRevenue: 0,
            totalProfit: 0,
            transactionCount: 0,
          };
        }

        productSales[key].totalQuantity += item.qty;
        productSales[key].totalRevenue += item.qty * item.unitPrice;
        productSales[key].totalProfit += item.profit || 0;
        productSales[key].transactionCount += 1;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  },

  /**
   * Get sales by hour (for peak hours analysis)
   * @param {string} date - Date to analyze (YYYY-MM-DD)
   * @returns {Promise<Array>} Sales grouped by hour
   */
  getSalesByHour: async (date) => {
    const data = await salesService.getAll({
      startDate: date,
      endDate: date,
      limit: 10000,
    });
    const sales = data.sales || data;
    const salesArray = Array.isArray(sales) ? sales : [];

    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0,
      revenue: 0,
      profit: 0,
    }));

    salesArray.forEach((sale) => {
      const hour = new Date(sale.createdAt).getHours();
      hourlyData[hour].count += 1;
      hourlyData[hour].revenue += sale.totalAmount;
      hourlyData[hour].profit += sale.totalProfit;
    });

    return hourlyData;
  },

  /**
   * Get sales trends (daily aggregation)
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Array>} Daily sales data
   */
  getTrends: async (startDate, endDate) => {
    const data = await salesService.getAll({
      startDate,
      endDate,
      limit: 10000,
    });
    const sales = data.sales || data;
    const salesArray = Array.isArray(sales) ? sales : [];

    const dailyData = {};

    salesArray.forEach((sale) => {
      const date = sale.date || sale.createdAt.split("T")[0];

      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          count: 0,
          revenue: 0,
          profit: 0,
          items: 0,
        };
      }

      dailyData[date].count += 1;
      dailyData[date].revenue += sale.totalAmount;
      dailyData[date].profit += sale.totalProfit;
      dailyData[date].items += sale.items.reduce(
        (sum, item) => sum + item.qty,
        0
      );
    });

    return Object.values(dailyData).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  },

  /**
   * Get recent sales
   * @param {number} limit - Number of sales to return
   * @returns {Promise<Array>} Recent sales
   */
  getRecent: async (limit = 10) => {
    return salesService.getAll({ limit });
  },

  /**
   * Calculate profit margin for a sale
   * @param {Object} sale - Sale object
   * @returns {number} Profit margin percentage
   */
  calculateProfitMargin: (sale) => {
    if (!sale.totalAmount || sale.totalAmount === 0) return 0;
    return (sale.totalProfit / sale.totalAmount) * 100;
  },

  /**
   * Validate sale items before submission
   * @param {Array} items - Sale items
   * @returns {Object} Validation result
   */
  validateSaleItems: (items) => {
    if (!items || items.length === 0) {
      return {
        valid: false,
        error: "Sale must contain at least one item",
      };
    }

    for (const item of items) {
      if (!item.productId) {
        return {
          valid: false,
          error: `Product ID missing for item: ${item.name}`,
        };
      }

      if (!item.qty || item.qty <= 0) {
        return {
          valid: false,
          error: `Invalid quantity for ${item.name}`,
        };
      }

      if (!item.unitPrice || item.unitPrice < 0) {
        return {
          valid: false,
          error: `Invalid price for ${item.name}`,
        };
      }
    }

    return { valid: true };
  },

  /**
   * Format sale data for API submission
   * @param {Array} items - Sale items from cart
   * @param {string} date - Sale date
   * @returns {Object} Formatted sale data
   */
  formatSaleData: (items, date = null) => {
    return {
      items: items.map((item) => ({
        productId: item.productId,
        name: item.productName || item.name,
        qty: item.quantity || item.qty,
        unitPrice: item.unitPrice,
        purchasePrice: item.purchasePrice || 0,
      })),
      date: date || new Date().toISOString().split("T")[0],
    };
  },

  /**
   * Export sales data
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @param {string} format - Export format ('csv' or 'json')
   * @returns {Promise<Blob>} Exported data
   */
  export: async (startDate, endDate, format = "csv") => {
    const data = await salesService.getAll({
      startDate,
      endDate,
      limit: 10000,
    });
    const sales = data.sales || data;
    const salesArray = Array.isArray(sales) ? sales : [];

    if (format === "json") {
      const blob = new Blob([JSON.stringify(sales, null, 2)], {
        type: "application/json",
      });
      return blob;
    }

    // CSV format
    const headers = [
      "Date",
      "Sale ID",
      "Items",
      "Total Amount",
      "Total Profit",
      "Profit Margin",
    ];
    const rows = sales.map((sale) => [
      sale.date,
      sale._id,
      sale.items.length,
      sale.totalAmount.toFixed(2),
      sale.totalProfit.toFixed(2),
      salesService.calculateProfitMargin(sale).toFixed(2) + "%",
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n"
    );

    const blob = new Blob([csv], { type: "text/csv" });
    return blob;
  },

  /**
   * Download sales export
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @param {string} format - Export format
   * @param {string} filename - File name
   */
  downloadExport: async (
    startDate,
    endDate,
    format = "csv",
    filename = "sales"
  ) => {
    const blob = await salesService.export(startDate, endDate, format);
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

export default salesService;
