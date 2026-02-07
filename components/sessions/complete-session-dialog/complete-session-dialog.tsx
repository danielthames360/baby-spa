"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPaymentStatus } from "@/lib/utils/installments";
import {
  parseSchedulePreferences,
  formatPreferencesText,
} from "@/lib/utils/bulk-scheduling";

import { useCashRegisterGuard } from "@/hooks/use-cash-register-guard";
import { SuccessView } from "./success-view";
import { AlertsSection } from "./alerts-section";
import { BabyCardSection } from "./baby-card-section";
import { PackageSection } from "./package-section";
import { ProductsSection } from "./products-section";
import { PaymentSummarySection } from "./payment-summary-section";
import type {
  CompleteSessionDialogProps,
  SessionData,
  Product,
  BabyCardCheckoutInfo,
  CompletedPurchaseInfo,
  RewardInfo,
  PaymentDetailInput,
  PackageData,
  PackagePurchaseData,
  PaymentStatus,
} from "./types";

// Dynamic import for payment dialog
const RegisterInstallmentPaymentDialog = dynamic(
  () =>
    import("@/components/packages/register-installment-payment-dialog").then(
      (mod) => mod.RegisterInstallmentPaymentDialog
    ),
  { ssr: false }
);

// Dynamic import for bulk scheduling dialog
const BulkSchedulingDialog = dynamic(
  () =>
    import("@/components/appointments/bulk-scheduling-dialog").then(
      (mod) => mod.BulkSchedulingDialog
    ),
  { ssr: false }
);

// Dynamic import for sell baby card dialog
const SellBabyCardDialog = dynamic(
  () =>
    import("@/components/baby-cards/sell-baby-card-dialog").then(
      (mod) => mod.SellBabyCardDialog
    ),
  { ssr: false }
);

// Dynamic import for cash register required modal
const CashRegisterRequiredModal = dynamic(
  () =>
    import("@/components/cash-register/cash-register-required-modal").then(
      (mod) => mod.CashRegisterRequiredModal
    ),
  { ssr: false }
);

