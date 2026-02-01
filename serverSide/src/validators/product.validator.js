import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  purchasePrice: z.number().min(0, "Purchase price must be non-negative"),
  sellingPrice: z.number().min(0, "Selling price must be non-negative"),
  stock: z.number().int().min(0, "Stock must be a non-negative integer"),
  expiryDate: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        return !isNaN(Date.parse(val));
      },
      { message: "Invalid date format" }
    ),
  barcode: z.string().optional(),
  barcodeType: z.string().optional(),
  description: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const barcodeSchema = z.object({
  barcode: z.string().min(1, "Barcode is required"),
  barcodeType: z.string().optional(),
});
