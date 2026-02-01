import api from "../lib/axios";

export const productService = {
  // Get all products with pagination and filters
  getAll: async (params = {}) => {
    const { page, limit, search, category, stockFilter } = params;
    const queryParams = new URLSearchParams();

    if (page) queryParams.append("page", page);
    if (limit) queryParams.append("limit", limit);
    if (search) queryParams.append("search", search);
    if (category) queryParams.append("category", category);
    if (stockFilter) queryParams.append("stockFilter", stockFilter);

    const response = await api.get(`/products?${queryParams.toString()}`);
    return response.data;
  },

  // Get single product
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Create product
  create: async (productData) => {
    const response = await api.post("/products", productData);
    return response.data;
  },

  // Update product
  update: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  // Delete product
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Find product by barcode
  findByBarcode: async (barcode) => {
    const response = await api.get(`/products/barcode/${barcode}`);
    return response.data;
  },

  // Update product barcode
  updateBarcode: async (id, barcode, barcodeType) => {
    const response = await api.patch(`/products/${id}/barcode`, {
      barcode,
      barcodeType,
    });
    return response.data;
  },
};

export default productService;
