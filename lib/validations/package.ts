import { z } from "zod";

// Package validation schema
export const packageSchema = z.object({
  name: z
    .string()
    .min(1, "NAME_REQUIRED")
    .max(100, "NAME_TOO_LONG"),
  description: z
    .string()
    .max(500, "DESCRIPTION_TOO_LONG")
    .optional()
    .or(z.literal("")),
  categoryId: z
    .string()
    .optional()
    .nullable(),
  // BABY = services for babies (hydrotherapy, etc.), PARENT = services for parents (prenatal massage, etc.)
  serviceType: z.enum(["BABY", "PARENT"]).optional(),
  sessionCount: z
    .number()
    .int()
    .min(1, "SESSION_COUNT_MIN")
    .max(100, "SESSION_COUNT_MAX"),
  basePrice: z
    .number()
    .min(0, "PRICE_INVALID")
    .max(100000, "PRICE_TOO_HIGH"),
  duration: z
    .number()
    .int()
    .min(15, "DURATION_TOO_SHORT")
    .max(180, "DURATION_TOO_LONG")
    .optional(),
  requiresAdvancePayment: z
    .boolean()
    .optional(),
  advancePaymentAmount: z
    .number()
    .min(0)
    .optional()
    .nullable(),
  // Installment configuration (per package)
  allowInstallments: z
    .boolean()
    .optional(),
  installmentsCount: z
    .number()
    .int()
    .min(2, "INSTALLMENTS_COUNT_MIN")
    .max(12, "INSTALLMENTS_COUNT_MAX")
    .optional()
    .nullable(),
  installmentsTotalPrice: z
    .number()
    .min(0, "INSTALLMENTS_PRICE_INVALID")
    .optional()
    .nullable(),
  installmentsPayOnSessions: z
    .string()
    .max(100, "INSTALLMENTS_SESSIONS_TOO_LONG")
    .optional()
    .nullable(),
  isActive: z.boolean(),
  isPublic: z.boolean().optional(),  // false = solo para premios Baby Card y uso interno
  sortOrder: z.number().int(),
});

export type PackageFormData = z.infer<typeof packageSchema>;

// Input type for form - with optional fields that have defaults
export type PackageFormInput = {
  name: string;
  description?: string;
  categoryId?: string | null;
  serviceType?: "BABY" | "PARENT";
  sessionCount: number;
  basePrice: number;
  duration?: number;
  requiresAdvancePayment?: boolean;
  advancePaymentAmount?: number | null;
  allowInstallments?: boolean;
  installmentsCount?: number | null;
  installmentsTotalPrice?: number | null;
  installmentsPayOnSessions?: string | null;
  isActive?: boolean;
  isPublic?: boolean;
  sortOrder?: number;
};

// Update package schema (partial)
export const updatePackageSchema = packageSchema.partial();

export type UpdatePackageData = z.infer<typeof updatePackageSchema>;

// Sell package validation schema
export const sellPackageSchema = z.object({
  babyId: z.string().min(1, "BABY_REQUIRED"),
  packageId: z.string().min(1, "PACKAGE_REQUIRED"),
  discountAmount: z
    .number()
    .min(0, "DISCOUNT_INVALID"),
  discountReason: z
    .string()
    .max(200, "REASON_TOO_LONG")
    .optional()
    .or(z.literal("")),
  paymentMethod: z.enum(["CASH", "CARD", "QR", "TRANSFER"], {
    message: "PAYMENT_METHOD_REQUIRED",
  }),
  paymentNotes: z
    .string()
    .max(500, "NOTES_TOO_LONG")
    .optional()
    .or(z.literal("")),
  // Payment plan: SINGLE (full payment) or INSTALLMENTS (use package config)
  paymentPlan: z.enum(["SINGLE", "INSTALLMENTS"], {
    message: "PAYMENT_PLAN_REQUIRED",
  }).optional(),
  // Legacy field - still accepted but paymentPlan is preferred
  installments: z
    .number()
    .int()
    .min(1, "INSTALLMENTS_MIN")
    .max(12, "INSTALLMENTS_MAX")
    .optional(),
  createdById: z
    .string()
    .optional(),
});

export type SellPackageFormData = z.infer<typeof sellPackageSchema>;

// Payment detail for split payments
const paymentDetailSchema = z.object({
  amount: z.number().min(0.01, "AMOUNT_MIN"),
  paymentMethod: z.enum(["CASH", "CARD", "QR", "TRANSFER"], {
    message: "PAYMENT_METHOD_REQUIRED",
  }),
  reference: z.string().max(100).optional().nullable(),
});

// Register installment payment validation schema
export const registerInstallmentPaymentSchema = z.object({
  packagePurchaseId: z.string().min(1, "PACKAGE_PURCHASE_REQUIRED"),
  installmentNumber: z
    .number()
    .int()
    .min(1, "INSTALLMENT_NUMBER_MIN"),
  amount: z
    .number()
    .min(0.01, "AMOUNT_MIN"),
  // Legacy single method (optional if paymentDetails is provided)
  paymentMethod: z.enum(["CASH", "CARD", "QR", "TRANSFER"], {
    message: "PAYMENT_METHOD_REQUIRED",
  }).optional(),
  reference: z
    .string()
    .max(100, "REFERENCE_TOO_LONG")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(500, "NOTES_TOO_LONG")
    .optional()
    .or(z.literal("")),
  // NEW: Split payment support
  paymentDetails: z.array(paymentDetailSchema).optional(),
}).refine(
  (data) => data.paymentMethod || (data.paymentDetails && data.paymentDetails.length > 0),
  { message: "PAYMENT_METHOD_REQUIRED", path: ["paymentMethod"] }
);

export type RegisterInstallmentPaymentData = z.infer<typeof registerInstallmentPaymentSchema>;
