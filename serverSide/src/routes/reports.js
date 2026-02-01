import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { getReports } from "../controller/reportsController.js";

const router = Router();

// Get comprehensive reports
router.get("/", verifyToken, getReports);

export default router;
