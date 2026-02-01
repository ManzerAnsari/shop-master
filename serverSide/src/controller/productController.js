import Product from "../models/Product.js";
import websocketService from "../services/websocketService.js";

export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      category = "",
      stockFilter = "",
    } = req.query;

    // Build query
    const query = { userId: req.user.id };

    // Search filter
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Stock filter
    if (stockFilter) {
      if (stockFilter === "low") {
        query.stock = { $lte: 10, $gt: 0 };
      } else if (stockFilter === "out") {
        query.stock = 0;
      } else if (stockFilter === "available") {
        query.stock = { $gt: 10 };
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    // req.validatedData comes from validate middleware
    const productData = req.validatedData || req.body;

    const product = await Product.create({
      ...productData,
      userId: req.user.id,
    });

    // Broadcast new product creation
    try {
      websocketService.broadcastInventoryUpdate({
        _id: product._id,
        name: product.name,
        stock: product.stock,
        previousStock: 0,
        change: product.stock,
        reason: "new_product",
      });
      console.log(`📢 New product broadcasted: ${product._id}`);
    } catch (wsError) {
      console.error("WebSocket broadcast error:", wsError);
    }

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.validatedData || req.body;

    const oldProduct = await Product.findOne({ _id: id, userId: req.user.id });

    const product = await Product.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!product) return res.status(404).json({ message: "Product not found" });

    // Broadcast inventory update if stock changed
    if (oldProduct && oldProduct.stock !== product.stock) {
      try {
        websocketService.broadcastInventoryUpdate({
          _id: product._id,
          name: product.name,
          stock: product.stock,
          previousStock: oldProduct.stock,
          change: product.stock - oldProduct.stock,
          reason: "manual_update",
        });
        console.log(`📢 Inventory update broadcasted: ${product._id}`);
      } catch (wsError) {
        console.error("WebSocket broadcast error:", wsError);
      }
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProductByBarcode = async (req, res) => {
  try {
    const product = await Product.findOne({
      barcode: req.params.barcode,
      userId: req.user.id,
    });
    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found with this barcode" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateProductBarcode = async (req, res) => {
  try {
    const { barcode, barcodeType } = req.validatedData || req.body;

    // Check if barcode already exists for another product
    const existingProduct = await Product.findOne({
      barcode,
      userId: req.user.id,
      _id: { $ne: req.params.id },
    });

    if (existingProduct) {
      return res.status(400).json({
        message: "Barcode already assigned to another product",
        product: existingProduct,
      });
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { barcode, barcodeType },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
