import { z } from "zod";

// Schema for creating a registration link (by staff) - only phone required
export const createRegistrationLinkSchema = z.object({
  parentPhone: z
    .string()
    .min(1, "PHONE_REQUIRED")
    .regex(/^\+\d{1,4}\d{6,14}$/, "PHONE_INVALID"), // Must include country code like +591...
  locale: z.enum(["es", "pt-BR"]).optional(),
});

export type CreateRegistrationLinkData = z.infer<typeof createRegistrationLinkSchema>;

// Schema for the public registration form - Primary parent
export const publicPrimaryParentSchema = z.object({
  name: z
    .string()
    .min(1, "NAME_REQUIRED")
    .min(2, "NAME_TOO_SHORT")
    .max(100, "NAME_TOO_LONG"),
  phone: z
    .string()
    .min(1, "PHONE_REQUIRED")
    .regex(/^[\d\s+()-]+$/, "PHONE_INVALID")
    .min(8, "PHONE_INVALID"),
  email: z
    .string()
    .email("EMAIL_INVALID")
    .optional()
    .or(z.literal("")),
  relationship: z.enum(["MOTHER", "FATHER", "GUARDIAN", "OTHER"]).default("MOTHER"),
});

export type PublicPrimaryParentData = z.infer<typeof publicPrimaryParentSchema>;

// Schema for the public registration form - Secondary parent (optional)
export const publicSecondaryParentSchema = z.object({
  name: z
    .string()
    .min(1, "NAME_REQUIRED")
    .min(2, "NAME_TOO_SHORT")
    .max(100, "NAME_TOO_LONG"),
  phone: z
    .string()
    .regex(/^[\d\s+()-]*$/, "PHONE_INVALID")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("EMAIL_INVALID")
    .optional()
    .or(z.literal("")),
  relationship: z.enum(["MOTHER", "FATHER", "GUARDIAN", "OTHER"]).default("FATHER"),
});

export type PublicSecondaryParentData = z.infer<typeof publicSecondaryParentSchema>;

// Schema for baby data in public form (same as babySchema)
export const publicBabySchema = z.object({
  name: z
    .string()
    .min(1, "NAME_REQUIRED")
    .min(2, "NAME_TOO_SHORT")
    .max(100, "NAME_TOO_LONG"),
  birthDate: z.coerce
    .date({ message: "BIRTH_DATE_REQUIRED" })
    .refine((date) => date <= new Date(), {
      message: "BIRTH_DATE_FUTURE",
    })
    .refine(
      (date) => {
        const now = new Date();
        const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
        return date >= threeYearsAgo;
      },
      {
        message: "BIRTH_DATE_TOO_OLD",
      }
    ),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    message: "GENDER_REQUIRED",
  }),
  birthType: z.enum(["NATURAL", "CESAREAN"]).optional().nullable(),
  birthWeeks: z.coerce
    .number()
    .min(20, "BIRTH_WEEKS_TOO_LOW")
    .max(45, "BIRTH_WEEKS_TOO_HIGH")
    .optional()
    .nullable(),
  birthWeight: z.coerce
    .number()
    .min(0.5, "BIRTH_WEIGHT_TOO_LOW")
    .max(7, "BIRTH_WEIGHT_TOO_HIGH")
    .optional()
    .nullable(),

  // Medical info
  birthDifficulty: z.boolean().default(false),
  birthDifficultyDesc: z.string().max(500).optional().nullable(),
  pregnancyIssues: z.boolean().default(false),
  pregnancyIssuesDesc: z.string().max(500).optional().nullable(),
  priorStimulation: z.boolean().default(false),
  priorStimulationType: z.string().max(200).optional().nullable(),
  developmentDiagnosis: z.boolean().default(false),
  developmentDiagnosisDesc: z.string().max(500).optional().nullable(),
  diagnosedIllness: z.boolean().default(false),
  diagnosedIllnessDesc: z.string().max(500).optional().nullable(),
  recentMedication: z.boolean().default(false),
  recentMedicationDesc: z.string().max(500).optional().nullable(),
  allergies: z.string().max(500).optional().nullable(),
  specialObservations: z.string().max(1000).optional().nullable(),

  // Consents
  socialMediaConsent: z.boolean().default(false),
  instagramHandle: z.string().max(50).optional().nullable(),

  // Marketing
  referralSource: z.string().max(100).optional().nullable(),
});

export type PublicBabyData = z.infer<typeof publicBabySchema>;

// Combined schema for the complete public registration
export const completePublicRegistrationSchema = z.object({
  token: z.string().min(1),
  parent1: publicPrimaryParentSchema,
  parent2: publicSecondaryParentSchema.optional().nullable(),
  baby: publicBabySchema,
});

export type CompletePublicRegistrationData = z.infer<typeof completePublicRegistrationSchema>;
