import { z } from "zod";

export const staffLoginSchema = z.object({
  username: z
    .string()
    .min(1, "USERNAME_REQUIRED")
    .min(3, "USERNAME_TOO_SHORT"),
  password: z
    .string()
    .min(1, "PASSWORD_REQUIRED")
    .min(6, "PASSWORD_TOO_SHORT"),
});

export const parentLoginSchema = z.object({
  accessCode: z
    .string()
    .min(1, "ACCESS_CODE_REQUIRED")
    .regex(/^BSB-[A-Z0-9]{5}$/, "ACCESS_CODE_INVALID"),
});

export type StaffLoginInput = z.infer<typeof staffLoginSchema>;
export type ParentLoginInput = z.infer<typeof parentLoginSchema>;
