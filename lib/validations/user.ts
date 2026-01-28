import { z } from "zod";

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["ADMIN", "RECEPTION", "THERAPIST"]),
  phone: z.string().optional().or(z.literal("")),
  baseSalary: z.number().min(0).optional(),
  payFrequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]).optional(),
});

export const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  role: z.enum(["ADMIN", "RECEPTION", "THERAPIST"]).optional(),
  phone: z.string().optional().or(z.literal("")),
  baseSalary: z.number().min(0).nullable().optional(),
  payFrequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]).optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
