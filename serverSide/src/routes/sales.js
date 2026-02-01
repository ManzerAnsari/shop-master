import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createSaleSchema } from "../validators/sales.validator.js";
import {
  getSales,
  getSaleById,
  createSale,
  deleteSale,
} from "../controller/salesController.js";

const router = Router();

// Apply auth middleware
router.use(verifyToken);

// Get all sales for user
router.get("/", getSales);

// Get single sale
router.get("/:id", getSaleById);

// Create sale
router.post("/", validate(createSaleSchema), createSale);

// Delete sale (refund)
router.delete("/:id", deleteSale);

export default router;
