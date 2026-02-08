"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Save,
  Send,
  Calendar,
  Users,
  FileText,
  Baby,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { translateError } from "@/lib/form-utils";
import { getCurrencySymbol } from "@/lib/utils/currency-utils";
import { fromDateOnly } from "@/lib/utils/date-utils";
import { cn } from "@/lib/utils";

const eventFormSchema = z.object({
  name: z.string().min(2, "NAME_TOO_SHORT").max(100),
  description: z.string().max(500).optional().nullable(),
  type: z.enum(["BABIES", "PARENTS"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "INVALID_DATE_FORMAT"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "INVALID_TIME_FORMAT"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "INVALID_TIME_FORMAT"),
  maxParticipants: z.number().min(1).max(100),
  blockedTherapists: z.number().min(0).max(4),
  minAgeMonths: z.number().min(0).max(36).optional().nullable(),
  maxAgeMonths: z.number().min(0).max(36).optional().nullable(),
  basePrice: z.number().min(0),
  internalNotes: z.string().max(1000).optional().nullable(),
  externalNotes: z.string().max(1000).optional().nullable(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  initialData?: Partial<EventFormData> & { id?: string; status?: string; minAgeMonths?: number | null; maxAgeMonths?: number | null };
  mode: "create" | "edit";
}

export function EventForm({ initialData, mode }: EventFormProps) {
  const t = useTranslations("events");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const locale = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState<"draft" | "publish">("draft");

  // Convert date if needed
  const defaultDate = initialData?.date
    ? typeof initialData.date === "string"
      ? initialData.date.split("T")[0]
      : fromDateOnly(initialData.date as unknown as Date)
    : "";

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      type: initialData?.type || "BABIES",
      date: defaultDate,
      startTime: initialData?.startTime || "09:00",
      endTime: initialData?.endTime || "11:00",
      maxParticipants: initialData?.maxParticipants || 10,
      blockedTherapists: initialData?.blockedTherapists || 0,
      minAgeMonths: initialData?.minAgeMonths ?? null,
      maxAgeMonths: initialData?.maxAgeMonths ?? null,
      basePrice: initialData?.basePrice || 0,
      internalNotes: initialData?.internalNotes || "",
      externalNotes: initialData?.externalNotes || "",
    },
  });

  const selectedType = form.watch("type");

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        status: submitAction === "publish" ? "PUBLISHED" : "DRAFT",
      };

      const url = mode === "create"
        ? "/api/events"
        : `/api/events/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error saving event");
      }

      const result = await response.json();
      toast.success(mode === "create" ? t("messages.created") : t("messages.updated"));
      router.push(`/${locale}/admin/events/${result.event.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="rounded-2xl border border-white/50 bg-white/70 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Column - Basic Info */}
            <div className="border-b border-gray-100 p-6 lg:border-b-0 lg:border-r">
              {/* Event Type Selection - Visual Cards */}
              <div className="mb-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        {t("form.type")}
                      </FormLabel>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => field.onChange("BABIES")}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                            field.value === "BABIES"
                              ? "border-teal-400 bg-teal-50 shadow-md"
                              : "border-gray-200 hover:border-teal-200 hover:bg-gray-50"
                          )}
                        >
                          <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full",
                            field.value === "BABIES"
                              ? "bg-teal-100"
                              : "bg-gray-100"
                          )}>
                            <Baby className={cn(
                              "h-6 w-6",
                              field.value === "BABIES" ? "text-teal-600" : "text-gray-400"
                            )} />
                          </div>
                          <span className={cn(
                            "text-sm font-medium",
                            field.value === "BABIES" ? "text-teal-700" : "text-gray-600"
                          )}>
                            {t("typeLabels.BABIES")}
                          </span>
                          <span className="text-center text-xs text-gray-500">
                            {t("typeDescriptions.BABIES")}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => field.onChange("PARENTS")}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                            field.value === "PARENTS"
                              ? "border-purple-400 bg-purple-50 shadow-md"
                              : "border-gray-200 hover:border-purple-200 hover:bg-gray-50"
                          )}
                        >
                          <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full",
                            field.value === "PARENTS"
                              ? "bg-purple-100"
                              : "bg-gray-100"
                          )}>
                            <Heart className={cn(
                              "h-6 w-6",
                              field.value === "PARENTS" ? "text-purple-600" : "text-gray-400"
                            )} />
                          </div>
                          <span className={cn(
                            "text-sm font-medium",
                            field.value === "PARENTS" ? "text-purple-700" : "text-gray-600"
                          )}>
                            {t("typeLabels.PARENTS")}
                          </span>
                          <span className="text-center text-xs text-gray-500">
                            {t("typeDescriptions.PARENTS")}
                          </span>
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Event Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      {t("form.name")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("form.namePlaceholder")}
                        className="h-11 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </FormControl>
                    <FormMessage>
                      {translateError(form.formState.errors.name?.message, t, "errors")}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      {t("form.description")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder={t("form.descriptionPlaceholder")}
                        className="rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Right Column - Date, Time, Capacity, Price */}
            <div className="p-6">
              {/* Date & Time Section */}
              <div className="mb-6 rounded-xl bg-gray-50/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4 text-teal-600" />
                  {t("form.dateTime")}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-500">{t("form.date")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            className="h-10 rounded-lg border border-gray-200 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                          />
                        </FormControl>
                        <FormMessage>
                          {translateError(form.formState.errors.date?.message, t, "errors")}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-500">{t("form.startTime")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="time"
                            className="h-10 rounded-lg border border-gray-200 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-500">{t("form.endTime")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="time"
                            className="h-10 rounded-lg border border-gray-200 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Capacity & Price Section */}
              <div className="mb-6 rounded-xl bg-gray-50/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Users className="h-4 w-4 text-teal-600" />
                  {t("form.capacity")} & {t("form.pricing")}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="maxParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-500">
                          {t("form.maxParticipants")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value) || 1)}
                            className="h-10 rounded-lg border border-gray-200 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="blockedTherapists"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-500">
                          {t("form.blockedTherapists")}
                        </FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(Number(v))}
                          defaultValue={String(field.value)}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-lg border border-gray-200 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">0</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="4">{t("form.allTherapists")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-500">
                          {t("form.basePrice")} ({getCurrencySymbol(locale)})
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            className="h-10 rounded-lg border border-gray-200 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {t("form.blockedTherapistsHelp")}
                </p>
              </div>

              {/* Age Range Section - Only for BABIES events */}
              {selectedType === "BABIES" && (
                <div className="mb-6 rounded-xl border-2 border-teal-100 bg-teal-50/50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-teal-700">
                    <Baby className="h-4 w-4" />
                    {t("form.ageRange")}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="minAgeMonths"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-gray-500">
                            {t("form.minAge")}
                          </FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={36}
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  field.onChange(val === "" ? null : Number(val));
                                }}
                                placeholder="0"
                                className="h-10 rounded-lg border border-gray-200 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                              />
                              <span className="text-xs text-gray-500">{t("form.months")}</span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxAgeMonths"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-gray-500">
                            {t("form.maxAge")}
                          </FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={36}
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  field.onChange(val === "" ? null : Number(val));
                                }}
                                placeholder="36"
                                className="h-10 rounded-lg border border-gray-200 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                              />
                              <span className="text-xs text-gray-500">{t("form.months")}</span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className="mt-2 text-xs text-teal-600">
                    {t("form.ageRangeHelp")}
                  </p>
                </div>
              )}

              {/* Notes Section - Collapsible feel */}
              <div className="rounded-xl bg-gray-50/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="h-4 w-4 text-teal-600" />
                  {t("form.notes")}
                </div>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="internalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-500">
                          {t("form.internalNotes")}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder={t("form.internalNotesHelp")}
                            className="min-h-[60px] rounded-lg border border-gray-200 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="externalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-500">
                          {t("form.externalNotes")}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder={t("form.externalNotesHelp")}
                            className="min-h-[60px] rounded-lg border border-gray-200 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="h-10 rounded-xl border-2 border-gray-200 px-5"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setSubmitAction("draft")}
              className="h-10 rounded-xl border-2 border-teal-200 px-5 text-teal-600 hover:bg-teal-50"
            >
              {isSubmitting && submitAction === "draft" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t("form.saveDraft")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={() => setSubmitAction("publish")}
              className={cn(
                "h-10 rounded-xl px-5 font-semibold text-white shadow-lg transition-all hover:shadow-xl",
                selectedType === "PARENTS"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-purple-300/50 hover:from-purple-600 hover:to-pink-600 hover:shadow-purple-400/40"
                  : "bg-gradient-to-r from-teal-500 to-cyan-500 shadow-teal-300/50 hover:from-teal-600 hover:to-cyan-600 hover:shadow-teal-400/40"
              )}
            >
              {isSubmitting && submitAction === "publish" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {t("form.saveAndPublish")}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
