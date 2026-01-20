import { z } from "zod";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

// Product validation schema
export const productSchema = z.object({
  name: z
    .string()
    .min(1, "NAME_REQUIRED")
    .max(100, "NAME_TOO_LONG"),
  description: z
    .string()
    .max(500, "DESCRIPTION_TOO_LONG")
    .optional()
    .or(z.literal("")),
  category: z
    .enum(PRODUCT_CATEGORIES as unknown as [string, ...string[]])
    .optional()
    .or(z.literal("")),
  costPrice: z
    .number()
    .min(0, "COST_PRICE_INVALID")
    .max(100000, "COST_PRICE_INVALID"),
  salePrice: z
    .number()
    .min(0, "SALE_PRICE_INVALID")
    .max(100000, "SALE_PRICE_INVALID"),
  currentStock: z
    .number()
    .int()
    .min(0, "STOCK_INVALID")
    .optional(),
  minStock: z
    .number()
    .int()
    .min(0, "MIN_STOCK_INVALID")
    .optional(),
  isActive: z.boolean().optional(),
  isChargeableByDefault: z.boolean().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// Update product schema (partial)
export const updateProductSchema = productSchema.partial();

export type UpdateProductData = z.infer<typeof updateProductSchema>;

// Register purchase validation schema
export const registerPurchaseSchema = z.object({
  productId: z.string().min(1, "PRODUCT_REQUIRED"),
  quantity: z
    .number()
    .int()
    .min(1, "QUANTITY_REQUIRED")
    .max(10000, "QUANTITY_INVALID"),
  unitCost: z
    .number()
    .min(0, "COST_PRICE_INVALID")
    .max(100000, "COST_PRICE_INVALID"),
  supplier: z
    .string()
    .max(200, "SUPPLIER_TOO_LONG")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(500, "NOTES_TOO_LONG")
    .optional()
    .or(z.literal("")),
});

export type RegisterPurchaseFormData = z.infer<typeof registerPurchaseSchema>;

// Adjust stock validation schema
export const adjustStockSchema = z.object({
  productId: z.string().min(1, "PRODUCT_REQUIRED"),
  newStock: z
    .number()
    .int()
    .min(0, "STOCK_INVALID")
    .max(100000, "STOCK_INVALID"),
  reason: z
    .string()
    .min(1, "REASON_REQUIRED")
    .max(500, "REASON_TOO_LONG"),
});

export type AdjustStockFormData = z.infer<typeof adjustStockSchema>;

// Use product validation schema (for sessions)
export const useProductSchema = z.object({
  productId: z.string().min(1, "PRODUCT_REQUIRED"),
  quantity: z
    .number()
    .int()
    .min(1, "QUANTITY_REQUIRED")
    .max(100, "QUANTITY_INVALID"),
  sessionId: z.string().optional(),
});

export type UseProductFormData = z.infer<typeof useProductSchema>;
