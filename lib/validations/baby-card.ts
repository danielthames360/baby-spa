import { z } from "zod";

// ============================================================
// ENUMS
// ============================================================

// Reward type enum
export const rewardTypeEnum = z.enum(["SERVICE", "PRODUCT", "EVENT", "CUSTOM"]);

// Baby card status enum
export const babyCardStatusEnum = z.enum([
  "ACTIVE",
  "COMPLETED",
  "REPLACED",
  "CANCELLED",
]);

// Payment method enum (reuse)
export const paymentMethodEnum = z.enum(["CASH", "CARD", "QR", "TRANSFER"]);

// ============================================================
// SPECIAL PRICE SCHEMA (embedded)
// ============================================================

export const specialPriceSchema = z.object({
  id: z.string().optional(), // For editing existing
  packageId: z.string().min(1, "PACKAGE_REQUIRED"),
  specialPrice: z.coerce.number().min(0, "PRICE_MIN"),
});

export type SpecialPriceData = z.infer<typeof specialPriceSchema>;

// ============================================================
// REWARD SCHEMA (embedded)
// ============================================================

export const rewardSchema = z
  .object({
    id: z.string().optional(), // For editing existing
    sessionNumber: z.coerce.number().min(2, "SESSION_NUMBER_MIN"),  // Min 2 - session 1 is reserved for first discount
    rewardType: rewardTypeEnum,

    // References based on type
    packageId: z.string().optional().nullable(),
    productId: z.string().optional().nullable(),

    // For custom rewards
    customName: z.string().max(100).optional().nullable(),
    customDescription: z.string().max(500).optional().nullable(),

    // Display
    displayName: z.string().min(1, "DISPLAY_NAME_REQUIRED").max(100),
    displayIcon: z.string().max(10).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Validate based on reward type
    if (data.rewardType === "SERVICE" && !data.packageId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PACKAGE_REQUIRED_FOR_SERVICE",
        path: ["packageId"],
      });
    }
    if (data.rewardType === "PRODUCT" && !data.productId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PRODUCT_REQUIRED_FOR_PRODUCT",
        path: ["productId"],
      });
    }
    if (data.rewardType === "CUSTOM" && !data.customName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CUSTOM_NAME_REQUIRED",
        path: ["customName"],
      });
    }
  });

export type RewardData = z.infer<typeof rewardSchema>;

// ============================================================
// BABY CARD SCHEMA (CREATE/UPDATE TEMPLATE)
// ============================================================

export const createBabyCardSchema = z
  .object({
    name: z
      .string()
      .min(1, "NAME_REQUIRED")
      .min(2, "NAME_TOO_SHORT")
      .max(100, "NAME_TOO_LONG"),
    description: z.string().max(1000).optional().nullable(),

    // Price and configuration
    price: z.coerce.number().min(0, "PRICE_MIN"),
    totalSessions: z.coerce.number().min(1, "SESSIONS_MIN").max(100, "SESSIONS_MAX"),
    firstSessionDiscount: z.coerce.number().min(0, "DISCOUNT_MIN").default(0),

    // State
    isActive: z.coerce.boolean().default(true),
    sortOrder: z.coerce.number().default(0),

    // Special prices (array)
    specialPrices: z.array(specialPriceSchema).default([]),

    // Rewards (array)
    rewards: z.array(rewardSchema).default([]),
  })
  .superRefine((data, ctx) => {
    // Validate that reward session numbers don't exceed total sessions
    for (let i = 0; i < data.rewards.length; i++) {
      const reward = data.rewards[i];
      if (reward.sessionNumber > data.totalSessions) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "REWARD_SESSION_EXCEEDS_TOTAL",
          path: ["rewards", i, "sessionNumber"],
        });
      }
      // Session #1 is reserved for first session discount (implicit)
      if (reward.sessionNumber === 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "REWARD_SESSION_ONE_RESERVED",
          path: ["rewards", i, "sessionNumber"],
        });
      }
    }

    // Validate unique session numbers for rewards
    const sessionNumbers = data.rewards.map((r) => r.sessionNumber);
    const uniqueNumbers = new Set(sessionNumbers);
    if (sessionNumbers.length !== uniqueNumbers.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DUPLICATE_REWARD_SESSIONS",
        path: ["rewards"],
      });
    }

    // Validate unique package IDs for special prices
    const packageIds = data.specialPrices.map((sp) => sp.packageId);
    const uniquePackages = new Set(packageIds);
    if (packageIds.length !== uniquePackages.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DUPLICATE_SPECIAL_PRICE_PACKAGES",
        path: ["specialPrices"],
      });
    }
  });

export type CreateBabyCardData = z.infer<typeof createBabyCardSchema>;

// Update schema - same as create but all fields optional
export const updateBabyCardSchema = z.object({
  name: z
    .string()
    .min(1, "NAME_REQUIRED")
    .min(2, "NAME_TOO_SHORT")
    .max(100, "NAME_TOO_LONG")
    .optional(),
  description: z.string().max(1000).optional().nullable(),
  price: z.coerce.number().min(0, "PRICE_MIN").optional(),
  totalSessions: z.coerce.number().min(1, "SESSIONS_MIN").max(100, "SESSIONS_MAX").optional(),
  firstSessionDiscount: z.coerce.number().min(0, "DISCOUNT_MIN").optional(),
  isActive: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().optional(),
  specialPrices: z.array(specialPriceSchema).optional(),
  rewards: z.array(rewardSchema).optional(),
});

export type UpdateBabyCardData = z.infer<typeof updateBabyCardSchema>;

// ============================================================
// PURCHASE BABY CARD SCHEMA
// ============================================================

export const purchaseBabyCardSchema = z.object({
  babyCardId: z.string().min(1, "BABY_CARD_REQUIRED"),
  babyId: z.string().min(1, "BABY_REQUIRED"),

  // Payment
  pricePaid: z.coerce.number().min(0),
  paymentMethod: paymentMethodEnum.optional().nullable(),
  paymentReference: z.string().max(100).optional().nullable(),

  // Schedule first free session
  scheduleFirstSession: z.coerce.boolean().default(false),
  firstSessionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "INVALID_DATE_FORMAT")
    .optional()
    .nullable(),
  firstSessionTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "INVALID_TIME_FORMAT")
    .optional()
    .nullable(),
});

export type PurchaseBabyCardData = z.infer<typeof purchaseBabyCardSchema>;

// ============================================================
// USE REWARD SCHEMA
// ============================================================

export const useRewardSchema = z.object({
  rewardId: z.string().min(1, "REWARD_REQUIRED"),

  // Where to apply
  applyTo: z.enum(["CURRENT_APPOINTMENT", "NEW_APPOINTMENT"]),

  // If applying to current appointment
  appointmentId: z.string().optional().nullable(),

  // If creating new appointment
  newAppointmentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "INVALID_DATE_FORMAT")
    .optional()
    .nullable(),
  newAppointmentTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "INVALID_TIME_FORMAT")
    .optional()
    .nullable(),

  // Notes
  notes: z.string().max(500).optional().nullable(),
});

export type UseRewardData = z.infer<typeof useRewardSchema>;

// ============================================================
// FILTERS SCHEMA
// ============================================================

export const babyCardFiltersSchema = z.object({
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export type BabyCardFilters = z.infer<typeof babyCardFiltersSchema>;

export const babyCardPurchaseFiltersSchema = z.object({
  status: babyCardStatusEnum.optional(),
  babyId: z.string().optional(),
  babyCardId: z.string().optional(),
});

export type BabyCardPurchaseFilters = z.infer<typeof babyCardPurchaseFiltersSchema>;
