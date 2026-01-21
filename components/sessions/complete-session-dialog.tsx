"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Baby,
  Package,
  DollarSign,
  Trash2,
  Plus,
  Sparkles,
  Check,
  CreditCard,
  Banknote,
  Building,
  MoreHorizontal,
  Percent,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CompleteSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onSuccess?: () => void;
}

interface SessionProduct {
  id: string;
  quantity: number;
  unitPrice: string;
  isChargeable: boolean;
  product: {
    id: string;
    name: string;
    salePrice: string;
  };
}

interface SessionData {
  id: string;
  sessionNumber: number;
  appointment: {
    isEvaluated: boolean;
    baby: {
      id: string;
      name: string;
    };
  };
  products: SessionProduct[];
}

interface Product {
  id: string;
  name: string;
  category: string | null;
  salePrice: string;
  currentStock: number;
}

interface PackageOption {
  id: string;
  name: string;
  description: string | null;
  sessionCount: number;
  basePrice: number | string;
}

interface ActivePackage {
  id: string;
  remainingSessions: number;
  package: {
    name: string;
  };
}

const paymentMethods = [
  { value: "CASH", icon: Banknote, color: "emerald" },
  { value: "TRANSFER", icon: Building, color: "blue" },
  { value: "CARD", icon: CreditCard, color: "violet" },
  { value: "OTHER", icon: MoreHorizontal, color: "gray" },
] as const;

