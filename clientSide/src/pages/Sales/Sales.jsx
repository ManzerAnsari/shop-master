import React, { useState, useEffect } from "react";
import {
  App,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  DatePicker,
  FloatButton,
  Modal,
} from "antd";
import { Icon } from "@iconify/react";
import IconButton from "../../components/IconButton";
import { useNavigate } from "react-router-dom";
import salesService from "../../services/salesService";
import dayjs from "dayjs";

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Sales = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  // Fetch sales data
  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const data = await salesService.getAll();
      // Handle both old array format and new paginated format
      const salesData = data.sales || data;
      setSalesHistory(Array.isArray(salesData) ? salesData : []);
    } catch (error) {
      console.error("Error fetching sales:", error);
      message.error("Failed to load sales history");
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary stats
  const salesArray = Array.isArray(salesHistory) ? salesHistory : [];
  const totalRevenue = salesArray.reduce(
    (sum, s) => sum + (s.totalAmount || 0),
    0
  );
  const totalTransactions = salesArray.length;
  // Assuming API returns a status, otherwise default to 'Completed'
  const pendingOrders = salesArray.filter((s) => s.status === "Pending").length;

  // Filter data
  const filteredSales = salesArray.filter((sale) => {
    const matchesSearch =
      sale._id?.toLowerCase().includes(searchText.toLowerCase()) ||
      (sale.customerName &&
        sale.customerName.toLowerCase().includes(searchText.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" ||
      (sale.status && sale.status.toLowerCase() === statusFilter);
    return matchesSearch && matchesStatus;
  });

  const handleViewSale = (record) => {
    setSelectedSale(record);
    setViewModalOpen(true);
  };

  const handleDownloadInvoice = (record) => {
    try {
      const dateStr = dayjs(record.date).format("YYYY-MM-DD");
      const lines = [
        "INVOICE",
        `Invoice #${(record._id || "").slice(-8).toUpperCase()}`,
        `Date: ${dayjs(record.date).format("MMM D, YYYY")}`,
        "",
        "ITEMS",
        "----------------------------------------",
        ...(record.items || []).map(
          (item) =>
            `${item.name || "Item"} x ${item.qty || 0} @ $${(item.unitPrice || 0).toFixed(2)} = $${((item.qty || 0) * (item.unitPrice || 0)).toFixed(2)}`
        ),
        "----------------------------------------",
        `Subtotal: $${(record.totalAmount || 0).toFixed(2)}`,
        `Profit: $${(record.totalProfit || 0).toFixed(2)}`,
      ];
      const content = lines.join("\n");
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${(record._id || "sale").slice(-6)}-${dateStr}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success("Invoice downloaded");
    } catch (err) {
      console.error("Download invoice error:", err);
      message.error("Failed to download invoice");
    }
  };

  const columns = [
    {
      title: "Invoice ID",
      dataIndex: "_id",
      key: "_id",
      render: (text) => (
        <span className="font-medium text-primary-dark">
          #{text ? String(text).slice(-6).toUpperCase() : "—"}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (text) => (
        <span className="text-gray-500">
          {text ? dayjs(text).format("MMM D, YYYY") : "—"}
        </span>
      ),
    },
    {
      title: "Items",
      dataIndex: "items",
      key: "items",
      render: (items) => (
        <Tag color="blue" className="text-primary-dark font-medium">
          {items ? items.length : 0} items
        </Tag>
      ),
    },
    {
      title: "Total",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount) => (
        <span className="font-bold text-primary-dark">
          ${amount ? amount.toFixed(2) : "0.00"}
        </span>
      ),
    },
    {
      title: "Profit",
      dataIndex: "totalProfit",
      key: "totalProfit",
      render: (profit) => (
        <span className="text-green-600 font-medium">
          +${profit ? profit.toFixed(2) : "0.00"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <IconButton
            variant="view"
            tooltip="View Details"
            size="small"
            onClick={() => handleViewSale(record)}
          />
          <IconButton
            variant="download"
            tooltip="Download Invoice"
            size="small"
            onClick={() => handleDownloadInvoice(record)}
          />
        </Space>
      ),
    },
  ];

  // Summary Card Component
  const SummaryCard = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light flex items-center justify-between">
      <div>
        <p className="text-primary-medium text-sm font-medium uppercase tracking-wider mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-primary-dark">{value}</h3>
      </div>
      <div className={`text-${color}-600`}>
        <Icon icon={icon} width="32" />
      </div>
    </div>
  );

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark mb-1">
            Sales History
          </h1>
          <p className="text-primary-medium">
            View and manage past sales transactions
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<Icon icon="material-symbols:add" />}
          onClick={() => navigate("/sales/new")}
          className="bg-primary-dark hover:bg-primary-medium flex items-center gap-2"
        >
          New Sale
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon="mdi:currency-usd"
          color="green"
        />
        <SummaryCard
          title="Total Transactions"
          value={totalTransactions}
          icon="mdi:receipt-text"
          color="blue"
        />
        <SummaryCard
          title="Avg. Order Value"
          value={`$${
            totalTransactions > 0
              ? (totalRevenue / totalTransactions).toFixed(2)
              : "0.00"
          }`}
          icon="mdi:chart-line"
          color="orange"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5 lg:col-span-5">
            <Search
              placeholder="Search by Invoice ID..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="large"
              prefix={
                <Icon
                  icon="material-symbols:search"
                  className="text-gray-400"
                />
              }
            />
          </div>
          <div className="md:col-span-4 lg:col-span-4">
            <RangePicker className="w-full" size="large" format="YYYY-MM-DD" />
          </div>
          <div className="md:col-span-3 lg:col-span-3">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full"
              size="large"
              placeholder="Status"
            >
              <Option value="all">All Status</Option>
              <Option value="completed">Completed</Option>
              <Option value="pending">Pending</Option>
              <Option value="refunded">Refunded</Option>
            </Select>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-accent-light overflow-hidden">
        <Table
          columns={columns}
          dataSource={filteredSales}
          loading={loading}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} transactions`,
            className: "p-4",
          }}
          scroll={{ x: 800 }}
        />
      </div>

      {/* View Sale Details Modal */}
      <Modal
        title={
          <span className="flex items-center gap-2">
            <Icon icon="mdi:receipt-text" />
            Sale Details #{selectedSale?._id?.slice(-6).toUpperCase() || ""}
          </span>
        }
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<Icon icon="mdi:download" />}
            onClick={() => {
              if (selectedSale) handleDownloadInvoice(selectedSale);
            }}
            style={{ background: "#3E5879" }}
          >
            Download Invoice
          </Button>,
        ]}
        width={560}
      >
        {selectedSale && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="font-medium">
                {dayjs(selectedSale.date).format("MMM D, YYYY")}
              </span>
            </div>
            <div className="border-t border-b border-gray-200 py-3 my-3">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Items
              </div>
              {(selectedSale.items || []).map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between py-1.5 text-sm"
                >
                  <span>
                    {item.name} × {item.qty}
                  </span>
                  <span>
                    ${((item.qty || 0) * (item.unitPrice || 0)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>${(selectedSale.totalAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Profit</span>
              <span>+${(selectedSale.totalProfit || 0).toFixed(2)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Floating Action Button for Mobile */}
      <FloatButton
        icon={<Icon icon="material-symbols:add" width="24" height="24" />}
        type="primary"
        onClick={() => navigate("/sales/new")}
        className="md:hidden"
        style={{
          background: "#3E5879",
          width: "56px",
          height: "56px",
        }}
        tooltip="New Sale"
      />
    </div>
  );
};

export default Sales;
