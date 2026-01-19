"use client";

import { FieldValues, UseFormReturn, Path } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Translations for the form
const translations = {
  es: {
    // Basic info
    name: "Nombre del bebé",
    namePlaceholder: "Nombre completo del bebé",
    birthDate: "Fecha de nacimiento",
    gender: "Género",
    male: "Masculino",
    female: "Femenino",
    select: "Seleccionar",

    // Birth info
    birthInfo: "Información de nacimiento",
    birthType: "Tipo de parto",
    natural: "Natural",
    cesarean: "Cesárea",
    gestationWeeks: "Semanas de gestación",
    gestationWeeksPlaceholder: "Ej: 38",
    birthWeight: "Peso al nacer (kg)",
    birthWeightPlaceholder: "Ej: 3.2",

    // Medical info
    medicalInfo: "Información médica",
    birthDifficulty: "¿Hubo complicaciones en el parto?",
    birthDifficultyDesc: "Describa las complicaciones...",
    diagnosedIllness: "¿Tiene algún diagnóstico médico?",
    diagnosedIllnessDesc: "Describa el diagnóstico...",
    allergies: "Alergias conocidas",
    allergiesPlaceholder: "Alimentos, medicamentos, otros...",
    specialObservations: "Observaciones especiales",
    specialObservationsPlaceholder: "Cualquier información adicional importante...",

    // Consents
    consents: "Autorizaciones",
    socialMediaConsent: "Autorizo publicar fotos/videos en redes sociales",
    instagramHandle: "Instagram (opcional)",
    instagramPlaceholder: "@usuario",

    // Referral
    referralSource: "¿Cómo nos conoció?",
    referralOptions: {
      instagram: "Instagram",
      facebook: "Facebook",
      google: "Google",
      referral: "Recomendación",
      other: "Otro",
    },

    // Errors
    errors: {
      NAME_REQUIRED: "El nombre es requerido",
      NAME_TOO_SHORT: "El nombre debe tener al menos 2 caracteres",
      NAME_TOO_LONG: "El nombre es muy largo",
      BIRTH_DATE_REQUIRED: "La fecha de nacimiento es requerida",
      BIRTH_DATE_FUTURE: "La fecha no puede ser futura",
      BIRTH_DATE_TOO_OLD: "El bebé debe tener menos de 3 años",
      GENDER_REQUIRED: "El género es requerido",
      BIRTH_WEEKS_TOO_LOW: "Las semanas deben ser al menos 20",
      BIRTH_WEEKS_TOO_HIGH: "Las semanas no pueden ser más de 45",
      BIRTH_WEIGHT_TOO_LOW: "El peso debe ser al menos 0.5 kg",
      BIRTH_WEIGHT_TOO_HIGH: "El peso no puede ser más de 7 kg",
    },
  },
  "pt-BR": {
    // Basic info
    name: "Nome do bebê",
    namePlaceholder: "Nome completo do bebê",
    birthDate: "Data de nascimento",
    gender: "Gênero",
    male: "Masculino",
    female: "Feminino",
    select: "Selecionar",

    // Birth info
    birthInfo: "Informações de nascimento",
    birthType: "Tipo de parto",
    natural: "Natural",
    cesarean: "Cesárea",
    gestationWeeks: "Semanas de gestação",
    gestationWeeksPlaceholder: "Ex: 38",
    birthWeight: "Peso ao nascer (kg)",
    birthWeightPlaceholder: "Ex: 3.2",

    // Medical info
    medicalInfo: "Informações médicas",
    birthDifficulty: "Houve complicações no parto?",
    birthDifficultyDesc: "Descreva as complicações...",
    diagnosedIllness: "Tem algum diagnóstico médico?",
    diagnosedIllnessDesc: "Descreva o diagnóstico...",
    allergies: "Alergias conhecidas",
    allergiesPlaceholder: "Alimentos, medicamentos, outros...",
    specialObservations: "Observações especiais",
    specialObservationsPlaceholder: "Qualquer informação adicional importante...",

    // Consents
    consents: "Autorizações",
    socialMediaConsent: "Autorizo publicar fotos/vídeos nas redes sociais",
    instagramHandle: "Instagram (opcional)",
    instagramPlaceholder: "@usuario",

    // Referral
    referralSource: "Como nos conheceu?",
    referralOptions: {
      instagram: "Instagram",
      facebook: "Facebook",
      google: "Google",
      referral: "Indicação",
      other: "Outro",
    },

    // Errors
    errors: {
      NAME_REQUIRED: "O nome é obrigatório",
      NAME_TOO_SHORT: "O nome deve ter pelo menos 2 caracteres",
      NAME_TOO_LONG: "O nome é muito longo",
      BIRTH_DATE_REQUIRED: "A data de nascimento é obrigatória",
      BIRTH_DATE_FUTURE: "A data não pode ser futura",
      BIRTH_DATE_TOO_OLD: "O bebê deve ter menos de 3 anos",
      GENDER_REQUIRED: "O gênero é obrigatório",
      BIRTH_WEEKS_TOO_LOW: "As semanas devem ser pelo menos 20",
      BIRTH_WEEKS_TOO_HIGH: "As semanas não podem ser mais de 45",
      BIRTH_WEIGHT_TOO_LOW: "O peso deve ser pelo menos 0.5 kg",
      BIRTH_WEIGHT_TOO_HIGH: "O peso não pode ser mais de 7 kg",
    },
  },
};

