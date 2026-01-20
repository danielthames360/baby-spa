"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Settings2, ArrowUp, ArrowDown } from "lucide-react";
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
import { adjustStockSchema, type AdjustStockFormData } from "@/lib/validations/inventory";

interface ProductForAdjustment {
  id: string;
  name: string;
  currentStock: number;
}

interface AdjustStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductForAdjustment | null;
  onSuccess: () => void;
}

export function AdjustStockDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: AdjustStockDialogProps) {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdjustStockFormData>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: {
      productId: "",
      newStock: 0,
      reason: "",
    },
  });

  const watchNewStock = form.watch("newStock");
  const difference = product ? watchNewStock - product.currentStock : 0;

  useEffect(() => {
    if (open && product) {
      form.reset({
        productId: product.id,
        newStock: product.currentStock,
        reason: "",
      });
    }
  }, [open, product, form]);

  const translateZodError = (error: string | undefined): string => {
    if (!error) return "";
    if (error.includes("_")) {
      return t(`inventory.errors.${error}`);
    }
    return error;
  };

  const onSubmit = async (data: AdjustStockFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to adjust stock");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adjusting stock:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
              <Settings2 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-800">
                {t("inventory.adjustment.title")}
              </DialogTitle>
              <p className="text-sm text-gray-500">
                {t("inventory.adjustment.subtitle")}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-xl bg-gray-50 p-4 mb-4">
          <p className="font-medium text-gray-800">{product.name}</p>
          <p className="text-sm text-gray-500">
            {t("inventory.adjustment.currentStock")}: {product.currentStock}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newStock"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">
                    {t("inventory.adjustment.newStock")}
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

            {/* Difference indicator */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">{t("inventory.adjustment.difference")}:</span>
              <span
                className={`flex items-center gap-1 font-semibold ${
                  difference > 0
                    ? "text-emerald-600"
                    : difference < 0
                    ? "text-rose-600"
                    : "text-gray-500"
                }`}
              >
                {difference > 0 && <ArrowUp className="h-4 w-4" />}
                {difference < 0 && <ArrowDown className="h-4 w-4" />}
                {difference > 0 ? `+${difference}` : difference}
              </span>
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">
                    {t("inventory.adjustment.reason")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("inventory.adjustment.reasonPlaceholder")}
                      className="min-h-[80px] rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                    />
                  </FormControl>
                  <FormMessage>
                    {translateZodError(fieldState.error?.message)}
                  </FormMessage>
                </FormItem>
              )}
            />

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
                disabled={isSubmitting || difference === 0}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-semibold text-white shadow-lg shadow-amber-300/50 transition-all hover:from-amber-600 hover:to-orange-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  t("inventory.adjustment.confirm")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
