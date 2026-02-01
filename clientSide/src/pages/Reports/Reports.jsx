import React, { useState, useEffect } from "react";
import { App, Select, Button, DatePicker, Space, Alert, Spin } from "antd";
import { Icon } from "@iconify/react";
import reportsService from "../../services/reportsService";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const { RangePicker } = DatePicker;
const { Option } = Select;

const Reports = () => {
  const { message } = App.useApp();
  const [dateRange, setDateRange] = useState("today");
  const [customDates, setCustomDates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salesTimeData, setSalesTimeData] = useState([]);
  const [profitTimeData, setProfitTimeData] = useState([]);
  const [topProductsData, setTopProductsData] = useState([]);
  const [keyMetrics, setKeyMetrics] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    averageOrderValue: 0,
    totalTransactions: 0,
  });
  const [insights, setInsights] = useState([]);

  // Fetch data when date range changes
  useEffect(() => {
    fetchReportData();
  }, [dateRange, customDates]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Get date range
      let dates;
      if (dateRange === "custom" && customDates) {
        dates = {
          startDate: customDates[0].format("YYYY-MM-DD"),
          endDate: customDates[1].format("YYYY-MM-DD"),
        };
      } else {
        dates = reportsService.getDateRange(dateRange);
      }

      // Fetch all data
      const {
        trends,
        topProducts,
        summary,
        insights: insightsData,
      } = await reportsService.getFullReport(dates.startDate, dates.endDate);

      // Transform sales trends for chart
      const formattedSales = trends.map((day) => ({
        date: new Date(day.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        sales: day.revenue,
        profit: day.profit,
      }));

      // Transform profit trends for chart
      const formattedProfit = trends.map((day) => ({
        month: new Date(day.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        profit: day.profit,
      }));

      // Transform top products for pie chart
      const formattedProducts = topProducts.map((product) => ({
        name: product.name,
        value: product.totalRevenue,
      }));

      setSalesTimeData(formattedSales);
      setProfitTimeData(formattedProfit);
      setTopProductsData(formattedProducts);
      setKeyMetrics(summary);
      setInsights(insightsData);
    } catch (error) {
      console.error("Error fetching report data:", error);
      message.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  // Colors for pie chart
  const COLORS = [
    "#3E5879",
    "#52c41a",
    "#faad14",
    "#ff4d4f",
    "#D8C4B6",
    "#213555",
  ];

  // Export functions
  const handleExportPDF = async () => {
    try {
      let dates;
      if (dateRange === "custom" && customDates) {
        dates = {
          startDate: customDates[0].format("YYYY-MM-DD"),
          endDate: customDates[1].format("YYYY-MM-DD"),
        };
      } else {
        dates = reportsService.getDateRange(dateRange);
      }

      await reportsService.downloadReport(
        dates.startDate,
        dates.endDate,
        "pdf"
      );
      message.success("PDF report downloaded successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      message.error("Failed to export PDF");
    }
  };

  const handleExportExcel = async () => {
    try {
      let dates;
      if (dateRange === "custom" && customDates) {
        dates = {
          startDate: customDates[0].format("YYYY-MM-DD"),
          endDate: customDates[1].format("YYYY-MM-DD"),
        };
      } else {
        dates = reportsService.getDateRange(dateRange);
      }

      await reportsService.downloadReport(
        dates.startDate,
        dates.endDate,
        "excel"
      );
      message.success("Excel report downloaded successfully");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      message.error("Failed to export Excel");
    }
  };

  // Custom label for pie chart
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        style={{ fontWeight: "bold", fontSize: "12px" }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Metric Card Component
  const MetricCard = ({ title, value, prefix, color, bgGradient }) => (
    <div
      className="rounded-2xl p-6 shadow-sm text-white h-full flex flex-col justify-between"
      style={{ background: bgGradient }}
    >
      <div className="text-white/80 font-medium text-sm uppercase tracking-wider mb-2">
        {title}
      </div>
      <div className="text-3xl font-bold">
        {prefix}
        {typeof value === "number"
          ? value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : value}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spin size="large" />
        <div className="mt-4 text-primary-medium font-medium">
          Loading reports...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark mb-1">
            Reports & Analytics
          </h1>
          <p className="text-primary-medium">
            Comprehensive insights and performance metrics
          </p>
        </div>

        {/* Export Buttons */}
        <Space>
          <Button
            icon={<Icon icon="mdi:file-pdf-box" width="20" />}
            onClick={handleExportPDF}
            className="border-primary-medium text-primary-medium hover:text-primary-dark hover:border-primary-dark"
          >
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
          <Button
            icon={<Icon icon="mdi:file-excel-box" width="20" />}
            onClick={handleExportExcel}
            className="border-green-600 text-green-600 hover:text-green-700 hover:border-green-700"
          >
            <span className="hidden sm:inline">Export Excel</span>
          </Button>
        </Space>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 min-w-fit">
            <Icon
              icon="material-symbols:date-range"
              width="24"
              className="text-primary-medium"
            />
            <span className="font-semibold text-primary-dark">Date Range:</span>
          </div>
          <Select
            value={dateRange}
            onChange={setDateRange}
            className="w-full md:w-48"
            size="large"
          >
            <Option value="today">Today</Option>
            <Option value="weekly">This Week</Option>
            <Option value="monthly">This Month</Option>
            <Option value="yearly">1 Year</Option>
            <Option value="custom">Custom Range</Option>
          </Select>
          {dateRange === "custom" && (
            <RangePicker
              value={customDates}
              onChange={setCustomDates}
              className="w-full md:w-auto"
              size="large"
            />
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales vs Time - Line Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
              <div className="flex items-center gap-2 mb-6">
                <Icon
                  icon="material-symbols:show-chart"
                  width="24"
                  className="text-primary-dark"
                />
                <h3 className="text-lg font-bold text-primary-dark m-0">
                  Sales Over Time
                </h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#3E5879" />
                    <YAxis stroke="#3E5879" />
                    <Tooltip
                      contentStyle={{
                        background: "white",
                        border: "1px solid #D8C4B6",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#3E5879"
                      strokeWidth={3}
                      dot={{ fill: "#3E5879", r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Sales ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Profit vs Time - Bar Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
              <div className="flex items-center gap-2 mb-6">
                <Icon
                  icon="material-symbols:bar-chart"
                  width="24"
                  className="text-primary-dark"
                />
                <h3 className="text-lg font-bold text-primary-dark m-0">
                  Profit Trends
                </h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#3E5879" />
                    <YAxis stroke="#3E5879" />
                    <Tooltip
                      contentStyle={{
                        background: "white",
                        border: "1px solid #D8C4B6",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="profit"
                      fill="#52c41a"
                      name="Profit ($)"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products - Pie Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
              <div className="flex items-center gap-2 mb-6">
                <Icon
                  icon="material-symbols:pie-chart"
                  width="24"
                  className="text-primary-dark"
                />
                <h3 className="text-lg font-bold text-primary-dark m-0">
                  Top Products Distribution
                </h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topProductsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {topProductsData.map((entry, index) => (
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
                        border: "1px solid #D8C4B6",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Icon
                  icon="material-symbols:analytics"
                  width="24"
                  className="text-primary-dark"
                />
                <h3 className="text-lg font-bold text-primary-dark m-0">
                  Key Metrics
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1">
                <MetricCard
                  title="Total Revenue"
                  value={keyMetrics.totalRevenue}
                  prefix="$"
                  bgGradient="linear-gradient(135deg, #3E5879 0%, #213555 100%)"
                />
                <MetricCard
                  title="Total Profit"
                  value={keyMetrics.totalProfit}
                  prefix="$"
                  bgGradient="linear-gradient(135deg, #52c41a 0%, #389e0d 100%)"
                />
                <MetricCard
                  title="Avg. Order"
                  value={keyMetrics.averageOrderValue}
                  prefix="$"
                  bgGradient="linear-gradient(135deg, #faad14 0%, #d48806 100%)"
                />
                <MetricCard
                  title="Transactions"
                  value={keyMetrics.totalTransactions}
                  prefix=""
                  bgGradient="linear-gradient(135deg, #D8C4B6 0%, #c9b5a7 100%)"
                />
              </div>
            </div>
          </div>

          {/* Insights Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
            <div className="flex items-center gap-2 mb-6">
              <Icon
                icon="material-symbols:lightbulb"
                width="24"
                className="text-primary-dark"
              />
              <h3 className="text-lg font-bold text-primary-dark m-0">
                Business Insights
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight) => (
                <Alert
                  key={insight.id}
                  icon={<Icon icon={insight.icon} width="24" height="24" />}
                  message={
                    <span className="font-semibold text-primary-dark text-base">
                      {insight.title}
                    </span>
                  }
                  description={
                    <span className="text-primary-medium text-sm">
                      {insight.description}
                    </span>
                  }
                  type={insight.impact === "high" ? "info" : "warning"}
                  showIcon
                  className="border-l-4 bg-accent-light"
                  style={{
                    borderLeftColor: insight.color,
                  }}
                />
              ))}
              {insights.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  No insights available for this period.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
