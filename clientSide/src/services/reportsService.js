/**
 * Reports Service
 * Handles analytics and reporting using sales and inventory data
 */

import salesService from "./salesService";
import inventoryService from "./inventoryService";

export const reportsService = {
  /**
   * Get dashboard analytics for date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} Analytics data
   */
  getDashboardAnalytics: async (startDate, endDate) => {
    const [salesData, summary, topProducts] = await Promise.all([
      salesService.getAll({ startDate, endDate, limit: 10000 }),
      salesService.getSummary(startDate, endDate),
      salesService.getTopProducts(startDate, endDate, 6),
    ]);

    const sales = salesData.sales || salesData;
    const salesArray = Array.isArray(sales) ? sales : [];

    return {
      summary,
      sales: salesArray,
      topProducts,
    };
  },

  /**
   * Get sales over time data for charts
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Array>} Daily sales data
   */
  getSalesOverTime: async (startDate, endDate) => {
    return salesService.getTrends(startDate, endDate);
  },

  /**
   * Get profit trends
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Array>} Profit data by period
   */
  getProfitTrends: async (startDate, endDate) => {
    const trends = await salesService.getTrends(startDate, endDate);
    return trends.map((day) => ({
      date: day.date,
      profit: day.profit,
      revenue: day.revenue,
    }));
  },

  /**
   * Get top products for pie chart
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @param {number} limit - Number of products
   * @returns {Promise<Array>} Top products with percentages
   */
  getTopProductsChart: async (startDate, endDate, limit = 6) => {
    const topProducts = await salesService.getTopProducts(
      startDate,
      endDate,
      limit
    );
    const totalRevenue = topProducts.reduce(
      (sum, p) => sum + p.totalRevenue,
      0
    );

    return topProducts.map((product) => ({
      name: product.name,
      value: product.totalRevenue,
      percentage:
        totalRevenue > 0
          ? ((product.totalRevenue / totalRevenue) * 100).toFixed(1)
          : 0,
    }));
  },

  /**
   * Get business insights
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Array>} Insights array
   */
  getInsights: async (startDate, endDate) => {
    const [topProducts, lowStock, summary] = await Promise.all([
      salesService.getTopProducts(startDate, endDate, 1),
      inventoryService.getLowStock(10),
      salesService.getSummary(startDate, endDate),
    ]);

    const insights = [];

    // Top product insight
    if (topProducts.length > 0) {
      insights.push({
        id: 1,
        type: "trend",
        icon: "material-symbols:trending-up",
        color: "#52c41a",
        title: `${topProducts[0].name} Leading Sales`,
        description: `Generated $${topProducts[0].totalRevenue.toFixed(
          2
        )} in revenue with ${topProducts[0].totalQuantity} units sold.`,
        impact: "high",
      });
    }

    // Low stock insight
    if (lowStock.length > 0) {
      insights.push({
        id: 2,
        type: "inventory",
        icon: "material-symbols:inventory",
        color: "#ff4d4f",
        title: "Low Stock Alert",
        description: `${lowStock.length} products running low on stock. Reorder recommended.`,
        impact: "high",
      });
    }

    // Profit margin insight
    if (summary.profitMargin > 0) {
      insights.push({
        id: 3,
        type: "profit",
        icon: "material-symbols:payments",
        color: "#3E5879",
        title: "Profit Margin",
        description: `Current profit margin is ${summary.profitMargin.toFixed(
          1
        )}% for the selected period.`,
        impact: summary.profitMargin >= 30 ? "high" : "medium",
      });
    }

    // Transaction volume insight
    if (summary.totalTransactions > 0) {
      insights.push({
        id: 4,
        type: "sales",
        icon: "material-symbols:receipt",
        color: "#faad14",
        title: "Transaction Volume",
        description: `${
          summary.totalTransactions
        } transactions completed with average order value of $${summary.averageOrderValue.toFixed(
          2
        )}.`,
        impact: "medium",
      });
    }

    return insights;
  },

  /**
   * Get key metrics summary
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Object>} Key metrics
   */
  getKeyMetrics: async (startDate, endDate) => {
    return salesService.getSummary(startDate, endDate);
  },

  /**
   * Export report data
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @param {string} format - 'pdf' or 'excel'
   * @returns {Promise<Blob>} Report file
   */
  exportReport: async (startDate, endDate, format = "excel") => {
    if (format === "excel" || format === "csv") {
      return salesService.export(startDate, endDate, "csv");
    }

    // For PDF, we'd need a PDF generation library
    // For now, return CSV
    return salesService.export(startDate, endDate, "csv");
  },

  /**
   * Download report
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @param {string} format - 'pdf' or 'excel'
   */
  downloadReport: async (startDate, endDate, format = "excel") => {
    const filename = `report_${startDate}_to_${endDate}`;
    const fileFormat = format === "pdf" ? "pdf" : "csv";

    await salesService.downloadExport(startDate, endDate, fileFormat, filename);
  },

  /**
   * Get full report data efficiently (deduplicated calls)
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Object>} All report data
   */
  getFullReport: async (startDate, endDate) => {
    const [trends, topProducts, summary, lowStock] = await Promise.all([
      salesService.getTrends(startDate, endDate),
      salesService.getTopProducts(startDate, endDate, 6),
      salesService.getSummary(startDate, endDate),
      inventoryService.getLowStock(10),
    ]);

    // Generate insights locally
    const insights = [];

    // Top product insight
    if (topProducts.length > 0) {
      insights.push({
        id: 1,
        type: "trend",
        icon: "material-symbols:trending-up",
        color: "#52c41a",
        title: `${topProducts[0].name} Leading Sales`,
        description: `Generated $${topProducts[0].totalRevenue.toFixed(
          2
        )} in revenue with ${topProducts[0].totalQuantity} units sold.`,
        impact: "high",
      });
    }

    // Low stock insight
    if (lowStock.length > 0) {
      insights.push({
        id: 2,
        type: "inventory",
        icon: "material-symbols:inventory",
        color: "#ff4d4f",
        title: "Low Stock Alert",
        description: `${lowStock.length} products running low on stock. Reorder recommended.`,
        impact: "high",
      });
    }

    // Profit margin insight
    if (summary.profitMargin > 0) {
      insights.push({
        id: 3,
        type: "profit",
        icon: "material-symbols:payments",
        color: "#3E5879",
        title: "Profit Margin",
        description: `Current profit margin is ${summary.profitMargin.toFixed(
          1
        )}% for the selected period.`,
        impact: summary.profitMargin >= 30 ? "high" : "medium",
      });
    }

    // Transaction volume insight
    if (summary.totalTransactions > 0) {
      insights.push({
        id: 4,
        type: "sales",
        icon: "material-symbols:receipt",
        color: "#faad14",
        title: "Transaction Volume",
        description: `${
          summary.totalTransactions
        } transactions completed with average order value of $${summary.averageOrderValue.toFixed(
          2
        )}.`,
        impact: "medium",
      });
    }

    return {
      trends,
      topProducts,
      summary,
      insights,
    };
  },

  /**
   * Get date range presets
   * @param {string} preset - 'today', 'weekly', 'monthly'
   * @returns {Object} Start and end dates
   */
  getDateRange: (preset) => {
    const today = new Date();
    const endDate = today.toISOString().split("T")[0];
    let startDate;

    switch (preset) {
      case "today":
        startDate = endDate;
        break;
      case "weekly":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split("T")[0];
        break;
      case "monthly":
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split("T")[0];
        break;
      case "yearly":
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        startDate = yearAgo.toISOString().split("T")[0];
        break;
      default:
        startDate = endDate;
    }

    return { startDate, endDate };
  },
};

export default reportsService;
