import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "NAME_REQUIRED")
    .max(50, "NAME_TOO_LONG"),
  description: z
    .string()
    .max(200, "DESCRIPTION_TOO_LONG")
    .optional()
    .nullable(),
  type: z.enum(["PACKAGE", "PRODUCT"], {
    message: "TYPE_REQUIRED",
  }),
  color: z
    .string()
    .max(20, "COLOR_TOO_LONG")
    .optional()
    .nullable(),
  sortOrder: z
    .number()
    .int()
    .min(0)
    .optional(),
});

export const categoryUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "NAME_REQUIRED")
    .max(50, "NAME_TOO_LONG")
    .optional(),
  description: z
    .string()
    .max(200, "DESCRIPTION_TOO_LONG")
    .optional()
    .nullable(),
  color: z
    .string()
    .max(20, "COLOR_TOO_LONG")
    .optional()
    .nullable(),
  sortOrder: z
    .number()
    .int()
    .min(0)
    .optional(),
  isActive: z
    .boolean()
    .optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
