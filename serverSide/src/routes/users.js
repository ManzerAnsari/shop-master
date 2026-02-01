import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  updateProfileSchema,
  updateShopSchema,
  updatePreferencesSchema,
  changePasswordSchema,
} from "../validators/user.validator.js";
import {
  getProfile,
  updateProfile,
  updateShopSettings,
  updatePreferences,
  changePassword,
  deleteAccount,
  uploadAvatar,
} from "../controller/userController.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

const router = Router();

// Apply auth middleware
router.use(verifyToken);

// Get user profile
router.get("/profile", getProfile);

// Update user profile
router.put("/profile", validate(updateProfileSchema), updateProfile);

// Update shop settings
router.put("/shop", validate(updateShopSchema), updateShopSettings);

// Update preferences
router.put(
  "/preferences",
  validate(updatePreferencesSchema),
  updatePreferences
);

// Change password
router.put("/password", validate(changePasswordSchema), changePassword);

// Delete account
router.delete("/account", deleteAccount);

// Upload avatar
router.post("/avatar", upload.single("avatar"), uploadAvatar);

export default router;
