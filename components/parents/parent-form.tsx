"use client";

import { useTranslations, useLocale } from "next-intl";
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
import { Checkbox } from "@/components/ui/checkbox";

interface ParentFormProps<T extends FieldValues> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<T, any, any>;
  prefix?: string;
  isPrimary?: boolean;
  /** Hide relationship and isPrimary fields (when managed externally) */
  hideRelationshipFields?: boolean;
}

export function ParentFormFields<T extends FieldValues>({ form, prefix = "", isPrimary = false, hideRelationshipFields = false }: ParentFormProps<T>) {
  const t = useTranslations();
  const locale = useLocale();

  const fieldName = (name: string): Path<T> =>
    (prefix ? `${prefix}.${name}` : name) as Path<T>;

  const translateError = (error: string | undefined): string => {
    if (!error) return "";
    if (error.includes("_")) {
      return t(`babyForm.errors.${error}`);
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
            <FormLabel className="text-gray-700">
              {t("babyForm.parentForm.name")}
            </FormLabel>
            <FormControl>
              <Input
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                onChange={field.onChange}
                value={getStringValue(field.value)}
                placeholder={t("babyForm.parentForm.namePlaceholder")}
                className="h-12 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
              />
            </FormControl>
            <FormMessage>{translateError(fieldState.error?.message)}</FormMessage>
          </FormItem>
        )}
      />

      {/* Document Type & Document ID */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name={fieldName("documentType")}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">
                {t("babyForm.parentForm.documentType")}
              </FormLabel>
              <Select onValueChange={field.onChange} value={getStringValue(field.value) || "CI"}>
                <FormControl>
                  <SelectTrigger className="h-12 rounded-xl border-2 border-teal-100">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CI">{t("babyForm.parentForm.ci")}</SelectItem>
                  <SelectItem value="PASSPORT">
                    {t("babyForm.parentForm.passport")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={fieldName("documentId")}
          render={({ field, fieldState }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-gray-700">
                {t("babyForm.parentForm.documentId")}
              </FormLabel>
              <FormControl>
                <Input
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  value={getStringValue(field.value)}
                  placeholder={t("babyForm.parentForm.documentIdPlaceholder")}
                  className="h-12 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                />
              </FormControl>
              <FormMessage>{translateError(fieldState.error?.message)}</FormMessage>
            </FormItem>
          )}
        />
      </div>

      {/* Phone */}
      <FormField
        control={form.control}
        name={fieldName("phone")}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel className="text-gray-700">
              {t("babyForm.parentForm.phone")}
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
            <FormLabel className="text-gray-700">
              {isPrimary ? t("babyForm.parentForm.emailRequired") : t("babyForm.parentForm.emailOptional")}
            </FormLabel>
            <FormControl>
              <Input
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                onChange={field.onChange}
                value={getStringValue(field.value)}
                type="email"
                placeholder={t("babyForm.parentForm.emailPlaceholder")}
                className="h-12 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
              />
            </FormControl>
            <FormMessage>{translateError(fieldState.error?.message)}</FormMessage>
          </FormItem>
        )}
      />

      {/* Relationship - hide when managed externally */}
      {!hideRelationshipFields && (
        <FormField
          control={form.control}
          name={fieldName("relationship")}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">
                {t("babyForm.parentForm.relationship")}
              </FormLabel>
              <Select onValueChange={field.onChange} value={getStringValue(field.value) || "MOTHER"}>
                <FormControl>
                  <SelectTrigger className="h-12 rounded-xl border-2 border-teal-100">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="MOTHER">
                    {t("babyForm.parentForm.mother")}
                  </SelectItem>
                  <SelectItem value="FATHER">
                    {t("babyForm.parentForm.father")}
                  </SelectItem>
                  <SelectItem value="GUARDIAN">
                    {t("babyForm.parentForm.guardian")}
                  </SelectItem>
                  <SelectItem value="OTHER">
                    {t("babyForm.parentForm.other")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      )}

      {/* Is Primary - only show when not forced as primary and not hidden */}
      {!isPrimary && !hideRelationshipFields && (
        <FormField
          control={form.control}
          name={fieldName("isPrimary")}
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 rounded-xl border-2 border-teal-100 bg-teal-50/50 p-4">
              <FormControl>
                <Checkbox
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                  className="h-5 w-5 rounded border-2 border-teal-300 data-[state=checked]:bg-teal-500 data-[state=checked]:text-white"
                />
              </FormControl>
              <FormLabel className="cursor-pointer text-gray-700">
                {t("babyForm.parentForm.isPrimary")}
              </FormLabel>
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
