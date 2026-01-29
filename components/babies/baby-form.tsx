"use client";

import { useTranslations } from "next-intl";
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
import { getStringValue, getDateValue, getTodayDateString } from "@/lib/form-utils";

interface BabyFormProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  prefix?: string;
}

export function BabyFormFields<T extends FieldValues>({ form, prefix = "" }: BabyFormProps<T>) {
  const t = useTranslations();

  const fieldName = (name: string): Path<T> =>
    (prefix ? `${prefix}.${name}` : name) as Path<T>;

  const translateError = (error: string | undefined): string => {
    if (!error) return "";
    if (error.includes("_")) {
      return t(`babyForm.errors.${error}`);
    }
    return error;
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
              <FormLabel className="text-gray-700">
                {t("babyForm.babyData.name")}
              </FormLabel>
              <FormControl>
                <Input
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  value={getStringValue(field.value)}
                  placeholder={t("babyForm.babyData.namePlaceholder")}
                  className="h-12 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                />
              </FormControl>
              <FormMessage>{translateError(fieldState.error?.message)}</FormMessage>
            </FormItem>
          )}
        />

        {/* Birth Date & Gender */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name={fieldName("birthDate")}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-gray-700">
                  {t("babyForm.babyData.birthDate")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={getDateValue(field.value)}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value + "T12:00:00Z") : undefined)}
                    max={getTodayDateString()}
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
                <FormLabel className="text-gray-700">
                  {t("babyForm.babyData.gender")}
                </FormLabel>
                <Select onValueChange={field.onChange} value={getStringValue(field.value)}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-teal-100">
                      <SelectValue placeholder={t("common.select")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MALE">
                      {t("babyForm.babyData.male")}
                    </SelectItem>
                    <SelectItem value="FEMALE">
                      {t("babyForm.babyData.female")}
                    </SelectItem>
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
        <h4 className="font-medium text-gray-700">
          {t("babyForm.babyData.birthInfo")}
        </h4>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name={fieldName("birthType")}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">
                  {t("babyForm.babyData.birthType")}
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={getStringValue(field.value)}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-teal-100">
                      <SelectValue placeholder={t("common.select")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NATURAL">
                      {t("babyForm.babyData.natural")}
                    </SelectItem>
                    <SelectItem value="CESAREAN">
                      {t("babyForm.babyData.cesarean")}
                    </SelectItem>
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
                <FormLabel className="text-gray-700">
                  {t("babyForm.babyData.gestationWeeks")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    placeholder={t("babyForm.babyData.gestationWeeksPlaceholder")}
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
                <FormLabel className="text-gray-700">
                  {t("babyForm.babyData.birthWeight")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    placeholder={t("babyForm.babyData.birthWeightPlaceholder")}
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
        <h4 className="font-medium text-gray-700">
          {t("babyForm.babyData.medicalInfo")}
        </h4>

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
                  {t("babyForm.babyData.birthDifficulty")}
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
                      placeholder={t("babyForm.babyData.birthDifficultyDesc")}
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
                  {t("babyForm.babyData.diagnosedIllness")}
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
                      placeholder={t("babyForm.babyData.diagnosedIllnessDesc")}
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
              <FormLabel className="text-gray-700">
                {t("babyForm.babyData.allergies")}
              </FormLabel>
              <FormControl>
                <Textarea
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  value={getStringValue(field.value)}
                  placeholder={t("babyForm.babyData.allergiesPlaceholder")}
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
              <FormLabel className="text-gray-700">
                {t("babyForm.babyData.specialObservations")}
              </FormLabel>
              <FormControl>
                <Textarea
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  value={getStringValue(field.value)}
                  placeholder={t("babyForm.babyData.specialObservationsPlaceholder")}
                  className="rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Consents */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">
          {t("babyForm.babyData.consents")}
        </h4>

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
                  {t("babyForm.babyData.socialMediaConsent")}
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
                  <FormLabel className="text-gray-700">
                    {t("babyForm.babyData.instagramHandle")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      value={getStringValue(field.value)}
                      placeholder={t("babyForm.babyData.instagramPlaceholder")}
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
            <FormLabel className="text-gray-700">
              {t("babyForm.babyData.referralSource")}
            </FormLabel>
            <Select onValueChange={field.onChange} value={getStringValue(field.value)}>
              <FormControl>
                <SelectTrigger className="h-12 rounded-xl border-2 border-teal-100">
                  <SelectValue placeholder={t("common.select")} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="instagram">
                  {t("babyForm.babyData.referralOptions.instagram")}
                </SelectItem>
                <SelectItem value="facebook">
                  {t("babyForm.babyData.referralOptions.facebook")}
                </SelectItem>
                <SelectItem value="google">
                  {t("babyForm.babyData.referralOptions.google")}
                </SelectItem>
                <SelectItem value="referral">
                  {t("babyForm.babyData.referralOptions.referral")}
                </SelectItem>
                <SelectItem value="other">
                  {t("babyForm.babyData.referralOptions.other")}
                </SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
    </div>
  );
}
