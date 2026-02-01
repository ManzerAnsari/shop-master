import { useState, useEffect, useRef } from "react";
import { App, Select, Spin, Tag, Button, Progress, DatePicker } from "antd";
import { Icon } from "@iconify/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import dashboardService from "../../services/dashboardService";
import aiInsightsService from "../../services/aiInsightsService";
import { useNavigate } from "react-router-dom";

const CHART_HEIGHT = 300;

const Dashboard = () => {
  const { message } = App.useApp();
  const [dateFilter, setDateFilter] = useState("week");
  const [customDateRange, setCustomDateRange] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [lineChartSize, setLineChartSize] = useState({ width: 0, height: 0 });
  const [pieChartSize, setPieChartSize] = useState({ width: 0, height: 0 });
  const lineChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const navigate = useNavigate();

  // Only render ResponsiveContainer when the chart wrapper has valid dimensions (avoids Recharts -1 error)
  useEffect(() => {
    const el = lineChartRef.current;
    if (!el) return;
    const check = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) setLineChartSize((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [dashboardData]);

  useEffect(() => {
    const el = pieChartRef.current;
    if (!el) return;
    const check = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) setPieChartSize((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [dashboardData]);

  // Fetch dashboard data
  useEffect(() => {
    if (
      dateFilter === "custom" &&
      (!customDateRange || customDateRange.length !== 2)
    ) {
      return;
    }
    fetchDashboardData();
  }, [dateFilter, customDateRange]);

  // Fetch AI insights
  useEffect(() => {
    fetchAIInsights();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      let range = dateFilter;
      let query = `?range=${range}`;

      if (range === "custom" && customDateRange.length === 2) {
        const startDate = customDateRange[0].format("YYYY-MM-DD");
        const endDate = customDateRange[1].format("YYYY-MM-DD");
        query += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const data = await dashboardService.getStats(
        query.replace("?range=", "")
      );
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      message.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsights = async () => {
    try {
      setInsightsLoading(true);
      const data = await aiInsightsService.getInsights();
      setAiInsights(data.insights || []);
    } catch (error) {
      console.error("Error fetching AI insights:", error);
    } finally {
      setInsightsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spin size="large" />
        <div className="mt-4 text-primary-medium font-medium">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-10">
        <Icon
          icon="material-symbols:error-outline"
          width="64"
          className="text-red-500 mb-4"
        />
        <h3 className="text-xl font-bold text-primary-dark">
          Failed to load data
        </h3>
        <p className="text-primary-medium mt-2">
          Please check your connection and try again.
        </p>
      </div>
    );
  }

  const {
    stats,
    lowStockProducts,
    salesTrend,
    topProducts,
    recentSales,
    categorySales,
  } = dashboardData;

  const COLORS = ["#213555", "#3E5879", "#D8C4B6", "#F5EFE7", "#9ca3af"];

  // Reusable KPI Card Component
  const KPICard = ({ title, value, icon, iconColor, subtext }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light hover:shadow-md transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-primary-medium font-medium text-sm mb-1 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-primary-dark mt-1">{value}</h3>
          {subtext && (
            <p className="text-xs text-primary-medium mt-2 opacity-80 flex items-center gap-1">
              {subtext}
            </p>
          )}
        </div>
        <div className={iconColor}>
          <Icon icon={icon} width="36" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark mb-1">
            Dashboard
          </h1>
          <p className="text-primary-medium">
            Overview of your shop's performance.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            type="primary"
            size="large"
            icon={<Icon icon="material-symbols:add" />}
            className="bg-primary-dark hover:bg-primary-medium"
            onClick={() => navigate("/sales/new")}
          >
            New Sale
          </Button>
          <Select
            value={dateFilter}
            onChange={setDateFilter}
            className="w-36"
            size="large"
            options={[
              { value: "today", label: "Today" },
              { value: "week", label: "This Week" },
              { value: "month", label: "This Month" },
              { value: "year", label: "This Year" },
              { value: "custom", label: "Custom Date" },
            ]}
          />
          {dateFilter === "custom" && (
            <DatePicker.RangePicker
              value={customDateRange}
              onChange={setCustomDateRange}
              className="w-64"
              size="large"
            />
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Sales"
          value={`$${stats.totalSales.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon="material-symbols:attach-money"
          iconColor="text-blue-600"
          subtext="Gross revenue"
        />
        <KPICard
          title="Total Profit"
          value={`$${stats.totalProfit.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon="material-symbols:trending-up"
          iconColor="text-green-600"
          subtext="Net profit"
        />
        <KPICard
          title="Best Selling"
          value={stats.bestSelling?.name || "N/A"}
          subtext={
            stats.bestSelling
              ? `${stats.bestSelling.quantity} units sold`
              : "No sales yet"
          }
          icon="material-symbols:trophy"
          iconColor="text-yellow-500"
        />
        <KPICard
          title="Stock Alerts"
          value={stats.stockAlerts}
          subtext="Items needing attention"
          icon="material-symbols:warning"
          iconColor="text-red-500"
        />
      </div>

      {/* AI Insights Panel */}
      <div className="bg-gradient-to-br from-primary-dark to-primary-medium rounded-2xl p-6 shadow-lg border border-primary-medium">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Icon
                icon="material-symbols:psychology"
                width="28"
                className="text-white"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">AI Insights</h3>
              <p className="text-sm text-white/80">
                Smart recommendations for your business
              </p>
            </div>
          </div>
          <Button
            onClick={fetchAIInsights}
            loading={insightsLoading}
            icon={<Icon icon="material-symbols:refresh" width="18" />}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            Refresh
          </Button>
        </div>

        {insightsLoading ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : aiInsights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiInsights.slice(0, 6).map((insight, index) => {
              const getInsightColor = (type) => {
                switch (type) {
                  case "success":
                    return "bg-green-500/20 border-green-400";
                  case "warning":
                    return "bg-yellow-500/20 border-yellow-400";
                  case "error":
                    return "bg-red-500/20 border-red-400";
                  default:
                    return "bg-blue-500/20 border-blue-400";
                }
              };

              const getIconName = (icon) => {
                const iconMap = {
                  "trending-up": "material-symbols:trending-up",
                  "trending-down": "material-symbols:trending-down",
                  "alert-circle": "material-symbols:error",
                  package: "material-symbols:inventory-2",
                  cart: "material-symbols:shopping-cart",
                  celebration: "material-symbols:celebration",
                  analytics: "material-symbols:analytics",
                  star: "material-symbols:star",
                  "price-tag": "material-symbols:sell",
                  "alert-triangle": "material-symbols:warning",
                };
                return iconMap[insight.icon] || "material-symbols:info";
              };

              return (
                <div
                  key={index}
                  className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border ${getInsightColor(
                    insight.type
                  )} hover:bg-white/20 transition-all cursor-pointer`}
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-white/20 p-2 rounded-lg shrink-0">
                      <Icon
                        icon={getIconName(insight.icon)}
                        width="20"
                        className="text-white"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-xs text-white/90 leading-relaxed">
                        {insight.message}
                      </p>
                      {insight.data &&
                        insight.type === "info" &&
                        insight.title === "Smart Reorder Suggestions" && (
                          <div className="mt-3 space-y-2">
                            {insight.data.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-white/10 rounded p-2 text-xs"
                              >
                                <div className="font-semibold text-white">
                                  {item.product}
                                </div>
                                <div className="text-white/80">
                                  Order: {item.recommendedOrder} units •{" "}
                                  {item.reason}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      {insight.data &&
                        insight.title === "Price Optimization" && (
                          <div className="mt-3 space-y-2">
                            {insight.data.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-white/10 rounded p-2 text-xs"
                              >
                                <div className="font-semibold text-white flex items-center gap-2">
                                  {item.product}
                                  {item.type === "increase" ? (
                                    <span className="text-green-300">↑</span>
                                  ) : (
                                    <span className="text-yellow-300">↓</span>
                                  )}
                                </div>
                                <div className="text-white/80">
                                  ${item.currentPrice} → ${item.suggestedPrice}{" "}
                                  • {item.reason}
                                </div>
                                <div className="text-white/70 text-[10px] mt-1">
                                  {item.impact}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      {insight.data &&
                        insight.title === "Unusual Patterns Detected" && (
                          <div className="mt-3 space-y-2">
                            {insight.data.map((item, idx) => (
                              <div
                                key={idx}
                                className={`rounded p-2 text-xs ${
                                  item.type === "positive"
                                    ? "bg-green-500/20"
                                    : "bg-red-500/20"
                                }`}
                              >
                                <div className="font-semibold text-white">
                                  {item.metric}
                                </div>
                                <div className="text-white/80">
                                  {item.message}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-white/80">
            <Icon
              icon="material-symbols:lightbulb"
              width="48"
              className="mx-auto mb-2 opacity-50"
            />
            <p>No insights available at the moment</p>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-primary-dark">Sales Trend</h3>
            <Tag color="blue">
              {dateFilter === "today"
                ? "Today"
                : dateFilter === "week"
                ? "Last 7 Days"
                : dateFilter === "month"
                ? "Last 30 Days"
                : dateFilter === "year"
                ? "This Year"
                : "Custom Range"}
            </Tag>
          </div>
          <div
            ref={lineChartRef}
            className="w-full min-w-0"
            style={{ height: CHART_HEIGHT }}
          >
            {lineChartSize.width > 0 && lineChartSize.height > 0 && (
              <ResponsiveContainer width={lineChartSize.width} height={lineChartSize.height}>
                <LineChart data={salesTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F5EFE7"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#3E5879"
                  tick={{ fill: "#3E5879", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#3E5879"
                  tick={{ fill: "#3E5879", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(255, 255, 255, 0.95)",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    padding: "12px",
                  }}
                  itemStyle={{ padding: 0 }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ paddingTop: "20px" }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#213555"
                  strokeWidth={3}
                  dot={{ fill: "#213555", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 7, strokeWidth: 0 }}
                  name="Sales"
                  animationDuration={1500}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#D8C4B6"
                  strokeWidth={3}
                  dot={{ fill: "#D8C4B6", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 7, strokeWidth: 0 }}
                  name="Profit"
                  animationDuration={1500}
                />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
          <h3 className="text-lg font-bold text-primary-dark mb-6">
            Sales by Category
          </h3>
          <div
            ref={pieChartRef}
            className="w-full min-w-0 flex flex-col items-center justify-center"
            style={{ height: CHART_HEIGHT }}
          >
            {categorySales && categorySales.length > 0 ? (
              pieChartSize.width > 0 && pieChartSize.height > 0 ? (
                <ResponsiveContainer width={pieChartSize.width} height={pieChartSize.height}>
                  <PieChart>
                  <Pie
                    data={categorySales}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={{ fill: "black", fontSize: 12, fontWeight: 500 }}
                  >
                    {categorySales.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `$${value.toFixed(2)}`}
                    contentStyle={{
                      background: "white",
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : null
            ) : (
              <div className="text-center text-primary-medium opacity-60">
                <Icon
                  icon="material-symbols:donut-small-outline"
                  width="48"
                  className="mx-auto mb-2"
                />
                <p>No category data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Sales, Top Products, Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-primary-dark">
              Recent Sales
            </h3>
            <Button type="link" onClick={() => navigate("/sales")}>
              View All
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-accent-light">
                  <th className="pb-3 font-semibold text-primary-medium text-sm">
                    Date
                  </th>
                  <th className="pb-3 font-semibold text-primary-medium text-sm">
                    Items
                  </th>
                  <th className="pb-3 font-semibold text-primary-medium text-sm text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent-light">
                {recentSales && recentSales.length > 0 ? (
                  recentSales.map((sale) => (
                    <tr key={sale._id} className="group hover:bg-gray-50">
                      <td className="py-3 text-sm text-primary-dark">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-sm text-primary-dark">
                        {sale.items.length} items
                      </td>
                      <td className="py-3 text-sm font-bold text-primary-dark text-right">
                        ${sale.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-gray-400">
                      No recent sales
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
          <h3 className="text-lg font-bold text-primary-dark mb-4">
            Top Products
          </h3>
          <div className="space-y-4">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : index === 1
                          ? "bg-gray-100 text-gray-700"
                          : index === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-primary-dark font-medium text-sm line-clamp-1">
                        {product.name}
                      </p>
                      <p className="text-xs text-primary-medium">
                        {product.quantity} sold
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary-dark">
                    ${product.revenue.toFixed(0)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-4">No data</p>
            )}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
          <h3 className="text-lg font-bold text-primary-dark mb-4">
            Low Stock
          </h3>
          <div className="space-y-4">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-dark font-medium">
                      {item.name}
                    </span>
                    <span className="text-red-500 font-bold">
                      {item.stock} left
                    </span>
                  </div>
                  <Progress
                    percent={(item.stock / 10) * 100}
                    strokeColor={item.stock <= 5 ? "#ef4444" : "#f59e0b"}
                    railColor="#F5EFE7"
                    showInfo={false}
                    size="small"
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Icon
                  icon="material-symbols:check-circle"
                  className="text-green-500 mx-auto mb-2"
                  width="32"
                />
                <p className="text-sm text-primary-medium">
                  Inventory is healthy
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
