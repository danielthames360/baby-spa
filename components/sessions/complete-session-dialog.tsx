"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Baby,
  Package,
  DollarSign,
  Trash2,
  Plus,
  Check,
  CreditCard,
  Banknote,
  Building,
  MoreHorizontal,
  Percent,
  Search,
  AlertTriangle,
  CalendarClock,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PackageSelector,
  type PackageData,
  type PackagePurchaseData,
} from "@/components/packages/package-selector";
import { getPaymentStatus, getRemainingBalance, type PaymentStatus } from "@/lib/utils/installments";
import { parseSchedulePreferences, formatPreferencesText } from "@/lib/utils/bulk-scheduling";

// Dynamic import for payment dialog
const RegisterInstallmentPaymentDialog = dynamic(
  () => import("@/components/packages/register-installment-payment-dialog").then(mod => mod.RegisterInstallmentPaymentDialog),
  { ssr: false }
);

// Dynamic import for bulk scheduling dialog
const BulkSchedulingDialog = dynamic(
  () => import("@/components/appointments/bulk-scheduling-dialog").then(mod => mod.BulkSchedulingDialog),
  { ssr: false }
);

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
  packagePurchaseId: string | null;
  packagePurchase: {
    id: string;
    remainingSessions: number;
    totalSessions: number;
    usedSessions: number;
    // Schedule preferences (transferred from appointment at checkout)
    schedulePreferences?: string | null;
    // Installment fields
    paymentPlan?: string;
    installments?: number;
    installmentAmount?: string | number | null;
    totalPrice?: string | number | null;
    finalPrice?: string | number;
    paidAmount?: string | number;
    installmentsPayOnSessions?: string | null;
    package: {
      id: string;
      name: string;
      categoryId: string | null;
    };
  } | null;
  appointment: {
    isEvaluated: boolean;
    selectedPackageId: string | null; // Catalog package selected (provisional)
    // Pending schedule preferences (from portal, before checkout)
    pendingSchedulePreferences?: string | null;
    selectedPackage: {
      id: string;
      name: string;
      categoryId: string | null;
      basePrice: string;
    } | null;
    baby: {
      id: string;
      name: string;
    } | null;
    parent: {
      id: string;
      name: string;
    } | null;
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
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  // Discount state
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>("");

  // Installment payment alert state
  const [showInstallmentPaymentDialog, setShowInstallmentPaymentDialog] = useState(false);
  const [installmentPaymentStatus, setInstallmentPaymentStatus] = useState<PaymentStatus | null>(null);

  // Bulk scheduling state (after completion)
  const [showSuccessView, setShowSuccessView] = useState(false);
  const [showBulkScheduling, setShowBulkScheduling] = useState(false);
  const [completedPurchaseInfo, setCompletedPurchaseInfo] = useState<{
    id: string;
    remainingSessions: number;
    packageName: string;
    packageDuration: number;
    babyId?: string;
    babyName?: string;
    parentId?: string;
    parentName?: string;
    schedulePreferences: string | null;
  } | null>(null);

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

  const fetchPackages = useCallback(async (serviceType: "BABY" | "PARENT" = "BABY") => {
    try {
      const response = await fetch(`/api/packages?active=true&serviceType=${serviceType}`);
      const data = await response.json();
      if (response.ok) {
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
    }
  }, []);

  const fetchClientPackages = useCallback(async (clientId: string, isParent: boolean) => {
    setIsLoadingBabyPackages(true);
    try {
      const endpoint = isParent ? `/api/parents/${clientId}/packages` : `/api/babies/${clientId}/packages`;
      const response = await fetch(endpoint);
      const data = await response.json();
      if (response.ok) {
        const availablePackages = (data.packages || [])
          .filter((pkg: { remainingSessions: number }) => pkg.remainingSessions > 0)
          .map((pkg: {
            id: string;
            remainingSessions: number;
            totalSessions: number;
            usedSessions: number;
            package: { id: string; name: string; categoryId: string | null; duration: number };
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
          }));
        setBabyPackages(availablePackages);
        return availablePackages;
      }
    } catch (error) {
      console.error("Error fetching baby packages:", error);
    } finally {
      setIsLoadingBabyPackages(false);
    }
    return [];
  }, []);

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

  useEffect(() => {
    if (open && sessionId) {
      // Reset state
      setSelectedPackageId(null);
      setSelectedPurchaseId(null);
      setSelectedPurchaseName("");
      setPaymentMethod("CASH");
      setPaymentNotes("");
      setShowDiscount(false);
      setDiscountAmount(0);
      setDiscountReason("");
      setError(null);
      setBabyPackages([]);
      setShowSuccessView(false);
      setShowBulkScheduling(false);
      setCompletedPurchaseInfo(null);

      fetchSession();
      fetchProducts();
      // Note: fetchPackages is called in initializePackageSelection after we know the service type
    }
  }, [open, sessionId, fetchSession, fetchProducts]);

  // Fetch client packages (baby or parent) and pre-select when session data is loaded
  useEffect(() => {
    const initializePackageSelection = async () => {
      if (!session) return;

      const isParentAppointment = !session.appointment.baby && !!session.appointment.parent;
      const clientId = session.appointment.baby?.id || session.appointment.parent?.id;

      if (!clientId) return;

      // Fetch catalog packages based on service type
      await fetchPackages(isParentAppointment ? "PARENT" : "BABY");

      const fetchedClientPackages = await fetchClientPackages(clientId, isParentAppointment);

      // Pre-select logic:
      // 1. If session has a linked package purchase, select it
      // 2. If appointment has a catalog package selected (provisional), select that
      // 3. Otherwise, let user choose
      if (session.packagePurchaseId && session.packagePurchase) {
        // Session linked to an existing purchase
        setSelectedPurchaseId(session.packagePurchaseId);
        setSelectedPackageId(session.packagePurchase.package.id);
        setSelectedPurchaseName(session.packagePurchase.package.name);
      } else if (session.appointment.selectedPackageId) {
        // Catalog package was selected (provisional) - no purchase yet
        setSelectedPackageId(session.appointment.selectedPackageId);
        setSelectedPurchaseId(null);
        setSelectedPurchaseName(session.appointment.selectedPackage?.name || "");
      } else if (fetchedClientPackages.length === 1) {
        // Auto-select if only one package
        const singlePackage = fetchedClientPackages[0];
        setSelectedPurchaseId(singlePackage.id);
        setSelectedPackageId(singlePackage.package.id);
        setSelectedPurchaseName(singlePackage.package.name);
      }
    };

    initializePackageSelection();
  }, [session, fetchPackages, fetchClientPackages]);

  // Calculate installment payment status when session has a linked package with installments
  useEffect(() => {
    if (!session?.packagePurchase) {
      setInstallmentPaymentStatus(null);
      return;
    }

    const purchase = session.packagePurchase;
    if (purchase.paymentPlan === "INSTALLMENTS" && (purchase.installments || 1) > 1) {
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

      // Show alert if there's any remaining balance (not just overdue)
      if (!status.isPaidInFull) {
        setInstallmentPaymentStatus(status);
      } else {
        setInstallmentPaymentStatus(null);
      }
    } else {
      setInstallmentPaymentStatus(null);
    }
  }, [session]);

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

  // Calculate package price - only for new packages (catalog selection), not for existing purchases
  const selectedPackage = selectedPurchaseId
    ? null // When using existing purchase, no package price
    : packages.find((p) => p.id === selectedPackageId);
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

  const handleComplete = async () => {
    // Always require a package selection (either from catalog or existing purchase)
    if (!selectedPackageId && !selectedPurchaseId) {
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
          // Send packageId for new catalog packages, or packagePurchaseId for existing purchases
          packageId: !selectedPurchaseId ? selectedPackageId || undefined : undefined,
          packagePurchaseId: selectedPurchaseId || undefined,
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

      // Check if we should show bulk scheduling option
      // data should contain the updated packagePurchase with remainingSessions
      const purchaseData = data.packagePurchase;
      if (purchaseData && purchaseData.remainingSessions > 0) {
        // Show success view with bulk scheduling option
        setCompletedPurchaseInfo({
          id: purchaseData.id,
          remainingSessions: purchaseData.remainingSessions,
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
      } else {
        // No remaining sessions, just close
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

  // Check if session was started with a package
  const hasLinkedPackage = session?.packagePurchase && session.packagePurchase.remainingSessions > 0;
  const needsPackageSelection = session && !session.packagePurchaseId;

  // Get parent's schedule preferences (from packagePurchase or pending appointment)
  const getParentPreferencesText = (): string | null => {
    const prefsJson = session?.packagePurchase?.schedulePreferences
      || session?.appointment?.pendingSchedulePreferences;
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
        ) : showSuccessView && completedPurchaseInfo ? (
          // Success view with bulk scheduling option
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-800">
                {t("session.completedSuccessfully")}
              </h3>
              <p className="text-gray-600">
                {t("bulkScheduling.scheduleNow")}
              </p>
              <div className="mt-4 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-teal-700">{completedPurchaseInfo.babyName || completedPurchaseInfo.parentName}</span>
                  {" - "}
                  <span className="font-medium">{completedPurchaseInfo.packageName}</span>
                </p>
                <p className="text-lg font-bold text-emerald-600 mt-1">
                  {t("bulkScheduling.remainingToSchedule", { count: completedPurchaseInfo.remainingSessions })}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl border-2 border-gray-200 px-6"
              >
                {t("common.close")}
              </Button>
              <Button
                onClick={() => setShowBulkScheduling(true)}
                className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white shadow-lg shadow-teal-300/50"
              >
                <Package className="mr-2 h-4 w-4" />
                {t("bulkScheduling.scheduleRemaining")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            {/* Session info - Full width header */}
            {(() => {
              const isParentAppointment = !session.appointment.baby && session.appointment.parent;
              const clientName = session.appointment.baby?.name || session.appointment.parent?.name || "";
              return (
                <div className={`flex items-center gap-3 rounded-xl bg-gradient-to-r px-4 py-3 shadow-sm ${isParentAppointment ? "from-rose-50 to-pink-50" : "from-emerald-50 to-teal-50"}`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br shadow-md ${isParentAppointment ? "from-rose-400 to-pink-500" : "from-emerald-500 to-teal-500"}`}>
                    {isParentAppointment ? (
                      <UserRound className="h-5 w-5 text-white" />
                    ) : (
                      <Baby className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">
                        {clientName}
                      </p>
                      {isParentAppointment && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                          {t("calendar.clientType.parent")}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${isParentAppointment ? "text-rose-600" : "text-emerald-600"}`}>
                      {t("session.sessionNumber", { number: session.sessionNumber })}
                    </p>
                  </div>
                  {hasLinkedPackage && session.packagePurchase && (
                    <div className="rounded-lg bg-white/80 px-3 py-1.5 text-right shadow-sm">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">{t("session.packageUsed")}</p>
                      <p className="text-sm font-semibold text-emerald-600">
                        {session.packagePurchase.package.name} ({session.packagePurchase.remainingSessions} {t("common.sessionsUnit")})
                      </p>
                    </div>
                  )}
                  {needsPackageSelection && (
                    <div className="rounded-lg bg-blue-50 px-3 py-1.5 text-right shadow-sm border border-blue-200">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-blue-600">{t("session.pendingPackage")}</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Installment payment alert - NEVER blocks, just informs */}
            {installmentPaymentStatus && !installmentPaymentStatus.isPaidInFull && (
              <Alert className={installmentPaymentStatus.overdueAmount > 0 ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50"}>
                <AlertTriangle className={`h-4 w-4 ${installmentPaymentStatus.overdueAmount > 0 ? "text-amber-600" : "text-blue-600"}`} />
                <AlertDescription className="ml-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className={`text-sm ${installmentPaymentStatus.overdueAmount > 0 ? "text-amber-800" : "text-blue-800"}`}>
                      {installmentPaymentStatus.overdueAmount > 0 ? (
                        installmentPaymentStatus.overdueInstallments.length === 1
                          ? t("packages.installments.alerts.installmentOverdue", {
                              number: installmentPaymentStatus.overdueInstallments[0],
                              amount: installmentPaymentStatus.overdueAmount.toFixed(2),
                            })
                          : t("packages.installments.alerts.installmentsOverdue", {
                              count: installmentPaymentStatus.overdueInstallments.length,
                              amount: installmentPaymentStatus.overdueAmount.toFixed(2),
                            })
                      ) : (
                        t("packages.installments.remainingBalance") + ": " + installmentPaymentStatus.pendingAmount.toFixed(2)
                      )}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setShowInstallmentPaymentDialog(true)}
                        className={cn(
                          "h-8 rounded-lg px-3 text-xs font-medium text-white shadow-sm",
                          installmentPaymentStatus.overdueAmount > 0
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                            : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                        )}
                      >
                        <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                        {t("packages.installments.registerPayment")}
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Parent schedule preferences - highlighted alert */}
            {parentPreferencesText && (
              <Alert className="border-cyan-200 bg-gradient-to-r from-cyan-50 to-teal-50">
                <CalendarClock className="h-4 w-4 text-cyan-600" />
                <AlertDescription className="ml-2">
                  <p className="font-medium text-cyan-800">{t("session.parentPreferredSchedule")}</p>
                  <p className="font-semibold text-cyan-700">{parentPreferencesText}</p>
                  <p className="text-xs text-cyan-600">{t("session.preferencesWillBeSaved")}</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Two column layout for desktop */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* LEFT COLUMN: Package Selection OR Linked Package Info */}
              <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
                <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
                  <Package className="h-5 w-5 text-teal-600" />
                  {t("session.selectPackage")}
                </h3>

                {/* Package Selection - Always show PackageSelector */}
                {!isLoadingBabyPackages && (
                  <PackageSelector
                    babyId={session.appointment.baby?.id || session.appointment.parent?.id || ""}
                    packages={packages}
                    babyPackages={babyPackages}
                    selectedPackageId={selectedPackageId}
                    selectedPurchaseId={selectedPurchaseId}
                    onSelectPackage={(pkgId, purchaseId, purchaseName) => {
                      setSelectedPackageId(pkgId);
                      setSelectedPurchaseId(purchaseId);
                      setSelectedPurchaseName(purchaseName || "");
                    }}
                    showCategories={true}
                    showPrices={true}
                    showExistingFirst={true}
                    allowNewPackage={true}
                    compact={true}
                    showProvisionalMessage={false}
                    forceShowCatalog={!!session.appointment.selectedPackageId && !session.packagePurchaseId}
                    maxHeight="300px"
                  />
                )}
                {isLoadingBabyPackages && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
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
            {(grandTotal > 0 || selectedPackageId || selectedPurchaseId || discountAmount > 0) && (
              <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
                <div className="space-y-2">
                  {/* Show selected existing package (no charge) */}
                  {selectedPurchaseId && selectedPurchaseName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {t("session.usingExistingPackage")}
                      </span>
                      <span className="text-emerald-600 font-medium">
                        {selectedPurchaseName}
                      </span>
                    </div>
                  )}
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
                disabled={isSubmitting || (!selectedPackageId && !selectedPurchaseId)}
                className={cn(
                  "rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 text-white shadow-lg shadow-emerald-300/50 transition-all hover:from-emerald-600 hover:to-teal-600",
                  (!selectedPackageId && !selectedPurchaseId) && "opacity-50"
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
            installmentAmount: session.packagePurchase.installmentAmount as number | null,
            paidAmount: session.packagePurchase.paidAmount as number,
            finalPrice: session.packagePurchase.finalPrice as number,
            totalPrice: session.packagePurchase.totalPrice as number | null,
            paymentPlan: session.packagePurchase.paymentPlan || "SINGLE",
            installmentsPayOnSessions: session.packagePurchase.installmentsPayOnSessions || null,
            package: session.packagePurchase.package,
          }}
          onSuccess={() => {
            setShowInstallmentPaymentDialog(false);
            fetchSession(); // Refresh to get updated payment status
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
    </Dialog>
  );
}
