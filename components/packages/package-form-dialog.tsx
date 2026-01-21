"use client";

import { useState, useEffect } from "react";
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
import { PACKAGE_CATEGORIES } from "@/lib/constants";

interface PackageData {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  sessionCount: number;
  basePrice: number | string;
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

  const form = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: "",
      description: "",
      category: null,
      sessionCount: 1,
      basePrice: 0,
      isActive: true,
      sortOrder: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (packageData) {
        form.reset({
          name: packageData.name,
          description: packageData.description || "",
          category: packageData.category as PackageFormData["category"],
          sessionCount: packageData.sessionCount,
          basePrice: Number(packageData.basePrice),
          isActive: packageData.isActive,
          sortOrder: packageData.sortOrder,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          category: null,
          sessionCount: 1,
          basePrice: 0,
          isActive: true,
          sortOrder: 0,
        });
      }
    }
  }, [open, packageData, form]);

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
        body: JSON.stringify(data),
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
      <DialogContent className="max-w-md rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md">
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
              name="category"
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
                      {PACKAGE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {t(`packages.categories.${category}`)}
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
            </div>

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
