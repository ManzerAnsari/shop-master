import { Router } from "express";
import auth from "./auth.js";
import products from "./products.js";
import sales from "./sales.js";
import dashboard from "./dashboard.js";
import reports from "./reports.js";
import users from "./users.js";
import aiInsights from "./aiInsights.js";
import festivals from "./festivals.js";

const router = Router();

router.use("/auth", auth);
router.use("/products", products);
router.use("/sales", sales);
router.use("/dashboard", dashboard);
router.use("/reports", reports);
router.use("/users", users);
router.use("/ai-insights", aiInsights);
router.use("/festivals", festivals);

export default router;
