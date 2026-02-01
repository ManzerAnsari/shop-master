import Sale from "../models/Sale.js";
import Product from "../models/Product.js";

export const getReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, range } = req.query;

    // Calculate date range
    let start = new Date();
    let end = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (range) {
        case "today":
          start.setHours(0, 0, 0, 0);
          break;
        case "weekly":
          start.setDate(start.getDate() - 7);
          break;
        case "monthly":
          start.setMonth(start.getMonth() - 1);
          break;
        default:
          start.setDate(start.getDate() - 7);
      }
    }

    // Get sales data
    const sales = await Sale.find({
      userId,
      date: {
        $gte: start.toISOString().split("T")[0],
        $lte: end.toISOString().split("T")[0],
      },
    });

    // Sales over time
    const salesTimeData = [];
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const daySales = sales.filter((sale) => {
        const saleDate = new Date(sale.date);
        return saleDate >= date && saleDate < nextDate;
      });

      salesTimeData.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        sales: daySales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        profit: daySales.reduce((sum, sale) => sum + sale.totalProfit, 0),
      });
    }

    // Profit trends by month (last 8 months)
    const profitTimeData = [];
    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthSales = await Sale.find({
        userId,
        date: {
          $gte: monthStart.toISOString().split("T")[0],
          $lte: monthEnd.toISOString().split("T")[0],
        },
      });

      profitTimeData.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        profit: monthSales.reduce((sum, sale) => sum + sale.totalProfit, 0),
      });
    }

    // Top products distribution
    const productSales = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productSales[item.name]) {
          productSales[item.name] = 0;
        }
        productSales[item.name] += item.qty * item.unitPrice;
      });
    });

    const topProductsData = Object.entries(productSales)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Add "Others" category
    const othersValue = Object.values(productSales)
      .sort((a, b) => b - a)
      .slice(5)
      .reduce((sum, val) => sum + val, 0);

    if (othersValue > 0) {
      topProductsData.push({ name: "Others", value: othersValue });
    }

    // Calculate percentages
    const totalValue = topProductsData.reduce(
      (sum, item) => sum + item.value,
      0
    );
    topProductsData.forEach((item) => {
      item.percentage =
        totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(0) : 0;
    });

    // Key metrics
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.totalProfit, 0);
    const totalTransactions = sales.length;
    const avgOrder =
      totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Business insights
    const insights = [];

    // Check for trending products
    const recentSales = await Sale.find({
      userId,
      date: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      },
    });

    const previousSales = await Sale.find({
      userId,
      date: {
        $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      },
    });

    if (recentSales.length > previousSales.length * 1.2) {
      insights.push({
        id: 1,
        type: "trend",
        icon: "material-symbols:trending-up",
        color: "#52c41a",
        title: "Sales Surge Detected",
        description: `Sales increased by ${(
          ((recentSales.length - previousSales.length) / previousSales.length) *
          100
        ).toFixed(0)}% compared to last month.`,
        impact: "high",
      });
    }

    // Check for low stock
    const lowStock = await Product.find({
      userId,
      stock: { $lte: 10, $gt: 0 },
    });
    if (lowStock.length > 0) {
      insights.push({
        id: 2,
        type: "inventory",
        icon: "material-symbols:inventory",
        color: "#ff4d4f",
        title: "Low Stock Alert",
        description: `${lowStock.length} products are running low on stock. Reorder soon to avoid stockouts.`,
        impact: "medium",
      });
    }

    // Check profit margin
    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    if (profitMargin > 35) {
      insights.push({
        id: 3,
        type: "profit",
        icon: "material-symbols:payments",
        color: "#3E5879",
        title: "Healthy Profit Margin",
        description: `Overall profit margin is ${profitMargin.toFixed(
          1
        )}%, which is above industry average.`,
        impact: "high",
      });
    }

    res.json({
      salesTimeData,
      profitTimeData,
      topProductsData,
      keyMetrics: {
        totalRevenue,
        totalProfit,
        avgOrder,
        totalTransactions,
      },
      insights,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
