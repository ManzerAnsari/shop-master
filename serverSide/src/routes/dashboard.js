import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { getDashboardStats } from "../controller/dashboardController.js";

const router = Router();

// Get dashboard statistics
router.get("/stats", verifyToken, getDashboardStats);

export default router;
