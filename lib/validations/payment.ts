import { z } from "zod";

// Single payment detail (one "line" of a split payment)
export const paymentDetailSchema = z.object({
  amount: z.number().min(0.01, "AMOUNT_MIN"),
  paymentMethod: z.enum(["CASH", "TRANSFER", "CARD", "OTHER"], {
    message: "PAYMENT_METHOD_REQUIRED",
  }),
  reference: z.string().max(100).optional().nullable(),
});

export type PaymentDetailInput = z.infer<typeof paymentDetailSchema>;

// Array of payment details (for split payments)
export const paymentDetailsArraySchema = z
  .array(paymentDetailSchema)
  .min(1, "AT_LEAST_ONE_PAYMENT")
  .refine((details) => details.every((d) => d.amount > 0), {
    message: "ALL_AMOUNTS_POSITIVE",
  });

export type PaymentDetailsArray = z.infer<typeof paymentDetailsArraySchema>;

// Helper to validate that sum equals expected total
export function validatePaymentDetailsSum(
  details: PaymentDetailInput[],
  expectedTotal: number,
  tolerance: number = 0.01
): { valid: boolean; error?: string; sum: number } {
  const sum = details.reduce((acc, d) => acc + d.amount, 0);
  const diff = Math.abs(sum - expectedTotal);

  if (diff > tolerance) {
    return {
      valid: false,
      error: "SUM_MISMATCH",
      sum,
    };
  }

  return { valid: true, sum };
}

// Schema for API requests that include payment details
export const paymentWithDetailsSchema = z.object({
  // Legacy single payment method (for backwards compatibility)
  paymentMethod: z.enum(["CASH", "TRANSFER", "CARD", "OTHER"]).optional(),
  paymentReference: z.string().max(100).optional().nullable(),
  // New split payment support
  paymentDetails: paymentDetailsArraySchema.optional(),
});

export type PaymentWithDetailsInput = z.infer<typeof paymentWithDetailsSchema>;

// Schema for creating payment details in the service
export const createPaymentDetailSchema = z.object({
  parentType: z.enum([
    "SESSION",
    "BABY_CARD",
    "EVENT_PARTICIPANT",
    "APPOINTMENT",
    "PACKAGE_INSTALLMENT",
  ]),
  parentId: z.string().min(1, "PARENT_ID_REQUIRED"),
  amount: z.number().min(0.01, "AMOUNT_MIN"),
  paymentMethod: z.enum(["CASH", "TRANSFER", "CARD", "OTHER"]),
  reference: z.string().max(100).optional().nullable(),
  createdById: z.string().optional().nullable(),
});

export type CreatePaymentDetailInput = z.infer<typeof createPaymentDetailSchema>;
