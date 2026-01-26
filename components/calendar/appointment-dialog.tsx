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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Baby,
  Calendar,
  Clock,
  Search,
  Loader2,
  AlertCircle,
  User,
  Package,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PackageSelector,
  type PackageData,
  type PackagePurchaseData,
} from "@/components/packages/package-selector";

// bundle-dynamic-imports: Lazy load payment dialog to reduce initial bundle
const RegisterPaymentDialog = dynamic(
  () => import("@/components/appointments/register-payment-dialog").then((m) => m.RegisterPaymentDialog),
  { ssr: false }
);

interface BabySearchResult {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  parents: {
    isPrimary: boolean;
    parent: {
      id: string;
      name: string;
      phone: string;
    };
  }[];
  packagePurchases: {
    id: string;
    remainingSessions: number;
    totalSessions: number;
    usedSessions: number;
    isActive: boolean;
    package: {
      id: string;
      name: string;
      categoryId: string | null;
      duration: number;
    };
  }[];
}

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

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BabySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBaby, setSelectedBaby] = useState<BabySearchResult | null>(
    null,
  );
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
      setSearchQuery("");
      setSearchResults([]);
      setSelectedBaby(null);
      setNotes("");
      setError(null);
      setSelectedPackageId(null);
      setSelectedPurchaseId(null);
      setShowAdvancePaymentConfirm(false);
      setCreatedAppointment(null);
      setShowPaymentDialog(false);
    }
  }, [open]);

  // Fetch package catalog
  const fetchCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const response = await fetch("/api/packages?active=true");
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

  // Fetch catalog when dialog opens
  useEffect(() => {
    if (open && catalogPackages.length === 0) {
      fetchCatalog();
    }
  }, [open, fetchCatalog, catalogPackages.length]);

  // Handle package selection
  const handlePackageSelect = (
    packageId: string | null,
    purchaseId: string | null,
  ) => {
    setSelectedPackageId(packageId);
    setSelectedPurchaseId(purchaseId);
  };

  // Transform baby packages to PackageSelector format
  const getBabyPackagesForSelector = (): PackagePurchaseData[] => {
    if (!selectedBaby) return [];
    return selectedBaby.packagePurchases
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
  };

  // Search babies
  const searchBabies = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/babies?search=${encodeURIComponent(query)}&limit=5`,
      );
      const data = await response.json();
      setSearchResults(data.babies || []);
    } catch (err) {
      console.error("Error searching babies:", err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchBabies(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchBabies]);

  // Auto-select package when baby is selected
  useEffect(() => {
    if (selectedBaby) {
      const activePackages = selectedBaby.packagePurchases.filter(
        (p) => p.isActive && p.remainingSessions > 0,
      );
      if (activePackages.length === 1) {
        setSelectedPurchaseId(activePackages[0].id);
        setSelectedPackageId(activePackages[0].package.id);
      } else {
        setSelectedPurchaseId(null);
        setSelectedPackageId(null);
      }
    }
  }, [selectedBaby]);

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
    if (!selectedBaby) return;
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
    if (!selectedBaby) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          babyId: selectedBaby.id,
          packagePurchaseId: selectedPurchaseId,
          packageId: selectedPackageId,
          // Use local date format to avoid timezone issues
          date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
          startTime: time,
          notes: notes || undefined,
          createAsPending,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Map error codes to translation keys
        const errorKey = data.error || "UNKNOWN_ERROR";
        setError(t(`calendar.errors.${errorKey}`));
        return;
      }

      // If user chose to pay now, show payment dialog
      if (showPaymentAfter) {
        const pkg = getSelectedPackageData();
        setCreatedAppointment({
          id: data.appointment.id,
          date: new Date(data.appointment.date),
          startTime: data.appointment.startTime,
          baby: { id: selectedBaby.id, name: selectedBaby.name },
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

          {/* Baby search */}
          {!selectedBaby ? (
            <div className="space-y-3">
              <Label className="text-gray-700">
                {t("calendar.searchBaby")}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("calendar.searchBabyPlaceholder")}
                  className="h-12 rounded-xl border-2 border-teal-100 pl-10 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-teal-500" />
                )}
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-gray-100 p-2">
                  {searchResults.map((baby) => {
                    // Sum all remaining sessions from active packages
                    const totalRemainingSessions = baby.packagePurchases
                      .filter((p) => p.isActive && p.remainingSessions > 0)
                      .reduce((sum, p) => sum + p.remainingSessions, 0);
                    const primaryParent = baby.parents.find((p) => p.isPrimary);

                    return (
                      <button
                        key={baby.id}
                        onClick={() => setSelectedBaby(baby)}
                        className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-teal-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-cyan-100">
                            <Baby className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {baby.name}
                            </p>
                            {primaryParent && (
                              <p className="text-sm text-gray-500">
                                {primaryParent.parent.name}
                              </p>
                            )}
                          </div>
                        </div>
                        {totalRemainingSessions > 0 ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                            {totalRemainingSessions}{" "}
                            {t("common.sessionsUnit")}
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                            {t("calendar.noPackage")}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {searchQuery.length >= 2 &&
                searchResults.length === 0 &&
                !isSearching && (
                  <p className="text-center text-sm text-gray-500">
                    {t("common.noResults")}
                  </p>
                )}
            </div>
          ) : (
            /* Selected baby */
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border-2 border-teal-200 bg-teal-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500">
                    <Baby className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {selectedBaby.name}
                    </p>
                    {selectedBaby.parents.find((p) => p.isPrimary) && (
                      <p className="flex items-center gap-1 text-sm text-gray-500">
                        <User className="h-3 w-3" />
                        {
                          selectedBaby.parents.find((p) => p.isPrimary)?.parent
                            .name
                        }
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBaby(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {t("calendar.change")}
                </Button>
              </div>

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
                    babyId={selectedBaby.id}
                    packages={catalogPackages}
                    babyPackages={getBabyPackagesForSelector()}
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
                  !selectedBaby ||
                  isSubmitting ||
                  (!selectedPackageId && !selectedPurchaseId)
                }
                className={cn(
                  "rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600",
                  (!selectedBaby ||
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
