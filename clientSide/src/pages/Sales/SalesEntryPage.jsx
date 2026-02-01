import { useState, useEffect } from "react";
import {
  App,
  Form,
  Select,
  InputNumber,
  Button,
  Table,
  Empty,
  Badge,
  Tooltip,
  Tag,
  Space,
  Spin,
  DatePicker,
} from "antd";
import dayjs from "dayjs";
import { Icon } from "@iconify/react";
import IconButton from "../../components/IconButton";
import Scanner from "../../components/Scanner/Scanner";
import { SCANNER_MODES } from "../../config/scannerConfig";
import { productService } from "../../services/productService";
import salesService from "../../services/salesService";
import { useNavigate } from "react-router-dom";

const { Option } = Select;

const SalesEntryPage = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [saleItems, setSaleItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saleDate, setSaleDate] = useState(() => dayjs());

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll({ limit: 1000 }); // Get all products for sales entry
      // Handle both old array format and new paginated format
      const productsData = data.products || data;
      const productsArray = Array.isArray(productsData) ? productsData : [];

      // Transform API data to match component format
      const transformedData = productsArray.map((product) => ({
        id: product._id,
        name: product.name,
        category: product.category || "Uncategorized",
        sellingPrice: product.sellingPrice || 0,
        purchasePrice: product.purchasePrice || 0,
        stock: product.stock || 0,
        sku: product.sku || "N/A",
      }));
      setProducts(transformedData);
    } catch (error) {
      console.error("Error fetching products:", error);
      message.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Calculate total price based on selected product and quantity
  const calculateTotal = () => {
    if (selectedProduct && quantity > 0) {
      const product = products.find((p) => p.id === selectedProduct);
      return product ? product.sellingPrice * quantity : 0;
    }
    return 0;
  };

  // Calculate profit for a sale item
  const calculateProfit = (productId, qty) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      return (product.sellingPrice - product.purchasePrice) * qty;
    }
    return 0;
  };

  // Handle barcode scan
  const handleScan = async (result) => {
    try {
      // Look up product by barcode
      const product = await productService.findByBarcode(result.code);

      // Check if product exists in our mock data (in real app, this comes from API)
      const mockProduct = products.find(
        (p) => p.id === product._id || p.name === product.name
      );

      if (!mockProduct) {
        message.error({
          content: `Product ${product.name} not found in inventory`,
          icon: <Icon icon="mdi:alert-octagon" />,
        });
        return;
      }

      if (mockProduct.stock === 0) {
        message.error({
          content: `${mockProduct.name} is out of stock`,
          icon: <Icon icon="mdi:alert-octagon" />,
        });
        return;
      }

      // Check if product already exists in sale items
      const existingItem = saleItems.find(
        (item) => item.productId === mockProduct.id
      );

      if (existingItem) {
        // Check stock before incrementing
        if (existingItem.quantity + 1 > mockProduct.stock) {
          message.error({
            content: `Only ${mockProduct.stock} units available for ${mockProduct.name}`,
            icon: <Icon icon="mdi:alert-octagon" />,
          });
          return;
        }

        // Update quantity
        setSaleItems(
          saleItems.map((item) =>
            item.productId === mockProduct.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  totalPrice: (item.quantity + 1) * mockProduct.sellingPrice,
                  profit: calculateProfit(mockProduct.id, item.quantity + 1),
                }
              : item
          )
        );
        message.success({
          content: `${mockProduct.name} quantity updated to ${
            existingItem.quantity + 1
          }`,
          icon: <Icon icon="mdi:check-circle" />,
        });
      } else {
        // Add new item
        const newItem = {
          key: `${mockProduct.id}-${Date.now()}`,
          productId: mockProduct.id,
          productName: mockProduct.name,
          category: mockProduct.category,
          quantity: 1,
          unitPrice: mockProduct.sellingPrice,
          totalPrice: mockProduct.sellingPrice,
          profit: calculateProfit(mockProduct.id, 1),
          profitMargin: (
            ((mockProduct.sellingPrice - mockProduct.purchasePrice) /
              mockProduct.sellingPrice) *
            100
          ).toFixed(1),
        };
        setSaleItems([...saleItems, newItem]);
        message.success({
          content: `${mockProduct.name} added to cart`,
          icon: <Icon icon="mdi:cart-check" />,
          duration: 2,
        });
      }
    } catch (error) {
      if (error.response?.status === 404) {
        message.error({
          content: `No product found with barcode: ${result.code}`,
          icon: <Icon icon="mdi:barcode-off" />,
        });
      } else {
        message.error({
          content: "Failed to lookup product. Please try again.",
          icon: <Icon icon="mdi:alert-circle" />,
        });
      }
    }
  };

  // Add product to sale items
  const handleAddItem = () => {
    if (!selectedProduct) {
      message.warning("Please select a product");
      return;
    }
    if (!quantity || quantity <= 0) {
      message.warning("Please enter a valid quantity");
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);

    if (quantity > product.stock) {
      message.error(`Only ${product.stock} units available in stock`);
      return;
    }

    // Check if product already exists in sale items
    const existingItem = saleItems.find(
      (item) => item.productId === selectedProduct
    );

    if (existingItem) {
      // Update quantity
      setSaleItems(
        saleItems.map((item) =>
          item.productId === selectedProduct
            ? {
                ...item,
                quantity: item.quantity + quantity,
                totalPrice: (item.quantity + quantity) * product.sellingPrice,
                profit: calculateProfit(
                  selectedProduct,
                  item.quantity + quantity
                ),
              }
            : item
        )
      );
      message.success(`Updated ${product.name} quantity`);
    } else {
      // Add new item
      const newItem = {
        key: `${selectedProduct}-${Date.now()}`,
        productId: selectedProduct,
        productName: product.name,
        category: product.category,
        quantity: quantity,
        unitPrice: product.sellingPrice,
        totalPrice: calculateTotal(),
        profit: calculateProfit(selectedProduct, quantity),
        profitMargin: (
          ((product.sellingPrice - product.purchasePrice) /
            product.sellingPrice) *
          100
        ).toFixed(1),
      };
      setSaleItems([...saleItems, newItem]);
      message.success(`${product.name} added to cart`);
    }

    // Reset form
    setSelectedProduct(null);
    setQuantity(1);
    setSearchValue("");
    form.resetFields();
  };

  // Remove item from sale
  const handleRemoveItem = (key) => {
    const item = saleItems.find((i) => i.key === key);
    setSaleItems(saleItems.filter((item) => item.key !== key));
    message.info(`${item.productName} removed from cart`);
  };

  // Update quantity inline
  const handleQuantityChange = (key, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(key);
      return;
    }

    const item = saleItems.find((i) => i.key === key);
    const product = products.find((p) => p.id === item.productId);

    if (newQty > product.stock) {
      message.error(`Only ${product.stock} units available`);
      return;
    }

    setSaleItems(
      saleItems.map((i) =>
        i.key === key
          ? {
              ...i,
              quantity: newQty,
              totalPrice: newQty * i.unitPrice,
              profit: calculateProfit(i.productId, newQty),
            }
          : i
      )
    );
  };

  // Calculate current sale totals
  const getCurrentSaleTotal = () => {
    return saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const getCurrentSaleProfit = () => {
    return saleItems.reduce((sum, item) => sum + item.profit, 0);
  };

  // Submit sale
  const handleSubmitSale = async () => {
    if (saleItems.length === 0) {
      message.warning("Please add at least one item to the sale");
      return;
    }

    try {
      setSubmitting(true);

      // Format sale data for API (include selected sale date)
      const dateStr = saleDate ? dayjs(saleDate).format("YYYY-MM-DD") : null;
      const saleData = salesService.formatSaleData(saleItems, dateStr);

      // Validate before submission
      const validation = salesService.validateSaleItems(saleData.items);
      if (!validation.valid) {
        message.error(validation.error);
        return;
      }

      // Submit to backend
      const createdSale = await salesService.create(saleData);

      message.success(
        `Sale completed! Total: $${createdSale.totalAmount.toFixed(2)}`
      );

      // Clear cart and navigate
      setSaleItems([]);
      navigate("/sales");
    } catch (error) {
      console.error("Error submitting sale:", error);

      if (error.response?.status === 400) {
        message.error(error.response.data.message || "Invalid sale data");
      } else if (error.response?.status === 404) {
        message.error("One or more products not found");
      } else {
        message.error("Failed to complete sale. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Get profit margin color
  const getProfitColor = (margin) => {
    if (margin >= 30) return "green";
    if (margin >= 15) return "gold";
    return "red";
  };

  // Table columns for sale items
  const columns = [
    {
      title: "Product",
      dataIndex: "productName",
      key: "productName",
      render: (text, record) => (
        <div>
          <div className="font-semibold text-primary-dark mb-1">{text}</div>
          <Tag color="blue" className="text-xs">
            {record.category}
          </Tag>
        </div>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: 140,
      render: (qty, record) => (
        <div className="flex items-center gap-2">
          <Button
            size="small"
            icon={<Icon icon="mdi:minus" width="14" />}
            onClick={() => handleQuantityChange(record.key, qty - 1)}
            className="flex items-center justify-center"
          />
          <span className="font-semibold text-primary-dark min-w-[30px] text-center">
            {qty}
          </span>
          <Button
            size="small"
            icon={<Icon icon="mdi:plus" width="14" />}
            onClick={() => handleQuantityChange(record.key, qty + 1)}
            className="flex items-center justify-center"
          />
        </div>
      ),
    },
    {
      title: "Unit Price",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 100,
      render: (price) => (
        <span className="text-primary-medium font-medium">
          ${price.toFixed(2)}
        </span>
      ),
    },
    {
      title: "Total",
      dataIndex: "totalPrice",
      key: "totalPrice",
      width: 110,
      render: (total) => (
        <span className="font-bold text-primary-dark text-lg">
          ${total.toFixed(2)}
        </span>
      ),
    },
    {
      title: "Profit",
      dataIndex: "profitMargin",
      key: "profitMargin",
      width: 100,
      render: (margin, record) => (
        <Tooltip title={`Profit: $${record.profit.toFixed(2)}`}>
          <Tag
            color={getProfitColor(parseFloat(margin))}
            className="font-semibold"
          >
            {margin}%
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 70,
      render: (_, record) => (
        <IconButton
          variant="delete"
          size="small"
          onClick={() => handleRemoveItem(record.key)}
          tooltip="Remove item"
        />
      ),
    },
  ];

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <IconButton
            variant="secondary"
            icon="mdi:arrow-left"
            onClick={() => navigate("/sales")}
            tooltip="Back to Sales History"
          />
          <div>
            <h1 className="text-2xl font-bold text-primary-dark m-0 flex items-center gap-2">
              <Icon icon="mdi:point-of-sale" className="text-primary-medium" />
              New Sale Entry
            </h1>
            <p className="text-primary-medium text-sm mt-1 opacity-80">
              Process a new sales transaction
            </p>
          </div>
        </div>
        {saleItems.length > 0 && (
          <Badge
            count={saleItems.length}
            className="bg-primary-medium"
            style={{ backgroundColor: "#3E5879" }}
            showZero
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT SIDE – Sales Entry + Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Items Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-2 border-b border-accent-light">
              <div className="flex items-center gap-2">
                <Icon
                  icon="mdi:cart-plus"
                  width="24"
                  className="text-primary-medium"
                />
                <h3 className="text-lg font-bold text-primary-dark m-0">
                  Add Items
                </h3>
              </div>
              <Form.Item
                label="Sale Date"
                className="mb-0"
                style={{ marginBottom: 0 }}
              >
                <DatePicker
                  value={saleDate}
                  onChange={(date) => setSaleDate(date || dayjs())}
                  size="large"
                  format="MMM D, YYYY"
                  allowClear={false}
                  className="min-w-[180px]"
                />
              </Form.Item>
            </div>

            <Form form={form} layout="vertical">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Product Select */}
                <div className="md:col-span-6">
                  <Form.Item label="Select Product" className="mb-0">
                    <Select
                      showSearch
                      placeholder="Search by name, category, or SKU..."
                      value={selectedProduct}
                      onChange={setSelectedProduct}
                      onSearch={setSearchValue}
                      searchValue={searchValue}
                      suffixIcon={<Icon icon="mdi:magnify" />}
                      size="large"
                      loading={loading}
                      filterOption={(input, option) => {
                        const product = products.find(
                          (p) => p.id === option.value
                        );
                        if (!product) return false;
                        const searchLower = input.toLowerCase();
                        return (
                          product.name.toLowerCase().includes(searchLower) ||
                          product.category
                            .toLowerCase()
                            .includes(searchLower) ||
                          product.sku.toLowerCase().includes(searchLower)
                        );
                      }}
                      optionLabelProp="label"
                    >
                      {products.map((product) => (
                        <Option
                          key={product.id}
                          value={product.id}
                          disabled={product.stock === 0}
                          label={`${product.name} - $${product.sellingPrice}`}
                        >
                          <div className="flex justify-between items-center py-1">
                            <div>
                              <div className="font-semibold text-primary-dark">
                                {product.name}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Tag color="blue" className="m-0 text-[10px]">
                                  {product.category}
                                </Tag>
                                <span>SKU: {product.sku}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary-dark">
                                ${product.sellingPrice}
                              </div>
                              <div
                                className={`text-xs ${
                                  product.stock === 0
                                    ? "text-red-500"
                                    : product.stock <= 10
                                    ? "text-orange-500"
                                    : "text-green-500"
                                }`}
                              >
                                {product.stock === 0
                                  ? "Out of Stock"
                                  : `${product.stock} left`}
                              </div>
                            </div>
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>

                {/* Quantity */}
                <div className="md:col-span-3">
                  <Form.Item label="Quantity" className="mb-0">
                    <InputNumber
                      min={1}
                      value={quantity}
                      onChange={setQuantity}
                      className="w-full"
                      size="large"
                      controls={{
                        upIcon: <Icon icon="mdi:plus" />,
                        downIcon: <Icon icon="mdi:minus" />,
                      }}
                    />
                  </Form.Item>
                </div>

                {/* Total Display */}
                <div className="md:col-span-3">
                  <Form.Item label="Item Total" className="mb-0">
                    <div className="h-[40px] bg-gray-50 border border-gray-200 rounded-lg flex items-center px-3 font-bold text-primary-dark text-lg">
                      ${calculateTotal().toFixed(2)}
                    </div>
                  </Form.Item>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Button
                  type="primary"
                  size="large"
                  icon={<Icon icon="mdi:cart-arrow-down" />}
                  onClick={handleAddItem}
                  disabled={!selectedProduct || !quantity}
                  className="flex-1 bg-primary-dark hover:bg-primary-medium flex items-center justify-center gap-2"
                >
                  Add to Cart
                </Button>
                <Tooltip title="Scan Barcode">
                  <Button
                    size="large"
                    icon={<Icon icon="mdi:barcode-scan" />}
                    onClick={() => setScannerOpen(true)}
                    className="border-green-600 text-green-600 hover:text-green-700 hover:border-green-700"
                  />
                </Tooltip>
              </div>
            </Form>
          </div>

          {/* Cart Items */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light min-h-[300px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon
                  icon="mdi:cart"
                  width="24"
                  className="text-primary-medium"
                />
                <h3 className="text-lg font-bold text-primary-dark m-0">
                  Shopping Cart
                </h3>
              </div>
              {saleItems.length > 0 && (
                <Button
                  type="text"
                  danger
                  icon={<Icon icon="mdi:delete-outline" />}
                  onClick={() => {
                    setSaleItems([]);
                    message.info("Cart cleared");
                  }}
                >
                  Clear Cart
                </Button>
              )}
            </div>

            {saleItems.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Your cart is empty"
                className="py-12"
              />
            ) : (
              <Table
                columns={columns}
                dataSource={saleItems}
                pagination={false}
                size="middle"
                className="border border-gray-100 rounded-lg overflow-hidden"
              />
            )}
          </div>
        </div>

        {/* RIGHT SIDE – Sale Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light sticky top-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-accent-light">
              <Icon
                icon="mdi:receipt-text-outline"
                width="24"
                className="text-primary-medium"
              />
              <h3 className="text-lg font-bold text-primary-dark m-0">
                Sale Summary
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600 font-medium">Items Count</span>
                <span className="text-xl font-bold text-primary-dark">
                  {saleItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>

              <div className="p-4 bg-primary-light/10 rounded-xl border border-primary-light/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-primary-medium font-medium">
                    Subtotal
                  </span>
                  <span className="text-2xl font-bold text-primary-dark">
                    ${getCurrentSaleTotal().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-600 flex items-center gap-1">
                    <Icon icon="mdi:trending-up" />
                    Est. Profit
                  </span>
                  <span className="text-green-600 font-bold">
                    +${getCurrentSaleProfit().toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                type="primary"
                size="large"
                block
                icon={<Icon icon="mdi:check-circle-outline" />}
                onClick={handleSubmitSale}
                disabled={saleItems.length === 0}
                loading={submitting}
                className="h-12 text-lg font-bold bg-green-600 hover:bg-green-700 border-none flex items-center justify-center gap-2 mt-4"
              >
                Complete Sale
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scanner Modal */}
      {scannerOpen && (
        <Scanner
          mode={SCANNER_MODES.CHECKOUT}
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
          isOpen={scannerOpen}
        />
      )}
    </div>
  );
};

export default SalesEntryPage;
