import Sale from "../models/Sale.js";
import Product from "../models/Product.js";

// Festival dates for boosting predictions
const festivalDates = [
  { date: "01-14", name: "Makar Sankranti", boost: 1.5 },
  { date: "01-26", name: "Republic Day", boost: 1.3 },
  { date: "02-26", name: "Maha Shivaratri", boost: 1.4 },
  { date: "03-14", name: "Holi", boost: 1.8 },
  { date: "03-31", name: "Eid al-Fitr", boost: 1.6 },
  { date: "04-14", name: "Baisakhi", boost: 1.4 },
  { date: "08-15", name: "Independence Day", boost: 1.5 },
  { date: "08-27", name: "Ganesh Chaturthi", boost: 1.7 },
  { date: "10-02", name: "Gandhi Jayanti", boost: 1.3 },
  { date: "10-20", name: "Diwali", boost: 2.0 },
  { date: "12-25", name: "Christmas", boost: 1.8 },
];

// Get upcoming festival within next N days
const getUpcomingFestival = (days = 30) => {
  const today = new Date();
  const festivals = festivalDates
    .map((f) => {
      const [month, day] = f.date.split("-");
      const festivalDate = new Date(today.getFullYear(), month - 1, day);

      // If festival already passed this year, check next year
      if (festivalDate < today) {
        festivalDate.setFullYear(today.getFullYear() + 1);
      }

      const daysUntil = Math.ceil(
        (festivalDate - today) / (1000 * 60 * 60 * 24)
      );

      return {
        ...f,
        date: festivalDate,
        daysUntil,
      };
    })
    .filter((f) => f.daysUntil > 0 && f.daysUntil <= days)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return festivals[0] || null;
};

