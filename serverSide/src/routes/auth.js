// routes/auth.js
import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import {
  loginController,
  logoutController,
  refreshController,
  meController,
  registerController,
  verifyController,
} from "../controller/auth.controller.js";

const router = Router();

// Register
router.post("/register", validate(registerSchema), registerController);

// Login – returns accessToken + refreshToken
router.post("/login", validate(loginSchema), loginController);

// Refresh – exchange refreshToken for new accessToken (+ new refreshToken)
router.post("/refresh", refreshController);

// Logout – optional body: { refreshToken } to invalidate that token
router.post("/logout", logoutController);

// Get current user
router.get("/me", verifyToken, meController);

// Verify token
router.get("/verify", verifyToken, verifyController);

export default router;
