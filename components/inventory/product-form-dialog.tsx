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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productSchema, type ProductFormData } from "@/lib/validations/inventory";

interface Category {
  id: string;
  name: string;
  color: string | null;
  isActive: boolean;
}

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  costPrice: number | string;
  salePrice: number | string;
  currentStock: number;
  minStock: number;
  isActive: boolean;
  isChargeableByDefault: boolean;
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductData | null;
  onSuccess: () => void;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductFormDialogProps) {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: null,
      costPrice: 0,
      salePrice: 0,
      currentStock: 0,
      minStock: 5,
      isActive: true,
      isChargeableByDefault: true,
    },
  });

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories?type=PRODUCT");
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchCategories();
      if (product) {
        form.reset({
          name: product.name,
          description: product.description || "",
          categoryId: product.categoryId,
          costPrice: Number(product.costPrice),
          salePrice: Number(product.salePrice),
          currentStock: product.currentStock,
          minStock: product.minStock,
          isActive: product.isActive,
          isChargeableByDefault: product.isChargeableByDefault,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          categoryId: null,
          costPrice: 0,
          salePrice: 0,
          currentStock: 0,
          minStock: 5,
          isActive: true,
          isChargeableByDefault: true,
        });
      }
    }
  }, [open, product, form, fetchCategories]);

  const translateZodError = (error: string | undefined): string => {
    if (!error) return "";
    if (error.includes("_")) {
      return t(`inventory.errors.${error}`);
    }
    return error;
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          categoryId: data.categoryId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save product");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
              <Package className="h-5 w-5 text-teal-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              {product ? t("inventory.editProduct") : t("inventory.newProduct")}
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
                    {t("inventory.form.name")} (ES)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("inventory.form.namePlaceholder")}
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
                    {t("inventory.form.description")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("inventory.form.descriptionPlaceholder")}
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
                    {t("inventory.form.category")}
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value || null)}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20">
                        <SelectValue placeholder={t("inventory.form.selectCategory")} />
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
                name="costPrice"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("inventory.form.costPrice")}
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
                name="salePrice"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("inventory.form.salePrice")}
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

            <div className="grid grid-cols-2 gap-4">
              {!product && (
                <FormField
                  control={form.control}
                  name="currentStock"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">
                        {t("inventory.form.currentStock")}
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
              )}

              <FormField
                control={form.control}
                name="minStock"
                render={({ field, fieldState }) => (
                  <FormItem className={product ? "col-span-2" : ""}>
                    <FormLabel className="text-gray-700">
                      {t("inventory.form.minStock")}
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
                    <FormDescription className="text-xs">
                      {t("inventory.form.minStockHelp")}
                    </FormDescription>
                    <FormMessage>
                      {translateZodError(fieldState.error?.message)}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isChargeableByDefault"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                  <div>
                    <FormLabel className="text-gray-700">
                      {t("inventory.form.isChargeableByDefault")}
                    </FormLabel>
                    <p className="text-sm text-gray-500">
                      {t("inventory.form.isChargeableByDefaultDescription")}
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

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                  <div>
                    <FormLabel className="text-gray-700">
                      {t("inventory.form.isActive")}
                    </FormLabel>
                    <p className="text-sm text-gray-500">
                      {t("inventory.form.isActiveDescription")}
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