export const getAIInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const insights = [];

    // 1. SALES TREND ANALYSIS
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const last60Days = new Date();
    last60Days.setDate(last60Days.getDate() - 60);

    const recentSales = await Sale.find({
      userId,
      createdAt: { $gte: last30Days },
    });

    const previousSales = await Sale.find({
      userId,
      createdAt: { $gte: last60Days, $lt: last30Days },
    });

    const recentRevenue = recentSales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );
    const previousRevenue = previousSales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    if (previousRevenue > 0) {
      const growthRate =
        ((recentRevenue - previousRevenue) / previousRevenue) * 100;

      if (growthRate > 10) {
        insights.push({
          type: "success",
          icon: "trending-up",
          title: "Strong Sales Growth",
          message: `Sales are up ${growthRate.toFixed(
            1
          )}% compared to last month - excellent performance!`,
          priority: "high",
        });
      } else if (growthRate < -10) {
        insights.push({
          type: "warning",
          icon: "trending-down",
          title: "Sales Decline Detected",
          message: `Sales dropped ${Math.abs(growthRate).toFixed(
            1
          )}% from last month. Consider promotional activities.`,
          priority: "high",
        });
      } else {
        insights.push({
          type: "info",
          icon: "analytics",
          title: "Steady Performance",
          message: `Sales are stable with ${
            growthRate > 0 ? "+" : ""
          }${growthRate.toFixed(1)}% change from last month.`,
          priority: "medium",
        });
      }
    }

    // 2. INVENTORY ALERTS - Low Stock & Reorder Suggestions
    const products = await Product.find({ userId });
    const lowStockProducts = [];
    const reorderSuggestions = [];

    for (const product of products) {
      // Low stock alert
      if (product.stock <= 5 && product.stock > 0) {
        lowStockProducts.push(product.name);
      } else if (product.stock === 0) {
        insights.push({
          type: "error",
          icon: "alert-circle",
          title: "Out of Stock",
          message: `${product.name} is out of stock! Reorder immediately to avoid lost sales.`,
          priority: "urgent",
          productId: product._id,
        });
      }

      // Calculate reorder point based on sales velocity
      const productSales = await Sale.find({
        userId,
        createdAt: { $gte: last30Days },
        "items.productId": product._id,
      });

      let totalSold = 0;
      productSales.forEach((sale) => {
        sale.items.forEach((item) => {
          if (item.productId.toString() === product._id.toString()) {
            totalSold += item.qty;
          }
        });
      });

      const avgDailySales = totalSold / 30;
      const leadTime = 7; // Assume 7 days lead time
      const safetyStock = avgDailySales * 3; // 3 days safety stock

      // Check for upcoming festival
      const upcomingFestival = getUpcomingFestival(30);
      const festivalBoost = upcomingFestival ? upcomingFestival.boost : 1;

      const reorderPoint =
        avgDailySales * leadTime * festivalBoost + safetyStock;

      if (product.stock < reorderPoint && avgDailySales > 0) {
        const recommendedOrder = Math.ceil(avgDailySales * 30 * festivalBoost); // 1 month supply
        reorderSuggestions.push({
          product: product.name,
          currentStock: product.stock,
          recommendedOrder,
          reason: upcomingFestival
            ? `${upcomingFestival.name} in ${upcomingFestival.daysUntil} days`
            : "Based on sales velocity",
        });
      }
    }

    if (lowStockProducts.length > 0) {
      insights.push({
        type: "warning",
        icon: "package",
        title: "Low Stock Alert",
        message: `${lowStockProducts.length} product${
          lowStockProducts.length > 1 ? "s are" : " is"
        } running low: ${lowStockProducts.slice(0, 3).join(", ")}${
          lowStockProducts.length > 3 ? "..." : ""
        }`,
        priority: "high",
      });
    }

    if (reorderSuggestions.length > 0) {
      insights.push({
        type: "info",
        icon: "cart",
        title: "Smart Reorder Suggestions",
        message: `${reorderSuggestions.length} product${
          reorderSuggestions.length > 1 ? "s need" : " needs"
        } reordering soon.`,
        priority: "medium",
        data: reorderSuggestions.slice(0, 5),
      });
    }

    // 3. FESTIVAL PREPARATION
    const upcomingFestival = getUpcomingFestival(30);
    if (upcomingFestival) {
      // Find top products from last year's same festival
      const lastYearFestival = new Date(upcomingFestival.date);
      lastYearFestival.setFullYear(lastYearFestival.getFullYear() - 1);

      const festivalStart = new Date(lastYearFestival);
      festivalStart.setDate(festivalStart.getDate() - 3);
      const festivalEnd = new Date(lastYearFestival);
      festivalEnd.setDate(festivalEnd.getDate() + 3);

      const festivalSales = await Sale.find({
        userId,
        date: {
          $gte: festivalStart.toISOString().split("T")[0],
          $lte: festivalEnd.toISOString().split("T")[0],
        },
      });

      const productSalesMap = {};
      festivalSales.forEach((sale) => {
        sale.items.forEach((item) => {
          if (!productSalesMap[item.name]) {
            productSalesMap[item.name] = 0;
          }
          productSalesMap[item.name] += item.qty;
        });
      });

      const topFestivalProducts = Object.entries(productSalesMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);

      if (topFestivalProducts.length > 0) {
        insights.push({
          type: "success",
          icon: "celebration",
          title: `Prepare for ${upcomingFestival.name}`,
          message: `${upcomingFestival.name} is in ${
            upcomingFestival.daysUntil
          } days. Stock up on: ${topFestivalProducts.join(", ")}`,
          priority: "high",
          data: {
            festival: upcomingFestival.name,
            daysUntil: upcomingFestival.daysUntil,
          },
        });
      }
    }

    // 4. REVENUE FORECAST
    const last90Days = new Date();
    last90Days.setDate(last90Days.getDate() - 90);
    const last90DaysSales = await Sale.find({
      userId,
      createdAt: { $gte: last90Days },
    });

    const dailyRevenue = {};
    last90DaysSales.forEach((sale) => {
      const date = sale.date;
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = 0;
      }
      dailyRevenue[date] += sale.totalAmount;
    });

    const revenues = Object.values(dailyRevenue);
    const avgDailyRevenue =
      revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length;
    const stdDev = Math.sqrt(
      revenues.reduce(
        (sum, rev) => sum + Math.pow(rev - avgDailyRevenue, 2),
        0
      ) / revenues.length
    );

    const nextMonthForecast = avgDailyRevenue * 30;
    const confidenceInterval = stdDev * 1.96; // 95% confidence

    insights.push({
      type: "info",
      icon: "trending-up",
      title: "Revenue Forecast",
      message: `Predicted revenue for next month: $${nextMonthForecast.toFixed(
        0
      )} ± $${confidenceInterval.toFixed(0)}`,
      priority: "medium",
      data: {
        forecast: nextMonthForecast,
        lower: nextMonthForecast - confidenceInterval,
        upper: nextMonthForecast + confidenceInterval,
        confidence: 95,
      },
    });

    // 5. PRICE OPTIMIZATION SUGGESTIONS
    const priceOptimization = [];

    for (const product of products) {
      // Get sales data for this product
      const productSalesData = await Sale.find({
        userId,
        createdAt: { $gte: last90Days },
        "items.productId": product._id,
      });

      let totalQuantitySold = 0;
      let totalRevenue = 0;

      productSalesData.forEach((sale) => {
        sale.items.forEach((item) => {
          if (item.productId.toString() === product._id.toString()) {
            totalQuantitySold += item.qty;
            totalRevenue += item.qty * item.unitPrice;
          }
        });
      });

      if (totalQuantitySold > 0) {
        const avgDailySales = totalQuantitySold / 90;
        const profitMargin =
          ((product.sellingPrice - product.purchasePrice) /
            product.sellingPrice) *
          100;
        const turnoverRate =
          totalQuantitySold / (product.stock + totalQuantitySold);

        // High demand + low stock = increase price
        if (avgDailySales > 2 && product.stock < 10 && profitMargin < 40) {
          const suggestedPrice = Math.ceil(product.sellingPrice * 1.1); // 10% increase
          const additionalProfit =
            (suggestedPrice - product.sellingPrice) * avgDailySales * 30;

          priceOptimization.push({
            product: product.name,
            currentPrice: product.sellingPrice,
            suggestedPrice,
            reason: "High demand, low stock",
            impact: `+$${additionalProfit.toFixed(0)}/month`,
            type: "increase",
          });
        }

        // Low demand + high stock = decrease price
        if (avgDailySales < 0.5 && product.stock > 20 && turnoverRate < 0.2) {
          const suggestedPrice = Math.ceil(product.sellingPrice * 0.9); // 10% decrease
          const estimatedIncrease = avgDailySales * 2; // Assume 2x sales increase

          priceOptimization.push({
            product: product.name,
            currentPrice: product.sellingPrice,
            suggestedPrice,
            reason: "Slow-moving inventory",
            impact: `Clear ${product.stock} units faster`,
            type: "decrease",
          });
        }
      }
    }

    if (priceOptimization.length > 0) {
      const increaseCount = priceOptimization.filter(
        (p) => p.type === "increase"
      ).length;
      const decreaseCount = priceOptimization.filter(
        (p) => p.type === "decrease"
      ).length;

      insights.push({
        type: "info",
        icon: "price-tag",
        title: "Price Optimization",
        message: `${
          priceOptimization.length
        } pricing opportunities: ${increaseCount} increase${
          increaseCount !== 1 ? "s" : ""
        }, ${decreaseCount} discount${decreaseCount !== 1 ? "s" : ""}`,
        priority: "medium",
        data: priceOptimization.slice(0, 5),
      });
    }

    // 6. ANOMALY DETECTION
    const anomalies = [];

    // Detect unusual daily sales patterns
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const last7DaysSales = await Sale.find({
      userId,
      createdAt: { $gte: last7Days },
    });

    const last7DaysRevenue = last7DaysSales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );
    const avgLast7Days = last7DaysRevenue / 7;

    // Compare with 90-day average
    if (avgDailyRevenue > 0) {
      const deviation =
        ((avgLast7Days - avgDailyRevenue) / avgDailyRevenue) * 100;

      if (Math.abs(deviation) > 30) {
        anomalies.push({
          type: deviation > 0 ? "positive" : "negative",
          metric: "Daily Revenue",
          deviation: deviation.toFixed(1),
          message:
            deviation > 0
              ? `Unusual spike: ${deviation.toFixed(1)}% above normal`
              : `Unusual drop: ${Math.abs(deviation).toFixed(1)}% below normal`,
        });
      }
    }

    // Detect products with unusual sales patterns
    const productSalesLast7Days = {};
    const productSalesLast30Days = {};

    last7DaysSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productSalesLast7Days[item.name]) {
          productSalesLast7Days[item.name] = 0;
        }
        productSalesLast7Days[item.name] += item.qty;
      });
    });

    recentSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productSalesLast30Days[item.name]) {
          productSalesLast30Days[item.name] = 0;
        }
        productSalesLast30Days[item.name] += item.qty;
      });
    });

    // Find products with sudden changes
    Object.keys(productSalesLast7Days).forEach((productName) => {
      const last7DaysQty = productSalesLast7Days[productName];
      const last30DaysQty = productSalesLast30Days[productName] || 0;
      const avgWeeklyFromMonth = (last30DaysQty / 30) * 7;

      if (avgWeeklyFromMonth > 0) {
        const change =
          ((last7DaysQty - avgWeeklyFromMonth) / avgWeeklyFromMonth) * 100;

        if (change > 100) {
          anomalies.push({
            type: "positive",
            metric: productName,
            deviation: change.toFixed(0),
            message: `${productName}: Sudden spike (+${change.toFixed(0)}%)`,
          });
        } else if (change < -70) {
          anomalies.push({
            type: "negative",
            metric: productName,
            deviation: change.toFixed(0),
            message: `${productName}: Sharp decline (${change.toFixed(0)}%)`,
          });
        }
      }
    });

    if (anomalies.length > 0) {
      const hasNegative = anomalies.some((a) => a.type === "negative");

      insights.push({
        type: hasNegative ? "warning" : "info",
        icon: "alert-triangle",
        title: "Unusual Patterns Detected",
        message: `${anomalies.length} anomal${
          anomalies.length > 1 ? "ies" : "y"
        } found in recent data - investigate for insights`,
        priority: hasNegative ? "high" : "medium",
        data: anomalies.slice(0, 5),
      });
    }

    // 7. TOP PERFORMING PRODUCTS
    const productRevenue = {};
    recentSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productRevenue[item.name]) {
          productRevenue[item.name] = 0;
        }
        productRevenue[item.name] += item.qty * item.unitPrice;
      });
    });

    const topProducts = Object.entries(productRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, revenue]) => ({ name, revenue }));

    if (topProducts.length > 0) {
      insights.push({
        type: "success",
        icon: "star",
        title: "Top Performers",
        message: `Your best sellers: ${topProducts
          .map((p) => p.name)
          .join(", ")}`,
        priority: "low",
        data: topProducts,
      });
    }

    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    insights.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    res.json({ insights, generatedAt: new Date() });
  } catch (error) {
    console.error("Error generating AI insights:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
