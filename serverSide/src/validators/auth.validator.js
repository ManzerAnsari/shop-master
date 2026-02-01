// validators/auth.validator.js
import { z } from "zod";

export const addressSchema = z.object({
  street: z.string().optional().nullable().or(z.literal("")),
  city: z.string().optional().nullable().or(z.literal("")),
  state: z.string().optional().nullable().or(z.literal("")),
  zipCode: z.string().optional().nullable().or(z.literal("")),
  country: z.string().optional().nullable().or(z.literal("")),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username is too long")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Username can contain letters, numbers, dot, underscore and hyphen"
    ),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .optional()
    .nullable()
    .refine((v) => !v || v.trim().length >= 6, {
      message: "Phone number is too short",
    }),
  shopName: z.string().min(1, "Shop name is required"),
  dateOfBirth: z
    .string()
    .optional()
    .nullable()
    .refine(
      (v) => {
        if (!v) return true;
        return /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      { message: "dateOfBirth must be in YYYY-MM-DD format" }
    ),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  address: addressSchema.optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});
