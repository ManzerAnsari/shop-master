import express from "express";
import { getAIInsights } from "../controller/aiInsightsController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyToken, getAIInsights);

export default router;
