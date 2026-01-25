"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  Play,
  Baby,
  User,
  Package,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import {
  PackageSelector,
  type PackageData,
  type PackagePurchaseData,
} from "@/components/packages/package-selector";
import { canUseNextSession, type PaymentStatus } from "@/lib/utils/installments";

// Dynamic import for payment dialog
const RegisterInstallmentPaymentDialog = dynamic(
  () => import("@/components/packages/register-installment-payment-dialog").then(mod => mod.RegisterInstallmentPaymentDialog),
  { ssr: false }
);

interface StartSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  babyId: string;
  babyName: string;
  startTime: string;
  preselectedPurchaseId?: string; // Existing package purchase pre-selected
  preselectedCatalogPackageId?: string; // Catalog package pre-selected (new purchase)
  onSuccess?: () => void;
}

interface Therapist {
  id: string;
  name: string;
}

interface PackagePurchase {
  id: string;
  remainingSessions: number;
  totalSessions: number;
  usedSessions: number;
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
    duration: number;
  };
}

export function StartSessionDialog({
  open,
  onOpenChange,
  appointmentId,
  babyId,
  babyName,
  startTime,
  preselectedPurchaseId,
  preselectedCatalogPackageId,
  onSuccess,
}: StartSessionDialogProps) {
  const t = useTranslations();

  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [packages, setPackages] = useState<PackagePurchase[]>([]);
  const [catalogPackages, setCatalogPackages] = useState<PackageData[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<string>("");
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [isLoadingTherapists, setIsLoadingTherapists] = useState(true);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment alert state
  const [paymentWarning, setPaymentWarning] = useState<PaymentStatus | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPurchaseForPayment, setSelectedPurchaseForPayment] = useState<PackagePurchase | null>(null);

  // Ref for scrollable content
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchTherapists = useCallback(async () => {
    setIsLoadingTherapists(true);
    try {
      const response = await fetch("/api/therapists");
      const data = await response.json();
      if (response.ok) {
        setTherapists(data.therapists || []);
      }
    } catch (error) {
      console.error("Error fetching therapists:", error);
    } finally {
      setIsLoadingTherapists(false);
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    if (!babyId) return;
    setIsLoadingPackages(true);
    try {
      const response = await fetch(`/api/babies/${babyId}/packages`);
      const data = await response.json();
      if (response.ok) {
        // Map packages to include installment fields
        const availablePackages = (data.packages || []).map((pkg: PackagePurchase) => ({
          ...pkg,
          paymentPlan: pkg.paymentPlan || "SINGLE",
          installments: pkg.installments || 1,
          installmentAmount: pkg.installmentAmount,
          totalPrice: pkg.totalPrice,
          finalPrice: pkg.finalPrice,
          paidAmount: pkg.paidAmount || 0,
          installmentsPayOnSessions: pkg.installmentsPayOnSessions,
        }));
        setPackages(availablePackages);

        // Auto-select logic:
        // 1. If preselectedPurchaseId is provided and exists in available packages, use it
        // 2. If preselectedCatalogPackageId is provided (new package from catalog), use it
        // 3. If only one package, auto-select it
        // 4. Otherwise, user must choose
        if (preselectedPurchaseId) {
          const preselected = availablePackages.find(
            (pkg: PackagePurchase) => pkg.id === preselectedPurchaseId
          );
          if (preselected) {
            setSelectedPurchaseId(preselectedPurchaseId);
            setSelectedPackageId(preselected.package.id);
          } else if (availablePackages.length === 1) {
            setSelectedPurchaseId(availablePackages[0].id);
            setSelectedPackageId(availablePackages[0].package.id);
          } else {
            setSelectedPurchaseId(null);
            setSelectedPackageId(null);
          }
        } else if (preselectedCatalogPackageId) {
          // A catalog package was preselected - set only packageId (no purchaseId)
          setSelectedPackageId(preselectedCatalogPackageId);
          setSelectedPurchaseId(null);
        } else if (availablePackages.length === 1) {
          setSelectedPurchaseId(availablePackages[0].id);
          setSelectedPackageId(availablePackages[0].package.id);
        } else {
          setSelectedPurchaseId(null);
          setSelectedPackageId(null);
        }
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setIsLoadingPackages(false);
    }
  }, [babyId, preselectedPurchaseId, preselectedCatalogPackageId]);

  const fetchCatalog = useCallback(async () => {
    setIsLoadingCatalog(true);
    try {
      const response = await fetch("/api/packages?active=true");
      const data = await response.json();
      if (response.ok) {
        setCatalogPackages(data.packages || []);
      }
    } catch (error) {
      console.error("Error fetching package catalog:", error);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setSelectedTherapist("");
      setSelectedPackageId(null);
      setSelectedPurchaseId(null);
      setError(null);
      setPaymentWarning(null);
      setShowPaymentDialog(false);
      setSelectedPurchaseForPayment(null);
      fetchTherapists();
      fetchPackages();
      fetchCatalog();
    }
  }, [open, fetchTherapists, fetchPackages, fetchCatalog]);

  // Scroll to bottom when catalog package is preselected and loading is done
  useEffect(() => {
    if (
      preselectedCatalogPackageId &&
      !isLoadingPackages &&
      !isLoadingCatalog &&
      scrollContainerRef.current
    ) {
      // Small delay to allow DOM to update
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 150);
    }
  }, [preselectedCatalogPackageId, isLoadingPackages, isLoadingCatalog]);

  // Check payment status when a purchase is selected
  useEffect(() => {
    if (!selectedPurchaseId) {
      setPaymentWarning(null);
      setSelectedPurchaseForPayment(null);
      return;
    }

    const selectedPurchase = packages.find(p => p.id === selectedPurchaseId);
    if (!selectedPurchase) {
      setPaymentWarning(null);
      setSelectedPurchaseForPayment(null);
      return;
    }

    // Check if it's an installment plan
    if (selectedPurchase.paymentPlan === "INSTALLMENTS" && (selectedPurchase.installments || 1) > 1) {
      const result = canUseNextSession({
        usedSessions: selectedPurchase.usedSessions,
        totalSessions: selectedPurchase.totalSessions,
        remainingSessions: selectedPurchase.remainingSessions,
        paymentPlan: selectedPurchase.paymentPlan || "SINGLE",
        installments: selectedPurchase.installments || 1,
        installmentAmount: selectedPurchase.installmentAmount || null,
        totalPrice: selectedPurchase.totalPrice || null,
        finalPrice: selectedPurchase.finalPrice || 0,
        paidAmount: selectedPurchase.paidAmount || 0,
        installmentsPayOnSessions: selectedPurchase.installmentsPayOnSessions || null,
      });

      if (result.hasWarning) {
        setPaymentWarning(result.paymentStatus);
        setSelectedPurchaseForPayment(selectedPurchase);
      } else {
        setPaymentWarning(null);
        setSelectedPurchaseForPayment(null);
      }
    } else {
      setPaymentWarning(null);
      setSelectedPurchaseForPayment(null);
    }
  }, [selectedPurchaseId, packages]);

  // Handle package selection from PackageSelector
  const handlePackageSelect = (packageId: string | null, purchaseId: string | null) => {
    setSelectedPackageId(packageId);
    setSelectedPurchaseId(purchaseId);
  };

  // Transform packages to PackageSelector format
  const getBabyPackagesForSelector = (): PackagePurchaseData[] => {
    return packages
      .filter(p => p.remainingSessions > 0)
      .map((pkg) => ({
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
  };

  const handleSubmit = async () => {
    if (!selectedTherapist) {
      setError(t("session.errors.SELECT_THERAPIST"));
      return;
    }

    // Package is required for starting a session
    if (!selectedPurchaseId && !selectedPackageId) {
      setError(t("session.errors.SELECT_PACKAGE"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Determine packagePurchaseId
      const packagePurchaseId = selectedPurchaseId || null;

      const response = await fetch("/api/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          therapistId: selectedTherapist,
          packagePurchaseId,
          packageId: selectedPackageId,
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
      console.error("Error starting session:", err);
      setError(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isLoadingTherapists || isLoadingPackages || isLoadingCatalog;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-white/50 bg-white/95 p-0 backdrop-blur-md">
        <DialogHeader className="shrink-0 border-b border-gray-100 px-6 py-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
              <Play className="h-5 w-5 text-white" />
            </div>
            {t("session.startSession")}
          </DialogTitle>
        </DialogHeader>

        <div ref={scrollContainerRef} className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          {/* Appointment info */}
          <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
              <Baby className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{babyName}</p>
              <p className="text-sm text-blue-600">{startTime}</p>
            </div>
          </div>

          {/* Therapist selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700">
              <User className="h-4 w-4" />
              {t("session.selectTherapist")}
            </Label>
            {isLoadingTherapists ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
              </div>
            ) : (
              <Select
                value={selectedTherapist}
                onValueChange={setSelectedTherapist}
              >
                <SelectTrigger className="h-12 rounded-xl border-2 border-teal-100">
                  <SelectValue placeholder={t("session.selectTherapistPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {therapists.map((therapist) => (
                    <SelectItem key={therapist.id} value={therapist.id}>
                      {therapist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Package selection */}
          {!isLoadingPackages && !isLoadingCatalog && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-700">
                <Package className="h-4 w-4" />
                {t("session.selectPackage")}
              </Label>

              <PackageSelector
                babyId={babyId}
                packages={catalogPackages}
                babyPackages={getBabyPackagesForSelector()}
                selectedPackageId={selectedPackageId}
                selectedPurchaseId={selectedPurchaseId}
                onSelectPackage={handlePackageSelect}
                showCategories={true}
                showPrices={false}
                showExistingFirst={true}
                allowNewPackage={true}
                compact={true}
                showProvisionalMessage={false}
                forceShowCatalog={!!preselectedCatalogPackageId}
              />
            </div>
          )}

          {/* Payment warning alert - NEVER blocks, just informs */}
          {paymentWarning && paymentWarning.overdueAmount > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="ml-2">
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-amber-800">
                    {paymentWarning.overdueInstallments.length === 1
                      ? t("packages.installments.alerts.installmentOverdue", {
                          number: paymentWarning.overdueInstallments[0],
                          amount: paymentWarning.overdueAmount.toFixed(2),
                        })
                      : t("packages.installments.alerts.installmentsOverdue", {
                          count: paymentWarning.overdueInstallments.length,
                          amount: paymentWarning.overdueAmount.toFixed(2),
                        })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setShowPaymentDialog(true)}
                      className="h-8 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 text-xs font-medium text-white shadow-sm hover:from-amber-600 hover:to-orange-600"
                    >
                      <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                      {t("packages.installments.registerPayment")}
                    </Button>
                    <span className="flex items-center text-xs text-amber-600">
                      {t("packages.installments.alerts.continueWithWarning")}
                    </span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        {/* Actions - Fixed footer */}
        <div className="shrink-0 border-t border-gray-100 px-6 py-4">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-2 border-gray-200"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                isLoading ||
                !selectedTherapist ||
                (!selectedPackageId && !selectedPurchaseId)
              }
              className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 text-white shadow-lg shadow-blue-300/50 transition-all hover:from-blue-600 hover:to-cyan-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  {t("session.start")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Payment Dialog */}
      {selectedPurchaseForPayment && (
        <RegisterInstallmentPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          purchase={{
            id: selectedPurchaseForPayment.id,
            totalSessions: selectedPurchaseForPayment.totalSessions,
            usedSessions: selectedPurchaseForPayment.usedSessions,
            remainingSessions: selectedPurchaseForPayment.remainingSessions,
            installments: selectedPurchaseForPayment.installments || 1,
            installmentAmount: selectedPurchaseForPayment.installmentAmount as number | null,
            paidAmount: selectedPurchaseForPayment.paidAmount as number,
            finalPrice: selectedPurchaseForPayment.finalPrice as number,
            totalPrice: selectedPurchaseForPayment.totalPrice as number | null,
            paymentPlan: selectedPurchaseForPayment.paymentPlan || "SINGLE",
            installmentsPayOnSessions: selectedPurchaseForPayment.installmentsPayOnSessions || null,
            package: selectedPurchaseForPayment.package,
          }}
          onSuccess={() => {
            setShowPaymentDialog(false);
            fetchPackages(); // Refresh to get updated payment status
          }}
        />
      )}
    </Dialog>
  );
}
