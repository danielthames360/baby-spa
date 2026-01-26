import { z } from "zod";

// Create appointment schema
// Either babyId OR parentId must be provided, but not both
export const createAppointmentSchema = z.object({
  babyId: z.string().optional().nullable(), // For baby appointments
  parentId: z.string().optional().nullable(), // For parent appointments (prenatal massage, etc.)
  date: z.string().min(1, "DATE_REQUIRED"), // ISO date string
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "INVALID_TIME_FORMAT"), // HH:mm
  notes: z.string().max(500, "NOTES_TOO_LONG").optional().or(z.literal("")),
  packageId: z.string().optional().nullable(), // Provisional package from catalog
  packagePurchaseId: z.string().optional().nullable(), // Existing package purchase
  createAsPending: z.boolean().optional(), // If true, create as PENDING_PAYMENT (for packages requiring advance payment)
}).refine(
  (data) => {
    // Either babyId or parentId must be provided (XOR logic)
    const hasBaby = data.babyId && data.babyId.length > 0;
    const hasParent = data.parentId && data.parentId.length > 0;
    return (hasBaby || hasParent) && !(hasBaby && hasParent);
  },
  {
    message: "CLIENT_REQUIRED", // Either baby or parent must be specified
    path: ["babyId"],
  }
);

export type CreateAppointmentData = z.infer<typeof createAppointmentSchema>;

// Update appointment schema
export const updateAppointmentSchema = z.object({
  date: z.string().optional(), // ISO date string
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "INVALID_TIME_FORMAT")
    .optional(),
  status: z
    .enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .optional(),
  notes: z.string().max(500, "NOTES_TOO_LONG").optional().or(z.literal("")),
  cancelReason: z
    .string()
    .max(200, "REASON_TOO_LONG")
    .optional()
    .or(z.literal("")),
  packageId: z.string().optional().nullable(), // Change provisional package from catalog
  packagePurchaseId: z.string().optional().nullable(), // Change to existing package purchase
});

export type UpdateAppointmentData = z.infer<typeof updateAppointmentSchema>;

// Cancel appointment schema
export const cancelAppointmentSchema = z.object({
  reason: z.string().min(1, "REASON_REQUIRED").max(200, "REASON_TOO_LONG"),
});

export type CancelAppointmentData = z.infer<typeof cancelAppointmentSchema>;
