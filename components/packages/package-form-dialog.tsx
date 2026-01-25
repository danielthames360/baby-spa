"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Package } from "lucide-react";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { packageSchema, type PackageFormData } from "@/lib/validations/package";
import { SessionPaymentSelector } from "./session-payment-selector";

interface Category {
  id: string;
  name: string;
  color: string | null;
  isActive: boolean;
}

interface PackageData {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  sessionCount: number;
  basePrice: number | string;
  duration?: number;
  requiresAdvancePayment?: boolean;
  advancePaymentAmount?: number | string | null;
  allowInstallments?: boolean;
  installmentsCount?: number | null;
  installmentsTotalPrice?: number | string | null;
  installmentsPayOnSessions?: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface PackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package?: PackageData | null;
  onSuccess: () => void;
}

export function PackageFormDialog({
  open,
  onOpenChange,
  package: packageData,
  onSuccess,
}: PackageFormDialogProps) {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const form = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: null,
      sessionCount: 1,
      basePrice: 0,
      duration: 60,
      requiresAdvancePayment: false,
      advancePaymentAmount: null,
      allowInstallments: false,
      installmentsCount: null,
      installmentsTotalPrice: null,
      installmentsPayOnSessions: null,
      isActive: true,
      sortOrder: 0,
    },
  });

  const requiresAdvancePayment = form.watch("requiresAdvancePayment");
  const allowInstallments = form.watch("allowInstallments");
  const sessionCount = form.watch("sessionCount");
  const installmentsCount = form.watch("installmentsCount");
  const installmentsTotalPrice = form.watch("installmentsTotalPrice");

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories?type=PACKAGE");
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchCategories();
      if (packageData) {
        form.reset({
          name: packageData.name,
          description: packageData.description || "",
          categoryId: packageData.categoryId,
          sessionCount: packageData.sessionCount,
          basePrice: Number(packageData.basePrice),
          duration: packageData.duration ?? 60,
          requiresAdvancePayment: packageData.requiresAdvancePayment ?? false,
          advancePaymentAmount: packageData.advancePaymentAmount
            ? Number(packageData.advancePaymentAmount)
            : null,
          allowInstallments: packageData.allowInstallments ?? false,
          installmentsCount: packageData.installmentsCount ?? null,
          installmentsTotalPrice: packageData.installmentsTotalPrice
            ? Number(packageData.installmentsTotalPrice)
            : null,
          installmentsPayOnSessions: packageData.installmentsPayOnSessions ?? null,
          isActive: packageData.isActive,
          sortOrder: packageData.sortOrder,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          categoryId: null,
          sessionCount: 1,
          basePrice: 0,
          duration: 60,
          requiresAdvancePayment: false,
          advancePaymentAmount: null,
          allowInstallments: false,
          installmentsCount: null,
          installmentsTotalPrice: null,
          installmentsPayOnSessions: null,
          isActive: true,
          sortOrder: 0,
        });
      }
    }
  }, [open, packageData, form, fetchCategories]);

  const translateZodError = (error: string | undefined): string => {
    if (!error) return "";
    if (error.includes("_")) {
      return t(`packages.errors.${error}`);
    }
    return error;
  };

  const onSubmit = async (data: PackageFormData) => {
    setIsSubmitting(true);
    try {
      const url = packageData
        ? `/api/packages/${packageData.id}`
        : "/api/packages";
      const method = packageData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          advancePaymentAmount: data.requiresAdvancePayment
            ? data.advancePaymentAmount
            : null,
          installmentsCount: data.allowInstallments
            ? data.installmentsCount
            : null,
          installmentsTotalPrice: data.allowInstallments
            ? data.installmentsTotalPrice
            : null,
          installmentsPayOnSessions: data.allowInstallments
            ? data.installmentsPayOnSessions
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save package");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving package:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
              <Package className="h-5 w-5 text-teal-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              {packageData
                ? t("packages.editPackage")
                : t("packages.newPackage")}
            </DialogTitle>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">
                    {t("packages.form.name")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("packages.form.namePlaceholder")}
                      className="h-11 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                    />
                  </FormControl>
                  <FormMessage>
                    {translateZodError(fieldState.error?.message)}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">
                    {t("packages.form.description")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("packages.form.descriptionPlaceholder")}
                      className="min-h-[80px] rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                    />
                  </FormControl>
                  <FormMessage>
                    {translateZodError(fieldState.error?.message)}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">
                    {t("packages.form.category")}
                  </FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={(value) => field.onChange(value || null)}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20">
                        <SelectValue placeholder={t("packages.form.categoryPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sessionCount"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("packages.form.sessionCount")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="h-11 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                      />
                    </FormControl>
                    <FormMessage>
                      {translateZodError(fieldState.error?.message)}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("packages.form.duration")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={15}
                        max={180}
                        step={15}
                        {...field}
                        value={field.value ?? 60}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="h-11 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {t("packages.form.durationHelp")}
                    </FormDescription>
                    <FormMessage>
                      {translateZodError(fieldState.error?.message)}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="basePrice"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("packages.form.price")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="h-11 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                      />
                    </FormControl>
                    <FormMessage>
                      {translateZodError(fieldState.error?.message)}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("packages.form.sortOrder")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="h-11 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                      />
                    </FormControl>
                    <FormMessage>
                      {translateZodError(fieldState.error?.message)}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="requiresAdvancePayment"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl bg-amber-50 p-4">
                  <div>
                    <FormLabel className="text-gray-700">
                      {t("packages.form.requiresAdvancePayment")}
                    </FormLabel>
                    <p className="text-sm text-gray-500">
                      {t("packages.form.requiresAdvancePaymentDescription")}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {requiresAdvancePayment && (
              <FormField
                control={form.control}
                name="advancePaymentAmount"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("packages.form.advancePaymentAmount")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        className="h-11 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                      />
                    </FormControl>
                    <FormMessage>
                      {translateZodError(fieldState.error?.message)}
                    </FormMessage>
                  </FormItem>
                )}
              />
            )}

            {/* Installments Configuration */}
            <FormField
              control={form.control}
              name="allowInstallments"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl bg-cyan-50 p-4">
                  <div>
                    <FormLabel className="text-gray-700">
                      {t("packages.form.allowInstallments")}
                    </FormLabel>
                    <p className="text-sm text-gray-500">
                      {t("packages.form.allowInstallmentsDescription")}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {allowInstallments && (
              <div className="space-y-4 rounded-xl border-2 border-cyan-100 bg-cyan-50/50 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="installmentsCount"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          {t("packages.form.installmentsCount")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={2}
                            max={12}
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            className="h-11 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                          />
                        </FormControl>
                        <FormMessage>
                          {translateZodError(fieldState.error?.message)}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="installmentsTotalPrice"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          {t("packages.form.installmentsTotalPrice")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            className="h-11 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          {t("packages.form.installmentsTotalPriceHelp")}
                        </FormDescription>
                        <FormMessage>
                          {translateZodError(fieldState.error?.message)}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                </div>

                {installmentsCount && installmentsTotalPrice && (
                  <div className="rounded-lg bg-white p-3 text-sm">
                    <span className="font-medium text-gray-700">
                      {t("packages.form.installmentAmountEach")}:{" "}
                    </span>
                    <span className="text-teal-700 font-semibold">
                      {(installmentsTotalPrice / installmentsCount).toFixed(2)}
                    </span>
                  </div>
                )}

                {sessionCount > 1 && installmentsCount && installmentsCount > 0 && (
                  <FormField
                    control={form.control}
                    name="installmentsPayOnSessions"
                    render={({ field }) => (
                      <FormItem>
                        <SessionPaymentSelector
                          totalSessions={sessionCount}
                          installmentsCount={installmentsCount}
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                  <div>
                    <FormLabel className="text-gray-700">
                      {t("packages.form.isActive")}
                    </FormLabel>
                    <p className="text-sm text-gray-500">
                      {t("packages.form.isActiveDescription")}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-11 rounded-xl border-2 border-gray-200"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  t("common.save")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
