import React, { useState, useEffect } from "react";
import {
  App,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  Spin,
} from "antd";
import { Icon } from "@iconify/react";
import IconButton from "../../components/IconButton";
import InventoryScanner from "../../components/InventoryScanner/InventoryScanner";
import { useNavigate } from "react-router-dom";
import inventoryService from "../../services/inventoryService";
import productService from "../../services/productService";
import { useDebounce } from "../../hooks/useDebounce";
import { useCurrency } from "../../hooks/useCurrency";

const { Search } = Input;
const { Option } = Select;

const Inventory = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { symbol } = useCurrency();
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    totalValue: 0,
  });

  // Debounce search text
  const debouncedSearch = useDebounce(searchText, 500);

  // Fetch products from API with pagination
  useEffect(() => {
    fetchProducts();
  }, [
    debouncedSearch,
    categoryFilter,
    stockFilter,
    pagination.current,
    pagination.pageSize,
  ]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll({
        page: pagination.current,
        limit: pagination.pageSize,
        search: debouncedSearch,
        category: categoryFilter !== "all" ? categoryFilter : "",
        stockFilter: stockFilter !== "all" ? stockFilter : "",
      });

      // Handle paginated response
      const productsData = data.products || data;
      const paginationData = data.pagination;

      // Transform API data to match table format
      const transformedData = productsData.map((product) => ({
        key: product._id,
        _id: product._id,
        name: product.name,
        category: product.category || "Uncategorized",
        purchasePrice: product.purchasePrice || 0,
        sellingPrice: product.sellingPrice || 0,
        stock: product.stock || 0,
        expiryDate: product.expiryDate || null,
        sku: product.sku,
        barcode: product.barcode,
      }));

      setProducts(transformedData);

      // Update pagination if available
      if (paginationData) {
        setPagination((prev) => ({
          ...prev,
          total: paginationData.total,
        }));
      }

      // Calculate stats (fetch all for stats if needed)
      calculateStats(
        transformedData,
        paginationData?.total || transformedData.length
      );
    } catch (error) {
      console.error("Error fetching products:", error);
      message.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data, total) => {
    const totalProducts = total || data.length;
    const lowStock = data.filter((p) => p.stock <= 10).length;
    const totalValue = data.reduce(
      (sum, p) => sum + p.stock * p.sellingPrice,
      0
    );
    setStats({ totalProducts, lowStock, totalValue });
  };

  const categories = [
    "Electronics",
    "Accessories",
    "Furniture",
    "Office Supplies",
    "Clothing",
    "Footwear",
    "Home & Kitchen",
    "Beauty & Personal Care",
    "Sports & Outdoors",
    "Toys & Games",
    "Books & Stationery",
    "Other",
  ];

  // Table columns
  const columns = [
    {
      title: "Product Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => (
        <span className="font-medium text-primary-dark">{text}</span>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      filters: categories.map((cat) => ({ text: cat, value: cat })),
      onFilter: (value, record) => record.category === value,
      render: (category) => (
        <Tag color="blue" className="text-primary-dark font-medium">
          {category}
        </Tag>
      ),
    },
    {
      title: "Purchase Price",
      dataIndex: "purchasePrice",
      key: "purchasePrice",
      sorter: (a, b) => a.purchasePrice - b.purchasePrice,
      render: (price) => <span className="text-primary-medium">${price}</span>,
    },
    {
      title: "Selling Price",
      dataIndex: "sellingPrice",
      key: "sellingPrice",
      sorter: (a, b) => a.sellingPrice - b.sellingPrice,
      render: (price) => (
        <span className="text-primary-dark font-bold">${price}</span>
      ),
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      sorter: (a, b) => a.stock - b.stock,
      render: (stock) => {
        let color = "green";
        if (stock === 0) color = "red";
        else if (stock <= 10) color = "gold";

        return (
          <Tag color={color} className="font-semibold min-w-[60px] text-center">
            {stock} units
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <IconButton
            variant="edit"
            onClick={() => handleEdit(record)}
            tooltip="Edit product"
          />
          <Popconfirm
            title="Delete Product"
            description="Are you sure you want to delete this product?"
            onConfirm={() => handleDelete(record.key)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ className: "bg-primary-dark" }}
          >
            <IconButton variant="delete" tooltip="Delete product" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    navigate("/inventory/add");
  };

  const handleEdit = (product) => {
    navigate(`/inventory/edit/${product.key}`);
  };

  const handleDelete = async (key) => {
    try {
      await productService.delete(key);
      message.success("Product deleted successfully");
      // Refresh products list
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      message.error("Failed to delete product");
    }
  };

  const handleScannerClose = (scannedItems) => {
    setScannerOpen(false);
    if (scannedItems && scannedItems.length > 0) {
      message.success({
        content: `Successfully updated ${scannedItems.length} product(s)`,
        icon: <Icon icon="mdi:check-circle" />,
        duration: 3,
      });
      // Refresh products from API
      fetchProducts();
    }
  };

  const handleStockUpdate = (updatedItem) => {
    // Real-time update as items are scanned
    const updatedProducts = products.map((p) => {
      if (p.key === updatedItem._id || p.name === updatedItem.name) {
        return { ...p, stock: updatedItem.newStock };
      }
      return p;
    });
    setProducts(updatedProducts);
    calculateStats(updatedProducts);
  };

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
            Inventory Management
          </h1>
          <p className="text-primary-medium">
            Manage your products, stock levels, and pricing
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            icon={<Icon icon="mdi:barcode-scan" />}
            onClick={() => setScannerOpen(true)}
            size="large"
            className="flex items-center gap-2 border-green-600 text-green-600 hover:text-green-700 hover:border-green-700"
          >
            Scan Stock
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<Icon icon="material-symbols:add" />}
            className="bg-primary-dark hover:bg-primary-medium flex items-center gap-2"
            onClick={handleAdd}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Total Products"
          value={stats.totalProducts}
          icon="mdi:package-variant-closed"
          color="blue"
        />
        <SummaryCard
          title="Low Stock Items"
          value={stats.lowStock}
          icon="mdi:alert-circle-outline"
          color="red"
        />
        <SummaryCard
          title="Total Value"
          value={`$${stats.totalValue.toLocaleString()}`}
          icon="mdi:currency-usd"
          color="green"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 lg:col-span-5">
            <Search
              placeholder="Search products..."
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
          <div className="md:col-span-3 lg:col-span-3">
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              className="w-full"
              size="large"
              placeholder="Category"
            >
              <Option value="all">All Categories</Option>
              {categories.map((cat) => (
                <Option key={cat} value={cat}>
                  {cat}
                </Option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-3 lg:col-span-4">
            <Select
              value={stockFilter}
              onChange={setStockFilter}
              className="w-full"
              size="large"
              placeholder="Stock Level"
            >
              <Option value="all">All Stock</Option>
              <Option value="available">In Stock (&gt;10)</Option>
              <Option value="low">Low Stock (≤10)</Option>
              <Option value="out">Out of Stock</Option>
            </Select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-accent-light overflow-hidden">
        <Spin spinning={loading} tip="Loading products...">
          <Table
            columns={columns}
            dataSource={products}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} products`,
              className: "p-4",
              onChange: (page, pageSize) => {
                setPagination((prev) => ({
                  ...prev,
                  current: page,
                  pageSize: pageSize,
                }));
              },
            }}
            scroll={{ x: 800 }}
          />
        </Spin>
      </div>

      {/* Inventory Scanner Modal */}
      {scannerOpen && (
        <InventoryScanner
          onClose={handleScannerClose}
          onUpdate={handleStockUpdate}
        />
      )}
    </div>
  );
};

export default Inventory;
