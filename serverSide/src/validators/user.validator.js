import { z } from "zod";
import { addressSchema } from "./auth.validator.js";

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username is too long")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Username can contain letters, numbers, dot, underscore and hyphen"
    )
    .optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z
    .string()
    .optional()
    .nullable()
    .refine((v) => !v || v.trim().length >= 6, {
      message: "Phone number is too short",
    }),
});

export const updateShopSchema = z.object({
  shopName: z.string().min(1, "Shop name is required").optional(),
  address: addressSchema.optional(),
  businessType: z.string().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
});

export const updatePreferencesSchema = z.object({
  currency: z.string().optional(),
  language: z.string().optional(),
  theme: z.string().optional(),
  notifications: z.boolean().optional(),
  emailUpdates: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});
