import React, { useEffect, useState } from "react";
import {
  App,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Modal,
  Space,
} from "antd";
import { Icon } from "@iconify/react";
import IconButton from "../../components/IconButton";
import { useNavigate, useParams } from "react-router-dom";
import qrCodeService from "../../services/qrCodeService";
import productService from "../../services/productService";
import dayjs from "dayjs";

const { Option } = Select;

const InventoryFormPage = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const currencies = [
    { label: "USD ($)", value: "USD", symbol: "$" },
    { label: "EUR (€)", value: "EUR", symbol: "€" },
    { label: "GBP (£)", value: "GBP", symbol: "£" },
    { label: "INR (₹)", value: "INR", symbol: "₹" },
    { label: "JPY (¥)", value: "JPY", symbol: "¥" },
  ];

  const getCategoryIcon = (category) => {
    const iconMap = {
      Electronics: "mdi:laptop",
      Accessories: "mdi:headphones",
      Furniture: "mdi:sofa",
      "Office Supplies": "mdi:paperclip",
      Clothing: "mdi:tshirt-crew",
      Footwear: "mdi:shoe-sneaker",
      "Home & Kitchen": "mdi:pot-steam",
      "Beauty & Personal Care": "mdi:lipstick",
      "Sports & Outdoors": "mdi:basketball",
      "Toys & Games": "mdi:robot",
      "Books & Stationery": "mdi:book-open-variant",
      Other: "mdi:dots-horizontal",
    };
    return iconMap[category] || "mdi:package-variant";
  };

  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    } else {
      // Set default currency for new products
      form.setFieldsValue({ currency: "USD" });
    }
  }, [id, isEditing]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const product = await productService.getById(id);
      if (product) {
        // Format date for DatePicker if exists
        const formattedProduct = {
          ...product,
          expiryDate: product.expiryDate ? dayjs(product.expiryDate) : null,
        };
        form.setFieldsValue(formattedProduct);
        setCurrentProduct(product);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      message.error("Failed to load product details");
      navigate("/inventory");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      // Format date back to string/Date object if needed
      const productData = {
        ...values,
        expiryDate: values.expiryDate ? values.expiryDate.toDate() : null,
      };

      if (isEditing) {
        await productService.update(id, productData);
        message.success("Product updated successfully");
      } else {
        await productService.create(productData);
        message.success("Product added successfully");
      }
      navigate("/inventory");
    } catch (error) {
      console.error("Error saving product:", error);
      message.error("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
    message.error("Please check the form for errors");
  };

  const handleGenerateQRCode = async () => {
    if (!isEditing || !currentProduct) {
      message.warning(
        "Please save the product first before generating QR code"
      );
      return;
    }

    setGeneratingQR(true);
    try {
      const qrDataUrl = await qrCodeService.generateQRCode(currentProduct._id, {
        width: 300,
        margin: 2,
      });
      setQrCodeDataUrl(qrDataUrl);
      setQrModalVisible(true);
    } catch (error) {
      message.error("Failed to generate QR code: " + error.message);
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleDownloadQRCode = async () => {
    if (!currentProduct) return;

    try {
      const productName = currentProduct.name
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      await qrCodeService.downloadQRCode(
        currentProduct._id,
        `qr_${productName}`,
        { width: 300, margin: 2 }
      );
      message.success("QR code downloaded successfully");
    } catch (error) {
      message.error("Failed to download QR code: " + error.message);
    }
  };

  const handlePrintLabel = async () => {
    if (!currentProduct) return;

    try {
      const product = {
        _id: currentProduct._id,
        name: currentProduct.name,
        sellingPrice: currentProduct.price, // Note: using 'price' from backend model
      };
      await qrCodeService.printLabel(product);
      message.success("Print dialog opened");
    } catch (error) {
      message.error("Failed to print label: " + error.message);
    }
  };

  const handleDownloadLabel = async () => {
    if (!currentProduct) return;

    try {
      const product = {
        _id: currentProduct._id,
        name: currentProduct.name,
        sellingPrice: currentProduct.price,
      };
      const productName = currentProduct.name
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      await qrCodeService.downloadPrintableLabel(
        product,
        `label_${productName}`
      );
      message.success("Label downloaded successfully");
    } catch (error) {
      message.error("Failed to download label: " + error.message);
    }
  };

  return (
    <div className="p-4 max-w-[1200px] mx-auto">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <IconButton
              variant="secondary"
              icon="mdi:arrow-left"
              onClick={() => navigate("/inventory")}
              tooltip="Back to Inventory"
            />
            <div>
              <h1 className="text-2xl font-bold text-primary-dark m-0 flex items-center gap-2">
                <Icon
                  icon={
                    isEditing ? "mdi:pencil-box" : "mdi:package-variant-plus"
                  }
                  className="text-primary-medium"
                  width="28"
                />
                {isEditing ? "Edit Product" : "Add New Product"}
              </h1>
              <p className="text-primary-medium text-sm mt-1 opacity-80">
                {isEditing
                  ? "Update product details and inventory"
                  : "Create a new product record in the system"}
              </p>
            </div>
          </div>
          {isEditing && (
            <Button
              type="default"
              size="large"
              icon={<Icon icon="mdi:qrcode" width="20" />}
              onClick={handleGenerateQRCode}
              loading={generatingQR}
              className="flex items-center gap-2 border-primary-medium text-primary-dark hover:text-primary-medium hover:border-primary-dark"
            >
              Generate QR Code
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-accent-light">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          className="space-y-8"
        >
          {/* Product Information Section */}
          <div>
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-accent-light">
              <Icon
                icon="mdi:information"
                width="24"
                className="text-primary-medium"
              />
              <h3 className="text-lg font-bold text-primary-dark m-0">
                Product Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item
                name="name"
                label="Product Name"
                rules={[
                  { required: true, message: "Please enter product name" },
                  {
                    min: 3,
                    message: "Product name must be at least 3 characters",
                  },
                ]}
                className="md:col-span-2"
              >
                <Input
                  placeholder="e.g., Premium Wireless Headphones"
                  prefix={
                    <Icon
                      icon="mdi:package-variant"
                      className="text-gray-400"
                    />
                  }
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="category"
                label="Category"
                rules={[
                  { required: true, message: "Please select a category" },
                ]}
              >
                <Select
                  placeholder="Select product category"
                  size="large"
                  suffixIcon={<Icon icon="mdi:chevron-down" />}
                >
                  {categories.map((cat) => (
                    <Option key={cat} value={cat}>
                      <div className="flex items-center gap-2">
                        <Icon icon={getCategoryIcon(cat)} width="16" />
                        {cat}
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="sku" label="SKU (Optional)">
                <Input
                  placeholder="Stock Keeping Unit"
                  prefix={<Icon icon="mdi:barcode" className="text-gray-400" />}
                  size="large"
                />
              </Form.Item>
            </div>
          </div>

          {/* Pricing Section */}
          <div>
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-accent-light">
              <Icon
                icon="mdi:currency-usd"
                width="24"
                className="text-primary-medium"
              />
              <h3 className="text-lg font-bold text-primary-dark m-0">
                Pricing
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Form.Item
                name="currency"
                label="Currency"
                rules={[{ required: true, message: "Select currency" }]}
              >
                <Select
                  placeholder="Select currency"
                  size="large"
                  suffixIcon={<Icon icon="mdi:chevron-down" />}
                >
                  {currencies.map((curr) => (
                    <Option key={curr.value} value={curr.value}>
                      {curr.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="purchasePrice"
                label="Purchase Price"
                rules={[
                  { required: true, message: "Enter purchase price" },
                  {
                    type: "number",
                    min: 0,
                    message: "Price must be positive",
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  className="w-full"
                  placeholder="0.00"
                  prefix={
                    <Icon
                      icon="mdi:cart-arrow-down"
                      className="text-gray-400"
                    />
                  }
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="sellingPrice"
                label="Selling Price"
                rules={[
                  { required: true, message: "Enter selling price" },
                  {
                    type: "number",
                    min: 0,
                    message: "Price must be positive",
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  className="w-full"
                  placeholder="0.00"
                  prefix={<Icon icon="mdi:tag" className="text-gray-400" />}
                  size="large"
                />
              </Form.Item>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1 mt-2">
              <Icon icon="mdi:lightbulb-on-outline" />
              Tip: Ensure selling price covers your costs and desired profit
              margin
            </div>
          </div>

          {/* Inventory Section */}
          <div>
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-accent-light">
              <Icon
                icon="mdi:package-variant-closed"
                width="24"
                className="text-primary-medium"
              />
              <h3 className="text-lg font-bold text-primary-dark m-0">
                Inventory Details
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item
                name="stock"
                label="Stock Quantity"
                rules={[
                  { required: true, message: "Enter stock quantity" },
                  {
                    type: "number",
                    min: 0,
                    message: "Stock cannot be negative",
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  placeholder="Enter available units"
                  size="large"
                  prefix={
                    <Icon icon="mdi:cube-outline" className="text-gray-400" />
                  }
                />
              </Form.Item>

              <Form.Item name="expiryDate" label="Expiry Date (Optional)">
                <DatePicker
                  className="w-full"
                  placeholder="Select expiry date"
                  size="large"
                  format="YYYY-MM-DD"
                  suffixIcon={<Icon icon="mdi:calendar" />}
                />
              </Form.Item>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1 mt-2">
              <Icon icon="mdi:information-outline" />
              Low stock alert triggers when quantity falls below 10 units
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-accent-light">
            <Button
              size="large"
              onClick={() => navigate("/inventory")}
              className="min-w-[120px]"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              className="min-w-[150px] bg-primary-medium hover:bg-primary-dark"
              icon={
                <Icon
                  icon={isEditing ? "mdi:content-save" : "mdi:plus"}
                  width="20"
                />
              }
            >
              {isEditing ? "Update Product" : "Add Product"}
            </Button>
          </div>
        </Form>
      </div>

      {/* QR Code Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-primary-dark">
            <Icon icon="mdi:qrcode" width="24" />
            <span className="font-bold">Product QR Code</span>
          </div>
        }
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={null}
        width={500}
        centered
        className="rounded-2xl overflow-hidden"
      >
        <div className="flex flex-col items-center gap-6 py-6">
          {qrCodeDataUrl && (
            <>
              <div className="bg-white p-4 rounded-xl border-2 border-accent-light shadow-sm">
                <img
                  src={qrCodeDataUrl}
                  alt="Product QR Code"
                  className="w-64 h-64"
                />
              </div>

              {currentProduct && (
                <div className="text-center">
                  <p className="font-bold text-xl text-primary-dark mb-1">
                    {currentProduct.name}
                  </p>
                  <p className="text-primary-medium font-medium text-lg">
                    Price: ${currentProduct.price?.toFixed(2)}
                  </p>
                  <p className="text-gray-400 text-xs mt-2 font-mono">
                    ID: {currentProduct._id}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-3 w-full">
                <Button
                  type="primary"
                  icon={<Icon icon="mdi:download" width="18" />}
                  onClick={handleDownloadQRCode}
                  size="large"
                  className="bg-primary-medium hover:bg-primary-dark"
                >
                  Download QR
                </Button>
                <Button
                  icon={<Icon icon="mdi:printer" width="18" />}
                  onClick={handlePrintLabel}
                  size="large"
                >
                  Print Label
                </Button>
                <Button
                  icon={<Icon icon="mdi:download-box" width="18" />}
                  onClick={handleDownloadLabel}
                  size="large"
                >
                  Download Label
                </Button>
              </div>

              <div className="text-xs text-gray-400 text-center bg-gray-50 p-3 rounded-lg w-full">
                <p>Scan this QR code to quickly look up this product.</p>
                <p>Compatible with all standard QR code scanners.</p>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default InventoryFormPage;