export function CompleteSessionDialog({
  open,
  onOpenChange,
  sessionId,
  onSuccess,
}: CompleteSessionDialogProps) {
  const t = useTranslations();
  const locale = useLocale();

  // Data state
  const [session, setSession] = useState<SessionData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [babyPackages, setBabyPackages] = useState<PackagePurchaseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBabyPackages, setIsLoadingBabyPackages] = useState(true);
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
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [selectedPurchaseName, setSelectedPurchaseName] = useState<string>("");

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailInput[]>([]);

  // Discount state
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>("");

  // Installment payment alert state
  const [showInstallmentPaymentDialog, setShowInstallmentPaymentDialog] =
    useState(false);

  // Bulk scheduling state (after completion)
  const [showSuccessView, setShowSuccessView] = useState(false);
  const [showBulkScheduling, setShowBulkScheduling] = useState(false);
  const [completedPurchaseInfo, setCompletedPurchaseInfo] =
    useState<CompletedPurchaseInfo | null>(null);

  // Baby Card checkout info state
  const [babyCardInfo, setBabyCardInfo] = useState<BabyCardCheckoutInfo | null>(
    null
  );
  const [newlyUnlockedRewards, setNewlyUnlockedRewards] = useState<RewardInfo[]>(
    []
  );

  // Reward usage state
  const [isUsingReward, setIsUsingReward] = useState(false);
  const [usedRewardIds, setUsedRewardIds] = useState<string[]>([]);

  // First session discount state
  const [useFirstSessionDiscount, setUseFirstSessionDiscount] = useState(false);

  // Advance payment state
  const [advancePaidAmount, setAdvancePaidAmount] = useState<number>(0);

  // Sell Baby Card dialog state
  const [showSellBabyCardDialog, setShowSellBabyCardDialog] = useState(false);

  // Cash register guard
  const { showCashRegisterModal, setShowCashRegisterModal, handleCashRegisterError, onCashRegisterSuccess } = useCashRegisterGuard();

  // Fetch functions
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

  const fetchPackages = useCallback(
    async (serviceType: "BABY" | "PARENT" = "BABY") => {
      try {
        const response = await fetch(
          `/api/packages?active=true&serviceType=${serviceType}`
        );
        const data = await response.json();
        if (response.ok) {
          setPackages(data.packages || []);
        }
      } catch (error) {
        console.error("Error fetching packages:", error);
      }
    },
    []
  );

  const fetchClientPackages = useCallback(
    async (clientId: string, isParent: boolean) => {
      setIsLoadingBabyPackages(true);
      try {
        const endpoint = isParent
          ? `/api/parents/${clientId}/packages`
          : `/api/babies/${clientId}/packages`;
        const response = await fetch(endpoint);
        const data = await response.json();
        if (response.ok) {
          const availablePackages = (data.packages || [])
            .filter(
              (pkg: { remainingSessions: number }) => pkg.remainingSessions > 0
            )
            .map(
              (pkg: {
                id: string;
                remainingSessions: number;
                totalSessions: number;
                usedSessions: number;
                package: {
                  id: string;
                  name: string;
                  categoryId: string | null;
                  duration: number;
                };
              }) => ({
                id: pkg.id,
                remainingSessions: pkg.remainingSessions,
                totalSessions: pkg.totalSessions,
                usedSessions: pkg.usedSessions,
                package: {
                  id: pkg.package.id,
                  name: pkg.package.name,
                  categoryId: pkg.package.categoryId,
                  duration: pkg.package.duration,
                },
              })
            );
          setBabyPackages(availablePackages);
          return availablePackages;
        }
      } catch (error) {
        console.error("Error fetching baby packages:", error);
      } finally {
        setIsLoadingBabyPackages(false);
      }
      return [];
    },
    []
  );

  const fetchSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      const data = await response.json();
      if (response.ok) {
        setSession(data.session);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const fetchBabyCardInfo = useCallback(async (babyId: string) => {
    try {
      const response = await fetch(`/api/checkout/baby-card-info/${babyId}`);
      const data = await response.json();
      if (response.ok) {
        setBabyCardInfo(data);
      }
    } catch (error) {
      console.error("Error fetching baby card info:", error);
    }
  }, []);

  const handleUseReward = async (reward: RewardInfo) => {
    if (!babyCardInfo?.purchase?.id) return;

    setIsUsingReward(true);
    try {
      const response = await fetch(
        `/api/baby-cards/purchases/${babyCardInfo.purchase.id}/rewards/${reward.id}/use`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: `Usado en checkout de sesión`,
          }),
        }
      );

      if (response.ok) {
        setUsedRewardIds((prev) => [...prev, reward.id]);
        if (session?.appointment?.baby?.id) {
          await fetchBabyCardInfo(session.appointment.baby.id);
        }
      } else {
        const data = await response.json();
        setError(t(`babyCard.errors.${data.error}`) || t("common.error"));
      }
    } catch (error) {
      console.error("Error using reward:", error);
      setError(t("common.error"));
    } finally {
      setIsUsingReward(false);
    }
  };

  // Effects
  useEffect(() => {
    if (open && sessionId) {
      // Reset session first so currentSessionId changes (null → id)
      // This ensures the initialization effect re-runs on reopen
      setSession(null);

      // Reset state
      setSelectedPackageId(null);
      setSelectedPurchaseId(null);
      setSelectedPurchaseName("");
      setPaymentMethod("CASH");
      setPaymentDetails([]);
      setShowDiscount(false);
      setDiscountAmount(0);
      setDiscountReason("");
      setError(null);
      setBabyPackages([]);
      setShowSuccessView(false);
      setShowBulkScheduling(false);
      setCompletedPurchaseInfo(null);
      setBabyCardInfo(null);
      setNewlyUnlockedRewards([]);
      setUsedRewardIds([]);
      setUseFirstSessionDiscount(false);
      setAdvancePaidAmount(0);
      setShowSellBabyCardDialog(false);

      fetchSession();
      fetchProducts();
    }
  }, [open, sessionId, fetchSession, fetchProducts]);

  // Fetch client packages and pre-select when session data is loaded (once per session.id)
  const currentSessionId = session?.id;
  useEffect(() => {
    if (!session) return;

    const initializePackageSelection = async () => {
      const isParentAppointment =
        !session.appointment.baby && !!session.appointment.parent;
      const clientId =
        session.appointment.baby?.id || session.appointment.parent?.id;

      if (!clientId) return;

      await fetchPackages(isParentAppointment ? "PARENT" : "BABY");

      const fetchedClientPackages = await fetchClientPackages(
        clientId,
        isParentAppointment
      );

      if (session.packagePurchaseId && session.packagePurchase) {
        setSelectedPurchaseId(session.packagePurchaseId);
        setSelectedPackageId(session.packagePurchase.package.id);
        setSelectedPurchaseName(session.packagePurchase.package.name);
      } else if (session.appointment.selectedPackageId) {
        setSelectedPackageId(session.appointment.selectedPackageId);
        setSelectedPurchaseId(null);
        setSelectedPurchaseName(session.appointment.selectedPackage?.name || "");
      } else if (fetchedClientPackages.length === 1) {
        const singlePackage = fetchedClientPackages[0];
        setSelectedPurchaseId(singlePackage.id);
        setSelectedPackageId(singlePackage.package.id);
        setSelectedPurchaseName(singlePackage.package.name);
      }

      // Fetch baby card info and advance payments in parallel
      const promises: Promise<void>[] = [];
      if (session.appointment.baby?.id) {
        promises.push(fetchBabyCardInfo(session.appointment.baby.id));
      }

      // Fetch advance payments for this appointment
      promises.push(
        fetch(`/api/appointments/${session.appointmentId}/payments`)
          .then((res) => res.json())
          .then((transactions: { category: string; total: number; isReversal: boolean; voidedAt: string | null }[]) => {
            if (Array.isArray(transactions)) {
              const advanceTotal = transactions
                .filter((t) => t.category === "APPOINTMENT_ADVANCE" && !t.isReversal && !t.voidedAt)
                .reduce((sum, t) => sum + Number(t.total), 0);
              setAdvancePaidAmount(advanceTotal);
            }
          })
          .catch((err) => console.error("Error fetching advance payments:", err))
      );

      await Promise.all(promises);
    };

    initializePackageSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only re-run when session ID changes, not on product updates
  }, [currentSessionId]);

  // Derive installment payment status from session data (no useEffect needed)
  const installmentPaymentStatus = useMemo<PaymentStatus | null>(() => {
    if (!session?.packagePurchase) return null;

    const purchase = session.packagePurchase;
    if (
      purchase.paymentPlan !== "INSTALLMENTS" ||
      (purchase.installments || 1) <= 1
    ) {
      return null;
    }

    const status = getPaymentStatus({
      usedSessions: purchase.usedSessions,
      totalSessions: purchase.totalSessions,
      remainingSessions: purchase.remainingSessions,
      paymentPlan: purchase.paymentPlan || "SINGLE",
      installments: purchase.installments || 1,
      installmentAmount: purchase.installmentAmount || null,
      totalPrice: purchase.totalPrice || null,
      finalPrice: purchase.finalPrice || 0,
      paidAmount: purchase.paidAmount || 0,
      installmentsPayOnSessions: purchase.installmentsPayOnSessions || null,
    });

    return status.isPaidInFull ? null : status;
  }, [session?.packagePurchase]);

  // Product handlers
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
        const data = await response.json();
        const newProduct = {
          id: data.product.id,
          quantity: data.product.quantity,
          unitPrice: String(data.product.unitPrice),
          isChargeable: data.product.isChargeable,
          product: {
            id: data.product.product.id,
            name: data.product.product.name,
            salePrice: String(data.product.product.salePrice),
          },
        };

        // Update session products locally (handles both new and updated quantity)
        setSession((prev) => {
          if (!prev) return prev;
          const existingIdx = prev.products.findIndex(
            (p) => p.id === newProduct.id
          );
          const updatedProducts =
            existingIdx >= 0
              ? prev.products.map((p, i) =>
                  i === existingIdx ? newProduct : p
                )
              : [...prev.products, newProduct];
          return { ...prev, products: updatedProducts };
        });

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
    // Optimistic update: remove from UI immediately
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        products: prev.products.filter((p) => p.id !== sessionProductId),
      };
    });

    try {
      const response = await fetch(
        `/api/sessions/${sessionId}/products?sessionProductId=${sessionProductId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        // Revert on failure by re-fetching
        await fetchSession();
      }
    } catch (error) {
      console.error("Error removing product:", error);
      await fetchSession();
    }
  };

  // Calculate totals
  const calculateProductsTotal = () => {
    if (!session) return 0;
    return session.products
      .filter((p) => p.isChargeable)
      .reduce((sum, p) => sum + parseFloat(p.unitPrice) * p.quantity, 0);
  };

  const selectedPackage = selectedPurchaseId
    ? null
    : packages.find((p) => p.id === selectedPackageId);

  const specialPriceEntry =
    selectedPackageId && !selectedPurchaseId
      ? babyCardInfo?.specialPrices.find((sp) => sp.packageId === selectedPackageId)
      : undefined;
  const packagePrice =
    specialPriceEntry?.specialPrice ??
    (selectedPackage ? Number(selectedPackage.basePrice) : 0);
  const productsTotal = calculateProductsTotal();
  const subtotal = productsTotal + packagePrice;

  const firstSessionDiscountValue =
    useFirstSessionDiscount &&
    babyCardInfo?.firstSessionDiscount &&
    !babyCardInfo.firstSessionDiscount.used
      ? Math.min(babyCardInfo.firstSessionDiscount.amount, subtotal)
      : 0;

  const grandTotal = Math.max(0, subtotal - discountAmount - firstSessionDiscountValue - advancePaidAmount);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "es-BO", {
      style: "currency",
      currency: locale === "pt-BR" ? "BRL" : "BOB",
    }).format(price);
  };

  const handlePaymentDetailsChange = useCallback(
    (details: PaymentDetailInput[]) => {
      setPaymentDetails(details);
      if (details.length > 0) {
        setPaymentMethod(details[0].paymentMethod);
      }
    },
    []
  );

  // Get unique categories from products
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ) as string[];

  // Complete handler
  const handleComplete = async () => {
    if (!selectedPackageId && !selectedPurchaseId) {
      setError(t("session.errors.PACKAGE_REQUIRED"));
      return;
    }

    if (grandTotal > 0 && paymentDetails.length === 0) {
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
          packageId: !selectedPurchaseId ? selectedPackageId || undefined : undefined,
          packagePurchaseId: selectedPurchaseId || undefined,
          paymentMethod: grandTotal > 0 ? paymentMethod : undefined,
          paymentDetails:
            grandTotal > 0 && paymentDetails.length > 0 ? paymentDetails : undefined,
          discountAmount: discountAmount > 0 ? discountAmount : undefined,
          discountReason: discountAmount > 0 ? discountReason || undefined : undefined,
          useFirstSessionDiscount: useFirstSessionDiscount || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorKey = data.error || "UNKNOWN_ERROR";
        // Check if cash register is required
        if (handleCashRegisterError(errorKey, handleComplete)) {
          setIsSubmitting(false);
          return;
        }
        setError(t(`session.errors.${errorKey}`));
        return;
      }

      if (data.babyCardInfo?.newRewards?.length > 0) {
        setNewlyUnlockedRewards(data.babyCardInfo.newRewards);
      }

      const purchaseData = data.packagePurchase;
      const scheduledForPackage = data.scheduledForPackage || 0;
      const availableToSchedule = purchaseData ? purchaseData.remainingSessions - scheduledForPackage : 0;
      if (purchaseData && availableToSchedule > 0) {
        setCompletedPurchaseInfo({
          id: purchaseData.id,
          remainingSessions: availableToSchedule,
          packageName: purchaseData.package?.name || selectedPurchaseName,
          packageDuration: purchaseData.package?.duration || 30,
          babyId: session!.appointment.baby?.id,
          babyName: session!.appointment.baby?.name,
          parentId: session!.appointment.parent?.id,
          parentName: session!.appointment.parent?.name,
          schedulePreferences: purchaseData.schedulePreferences || null,
        });
        setShowSuccessView(true);
        onSuccess?.();
      } else if (data.babyCardInfo?.newRewards?.length > 0) {
        setShowSuccessView(true);
        onSuccess?.();
      } else {
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (err) {
      console.error("Error completing session:", err);
      setError(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get parent's schedule preferences
  const getParentPreferencesText = (): string | null => {
    const prefsJson =
      session?.packagePurchase?.schedulePreferences ||
      session?.appointment?.pendingSchedulePreferences;
    if (!prefsJson) return null;
    const prefs = parseSchedulePreferences(prefsJson);
    return prefs.length > 0 ? formatPreferencesText(prefs, locale) : null;
  };
  const parentPreferencesText = getParentPreferencesText();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[1200px] w-[90vw] max-h-[90vh] overflow-y-auto rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md sm:!max-w-[1200px]">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-200">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <span>{t("session.completeSession")}</span>
              {session && (
                <p className="text-base font-medium text-gray-500 mt-0.5">
                  {session.appointment.baby?.name ||
                    session.appointment.parent?.name}
                </p>
              )}
            </div>
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
        ) : showSuccessView ? (
          <SuccessView
            completedPurchaseInfo={completedPurchaseInfo}
            newlyUnlockedRewards={newlyUnlockedRewards}
            onClose={() => onOpenChange(false)}
            onScheduleRemaining={() => setShowBulkScheduling(true)}
          />
        ) : (
          <div className="space-y-6 pt-4">
            {/* Alerts Section */}
            <AlertsSection
              installmentPaymentStatus={installmentPaymentStatus}
              parentPreferencesText={parentPreferencesText}
              onShowInstallmentPayment={() =>
                setShowInstallmentPaymentDialog(true)
              }
            />

            {/* Baby Card Section - Only show for baby appointments */}
            {session.appointment.baby && babyCardInfo && (
              <BabyCardSection
                babyCardInfo={babyCardInfo}
                selectedPackageId={selectedPackageId}
                selectedPurchaseId={selectedPurchaseId}
                subtotal={subtotal}
                useFirstSessionDiscount={useFirstSessionDiscount}
                onToggleFirstSessionDiscount={() =>
                  setUseFirstSessionDiscount(!useFirstSessionDiscount)
                }
                usedRewardIds={usedRewardIds}
                isUsingReward={isUsingReward}
                onUseReward={handleUseReward}
                onBuyCard={() => setShowSellBabyCardDialog(true)}
                formatPrice={formatPrice}
              />
            )}

            {/* Two column layout for desktop */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* LEFT COLUMN: Package Selection + Products */}
              <div className="space-y-5">
                <PackageSection
                  session={session}
                  packages={packages}
                  babyPackages={babyPackages}
                  selectedPackageId={selectedPackageId}
                  selectedPurchaseId={selectedPurchaseId}
                  isLoadingBabyPackages={isLoadingBabyPackages}
                  onSelectPackage={(pkgId, purchaseId, purchaseName) => {
                    setSelectedPackageId(pkgId);
                    setSelectedPurchaseId(purchaseId);
                    setSelectedPurchaseName(purchaseName || "");
                  }}
                />

                <ProductsSection
                  sessionProducts={session.products}
                  products={products}
                  showAddProduct={showAddProduct}
                  onToggleAddProduct={() => setShowAddProduct(!showAddProduct)}
                  selectedProduct={selectedProduct}
                  onSelectProduct={setSelectedProduct}
                  productQuantity={productQuantity}
                  onQuantityChange={setProductQuantity}
                  productChargeable={productChargeable}
                  onChargeableChange={setProductChargeable}
                  productSearchQuery={productSearchQuery}
                  onSearchChange={setProductSearchQuery}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  categories={categories}
                  isAddingProduct={isAddingProduct}
                  onAddProduct={handleAddProduct}
                  onRemoveProduct={handleRemoveProduct}
                  formatPrice={formatPrice}
                />
              </div>

              {/* RIGHT COLUMN: Summary + Discounts + Payment */}
              <PaymentSummarySection
                selectedPackage={selectedPackage}
                selectedPurchaseId={selectedPurchaseId}
                selectedPurchaseName={selectedPurchaseName}
                packagePrice={packagePrice}
                productsTotal={productsTotal}
                subtotal={subtotal}
                discountAmount={discountAmount}
                firstSessionDiscountValue={firstSessionDiscountValue}
                advancePaidAmount={advancePaidAmount}
                grandTotal={grandTotal}
                showDiscount={showDiscount}
                onToggleDiscount={() => setShowDiscount(!showDiscount)}
                onDiscountAmountChange={setDiscountAmount}
                discountReason={discountReason}
                onDiscountReasonChange={setDiscountReason}
                useFirstSessionDiscount={useFirstSessionDiscount}
                onToggleFirstSessionDiscount={() =>
                  setUseFirstSessionDiscount(!useFirstSessionDiscount)
                }
                babyCardInfo={babyCardInfo}
                selectedPackageId={selectedPackageId}
                onPaymentDetailsChange={handlePaymentDetailsChange}
                isSubmitting={isSubmitting}
                formatPrice={formatPrice}
              />
            </div>

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
                disabled={
                  isSubmitting || (!selectedPackageId && !selectedPurchaseId)
                }
                className={cn(
                  "rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 text-white shadow-lg shadow-emerald-300/50 transition-all hover:from-emerald-600 hover:to-teal-600",
                  !selectedPackageId && !selectedPurchaseId && "opacity-50"
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

      {/* Installment Payment Dialog */}
      {session?.packagePurchase && installmentPaymentStatus && (
        <RegisterInstallmentPaymentDialog
          open={showInstallmentPaymentDialog}
          onOpenChange={setShowInstallmentPaymentDialog}
          purchase={{
            id: session.packagePurchase.id,
            totalSessions: session.packagePurchase.totalSessions,
            usedSessions: session.packagePurchase.usedSessions,
            remainingSessions: session.packagePurchase.remainingSessions,
            installments: session.packagePurchase.installments || 1,
            installmentAmount:
              session.packagePurchase.installmentAmount as number | null,
            paidAmount: session.packagePurchase.paidAmount as number,
            finalPrice: session.packagePurchase.finalPrice as number,
            totalPrice: session.packagePurchase.totalPrice as number | null,
            paymentPlan: session.packagePurchase.paymentPlan || "SINGLE",
            installmentsPayOnSessions:
              session.packagePurchase.installmentsPayOnSessions || null,
            package: session.packagePurchase.package,
          }}
          onSuccess={() => {
            setShowInstallmentPaymentDialog(false);
            fetchSession();
          }}
        />
      )}

      {/* Bulk Scheduling Dialog - only for baby appointments */}
      {completedPurchaseInfo && completedPurchaseInfo.babyId && (
        <BulkSchedulingDialog
          open={showBulkScheduling}
          onOpenChange={setShowBulkScheduling}
          packagePurchaseId={completedPurchaseInfo.id}
          babyId={completedPurchaseInfo.babyId}
          babyName={completedPurchaseInfo.babyName || ""}
          packageName={completedPurchaseInfo.packageName}
          packageDuration={completedPurchaseInfo.packageDuration}
          availableSessions={completedPurchaseInfo.remainingSessions}
          parentPreferences={
            completedPurchaseInfo.schedulePreferences
              ? JSON.parse(completedPurchaseInfo.schedulePreferences)
              : undefined
          }
          onComplete={() => {
            setShowBulkScheduling(false);
            onOpenChange(false);
          }}
        />
      )}

      {/* Sell Baby Card Dialog */}
      {session?.appointment.baby && (
        <SellBabyCardDialog
          open={showSellBabyCardDialog}
          onOpenChange={setShowSellBabyCardDialog}
          babyId={session.appointment.baby.id}
          babyName={session.appointment.baby.name}
          hasActiveBabyCard={babyCardInfo?.hasActiveCard}
          onSuccess={() => {
            setShowSellBabyCardDialog(false);
            fetchBabyCardInfo(session.appointment.baby!.id);
          }}
        />
      )}

      {/* Cash Register Required Modal */}
      <CashRegisterRequiredModal
        open={showCashRegisterModal}
        onOpenChange={setShowCashRegisterModal}
        onSuccess={onCashRegisterSuccess}
      />
    </Dialog>
  );
}
