"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Package,
  CreditCard,
  Banknote,
  Building,
  MoreHorizontal,
  Check,
  Sparkles,
  Percent,
} from "lucide-react";
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
import { Card } from "@/components/ui/card";
import {
  sellPackageSchema,
  type SellPackageFormData,
} from "@/lib/validations/package";

interface PackageOption {
  id: string;
  name: string;
  description: string | null;
  sessionCount: number;
  basePrice: number | string;
}

interface SellPackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babyId: string;
  babyName: string;
  onSuccess: () => void;
}

const paymentMethods = [
  { value: "CASH", icon: Banknote, color: "emerald" },
  { value: "TRANSFER", icon: Building, color: "blue" },
  { value: "CARD", icon: CreditCard, color: "violet" },
  { value: "OTHER", icon: MoreHorizontal, color: "gray" },
] as const;

export function SellPackageDialog({
  open,
  onOpenChange,
  babyId,
  babyName,
  onSuccess,
}: SellPackageDialogProps) {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null
  );
  const [showDiscount, setShowDiscount] = useState(false);

  const form = useForm<SellPackageFormData>({
    resolver: zodResolver(sellPackageSchema),
    defaultValues: {
      babyId: babyId,
      packageId: "",
      discountAmount: 0,
      discountReason: "",
      paymentMethod: "CASH",
      paymentNotes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        babyId: babyId,
        packageId: "",
        discountAmount: 0,
        discountReason: "",
        paymentMethod: "CASH",
        paymentNotes: "",
      });
      setSelectedPackageId(null);
      setShowDiscount(false);
      fetchPackages();
    }
  }, [open, babyId, form]);

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/packages");
      const data = await response.json();
      setPackages(data.packages || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);
  const discountAmount = form.watch("discountAmount") || 0;
  const basePrice = selectedPackage ? Number(selectedPackage.basePrice) : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  const getPackageName = (pkg: PackageOption) => {
    return pkg.name;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "es-BO", {
      style: "currency",
      currency: locale === "pt-BR" ? "BRL" : "BOB",
    }).format(price);
  };

  const translateZodError = (error: string | undefined): string => {
    if (!error) return "";
    if (error.includes("_")) {
      return t(`packages.errors.${error}`);
    }
    return error;
  };

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId);
    form.setValue("packageId", packageId);
  };

  const onSubmit = async (data: SellPackageFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/package-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to sell package");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error selling package:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Colors for package cards
  const getPackageColors = (sessionCount: number) => {
    if (sessionCount === 1) {
      return {
        gradient: "from-gray-400 to-gray-500",
        bg: "bg-gray-50 border-gray-200",
        selected: "bg-gray-100 border-gray-400 ring-2 ring-gray-400",
      };
    } else if (sessionCount <= 4) {
      return {
        gradient: "from-teal-400 to-cyan-500",
        bg: "bg-teal-50 border-teal-200",
        selected: "bg-teal-100 border-teal-500 ring-2 ring-teal-500",
      };
    } else if (sessionCount <= 8) {
      return {
        gradient: "from-cyan-500 to-blue-500",
        bg: "bg-cyan-50 border-cyan-200",
        selected: "bg-cyan-100 border-cyan-500 ring-2 ring-cyan-500",
      };
    } else if (sessionCount <= 10) {
      return {
        gradient: "from-violet-500 to-purple-500",
        bg: "bg-violet-50 border-violet-200",
        selected: "bg-violet-100 border-violet-500 ring-2 ring-violet-500",
      };
    } else {
      return {
        gradient: "from-amber-400 to-orange-500",
        bg: "bg-amber-50 border-amber-200",
        selected: "bg-amber-100 border-amber-500 ring-2 ring-amber-500",
      };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
              <Package className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-800">
                {t("packages.sellPackage")}
              </DialogTitle>
              <p className="text-sm text-gray-500">
                {t("packages.sellPackageFor", { name: babyName })}
              </p>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Package Selection */}
            <div>
              <FormLabel className="text-gray-700 mb-3 block">
                {t("packages.selectPackage")}
              </FormLabel>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                </div>
              ) : packages.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {packages.map((pkg) => {
                    const colors = getPackageColors(pkg.sessionCount);
                    const isSelected = selectedPackageId === pkg.id;

                    return (
                      <Card
                        key={pkg.id}
                        onClick={() => handlePackageSelect(pkg.id)}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                          isSelected ? colors.selected : colors.bg
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-800">
                                {getPackageName(pkg)}
                              </h4>
                              {isSelected && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500">
                                  <Check className="h-3 w-3 text-white" />
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gradient-to-r ${colors.gradient} text-white`}
                              >
                                <Sparkles className="mr-1 h-3 w-3" />
                                {t("packages.sessionCount", {
                                  count: pkg.sessionCount,
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-gray-800">
                              {formatPrice(Number(pkg.basePrice))}
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">
                  {t("packages.noPackagesAvailable")}
                </div>
              )}
              <FormField
                control={form.control}
                name="packageId"
                render={({ fieldState }) => (
                  <FormMessage className="mt-2">
                    {translateZodError(fieldState.error?.message)}
                  </FormMessage>
                )}
              />
            </div>

            {/* Payment Method */}
            <div>
              <FormLabel className="text-gray-700 mb-3 block">
                {t("packages.paymentMethod")}
              </FormLabel>
              <div className="grid grid-cols-4 gap-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected =
                    form.watch("paymentMethod") === method.value;

                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() =>
                        form.setValue("paymentMethod", method.value)
                      }
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                        isSelected
                          ? `border-${method.color}-500 bg-${method.color}-50 ring-2 ring-${method.color}-500`
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          isSelected
                            ? `text-${method.color}-600`
                            : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          isSelected
                            ? `text-${method.color}-700`
                            : "text-gray-600"
                        }`}
                      >
                        {t(`payment.${method.value.toLowerCase()}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discount Toggle */}
            {selectedPackage && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowDiscount(!showDiscount)}
                  className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700"
                >
                  <Percent className="h-4 w-4" />
                  {showDiscount
                    ? t("packages.hideDiscount")
                    : t("packages.addDiscount")}
                </button>

                {showDiscount && (
                  <div className="mt-3 space-y-3 rounded-xl bg-gray-50 p-4">
                    <FormField
                      control={form.control}
                      name="discountAmount"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            {t("packages.discountAmount")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={basePrice}
                              step="0.01"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                              className="h-11 rounded-xl border-2 border-gray-200"
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
                      name="discountReason"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            {t("packages.discountReason")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t(
                                "packages.discountReasonPlaceholder"
                              )}
                              className="h-11 rounded-xl border-2 border-gray-200"
                            />
                          </FormControl>
                          <FormMessage>
                            {translateZodError(fieldState.error?.message)}
                          </FormMessage>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Payment Notes */}
            <FormField
              control={form.control}
              name="paymentNotes"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">
                    {t("packages.paymentNotes")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("packages.paymentNotesPlaceholder")}
                      className="min-h-[80px] rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                    />
                  </FormControl>
                  <FormMessage>
                    {translateZodError(fieldState.error?.message)}
                  </FormMessage>
                </FormItem>
              )}
            />

            {/* Price Summary */}
            {selectedPackage && (
              <div className="rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {t("packages.basePrice")}
                    </span>
                    <span className="text-gray-800">
                      {formatPrice(basePrice)}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {t("packages.discount")}
                      </span>
                      <span className="text-rose-600">
                        -{formatPrice(discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-teal-200 pt-2">
                    <span className="font-medium text-gray-700">
                      {t("packages.total")}
                    </span>
                    <span className="text-xl font-bold text-teal-600">
                      {formatPrice(finalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
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
                disabled={isSubmitting || !selectedPackageId}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    {t("packages.confirmSale")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
