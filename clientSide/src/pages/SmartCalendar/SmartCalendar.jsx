import React, { useState, useEffect } from "react";
import {
  App,
  Calendar,
  Badge,
  Card,
  List,
  Alert,
  Spin,
  Tag,
  Tooltip,
  Statistic,
  Progress,
  Select,
  Button,
} from "antd";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import salesService from "../../services/salesService";
import { getFestivalsForCalendar } from "../../services/festivalsService";
import { getFestivalForDate, getUpcomingFestivals } from "../../utils/festivals";

const COUNTRY_OPTIONS = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
];

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const { Option } = Select;

const SmartCalendar = () => {
  const { message } = App.useApp();
  const [value, setValue] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [multiYearData, setMultiYearData] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [predictions, setPredictions] = useState({
    avgRevenue: 0,
    growthRate: 0,
    predictedRevenue: 0,
    confidence: 0,
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSalesData, setProductSalesData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartMonth, setChartMonth] = useState(dayjs().month());
  const [chartYear, setChartYear] = useState(dayjs().year());
  const [chartView, setChartView] = useState("month"); // 'month' or 'year'
  const [festivals, setFestivals] = useState([]);
  const [festivalsLoading, setFestivalsLoading] = useState(true);
  const [country, setCountry] = useState("IN");

  const upcomingFestivals = getUpcomingFestivals(festivals, 60);

  useEffect(() => {
    let cancelled = false;
    setFestivalsLoading(true);
    getFestivalsForCalendar(country)
      .then((list) => {
        if (!cancelled) setFestivals(list || []);
      })
      .catch(() => {
        if (!cancelled) setFestivals([]);
      })
      .finally(() => {
        if (!cancelled) setFestivalsLoading(false);
      });
    return () => { cancelled = true; };
  }, [country]);

  useEffect(() => {
    fetchMultiYearData(value);
  }, [value]);

  const fetchMultiYearData = async (date) => {
    try {
      setLoading(true);
      setError(null);
      const currentMonth = date.month();
      const currentYear = date.year();

      // Fetch data for the same month across 3 years
      const yearsToFetch = [0, 1, 2]; // Current year, 1 year ago, 2 years ago
      const allData = {};

      for (const yearsAgo of yearsToFetch) {
        const targetDate = dayjs()
          .year(currentYear - yearsAgo)
          .month(currentMonth);
        const startDate = targetDate.startOf("month").format("YYYY-MM-DD");
        const endDate = targetDate.endOf("month").format("YYYY-MM-DD");

        const [trends, products] = await Promise.all([
          salesService.getTrends(startDate, endDate),
          salesService.getTopProducts(startDate, endDate, 10),
        ]);

        allData[yearsAgo] = {
          trends: trends,
          products: products,
          totalRevenue: trends.reduce((sum, day) => sum + day.revenue, 0),
          totalOrders: trends.reduce((sum, day) => sum + day.count, 0),
        };
      }

      setMultiYearData(allData);

      // Calculate predictions based on historical trends
      calculatePredictions(allData);

      // Get top products across all years
      const allProducts = {};
      Object.values(allData).forEach((yearData) => {
        yearData.products.forEach((product) => {
          if (!allProducts[product.name]) {
            allProducts[product.name] = {
              name: product.name,
              totalQuantity: 0,
              totalRevenue: 0,
              years: 0,
            };
          }
          allProducts[product.name].totalQuantity += product.totalQuantity;
          allProducts[product.name].totalRevenue += product.totalRevenue;
          allProducts[product.name].years += 1;
        });
      });

      let topProductsList = Object.values(allProducts)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);

      // If current month has no sales across 3 years, use last 12 months for product list
      if (topProductsList.length === 0) {
        const fallbackStart = dayjs().subtract(12, "month").startOf("month").format("YYYY-MM-DD");
        const fallbackEnd = dayjs().format("YYYY-MM-DD");
        const fallbackProducts = await salesService.getTopProducts(fallbackStart, fallbackEnd, 5);
        topProductsList = (fallbackProducts || []).map((p) => ({
          name: p.name,
          totalQuantity: p.totalQuantity || 0,
          totalRevenue: p.totalRevenue || 0,
          years: 1,
        }));
      }

      setTopProducts(topProductsList);

      // Auto-select first product for chart
      if (topProductsList.length > 0) {
        setSelectedProduct((prev) => prev && topProductsList.some((p) => p.name === prev) ? prev : topProductsList[0].name);
      }
    } catch (err) {
      console.error("Error fetching multi-year data:", err);
      setError("Failed to load calendar data. Please try again.");
      message.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch product sales data for chart
  useEffect(() => {
    if (selectedProduct) {
      fetchProductSalesData(selectedProduct);
    }
  }, [selectedProduct, chartMonth, chartYear, chartView]);

  const fetchProductSalesData = async (productName) => {
    try {
      setChartLoading(true);

      const chartData = {
        labels: [],
        datasets: [],
      };

      const colors = ["#3E5879", "#52c41a", "#faad14"];
      const yearLabels = ["This Year", "Last Year", "2 Years Ago"];

      if (chartView === "month") {
        // MONTH VIEW: Show daily sales for selected month
        for (let yearsAgo = 0; yearsAgo < 3; yearsAgo++) {
          const targetDate = dayjs()
            .year(chartYear - yearsAgo)
            .month(chartMonth);
          const startDate = targetDate.startOf("month").format("YYYY-MM-DD");
          const endDate = targetDate.endOf("month").format("YYYY-MM-DD");

          const salesData = await salesService.getAll({
            startDate,
            endDate,
            limit: 10000,
          });
          const sales = salesData.sales || salesData;
          const salesArray = Array.isArray(sales) ? sales : [];

          // Filter sales for the selected product and aggregate by date
          const productSalesByDate = {};
          salesArray.forEach((sale) => {
            (sale.items || []).forEach((item) => {
              if (item.name === productName) {
                const date = sale.date;
                if (!productSalesByDate[date]) {
                  productSalesByDate[date] = 0;
                }
                productSalesByDate[date] += item.qty;
              }
            });
          });

          // Create dataset for this year
          const daysInMonth = targetDate.daysInMonth();
          const dataPoints = [];

          for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = targetDate.date(day).format("YYYY-MM-DD");
            dataPoints.push(productSalesByDate[dateStr] || 0);

            // Set labels only once (from current year)
            if (yearsAgo === 0) {
              chartData.labels.push(day.toString());
            }
          }

          chartData.datasets.push({
            label: yearLabels[yearsAgo],
            data: dataPoints,
            backgroundColor: colors[yearsAgo],
            borderColor: colors[yearsAgo],
            borderWidth: 1,
          });
        }
      } else {
        // YEAR VIEW: Show monthly sales for selected year
        for (let yearsAgo = 0; yearsAgo < 3; yearsAgo++) {
          const targetYear = chartYear - yearsAgo;
          const dataPoints = [];

          for (let month = 0; month < 12; month++) {
            const targetDate = dayjs().year(targetYear).month(month);
            const startDate = targetDate.startOf("month").format("YYYY-MM-DD");
            const endDate = targetDate.endOf("month").format("YYYY-MM-DD");

            const salesData = await salesService.getAll({
              startDate,
              endDate,
              limit: 10000,
            });
            const sales = salesData.sales || salesData;
            const salesArray = Array.isArray(sales) ? sales : [];

            // Filter sales for the selected product and aggregate
            let monthlyTotal = 0;
            salesArray.forEach((sale) => {
              (sale.items || []).forEach((item) => {
                if (item.name === productName) {
                  monthlyTotal += item.qty;
                }
              });
            });

            dataPoints.push(monthlyTotal);

            // Set labels only once (from current year)
            if (yearsAgo === 0) {
              chartData.labels.push(dayjs().month(month).format("MMM"));
            }
          }

          chartData.datasets.push({
            label: yearLabels[yearsAgo],
            data: dataPoints,
            backgroundColor: colors[yearsAgo],
            borderColor: colors[yearsAgo],
            borderWidth: 1,
          });
        }
      }

      setProductSalesData(chartData);
    } catch (error) {
      console.error("Error fetching product sales data:", error);
    } finally {
      setChartLoading(false);
    }
  };

  const calculatePredictions = (data) => {
    // Calculate average revenue and growth rate
    const revenues = [
      data[2]?.totalRevenue || 0, // 2 years ago
      data[1]?.totalRevenue || 0, // 1 year ago
      data[0]?.totalRevenue || 0, // Current year
    ];

    const avgRevenue =
      revenues.reduce((sum, rev) => sum + rev, 0) /
      revenues.filter((r) => r > 0).length;

    // Calculate year-over-year growth rate
    let growthRate = 0;
    if (revenues[0] > 0 && revenues[1] > 0) {
      growthRate = ((revenues[1] - revenues[0]) / revenues[0]) * 100;
    }

    // Predict next month's revenue based on trend
    const predictedRevenue = revenues[1] * (1 + growthRate / 100);

    // Calculate confidence based on data consistency (guard against NaN)
    const variance =
      revenues.reduce((sum, rev) => sum + Math.pow(rev - avgRevenue, 2), 0) /
      (revenues.length || 1);
    const stdDev = Math.sqrt(Math.max(0, variance));
    const confidence =
      avgRevenue > 0
        ? Math.max(0, Math.min(100, 100 - (stdDev / avgRevenue) * 100))
        : 0;

    setPredictions({
      avgRevenue: Number.isFinite(avgRevenue) ? avgRevenue : 0,
      growthRate: Number.isFinite(growthRate) ? growthRate : 0,
      predictedRevenue: Number.isFinite(predictedRevenue) ? predictedRevenue : 0,
      confidence: Number.isFinite(confidence) ? confidence : 0,
    });
  };

  const dateCellRender = (cellValue) => {
    const dateString = cellValue.format("YYYY-MM-DD");
    const festival = getFestivalForDate(dateString, festivals);

    // Get sales data for this date across multiple years
    const salesByYear = {};
    [0, 1, 2].forEach((yearsAgo) => {
      const targetDate = cellValue.subtract(yearsAgo, "year").format("YYYY-MM-DD");
      const yearData = multiYearData[yearsAgo];
      if (yearData) {
        const dayData = yearData.trends.find((t) => t.date === targetDate);
        if (dayData) {
          salesByYear[yearsAgo] = dayData;
        }
      }
    });

    const hasData = Object.keys(salesByYear).length > 0;
    const avgRevenue = hasData
      ? Object.values(salesByYear).reduce(
          (sum, data) => sum + data.revenue,
          0
        ) / Object.values(salesByYear).length
      : 0;

    return (
      <div className="flex flex-col gap-1 mt-1">
        {festival && (
          <Tooltip title={festival.name}>
            <Tag color="purple" className="m-0 text-xs w-full truncate">
              🎉 {festival.name}
            </Tag>
          </Tooltip>
        )}
        {hasData && (
          <Tooltip
            title={
              <div>
                {Object.entries(salesByYear).map(([yearsAgo, data]) => (
                  <div key={yearsAgo}>
                    {yearsAgo === "0"
                      ? "This Year"
                      : `${yearsAgo} Year${yearsAgo > 1 ? "s" : ""} Ago`}
                    : ${data.revenue.toLocaleString()} ({data.count} orders)
                  </div>
                ))}
                <div className="mt-1 pt-1 border-t border-white/20">
                  <strong>Avg: ${avgRevenue.toFixed(0)}</strong>
                </div>
              </div>
            }
          >
            <div className="text-xs text-green-600 font-medium bg-green-50 px-1 rounded">
              ${avgRevenue.toFixed(0)}
            </div>
          </Tooltip>
        )}
      </div>
    );
  };

  const onPanelChange = (newValue) => {
    setValue(newValue);
  };

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark mb-1">
            Smart Calendar & Predictions
          </h1>
          <p className="text-primary-medium">
            AI-powered insights based on 3 years of historical data
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-primary-medium whitespace-nowrap">
            Holidays:
          </span>
          <Select
            value={country}
            onChange={setCountry}
            style={{ width: 180 }}
            size="large"
            loading={festivalsLoading}
            options={COUNTRY_OPTIONS.map((c) => ({
              value: c.code,
              label: c.name,
            }))}
          />
          <Button
            type="default"
            size="large"
            icon={<Icon icon="mdi:calendar-today" />}
            onClick={() => setValue(dayjs())}
            className="border-primary-medium text-primary-dark hover:bg-accent-light"
          >
            Today
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
        />
      )}

      {/* Prediction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-accent-light">
          <Statistic
            title={
              <span className="text-primary-medium">Avg Monthly Revenue</span>
            }
            value={predictions.avgRevenue}
            precision={0}
            prefix="$"
            valueStyle={{ color: "#213555", fontSize: "24px" }}
          />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-accent-light">
          <Statistic
            title={<span className="text-primary-medium">Growth Rate</span>}
            value={predictions.growthRate}
            precision={1}
            suffix="%"
            valueStyle={{
              color: predictions.growthRate >= 0 ? "#52c41a" : "#ff4d4f",
              fontSize: "24px",
            }}
            prefix={
              predictions.growthRate >= 0 ? (
                <Icon icon="material-symbols:trending-up" />
              ) : (
                <Icon icon="material-symbols:trending-down" />
              )
            }
          />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-accent-light">
          <Statistic
            title={
              <span className="text-primary-medium">Predicted Revenue</span>
            }
            value={predictions.predictedRevenue}
            precision={0}
            prefix="$"
            valueStyle={{ color: "#1890ff", fontSize: "24px" }}
          />
          <div className="text-xs text-primary-medium mt-1">
            Next month forecast
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-accent-light">
          <div className="text-sm text-primary-medium mb-2">
            Prediction Confidence
          </div>
          <Progress
            percent={predictions.confidence}
            strokeColor={{
              "0%": "#ff4d4f",
              "50%": "#faad14",
              "100%": "#52c41a",
            }}
            railColor="#F5EFE7"
            format={(percent) => `${percent?.toFixed(0) ?? 0}%`}
          />
        </div>
      </div>

      {/* Product Sales Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-primary-dark mb-1">
              Product Sales Trend
            </h3>
            <p className="text-sm text-primary-medium">
              Daily sales comparison across 3 years
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-primary-medium whitespace-nowrap">
                View:
              </span>
              <div className="flex rounded-lg overflow-hidden border border-primary-medium">
                <button
                  onClick={() => setChartView("month")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    chartView === "month"
                      ? "bg-primary-dark text-white"
                      : "bg-white text-primary-dark hover:bg-accent-light"
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setChartView("year")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    chartView === "year"
                      ? "bg-primary-dark text-white"
                      : "bg-white text-primary-dark hover:bg-accent-light"
                  }`}
                >
                  Year
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-primary-medium whitespace-nowrap">
                Product:
              </span>
              <Select
                value={selectedProduct}
                onChange={setSelectedProduct}
                style={{ width: 200 }}
                placeholder="Choose a product"
              >
                {topProducts.map((product) => (
                  <Option key={product.name} value={product.name}>
                    {product.name}
                  </Option>
                ))}
              </Select>
            </div>
            {chartView === "month" && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-primary-medium whitespace-nowrap">
                  Month:
                </span>
                <Select
                  value={chartMonth}
                  onChange={setChartMonth}
                  style={{ width: 150 }}
                >
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((month, index) => (
                    <Option key={index} value={index}>
                      {month}
                    </Option>
                  ))}
                </Select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-primary-medium whitespace-nowrap">
                Year:
              </span>
              <Select
                value={chartYear}
                onChange={setChartYear}
                style={{ width: 120 }}
              >
                {[dayjs().year(), dayjs().year() - 1, dayjs().year() - 2].map(
                  (year) => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  )
                )}
              </Select>
            </div>
          </div>
        </div>

        {chartLoading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : productSalesData ? (
          <div className="h-[400px]">
            <Bar
              data={productSalesData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                  },
                  title: {
                    display: true,
                    text:
                      chartView === "month"
                        ? `${selectedProduct} - ${dayjs()
                            .month(chartMonth)
                            .format("MMMM")} ${chartYear}`
                        : `${selectedProduct} - ${chartYear}`,
                    font: {
                      size: 16,
                      weight: "bold",
                    },
                  },
                  tooltip: {
                    callbacks: {
                      title: (context) => {
                        return chartView === "month"
                          ? `Day ${context[0].label}`
                          : context[0].label;
                      },
                      label: (context) => {
                        return `${context.dataset.label}: ${context.parsed.y} units`;
                      },
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                    title: {
                      display: true,
                      text: "Units Sold",
                    },
                  },
                  x: {
                    title: {
                      display: true,
                      text: chartView === "month" ? "Day of Month" : "Month",
                    },
                  },
                },
              }}
            />
          </div>
        ) : (
          <div className="flex justify-center items-center py-20 text-primary-medium">
            <div className="text-center">
              <Icon
                icon="material-symbols:bar-chart"
                width="48"
                height="48"
                className="mx-auto mb-2 opacity-50"
              />
              <p>Select a product to view sales trend</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-primary-dark">
                Historical Sales Calendar
              </h3>
              <p className="text-sm text-primary-medium">
                Hover over dates to see multi-year comparison
              </p>
            </div>
            <Button
              size="middle"
              icon={<Icon icon="mdi:calendar-today" />}
              onClick={() => setValue(dayjs())}
            >
              Go to Today
            </Button>
          </div>
          <Calendar
            value={value}
            onPanelChange={onPanelChange}
            onSelect={setValue}
            dateCellRender={dateCellRender}
          />
        </div>

        {/* Insights Panel */}
        <div className="space-y-6">
          {/* Year-over-Year Comparison */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
            <h3 className="text-lg font-bold text-primary-dark mb-4 flex items-center gap-2">
              <Icon
                icon="material-symbols:compare-arrows"
                className="text-blue-500"
              />
              Year-over-Year
            </h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <Spin />
              </div>
            ) : (
              <div className="max-h-[280px] overflow-y-auto overflow-x-hidden pr-1 space-y-3">
                {[0, 1, 2].map((yearsAgo) => {
                  const yearData = multiYearData[yearsAgo];
                  if (!yearData) return null;

                  const yearLabel =
                    yearsAgo === 0
                      ? "This Year"
                      : yearsAgo === 1
                      ? "Last Year"
                      : "2 Years Ago";

                  return (
                    <div
                      key={yearsAgo}
                      className="p-3 rounded-lg bg-accent-light/30"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-primary-dark">
                          {yearLabel}
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          ${yearData.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-primary-medium">
                        {yearData.totalOrders} orders
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Festivals */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
            <h3 className="text-lg font-bold text-primary-dark mb-4 flex items-center gap-2">
              <Icon
                icon="material-symbols:celebration"
                className="text-purple-500"
              />
              Upcoming Festivals
            </h3>
            <div className="max-h-[280px] overflow-y-auto overflow-x-hidden pr-1">
            <List
              dataSource={upcomingFestivals}
              renderItem={(item) => (
                <List.Item className="px-0 py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3 w-full">
                    <div className="bg-purple-100 text-purple-600 p-2 rounded-lg">
                      <Icon icon="material-symbols:event" width="20" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-primary-dark">
                        {item.name}
                      </div>
                      <div className="text-xs text-primary-medium">
                        {dayjs(item.date).format("MMMM D, YYYY")}
                      </div>
                    </div>
                    <Tag color="purple">
                      {item.daysUntil === 0
                        ? "Today"
                        : item.daysUntil === 1
                        ? "Tomorrow"
                        : `${item.daysUntil} days`}
                    </Tag>
                  </div>
                </List.Item>
              )}
              locale={{ emptyText: "No festivals in the next 60 days" }}
            />
            </div>
          </div>

          {/* Smart Stock Suggestions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
            <h3 className="text-lg font-bold text-primary-dark mb-4 flex items-center gap-2">
              <Icon
                icon="material-symbols:lightbulb"
                className="text-yellow-500"
              />
              Smart Suggestions
            </h3>

            <Alert
              message="Multi-Year Analysis"
              description="These products consistently perform well during this period across all years."
              type="success"
              showIcon
              className="mb-4"
            />

            {loading ? (
              <div className="flex justify-center py-8">
                <Spin />
              </div>
            ) : (
              <div className="max-h-[280px] overflow-y-auto overflow-x-hidden pr-1">
                <List
                  dataSource={topProducts}
                  renderItem={(item) => (
                    <List.Item className="px-0 py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3 w-full">
                        <div className="bg-yellow-100 text-yellow-600 p-2 rounded-lg">
                          <Icon icon="material-symbols:inventory-2" width="20" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-primary-dark">
                            {item.name}
                          </div>
                          <div className="text-xs text-primary-medium">
                            {item.totalQuantity} units sold • {item.years} year
                            {item.years > 1 ? "s" : ""} data
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            ${item.totalRevenue.toLocaleString()}
                          </div>
                          <div className="text-xs text-primary-medium">
                            ${(item.totalRevenue / item.years).toFixed(0)}/yr
                          </div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                  locale={{ emptyText: "No historical data available" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartCalendar;
