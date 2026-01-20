import { z } from "zod";

// Create appointment schema
export const createAppointmentSchema = z.object({
  babyId: z.string().min(1, "BABY_REQUIRED"),
  date: z.string().min(1, "DATE_REQUIRED"), // ISO date string
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "INVALID_TIME_FORMAT"), // HH:mm
  notes: z.string().max(500, "NOTES_TOO_LONG").optional().or(z.literal("")),
});

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
});

export type UpdateAppointmentData = z.infer<typeof updateAppointmentSchema>;

// Cancel appointment schema
export const cancelAppointmentSchema = z.object({
  reason: z.string().min(1, "REASON_REQUIRED").max(200, "REASON_TOO_LONG"),
});

export type CancelAppointmentData = z.infer<typeof cancelAppointmentSchema>;
