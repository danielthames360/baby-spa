import { z } from "zod";

// Parent validation schema
export const parentSchema = z.object({
  name: z
    .string()
    .min(1, "NAME_REQUIRED")
    .min(2, "NAME_TOO_SHORT")
    .max(100, "NAME_TOO_LONG"),
  documentId: z
    .string()
    .min(1, "DOCUMENT_REQUIRED")
    .max(20, "DOCUMENT_TOO_LONG"),
  documentType: z.enum(["CI", "CPF", "PASSPORT"]).default("CI"),
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
  birthDate: z.coerce.date().optional().nullable(),
  relationship: z.enum(["MOTHER", "FATHER", "GUARDIAN", "OTHER"]).default("MOTHER"),
  isPrimary: z.boolean().default(true),
});

export type ParentFormData = z.infer<typeof parentSchema>;

// Primary parent schema (email required for main contact)
export const primaryParentSchema = z.object({
  name: z
    .string()
    .min(1, "NAME_REQUIRED")
    .min(2, "NAME_TOO_SHORT")
    .max(100, "NAME_TOO_LONG"),
  documentId: z
    .string()
    .min(1, "DOCUMENT_REQUIRED")
    .max(20, "DOCUMENT_TOO_LONG"),
  documentType: z.enum(["CI", "CPF", "PASSPORT"]).default("CI"),
  phone: z
    .string()
    .min(1, "PHONE_REQUIRED")
    .regex(/^[\d\s+()-]+$/, "PHONE_INVALID")
    .min(8, "PHONE_INVALID"),
  email: z
    .string()
    .min(1, "EMAIL_REQUIRED_PRIMARY")
    .email("EMAIL_INVALID"),
  birthDate: z.coerce.date().optional().nullable(),
  relationship: z.enum(["MOTHER", "FATHER", "GUARDIAN", "OTHER"]).default("MOTHER"),
  isPrimary: z.literal(true).default(true),
});

export type PrimaryParentFormData = z.infer<typeof primaryParentSchema>;

// Secondary parent schema (less strict, email optional)
export const secondaryParentSchema = parentSchema.extend({
  isPrimary: z.literal(false).default(false),
});

export type SecondaryParentFormData = z.infer<typeof secondaryParentSchema>;

// Baby validation schema
export const babySchema = z.object({
  name: z
    .string()
    .min(1, "NAME_REQUIRED")
    .min(2, "NAME_TOO_SHORT")
    .max(100, "NAME_TOO_LONG"),
  birthDate: z.coerce
    .date({ error: "BIRTH_DATE_REQUIRED" })
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
    error: "GENDER_REQUIRED",
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

export type BabyFormData = z.infer<typeof babySchema>;

// Combined form for creating baby with parent
export const createBabyWithParentSchema = z.object({
  parent: parentSchema,
  baby: babySchema,
  existingParentId: z.string().optional().nullable(),
});

export type CreateBabyWithParentData = z.infer<typeof createBabyWithParentSchema>;

// Update baby schema (partial, for editing)
export const updateBabySchema = babySchema.partial();

export type UpdateBabyData = z.infer<typeof updateBabySchema>;

// Update parent schema (partial, for editing)
export const updateParentSchema = parentSchema.partial();

export type UpdateParentData = z.infer<typeof updateParentSchema>;

// Search params schema
export const babySearchParamsSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["active", "inactive", "all"]).default("active"),
  hasActivePackage: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export type BabySearchParams = z.infer<typeof babySearchParamsSchema>;

// Baby note schema
export const babyNoteSchema = z.object({
  note: z.string().min(1, "NOTE_REQUIRED").max(2000, "NOTE_TOO_LONG"),
});

export type BabyNoteData = z.infer<typeof babyNoteSchema>;
