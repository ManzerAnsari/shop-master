import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import websocketService from "../services/websocketService.js";

export const getSales = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    let query = { userId: req.user.id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const [sales, total] = await Promise.all([
      Sale.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Sale.countDocuments(query),
    ]);

    res.json({
      sales,
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

export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!sale) return res.status(404).json({ message: "Sale not found" });
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createSale = async (req, res) => {
  try {
    const { items, date } = req.validatedData || req.body;

    // Validate stock availability
    for (const item of items) {
      const product = await Product.findOne({
        _id: item.productId,
        userId: req.user.id,
      });
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product ${item.name} not found` });
      }
      if (product.stock < item.qty) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.name}. Available: ${product.stock}`,
        });
      }
    }

    // Calculate totals
    let totalAmount = 0;
    let totalProfit = 0;

    const saleItems = items.map((item) => {
      const itemTotal = item.qty * item.unitPrice;
      const itemProfit = item.qty * (item.unitPrice - item.purchasePrice);
      totalAmount += itemTotal;
      totalProfit += itemProfit;

      return {
        ...item,
        profit: itemProfit,
      };
    });

    // Create sale
    const sale = await Sale.create({
      userId: req.user.id,
      date: date || new Date().toISOString().split("T")[0],
      items: saleItems,
      totalAmount,
      totalProfit,
    });

    // Update product stock and track inventory changes
    const inventoryUpdates = [];
    for (const item of items) {
      const updatedProduct = await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.qty } },
        { new: true }
      );

      if (updatedProduct) {
        inventoryUpdates.push({
          _id: updatedProduct._id,
          name: updatedProduct.name,
          stock: updatedProduct.stock,
          previousStock: updatedProduct.stock + item.qty,
          change: -item.qty,
          reason: "sale",
          saleId: sale._id,
        });
      }
    }

    // Broadcast sale event via WebSocket
    try {
      websocketService.broadcastSale({
        _id: sale._id,
        userId: req.user.id,
        totalAmount: sale.totalAmount,
        totalProfit: sale.totalProfit,
        items: saleItems,
        date: sale.date,
        createdAt: sale.createdAt,
      });

      // Broadcast inventory updates
      for (const update of inventoryUpdates) {
        websocketService.broadcastInventoryUpdate(update);

        // Check for low stock and send notification
        if (update.stock <= 5 && update.stock > 0) {
          websocketService.sendToUser(req.user.id, "notification", {
            type: "low_stock",
            severity: "warning",
            title: "Low Stock Alert",
            message: `${update.name} is running low (${update.stock} remaining)`,
            productId: update._id,
            productName: update.name,
            currentStock: update.stock,
          });
        } else if (update.stock === 0) {
          websocketService.sendToUser(req.user.id, "notification", {
            type: "stock_out",
            severity: "urgent",
            title: "Stock Out Alert",
            message: `${update.name} is out of stock!`,
            productId: update._id,
            productName: update.name,
            currentStock: 0,
          });
        }
      }

      console.log(`📢 Sale event broadcasted: ${sale._id}`);
    } catch (wsError) {
      console.error("WebSocket broadcast error:", wsError);
      // Don't fail the sale if WebSocket fails
    }

    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    // Restore product stock and track inventory changes
    const inventoryUpdates = [];
    for (const item of sale.items) {
      const updatedProduct = await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.qty } },
        { new: true }
      );

      if (updatedProduct) {
        inventoryUpdates.push({
          _id: updatedProduct._id,
          name: updatedProduct.name,
          stock: updatedProduct.stock,
          previousStock: updatedProduct.stock - item.qty,
          change: item.qty,
          reason: "refund",
          saleId: sale._id,
        });
      }
    }

    await Sale.findByIdAndDelete(req.params.id);

    // Broadcast inventory updates via WebSocket
    try {
      for (const update of inventoryUpdates) {
        websocketService.broadcastInventoryUpdate(update);
      }

      // Send refund notification
      websocketService.sendToUser(req.user.id, "notification", {
        type: "sale_refunded",
        severity: "info",
        title: "Sale Refunded",
        message: `Sale refunded: $${sale.totalAmount.toFixed(2)} returned`,
        saleId: sale._id,
        amount: sale.totalAmount,
      });

      console.log(`📢 Refund event broadcasted: ${sale._id}`);
    } catch (wsError) {
      console.error("WebSocket broadcast error:", wsError);
      // Don't fail the refund if WebSocket fails
    }

    res.json({ message: "Sale refunded successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
