"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShoppingCart, Package } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerPurchaseSchema, type RegisterPurchaseFormData } from "@/lib/validations/inventory";

interface ProductOption {
  id: string;
  name: string;
  currentStock: number;
}

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductOption[];
  selectedProductId?: string;
  onSuccess: () => void;
}

export function PurchaseDialog({
  open,
  onOpenChange,
  products,
  selectedProductId,
  onSuccess,
}: PurchaseDialogProps) {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterPurchaseFormData>({
    resolver: zodResolver(registerPurchaseSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
      unitCost: 0,
      supplier: "",
      notes: "",
    },
  });

  const watchProductId = form.watch("productId");
  const watchQuantity = form.watch("quantity");
  const watchUnitCost = form.watch("unitCost");

  const selectedProduct = products.find((p) => p.id === watchProductId);
  const totalCost = (watchQuantity || 0) * (watchUnitCost || 0);
  const stockAfter = (selectedProduct?.currentStock || 0) + (watchQuantity || 0);

  useEffect(() => {
    if (open) {
      form.reset({
        productId: selectedProductId || "",
        quantity: 1,
        unitCost: 0,
        supplier: "",
        notes: "",
      });
    }
  }, [open, selectedProductId, form]);

  const translateZodError = (error: string | undefined): string => {
    if (!error) return "";
    if (error.includes("_")) {
      return t(`inventory.errors.${error}`);
    }
    return error;
  };

  const onSubmit = async (data: RegisterPurchaseFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/inventory/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to register purchase");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error registering purchase:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100">
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-800">
                {t("inventory.purchase.title")}
              </DialogTitle>
              <p className="text-sm text-gray-500">
                {t("inventory.purchase.subtitle")}
              </p>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">
                    {t("inventory.purchase.selectProduct")}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20">
                        <SelectValue placeholder={t("inventory.purchase.selectProduct")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span>{product.name}</span>
                            <span className="text-xs text-gray-400">
                              ({product.currentStock} en stock)
                            </span>
                          </div>
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
                name="quantity"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("inventory.purchase.quantity")}
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
                name="unitCost"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("inventory.purchase.unitCost")}
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
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">
                    {t("inventory.purchase.supplier")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("inventory.purchase.supplierPlaceholder")}
                      className="h-11 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">
                    {t("inventory.purchase.notes")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("inventory.purchase.notesPlaceholder")}
                      className="min-h-[60px] rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Summary */}
            <div className="rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t("inventory.purchase.totalCost")}:</span>
                <span className="font-semibold text-gray-800">
                  {totalCost.toFixed(2)}
                </span>
              </div>
              {selectedProduct && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t("inventory.purchase.stockAfter")}:</span>
                  <span className="font-semibold text-emerald-600">
                    {stockAfter}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
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
                disabled={isSubmitting || !watchProductId}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold text-white shadow-lg shadow-emerald-300/50 transition-all hover:from-emerald-600 hover:to-teal-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  t("inventory.purchase.confirm")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