export function CompleteSessionDialog({
  open,
  onOpenChange,
  sessionId,
  onSuccess,
}: CompleteSessionDialogProps) {
  const t = useTranslations();
  const locale = useLocale();

  const [session, setSession] = useState<SessionData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [activePackage, setActivePackage] = useState<ActivePackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add product form state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [productChargeable, setProductChargeable] = useState<boolean>(true);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Package selection state
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  // Discount state
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>("");

  const fetchSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      const data = await response.json();
      if (response.ok) {
        setSession(data.session);
        // Fetch baby's active package
        if (data.session?.appointment?.baby?.id) {
          fetchActivePackage(data.session.appointment.baby.id);
        }
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch("/api/products/selector");
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    try {
      const response = await fetch("/api/packages");
      const data = await response.json();
      if (response.ok) {
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
    }
  }, []);

  const fetchActivePackage = useCallback(async (babyId: string) => {
    try {
      const response = await fetch(`/api/babies/${babyId}/active-package`);
      const data = await response.json();
      if (response.ok && data.package) {
        setActivePackage(data.package);
        // Don't auto-select if baby has an active package with sessions
      }
    } catch (error) {
      console.error("Error fetching active package:", error);
    }
  }, []);

  useEffect(() => {
    if (open && sessionId) {
      // Reset state
      setSelectedPackageId(null);
      setPaymentMethod("CASH");
      setPaymentNotes("");
      setShowDiscount(false);
      setDiscountAmount(0);
      setDiscountReason("");
      setError(null);
      setActivePackage(null);

      fetchSession();
      fetchProducts();
      fetchPackages();
    }
  }, [open, sessionId, fetchSession, fetchProducts, fetchPackages]);

  const handleAddProduct = async () => {
    if (!selectedProduct || productQuantity < 1) return;

    setIsAddingProduct(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct,
          quantity: productQuantity,
          isChargeable: productChargeable,
        }),
      });

      if (response.ok) {
        await fetchSession();
        setShowAddProduct(false);
        setSelectedProduct("");
        setProductQuantity(1);
        setProductChargeable(true);
        setProductSearchQuery("");
        setSelectedCategory("all");
      } else {
        const data = await response.json();
        setError(t(`session.errors.${data.error}`));
      }
    } catch (error) {
      console.error("Error adding product:", error);
      setError(t("common.error"));
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleRemoveProduct = async (sessionProductId: string) => {
    try {
      const response = await fetch(
        `/api/sessions/${sessionId}/products?sessionProductId=${sessionProductId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        await fetchSession();
      }
    } catch (error) {
      console.error("Error removing product:", error);
    }
  };

  const calculateProductsTotal = () => {
    if (!session) return 0;
    return session.products
      .filter((p) => p.isChargeable)
      .reduce((sum, p) => sum + parseFloat(p.unitPrice) * p.quantity, 0);
  };

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);
  const packagePrice = selectedPackage ? Number(selectedPackage.basePrice) : 0;
  const productsTotal = calculateProductsTotal();
  const subtotal = productsTotal + packagePrice;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  // Helper to format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "es-BO", {
      style: "currency",
      currency: locale === "pt-BR" ? "BRL" : "BOB",
    }).format(price);
  };

  // Get unique categories from products
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ) as string[];

  // Filter products by search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = productSearchQuery
      ? product.name.toLowerCase().includes(productSearchQuery.toLowerCase())
      : true;
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

  const handleComplete = async () => {
    // Require either an active package with sessions OR a selected package to sell
    const hasActivePackageWithSessions = activePackage && activePackage.remainingSessions > 0;

    if (!hasActivePackageWithSessions && !selectedPackageId) {
      setError(t("session.errors.PACKAGE_REQUIRED"));
      return;
    }

    // If there's a total, payment method is required
    if (grandTotal > 0 && !paymentMethod) {
      setError(t("session.errors.PAYMENT_METHOD_REQUIRED"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackageId || undefined,
          paymentMethod: grandTotal > 0 ? paymentMethod : undefined,
          paymentNotes: paymentNotes || undefined,
          discountAmount: discountAmount > 0 ? discountAmount : undefined,
          discountReason: discountAmount > 0 ? discountReason || undefined : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorKey = data.error || "UNKNOWN_ERROR";
        setError(t(`session.errors.${errorKey}`));
        return;
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Error completing session:", err);
      setError(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasActivePackageWithSessions = activePackage && activePackage.remainingSessions > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[1200px] w-[90vw] max-h-[90vh] overflow-y-auto rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md sm:!max-w-[1200px]">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-200">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            {t("session.completeSession")}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          </div>
        ) : !session ? (
          <div className="py-8 text-center text-gray-500">
            {t("session.errors.SESSION_NOT_FOUND")}
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            {/* Session info - Full width header */}
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md">
                <Baby className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">
                  {session.appointment.baby.name}
                </p>
                <p className="text-xs text-emerald-600">
                  {t("session.sessionNumber", { number: session.sessionNumber })}
                </p>
              </div>
              {hasActivePackageWithSessions && (
                <div className="rounded-lg bg-white/80 px-3 py-1.5 text-right shadow-sm">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">{t("session.activePackage")}</p>
                  <p className="text-sm font-semibold text-emerald-600">
                    {activePackage.package.name} ({activePackage.remainingSessions} {t("common.sessionsUnit")})
                  </p>
                </div>
              )}
            </div>


            {/* Two column layout for desktop */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* LEFT COLUMN: Package Selection OR Active Package Info */}
              <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
                <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
                  <Package className="h-5 w-5 text-teal-600" />
                  {hasActivePackageWithSessions ? t("session.activePackage") : t("session.selectPackageToSell")}
                </h3>

                {/* Package Selection - Only show if baby doesn't have active package with sessions */}
                {!hasActivePackageWithSessions && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-700 border border-blue-200">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {t("session.noActivePackageInfo")}
                    </div>

                    {packages.length > 0 ? (
                      <div className="grid gap-3 lg:grid-cols-2">
                        {packages.map((pkg) => {
                          const colors = getPackageColors(pkg.sessionCount);
                          const isSelected = selectedPackageId === pkg.id;

                          return (
                            <Card
                              key={pkg.id}
                              onClick={() => setSelectedPackageId(isSelected ? null : pkg.id)}
                              className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                                isSelected ? colors.selected : colors.bg
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {isSelected && (
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500">
                                      <Check className="h-4 w-4 text-white" />
                                    </span>
                                  )}
                                  <div>
                                    <h4 className="font-semibold text-gray-800">
                                      {pkg.name}
                                    </h4>
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
                                </div>
                                <span className="text-xl font-bold text-gray-800">
                                  {formatPrice(Number(pkg.basePrice))}
                                </span>
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
                  </div>
                )}

                {/* Info when baby HAS active package */}
                {hasActivePackageWithSessions && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 rounded-xl bg-emerald-100 p-4 border border-emerald-200">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-emerald-800">{activePackage.package.name}</p>
                        <p className="text-sm text-emerald-700">
                          {t("session.willDeductFromPackage", {
                            package: activePackage.package.name,
                            remaining: activePackage.remainingSessions
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Products section */}
              <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
                    <Package className="h-5 w-5 text-cyan-600" />
                    {t("session.productsUsed")}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddProduct(!showAddProduct)}
                    className="rounded-xl border-2 border-teal-200 text-teal-600 hover:bg-teal-50 font-medium"
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    {t("session.addProduct")}
                  </Button>
                </div>

                {/* Add product form */}
                {showAddProduct && (
                  <div className="space-y-3 rounded-xl bg-white p-4 border border-teal-100 shadow-sm">
                    {/* Search input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        placeholder={t("session.searchProduct")}
                        className="h-10 rounded-xl border-2 border-gray-200 pl-10 focus:border-teal-400"
                      />
                    </div>

                    {/* Category filter */}
                    {categories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCategory("all")}
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-medium transition-all",
                            selectedCategory === "all"
                              ? "bg-teal-500 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          {t("common.all")}
                        </button>
                        {categories.map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => setSelectedCategory(category)}
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-medium transition-all",
                              selectedCategory === category
                                ? "bg-teal-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Products grid */}
                    <div className="max-h-[180px] overflow-y-auto">
                      {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {filteredProducts.map((product) => {
                            const isSelected = selectedProduct === product.id;
                            const isOutOfStock = product.currentStock < 1;

                            return (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => !isOutOfStock && setSelectedProduct(isSelected ? "" : product.id)}
                                disabled={isOutOfStock}
                                className={cn(
                                  "flex flex-col items-start rounded-lg border-2 p-2.5 text-left transition-all",
                                  isSelected
                                    ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500"
                                    : isOutOfStock
                                    ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                                    : "border-gray-200 hover:border-teal-300 hover:bg-teal-50/50"
                                )}
                              >
                                <div className="flex w-full items-start justify-between gap-1">
                                  <span className="text-sm font-medium text-gray-800 line-clamp-1">
                                    {product.name}
                                  </span>
                                  {isSelected && (
                                    <Check className="h-4 w-4 flex-shrink-0 text-teal-600" />
                                  )}
                                </div>
                                <div className="flex w-full items-center justify-between mt-1">
                                  <span className="text-xs text-teal-600 font-semibold">
                                    {formatPrice(Number(product.salePrice))}
                                  </span>
                                  <span className={cn(
                                    "text-xs",
                                    isOutOfStock ? "text-rose-500" : "text-gray-400"
                                  )}>
                                    Stock: {product.currentStock}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-center text-sm text-gray-500 py-4">
                          {t("common.noResults")}
                        </p>
                      )}
                    </div>

                    {/* Quantity and chargeable controls */}
                    {selectedProduct && (
                      <div className="flex gap-3 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-gray-500">{t("common.quantity")}:</Label>
                          <Input
                            type="number"
                            min={1}
                            value={productQuantity}
                            onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                            className="h-9 w-16 rounded-lg border-2 border-gray-200 text-center text-sm font-medium"
                          />
                        </div>
                        <Select
                          value={productChargeable ? "yes" : "no"}
                          onValueChange={(v) => setProductChargeable(v === "yes")}
                        >
                          <SelectTrigger className="h-9 flex-1 rounded-lg border-2 border-gray-200 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">{t("session.chargeable")}</SelectItem>
                            <SelectItem value="no">{t("session.notChargeable")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleAddProduct}
                          disabled={!selectedProduct || isAddingProduct}
                          className="h-9 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 px-4 text-white text-sm font-medium"
                        >
                          {isAddingProduct ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            t("common.add")
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Products list */}
                {session.products.length > 0 ? (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {session.products.map((sp) => (
                      <div
                        key={sp.id}
                        className={cn(
                          "flex items-center justify-between rounded-xl p-4 border",
                          sp.isChargeable ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-200"
                        )}
                      >
                        <div>
                          <p className="font-medium text-gray-800">
                            {sp.product.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {sp.quantity} x {formatPrice(parseFloat(sp.unitPrice))}
                            {sp.isChargeable && (
                              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                {t("session.chargeable")}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {sp.isChargeable && (
                            <span className="text-lg font-bold text-emerald-600">
                              {formatPrice(parseFloat(sp.unitPrice) * sp.quantity)}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveProduct(sp.id)}
                            className="h-9 w-9 rounded-full p-0 text-rose-500 hover:bg-rose-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-3">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">
                      {t("session.noProductsAdded")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Discount Toggle - Show when there's a subtotal */}
            {subtotal > 0 && (
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
                    <div>
                      <Label className="text-gray-700 mb-1.5 block text-sm">
                        {t("packages.discountAmount")}
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={subtotal}
                        step="0.01"
                        value={discountAmount || ""}
                        onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                        className="h-10 rounded-xl border-2 border-gray-200"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 mb-1.5 block text-sm">
                        {t("packages.discountReason")}
                      </Label>
                      <Input
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        placeholder={t("packages.discountReasonPlaceholder")}
                        className="h-10 rounded-xl border-2 border-gray-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Method - Always show when there's a total */}
            {grandTotal > 0 && (
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-gray-700">
                  <DollarSign className="h-4 w-4" />
                  {t("session.paymentMethod")}
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.value;

                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setPaymentMethod(method.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all",
                          isSelected
                            ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            isSelected ? "text-teal-600" : "text-gray-400"
                          )}
                        />
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isSelected ? "text-teal-700" : "text-gray-600"
                          )}
                        >
                          {t(`payment.${method.value.toLowerCase()}`)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Payment notes */}
                <Input
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder={t("session.paymentNotesPlaceholder")}
                  className="h-10 rounded-lg border-gray-200"
                />
              </div>
            )}

            {/* Total Summary */}
            {(grandTotal > 0 || selectedPackageId || discountAmount > 0) && (
              <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
                <div className="space-y-2">
                  {productsTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {t("session.productsSubtotal")}
                      </span>
                      <span className="text-gray-800">
                        {formatPrice(productsTotal)}
                      </span>
                    </div>
                  )}
                  {selectedPackage && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {t("session.packageSubtotal")} ({selectedPackage.name})
                      </span>
                      <span className="text-gray-800">
                        {formatPrice(packagePrice)}
                      </span>
                    </div>
                  )}
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
                      {t("session.total")}
                    </span>
                    <span className="text-xl font-bold text-emerald-600">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl border-2 border-gray-200"
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleComplete}
                disabled={isSubmitting || (!hasActivePackageWithSessions && !selectedPackageId)}
                className={cn(
                  "rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 text-white shadow-lg shadow-emerald-300/50 transition-all hover:from-emerald-600 hover:to-teal-600",
                  (!hasActivePackageWithSessions && !selectedPackageId) && "opacity-50"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t("session.complete")}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
