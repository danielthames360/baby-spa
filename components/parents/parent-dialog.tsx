"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslations, useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";

interface ParentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parent?: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    status: string;
    pregnancyWeeks: number | null;
    leadSource: string | null;
    leadNotes: string | null;
    babies?: { id: string }[]; // To check if parent has babies
  } | null;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  status: "LEAD" | "ACTIVE" | "INACTIVE";
  pregnancyWeeks: string;
  leadSource: string;
  leadNotes: string;
}

const LEAD_SOURCES = [
  "event",
  "instagram",
  "facebook",
  "referral",
  "walkin",
  "other",
] as const;

export function ParentDialog({
  open,
  onOpenChange,
  parent,
  onSuccess,
}: ParentDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!parent;

  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      status: "LEAD",
      pregnancyWeeks: "",
      leadSource: "",
      leadNotes: "",
    },
  });

  // Reset form when parent changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: parent?.name ?? "",
        phone: parent?.phone ?? "",
        email: parent?.email ?? "",
        status: (parent?.status as "LEAD" | "ACTIVE" | "INACTIVE") ?? "LEAD",
        pregnancyWeeks: parent?.pregnancyWeeks?.toString() ?? "",
        leadSource: parent?.leadSource ?? "",
        leadNotes: parent?.leadNotes ?? "",
      });
    }
  }, [open, parent, form]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Validate required fields
      if (!data.name.trim()) {
        form.setError("name", { message: "NAME_REQUIRED" });
        setIsSubmitting(false);
        return;
      }
      if (!data.phone.trim()) {
        form.setError("phone", { message: "PHONE_REQUIRED" });
        setIsSubmitting(false);
        return;
      }

      const url = isEditing ? `/api/parents/${parent!.id}` : "/api/parents";
      const method = isEditing ? "PUT" : "POST";

      const payload = {
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        status: data.status,
        pregnancyWeeks: data.pregnancyWeeks ? parseInt(data.pregnancyWeeks) : null,
        leadSource: data.leadSource || null,
        leadNotes: data.leadNotes || null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error saving parent");
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error saving parent:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = form.watch("status");
  const isLead = status === "LEAD";
  const hasBabies = (parent?.babies?.length ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-xl font-bold text-transparent">
            {isEditing ? t("parents.editParent") : t("parents.newParent")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("parents.fields.name")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("parents.fields.name")}
                      className="h-12 rounded-xl border-2 border-teal-100"
                    />
                  </FormControl>
                  <FormMessage>
                    {fieldState.error?.message && t(`babyForm.errors.${fieldState.error.message}`)}
                  </FormMessage>
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("parents.fields.phone")}</FormLabel>
                  <FormControl>
                    <PhoneInput
                      value={field.value}
                      onChange={field.onChange}
                      locale={locale}
                    />
                  </FormControl>
                  <FormMessage>
                    {fieldState.error?.message && t(`babyForm.errors.${fieldState.error.message}`)}
                  </FormMessage>
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("parents.fields.email")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder={t("parents.fields.email")}
                      className="h-12 rounded-xl border-2 border-teal-100"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("parents.fields.status")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-xl border-2 border-teal-100">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LEAD" disabled={hasBabies}>
                        {t("parents.status.lead")}
                        {hasBabies && " ✗"}
                      </SelectItem>
                      <SelectItem value="ACTIVE">{t("parents.status.active")}</SelectItem>
                      <SelectItem value="INACTIVE">{t("parents.status.inactive")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {hasBabies && (
                    <p className="text-xs text-amber-600">
                      {t("parents.messages.cannotBeLeadWithBabies")}
                    </p>
                  )}
                </FormItem>
              )}
            />

            {/* LEAD-specific fields */}
            {isLead && (
              <>
                {/* Pregnancy Weeks */}
                <FormField
                  control={form.control}
                  name="pregnancyWeeks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("parents.fields.pregnancyWeeks")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={1}
                          max={45}
                          placeholder="Ej: 24"
                          className="h-12 rounded-xl border-2 border-teal-100"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Lead Source */}
                <FormField
                  control={form.control}
                  name="leadSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("parents.fields.leadSource")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl border-2 border-teal-100">
                            <SelectValue placeholder={t("parents.fields.leadSource")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LEAD_SOURCES.map((source) => (
                            <SelectItem key={source} value={source}>
                              {t(`parents.leadSources.${source}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Lead Notes */}
                <FormField
                  control={form.control}
                  name="leadNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("parents.fields.leadNotes")}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={t("parents.fields.leadNotes")}
                          className="min-h-[100px] rounded-xl border-2 border-teal-100"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-300/50"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("common.save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
