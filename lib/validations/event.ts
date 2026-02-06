import { z } from "zod";

// Event type enum
export const eventTypeEnum = z.enum(["BABIES", "PARENTS"]);

// Event status enum
export const eventStatusEnum = z.enum([
  "DRAFT",
  "PUBLISHED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

// Participant status enum
export const participantStatusEnum = z.enum([
  "REGISTERED",
  "CONFIRMED",
  "CANCELLED",
  "NO_SHOW",
]);

// Discount type enum
export const discountTypeEnum = z.enum(["COURTESY", "FIXED"]);

// Payment method enum (reuse from existing)
export const paymentMethodEnum = z.enum(["CASH", "CARD", "QR", "TRANSFER"]);

// Create event schema
export const createEventSchema = z.object({
  name: z
    .string()
    .min(1, "NAME_REQUIRED")
    .min(2, "NAME_TOO_SHORT")
    .max(100, "NAME_TOO_LONG"),
  description: z.string().max(500).optional().nullable(),
  type: eventTypeEnum,

  // Date and time - sent as strings from frontend
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "INVALID_DATE_FORMAT"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "INVALID_TIME_FORMAT"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "INVALID_TIME_FORMAT"),

  // Capacity and blocking
  maxParticipants: z.coerce.number().min(1).max(100).default(10),
  blockedTherapists: z.coerce.number().min(0).max(4).default(0),

  // Age range (only for BABIES events)
  minAgeMonths: z.coerce.number().min(0).max(36).optional().nullable(),
  maxAgeMonths: z.coerce.number().min(0).max(36).optional().nullable(),

  // Price
  basePrice: z.coerce.number().min(0),

  // Status (optional, defaults to DRAFT)
  status: eventStatusEnum.optional().default("DRAFT"),

  // Notes
  internalNotes: z.string().max(1000).optional().nullable(),
  externalNotes: z.string().max(1000).optional().nullable(),
});

export type CreateEventData = z.infer<typeof createEventSchema>;

// Update event schema (partial)
export const updateEventSchema = createEventSchema.partial().omit({ type: true });

export type UpdateEventData = z.infer<typeof updateEventSchema>;

// Update event status schema
export const updateEventStatusSchema = z.object({
  status: eventStatusEnum,
});

export type UpdateEventStatusData = z.infer<typeof updateEventStatusSchema>;

// Add baby participant schema
export const addBabyParticipantSchema = z.object({
  babyId: z.string().min(1, "BABY_REQUIRED"),
  discountType: discountTypeEnum.optional().nullable(),
  discountAmount: z.coerce.number().min(0).optional().nullable(),
  discountReason: z.string().max(200).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type AddBabyParticipantData = z.infer<typeof addBabyParticipantSchema>;

// Add parent (LEAD) participant schema
export const addParentParticipantSchema = z.object({
  parentId: z.string().optional().nullable(),
  // For new LEADs
  name: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^[\d\s+()-]+$/).min(8).optional(),
  email: z.string().email().optional().or(z.literal("")),
  pregnancyWeeks: z.coerce.number().min(1).max(45).optional().nullable(),
  leadSource: z.string().max(100).optional().nullable(),
  leadNotes: z.string().max(500).optional().nullable(),
  // Discount
  discountType: discountTypeEnum.optional().nullable(),
  discountAmount: z.coerce.number().min(0).optional().nullable(),
  discountReason: z.string().max(200).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type AddParentParticipantData = z.infer<typeof addParentParticipantSchema>;

// Update participant schema
export const updateParticipantSchema = z.object({
  status: participantStatusEnum.optional(),
  discountType: discountTypeEnum.optional().nullable(),
  discountAmount: z.coerce.number().min(0).optional().nullable(),
  discountReason: z.string().max(200).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type UpdateParticipantData = z.infer<typeof updateParticipantSchema>;

// Payment detail schema for split payments
const paymentDetailSchema = z.object({
  amount: z.coerce.number().min(0.01),
  paymentMethod: paymentMethodEnum,
  reference: z.string().max(100).optional().nullable(),
});

// Register payment schema - supports both legacy single method and split payments
export const registerPaymentSchema = z.object({
  amount: z.coerce.number().min(0.01, "AMOUNT_REQUIRED"),
  paymentMethod: paymentMethodEnum.optional(),
  paymentReference: z.string().max(100).optional().nullable(),
  paymentDetails: z.array(paymentDetailSchema).optional(),
}).refine(
  (data) => data.paymentMethod !== undefined || (data.paymentDetails && data.paymentDetails.length > 0),
  { message: "PAYMENT_METHOD_REQUIRED", path: ["paymentMethod"] }
);

export type RegisterPaymentData = z.infer<typeof registerPaymentSchema>;

// Mark attendance schema (single participant)
export const markAttendanceSchema = z.object({
  attended: z.boolean(),
});

export type MarkAttendanceData = z.infer<typeof markAttendanceSchema>;

// Bulk attendance schema
export const bulkAttendanceSchema = z.object({
  attendance: z.array(
    z.object({
      participantId: z.string(),
      attended: z.boolean(),
    })
  ),
});

export type BulkAttendanceData = z.infer<typeof bulkAttendanceSchema>;

// Add product to event schema
export const addEventProductSchema = z.object({
  productId: z.string().min(1, "PRODUCT_REQUIRED"),
  quantity: z.coerce.number().min(1).default(1),
  notes: z.string().max(200).optional().nullable(),
});

export type AddEventProductData = z.infer<typeof addEventProductSchema>;

// Event filters schema
// Status can be a single value or comma-separated list (e.g., "PUBLISHED,IN_PROGRESS")
export const eventFiltersSchema = z.object({
  status: z.string().optional(), // Will be parsed as comma-separated values
  type: eventTypeEnum.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
});

export type EventFilters = z.infer<typeof eventFiltersSchema>;
