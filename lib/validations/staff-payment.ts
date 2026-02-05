import { z } from "zod";
import { optionalBooleanFromString } from "./zod-helpers";

// Payment detail schema (for split payments)
const paymentDetailSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["CASH", "CARD", "QR", "TRANSFER"]),
  reference: z.string().optional().nullable(),
});

// Staff payment types
export const staffPaymentTypes = [
  "SALARY",
  "COMMISSION",
  "BONUS",
  "ADVANCE",
  "ADVANCE_RETURN",
  "DEDUCTION",
  "BENEFIT",
  "SETTLEMENT",
] as const;

// Create staff payment schema
export const createStaffPaymentSchema = z.object({
  staffId: z.string().min(1, "Staff is required"),
  type: z.enum(staffPaymentTypes),
  grossAmount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  periodMonth: z.number().min(1).max(12).optional(),
  periodYear: z.number().min(2020).max(2100).optional(),
  advanceDeducted: z.number().min(0).optional(),
  paymentDetails: z.array(paymentDetailSchema).optional(),
  paymentMethod: z.enum(["CASH", "CARD", "QR", "TRANSFER"]).optional(),
  paymentReference: z.string().optional(),
});

// Delete staff payment schema
export const deleteStaffPaymentSchema = z.object({
  id: z.string().min(1, "Payment ID is required"),
});

// List staff payments schema
export const listStaffPaymentsSchema = z.object({
  staffId: z.string().optional(),
  type: z.enum(staffPaymentTypes).optional(),
  types: z.array(z.enum(staffPaymentTypes)).optional(),
  periodMonth: z.coerce.number().min(1).max(12).optional(),
  periodYear: z.coerce.number().min(2020).max(2100).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  includeDeleted: optionalBooleanFromString,
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

// Staff stats schema
export const staffStatsSchema = z.object({
  staffId: z.string().min(1, "Staff ID is required"),
  year: z.coerce.number().min(2020).max(2100),
  month: z.coerce.number().min(1).max(12),
});

// Export types
export type CreateStaffPaymentInput = z.infer<typeof createStaffPaymentSchema>;
export type ListStaffPaymentsInput = z.infer<typeof listStaffPaymentsSchema>;
export type StaffStatsInput = z.infer<typeof staffStatsSchema>;