interface PublicBabyFormFieldsProps<T extends FieldValues> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<T, any, any>;
  locale: "es" | "pt-BR";
}

export function PublicBabyFormFields<T extends FieldValues>({
  form,
  locale,
}: PublicBabyFormFieldsProps<T>) {
  const t = translations[locale];

  const fieldName = (name: string): Path<T> => name as Path<T>;

  const translateError = (error: string | undefined): string => {
    if (!error) return "";
    if (error in t.errors) {
      return t.errors[error as keyof typeof t.errors];
    }
    return error;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStringValue = (value: any): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    return String(value);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getDateValue = (value: any): string => {
    if (!value) return "";
    try {
      return new Date(value as string | number | Date).toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        {/* Name */}
        <FormField
          control={form.control}
          name={fieldName("name")}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-gray-700">{t.name}</FormLabel>
              <FormControl>
                <Input
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  value={getStringValue(field.value)}
                  placeholder={t.namePlaceholder}
                  className="h-12 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                />
              </FormControl>
              <FormMessage>{translateError(fieldState.error?.message)}</FormMessage>
            </FormItem>
          )}
        />

        {/* Birth Date & Gender */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name={fieldName("birthDate")}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-gray-700">{t.birthDate}</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={getDateValue(field.value)}
                    onChange={(e) =>
                      field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                    }
                    max={new Date().toISOString().split("T")[0]}
                    className="h-12 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                  />
                </FormControl>
                <FormMessage>{translateError(fieldState.error?.message)}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={fieldName("gender")}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-gray-700">{t.gender}</FormLabel>
                <Select onValueChange={field.onChange} value={getStringValue(field.value)}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-teal-100">
                      <SelectValue placeholder={t.select} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MALE">{t.male}</SelectItem>
                    <SelectItem value="FEMALE">{t.female}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage>{translateError(fieldState.error?.message)}</FormMessage>
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Birth Info */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">{t.birthInfo}</h4>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name={fieldName("birthType")}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">{t.birthType}</FormLabel>
                <Select onValueChange={field.onChange} value={getStringValue(field.value)}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-teal-100">
                      <SelectValue placeholder={t.select} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NATURAL">{t.natural}</SelectItem>
                    <SelectItem value="CESAREAN">{t.cesarean}</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={fieldName("birthWeeks")}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">{t.gestationWeeks}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : null)
                    }
                    placeholder={t.gestationWeeksPlaceholder}
                    min={20}
                    max={45}
                    className="h-12 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={fieldName("birthWeight")}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">{t.birthWeight}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : null)
                    }
                    placeholder={t.birthWeightPlaceholder}
                    min={0.5}
                    max={7}
                    className="h-12 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Medical Info */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">{t.medicalInfo}</h4>

        {/* Birth Difficulty */}
        <div className="rounded-xl border-2 border-teal-100 bg-white/50 p-4">
          <FormField
            control={form.control}
            name={fieldName("birthDifficulty")}
            render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl>
                  <Checkbox
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    className="h-5 w-5 rounded border-2 border-teal-300 data-[state=checked]:bg-teal-500 data-[state=checked]:text-white"
                  />
                </FormControl>
                <FormLabel className="cursor-pointer text-gray-700">
                  {t.birthDifficulty}
                </FormLabel>
              </FormItem>
            )}
          />
          {form.watch(fieldName("birthDifficulty")) && (
            <FormField
              control={form.control}
              name={fieldName("birthDifficultyDesc")}
              render={({ field }) => (
                <FormItem className="mt-3">
                  <FormControl>
                    <Textarea
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      value={getStringValue(field.value)}
                      placeholder={t.birthDifficultyDesc}
                      className="rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Diagnosed Illness */}
        <div className="rounded-xl border-2 border-teal-100 bg-white/50 p-4">
          <FormField
            control={form.control}
            name={fieldName("diagnosedIllness")}
            render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl>
                  <Checkbox
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    className="h-5 w-5 rounded border-2 border-teal-300 data-[state=checked]:bg-teal-500 data-[state=checked]:text-white"
                  />
                </FormControl>
                <FormLabel className="cursor-pointer text-gray-700">
                  {t.diagnosedIllness}
                </FormLabel>
              </FormItem>
            )}
          />
          {form.watch(fieldName("diagnosedIllness")) && (
            <FormField
              control={form.control}
              name={fieldName("diagnosedIllnessDesc")}
              render={({ field }) => (
                <FormItem className="mt-3">
                  <FormControl>
                    <Textarea
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      value={getStringValue(field.value)}
                      placeholder={t.diagnosedIllnessDesc}
                      className="rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Allergies */}
        <FormField
          control={form.control}
          name={fieldName("allergies")}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">{t.allergies}</FormLabel>
              <FormControl>
                <Textarea
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  value={getStringValue(field.value)}
                  placeholder={t.allergiesPlaceholder}
                  className="rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Special Observations */}
        <FormField
          control={form.control}
          name={fieldName("specialObservations")}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">{t.specialObservations}</FormLabel>
              <FormControl>
                <Textarea
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  value={getStringValue(field.value)}
                  placeholder={t.specialObservationsPlaceholder}
                  className="rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Consents */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">{t.consents}</h4>

        <div className="rounded-xl border-2 border-teal-100 bg-white/50 p-4">
          <FormField
            control={form.control}
            name={fieldName("socialMediaConsent")}
            render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl>
                  <Checkbox
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    className="h-5 w-5 rounded border-2 border-teal-300 data-[state=checked]:bg-teal-500 data-[state=checked]:text-white"
                  />
                </FormControl>
                <FormLabel className="cursor-pointer text-gray-700">
                  {t.socialMediaConsent}
                </FormLabel>
              </FormItem>
            )}
          />
          {form.watch(fieldName("socialMediaConsent")) && (
            <FormField
              control={form.control}
              name={fieldName("instagramHandle")}
              render={({ field }) => (
                <FormItem className="mt-3">
                  <FormLabel className="text-gray-700">{t.instagramHandle}</FormLabel>
                  <FormControl>
                    <Input
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      value={getStringValue(field.value)}
                      placeholder={t.instagramPlaceholder}
                      className="h-12 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>
      </div>

      {/* Referral Source */}
      <FormField
        control={form.control}
        name={fieldName("referralSource")}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">{t.referralSource}</FormLabel>
            <Select onValueChange={field.onChange} value={getStringValue(field.value)}>
              <FormControl>
                <SelectTrigger className="h-12 rounded-xl border-2 border-teal-100">
                  <SelectValue placeholder={t.select} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="instagram">{t.referralOptions.instagram}</SelectItem>
                <SelectItem value="facebook">{t.referralOptions.facebook}</SelectItem>
                <SelectItem value="google">{t.referralOptions.google}</SelectItem>
                <SelectItem value="referral">{t.referralOptions.referral}</SelectItem>
                <SelectItem value="other">{t.referralOptions.other}</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
    </div>
  );
}
