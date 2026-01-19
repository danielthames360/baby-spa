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
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Translations for the form
const translations = {
  es: {
    name: "Nombre completo",
    namePlaceholder: "Ingrese su nombre completo",
    phoneRequired: "Teléfono",
    phoneOptional: "Teléfono (opcional)",
    emailOptional: "Correo electrónico (opcional)",
    emailPlaceholder: "ejemplo@correo.com",
    relationship: "Relación con el bebé",
    mother: "Madre",
    father: "Padre",
    guardian: "Tutor/a",
    other: "Otro",
    errors: {
      NAME_REQUIRED: "El nombre es requerido",
      NAME_TOO_SHORT: "El nombre debe tener al menos 2 caracteres",
      NAME_TOO_LONG: "El nombre es muy largo",
      PHONE_REQUIRED: "El teléfono es requerido",
      PHONE_INVALID: "Teléfono inválido",
      EMAIL_INVALID: "Correo electrónico inválido",
    },
  },
  "pt-BR": {
    name: "Nome completo",
    namePlaceholder: "Digite seu nome completo",
    phoneRequired: "Telefone",
    phoneOptional: "Telefone (opcional)",
    emailOptional: "E-mail (opcional)",
    emailPlaceholder: "exemplo@email.com",
    relationship: "Relação com o bebê",
    mother: "Mãe",
    father: "Pai",
    guardian: "Responsável",
    other: "Outro",
    errors: {
      NAME_REQUIRED: "O nome é obrigatório",
      NAME_TOO_SHORT: "O nome deve ter pelo menos 2 caracteres",
      NAME_TOO_LONG: "O nome é muito longo",
      PHONE_REQUIRED: "O telefone é obrigatório",
      PHONE_INVALID: "Telefone inválido",
      EMAIL_INVALID: "E-mail inválido",
    },
  },
};

interface PublicParentFormFieldsProps<T extends FieldValues> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<T, any, any>;
  locale: "es" | "pt-BR";
  isPrimary?: boolean;
}

export function PublicParentFormFields<T extends FieldValues>({
  form,
  locale,
  isPrimary = false,
}: PublicParentFormFieldsProps<T>) {
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

  return (
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

      {/* Phone */}
      <FormField
        control={form.control}
        name={fieldName("phone")}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel className="text-gray-700">
              {isPrimary ? t.phoneRequired : t.phoneOptional}
            </FormLabel>
            <FormControl>
              <PhoneInput
                ref={field.ref}
                value={getStringValue(field.value)}
                onChange={field.onChange}
                locale={locale}
              />
            </FormControl>
            <FormMessage>{translateError(fieldState.error?.message)}</FormMessage>
          </FormItem>
        )}
      />

      {/* Email */}
      <FormField
        control={form.control}
        name={fieldName("email")}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel className="text-gray-700">{t.emailOptional}</FormLabel>
            <FormControl>
              <Input
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                onChange={field.onChange}
                value={getStringValue(field.value)}
                type="email"
                placeholder={t.emailPlaceholder}
                className="h-12 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
              />
            </FormControl>
            <FormMessage>{translateError(fieldState.error?.message)}</FormMessage>
          </FormItem>
        )}
      />

      {/* Relationship */}
      <FormField
        control={form.control}
        name={fieldName("relationship")}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">{t.relationship}</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={getStringValue(field.value) || "MOTHER"}
            >
              <FormControl>
                <SelectTrigger className="h-12 rounded-xl border-2 border-teal-100">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="MOTHER">{t.mother}</SelectItem>
                <SelectItem value="FATHER">{t.father}</SelectItem>
                <SelectItem value="GUARDIAN">{t.guardian}</SelectItem>
                <SelectItem value="OTHER">{t.other}</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
    </div>
  );
}
