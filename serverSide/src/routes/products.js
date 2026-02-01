import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createProductSchema,
  updateProductSchema,
  barcodeSchema,
} from "../validators/product.validator.js";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductByBarcode,
  updateProductBarcode,
} from "../controller/productController.js";

const router = Router();

// Apply auth middleware to all routes
router.use(verifyToken);

// Get all products
router.get("/", getProducts);

// Get single product
router.get("/:id", getProductById);

// Create product
router.post("/", validate(createProductSchema), createProduct);

// Update product
router.put("/:id", validate(updateProductSchema), updateProduct);

// Delete product
router.delete("/:id", deleteProduct);

// Get product by barcode
router.get("/barcode/:barcode", getProductByBarcode);

// Update product barcode
router.patch("/:id/barcode", validate(barcodeSchema), updateProductBarcode);

export default router;
