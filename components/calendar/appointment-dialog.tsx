"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Baby,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  Package,
  CreditCard,
  AlertTriangle,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PackageSelector,
  type PackageData,
  type PackagePurchaseData,
} from "@/components/packages/package-selector";
import {
  ClientSelector,
  type SelectedClient,
  type BabySearchResult,
} from "@/components/calendar/client-selector";

// bundle-dynamic-imports: Lazy load payment dialog to reduce initial bundle
const RegisterPaymentDialog = dynamic(
  () => import("@/components/appointments/register-payment-dialog").then((m) => m.RegisterPaymentDialog),
  { ssr: false }
);

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  time: string;
  onSuccess?: () => void;
}

export function AppointmentDialog({
  open,
  onOpenChange,
  date,
  time,
  onSuccess,
}: AppointmentDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === "pt-BR" ? "pt-BR" : "es-ES";

  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null,
  );
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(
    null,
  );
  const [catalogPackages, setCatalogPackages] = useState<PackageData[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  // Advance payment flow states
  const [showAdvancePaymentConfirm, setShowAdvancePaymentConfirm] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<{
    id: string;
    date: Date;
    startTime: string;
    baby: { id: string; name: string };
    selectedPackage?: { id: string; name: string; basePrice?: number | string | null; advancePaymentAmount?: number | string | null } | null;
  } | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Ref for scrollable content
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when catalog expands
  const handleCatalogToggle = useCallback((expanded: boolean) => {
    if (expanded && scrollContainerRef.current) {
      // Small delay to allow the DOM to update
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  }, []);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedClient(null);
      setNotes("");
      setError(null);
      setSelectedPackageId(null);
      setSelectedPurchaseId(null);
      setShowAdvancePaymentConfirm(false);
      setCreatedAppointment(null);
      setShowPaymentDialog(false);
    }
  }, [open]);

  // Fetch package catalog filtered by client type
  const fetchCatalog = useCallback(async (serviceType?: "BABY" | "PARENT") => {
    setLoadingCatalog(true);
    try {
      const params = new URLSearchParams({ active: "true" });
      if (serviceType) {
        params.set("serviceType", serviceType);
      }
      const response = await fetch(`/api/packages?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        setCatalogPackages(data.packages || []);
      }
    } catch (error) {
      console.error("Error fetching package catalog:", error);
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  // Fetch catalog when dialog opens or client type changes
  useEffect(() => {
    if (open) {
      const serviceType = selectedClient?.type === "PARENT" ? "PARENT" : "BABY";
      fetchCatalog(serviceType);
    }
  }, [open, fetchCatalog, selectedClient?.type]);

  // Handle package selection
  const handlePackageSelect = (
    packageId: string | null,
    purchaseId: string | null,
  ) => {
    setSelectedPackageId(packageId);
    setSelectedPurchaseId(purchaseId);
  };

  // Transform client packages to PackageSelector format
  const getClientPackagesForSelector = (): PackagePurchaseData[] => {
    // For baby appointments, use baby's packages
    if (selectedClient?.type === "BABY" && selectedClient.baby) {
      return selectedClient.baby.packagePurchases
        .filter((p) => p.isActive && p.remainingSessions > 0)
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
    }
    // For parent appointments, use parent's packages if available
    if (selectedClient?.type === "PARENT" && selectedClient.parent?.packagePurchases) {
      return selectedClient.parent.packagePurchases
        .filter((p) => p.isActive && p.remainingSessions > 0)
        .map((pkg) => ({
          id: pkg.id,
          remainingSessions: pkg.remainingSessions,
          totalSessions: pkg.totalSessions,
          usedSessions: 0, // Parent packages may not have usedSessions tracked yet
          package: {
            id: pkg.package.id,
            name: pkg.package.name,
            categoryId: pkg.package.categoryId,
            duration: pkg.package.duration,
          },
        }));
    }
    return [];
  };

  // Auto-select package when client is selected
  useEffect(() => {
    if (selectedClient) {
      let activePackages: { id: string; package: { id: string } }[] = [];

      if (selectedClient.type === "BABY" && selectedClient.baby) {
        activePackages = selectedClient.baby.packagePurchases.filter(
          (p) => p.isActive && p.remainingSessions > 0,
        );
      } else if (selectedClient.type === "PARENT" && selectedClient.parent?.packagePurchases) {
        activePackages = selectedClient.parent.packagePurchases.filter(
          (p) => p.isActive && p.remainingSessions > 0,
        );
      }

      if (activePackages.length === 1) {
        setSelectedPurchaseId(activePackages[0].id);
        setSelectedPackageId(activePackages[0].package.id);
      } else {
        setSelectedPurchaseId(null);
        setSelectedPackageId(null);
      }
    }
  }, [selectedClient]);

  // Auto-scroll to bottom when advance payment confirmation appears
  useEffect(() => {
    if (showAdvancePaymentConfirm && scrollContainerRef.current) {
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [showAdvancePaymentConfirm]);

  // Get selected package data for advance payment check
  const getSelectedPackageData = (): PackageData | null => {
    if (!selectedPackageId || selectedPurchaseId) return null;
    return catalogPackages.find((pkg) => pkg.id === selectedPackageId) || null;
  };

  // Check if selected package requires advance payment
  const selectedPackageRequiresAdvance = (): boolean => {
    const pkg = getSelectedPackageData();
    return pkg?.requiresAdvancePayment === true;
  };

  // Get advance payment amount for selected package
  const getAdvancePaymentAmount = (): number => {
    const pkg = getSelectedPackageData();
    if (!pkg?.advancePaymentAmount) return 0;
    return typeof pkg.advancePaymentAmount === "string"
      ? parseFloat(pkg.advancePaymentAmount)
      : pkg.advancePaymentAmount;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedClient) return;
    if (!selectedPackageId && !selectedPurchaseId) return;

    // Check if package requires advance payment and show confirmation
    if (selectedPackageRequiresAdvance() && !showAdvancePaymentConfirm) {
      setShowAdvancePaymentConfirm(true);
      return;
    }

    // If showing confirmation, this means user clicked one of the action buttons
    // which should call createAppointment directly
    if (showAdvancePaymentConfirm) return;

    await createAppointment(false);
  };

  // Create appointment with optional pending status
  // showPaymentAfter: if true, open payment dialog after creating (for "Registrar Pago Ahora" flow)
  const createAppointment = async (createAsPending: boolean, showPaymentAfter: boolean = false) => {
    if (!selectedClient) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Build request body based on client type
      const requestBody: Record<string, unknown> = {
        packagePurchaseId: selectedPurchaseId,
        packageId: selectedPackageId,
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
        startTime: time,
        notes: notes || undefined,
        createAsPending,
      };

      // Set either babyId or parentId based on client type
      if (selectedClient.type === "BABY" && selectedClient.baby) {
        requestBody.babyId = selectedClient.baby.id;
      } else if (selectedClient.type === "PARENT" && selectedClient.parent) {
        requestBody.parentId = selectedClient.parent.id;
      }

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        // Map error codes to translation keys
        const errorKey = data.error || "UNKNOWN_ERROR";
        setError(t(`calendar.errors.${errorKey}`));
        return;
      }

      // If user chose to pay now, show payment dialog (only for baby appointments for now)
      if (showPaymentAfter && selectedClient.type === "BABY" && selectedClient.baby) {
        const pkg = getSelectedPackageData();
        setCreatedAppointment({
          id: data.appointment.id,
          date: new Date(data.appointment.date),
          startTime: data.appointment.startTime,
          baby: { id: selectedClient.baby.id, name: selectedClient.baby.name },
          selectedPackage: pkg ? {
            id: pkg.id,
            name: pkg.name,
            basePrice: pkg.basePrice,
            advancePaymentAmount: pkg.advancePaymentAmount,
          } : null,
        });
        setShowAdvancePaymentConfirm(false);
        setShowPaymentDialog(true);
        return;
      }

      // Otherwise just close and refresh
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Error creating appointment:", err);
      setError(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle payment registered
  const handlePaymentRegistered = () => {
    setShowPaymentDialog(false);
    setCreatedAppointment(null);
    onOpenChange(false);
    onSuccess?.();
  };

  // Handle skip payment (schedule without payment)
  const handleScheduleWithoutPayment = async () => {
    await createAppointment(true);
  };

  // Handle register payment now - creates as PENDING_PAYMENT first, payment API will change to SCHEDULED
  const handleRegisterPaymentNow = async () => {
    await createAppointment(true, true); // createAsPending=true, showPaymentAfter=true
  };

  // Format date for display
  const formattedDate = date.toLocaleDateString(dateLocale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-white/50 bg-white/95 p-0 backdrop-blur-md">
        <DialogHeader className="shrink-0 border-b border-gray-100 px-6 py-4">
          <DialogTitle className="text-xl font-bold text-gray-800">
            {t("calendar.newAppointment")}
          </DialogTitle>
        </DialogHeader>

        <div ref={scrollContainerRef} className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
          {/* Date & Time display */}
          <div className="flex gap-4 rounded-xl bg-teal-50 p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal-600" />
              <span className="text-sm font-medium text-gray-700">
                {formattedDate}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-600" />
              <span className="text-sm font-medium text-gray-700">{time}</span>
            </div>
          </div>

          {/* Client selection (Baby or Parent) */}
          <ClientSelector
            selectedClient={selectedClient}
            onClientSelect={setSelectedClient}
          />

          {/* Package selection - shown when client is selected */}
          {selectedClient && (
            <div className="space-y-4">
              {/* Package selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700">
                  <Package className="h-4 w-4" />
                  {t("packages.selectPackage")}
                </Label>
                {loadingCatalog ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                  </div>
                ) : (
                  <PackageSelector
                    babyId={selectedClient.type === "BABY" ? selectedClient.baby?.id : undefined}
                    packages={catalogPackages}
                    babyPackages={getClientPackagesForSelector()}
                    selectedPackageId={selectedPackageId}
                    selectedPurchaseId={selectedPurchaseId}
                    onSelectPackage={handlePackageSelect}
                    onCatalogToggle={handleCatalogToggle}
                    showCategories={true}
                    showPrices={true}
                    showExistingFirst={true}
                    allowNewPackage={true}
                    compact={true}
                    showProvisionalMessage={true}
                  />
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-gray-700">{t("calendar.notes")}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("calendar.notesPlaceholder")}
                  className="min-h-[80px] rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                />
              </div>
            </div>
          )}

          {/* Advance payment confirmation step */}
          {showAdvancePaymentConfirm && (
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-amber-800">
                    {t("calendar.advancePaymentRequired")}
                  </p>
                  <p className="text-sm text-amber-700">
                    {t("calendar.advancePaymentAmount", { amount: getAdvancePaymentAmount() })}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleRegisterPaymentNow}
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-300/50"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  {t("calendar.registerPaymentNow")}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleScheduleWithoutPayment}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {t("calendar.scheduleWithoutPayment")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowAdvancePaymentConfirm(false)}
                  disabled={isSubmitting}
                  className="w-full text-gray-500"
                >
                  {t("common.back")}
                </Button>
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

        </div>

        {/* Actions - Fixed footer */}
        {!showAdvancePaymentConfirm && (
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
                  !selectedClient ||
                  isSubmitting ||
                  (!selectedPackageId && !selectedPurchaseId)
                }
                className={cn(
                  "rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600",
                  (!selectedClient ||
                    (!selectedPackageId && !selectedPurchaseId)) &&
                    "opacity-50",
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  t("calendar.schedule")
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Payment registration dialog */}
      {createdAppointment && (
        <RegisterPaymentDialog
          open={showPaymentDialog}
          onOpenChange={(open) => {
            if (!open) {
              // If closed without payment, the appointment remains as PENDING_PAYMENT
              // User can register payment later from the calendar
              setShowPaymentDialog(false);
              setCreatedAppointment(null);
              onOpenChange(false);
              onSuccess?.();
            }
          }}
          appointment={createdAppointment}
          onPaymentRegistered={handlePaymentRegistered}
        />
      )}
    </Dialog>
  );
}
