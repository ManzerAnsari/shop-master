import Sale from "../models/Sale.js";
import Product from "../models/Product.js";

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get date range (default: last 7 days)
    const dateRange = req.query.range || "week";
    let startDate = new Date();

    switch (dateRange) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "custom":
        if (req.query.startDate) {
          startDate = new Date(req.query.startDate);
        }
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const query = {
      userId,
      date: { $gte: startDate.toISOString().split("T")[0] },
    };

    if (dateRange === "custom" && req.query.endDate) {
      query.date.$lte = new Date(req.query.endDate).toISOString().split("T")[0];
    }

    // Get sales data
    const sales = await Sale.find(query);

    // Calculate totals
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.totalProfit, 0);
    const totalTransactions = sales.length;

    // Get low stock products
    const lowStockProducts = await Product.find({
      userId,
      stock: { $lte: 10, $gt: 0 },
    }).limit(5);

    // Get out of stock products
    const outOfStockCount = await Product.countDocuments({
      userId,
      stock: 0,
    });

    // Get best selling product
    const productSales = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].quantity += item.qty;
        productSales[item.productId].revenue += item.qty * item.unitPrice;
      });
    });

    const bestSelling =
      Object.values(productSales).sort((a, b) => b.quantity - a.quantity)[0] ||
      null;

    // Sales trend
    const salesTrend = [];
    let currentDate = new Date(startDate);
    let endDate = new Date();

    if (dateRange === "custom" && req.query.endDate) {
      endDate = new Date(req.query.endDate);
    }

    // Set endDate to end of day to include all sales
    endDate.setHours(23, 59, 59, 999);

    const isMonthly =
      dateRange === "year" ||
      (dateRange === "custom" &&
        endDate - currentDate > 32 * 24 * 60 * 60 * 1000);

    if (isMonthly) {
      // Monthly grouping
      currentDate.setDate(1); // Start from beginning of month

      while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthName = currentDate.toLocaleString("default", {
          month: "short",
        });

        const monthSales = sales.filter((sale) => {
          const saleDate = new Date(sale.date);
          return (
            saleDate.getFullYear() === year && saleDate.getMonth() === month
          );
        });

        const monthTotal = monthSales.reduce(
          (sum, sale) => sum + sale.totalAmount,
          0
        );
        const monthProfit = monthSales.reduce(
          (sum, sale) => sum + sale.totalProfit,
          0
        );

        salesTrend.push({
          date: `${monthName} ${year}`,
          sales: monthTotal,
          profit: monthProfit,
        });

        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    } else {
      // Daily grouping
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const dayLabel = currentDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        const daySales = sales.filter((sale) => {
          const saleDateStr = new Date(sale.date).toISOString().split("T")[0];
          return saleDateStr === dateStr;
        });

        const dayTotal = daySales.reduce(
          (sum, sale) => sum + sale.totalAmount,
          0
        );
        const dayProfit = daySales.reduce(
          (sum, sale) => sum + sale.totalProfit,
          0
        );

        salesTrend.push({
          date: dayLabel,
          sales: dayTotal,
          profit: dayProfit,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Top 5 products
    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({
        productId: id,
        name: data.name,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Recent Transactions (Last 5)
    const recentSales = await Sale.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Category Distribution
    // We need to fetch product categories for the sales in the current period
    // Since Sale items don't have category, we need to look it up
    const productIds = [
      ...new Set(sales.flatMap((s) => s.items.map((i) => i.productId))),
    ];
    const products = await Product.find(
      { _id: { $in: productIds } },
      "category _id"
    ).lean();
    const productCategoryMap = products.reduce((acc, p) => {
      acc[p._id.toString()] = p.category;
      return acc;
    }, {});

    const categoryStats = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const category =
          productCategoryMap[item.productId.toString()] || "Uncategorized";
        if (!categoryStats[category]) {
          categoryStats[category] = 0;
        }
        categoryStats[category] += item.qty * item.unitPrice;
      });
    });

    const categorySales = Object.entries(categoryStats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    res.json({
      stats: {
        totalSales,
        totalProfit,
        totalTransactions,
        averageOrder:
          totalTransactions > 0 ? totalSales / totalTransactions : 0,
        stockAlerts: lowStockProducts.length + outOfStockCount,
        bestSelling,
      },
      lowStockProducts,
      salesTrend,
      topProducts,
      recentSales,
      categorySales,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
