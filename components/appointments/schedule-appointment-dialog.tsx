"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { getCurrencySymbol } from "@/lib/utils/currency-utils";
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
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Package,
  CreditCard,
  AlertTriangle,
  Sparkles,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatLocalDateString } from "@/lib/utils/date-utils";
import {
  PackageSelector,
  type PackageData,
  type PackagePurchaseData,
  type SpecialPriceInfo,
} from "@/components/packages/package-selector";

// bundle-dynamic-imports: Lazy load payment dialog to reduce initial bundle
const RegisterPaymentDialog = dynamic(
  () => import("@/components/appointments/register-payment-dialog").then((m) => m.RegisterPaymentDialog),
  { ssr: false }
);

// Constants moved outside component to prevent re-creation on each render
const WEEK_DAYS: Record<string, string[]> = {
  es: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  "pt-BR": ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
};

interface TimeSlot {
  time: string;
  available: number;
  total: number;
}

interface DayAvailability {
  date: string;
  isClosed: boolean;
  closedReason?: string;
  slots: TimeSlot[];
}

interface BabyPackagePurchase {
  id: string;
  remainingSessions: number;
  totalSessions: number;
  usedSessions: number;
  isActive: boolean;
  package: {
    id: string;
    name: string;
    categoryId?: string | null;
    duration: number;
  };
}

interface ActiveBabyCard {
  id: string;
  completedSessions: number;
  babyCard: {
    name: string;
    totalSessions: number;
  };
}

// Baby Card checkout info interface
interface BabyCardCheckoutInfo {
  hasActiveCard: boolean;
  purchase: {
    id: string;
    babyCardName: string;
    completedSessions: number;
    totalSessions: number;
    progressPercent: number;
    status: string;
  } | null;
  firstSessionDiscount: {
    amount: number;
    used: boolean;
  } | null;
  availableRewards: {
    id: string;
    displayName: string;
    displayIcon: string | null;
    rewardType: string;
    sessionNumber: number;
  }[];
  nextReward: {
    id: string;
    displayName: string;
    displayIcon: string | null;
    sessionNumber: number;
    sessionsUntilUnlock: number;
  } | null;
  specialPrices: SpecialPriceInfo[];
}

interface ScheduleAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babyId: string;
  babyName: string;
  packagePurchases?: BabyPackagePurchase[];
  activeBabyCard?: ActiveBabyCard | null;
  onSuccess?: () => void;
}

export function ScheduleAppointmentDialog({
  open,
  onOpenChange,
  babyId,
  babyName,
  packagePurchases = [],
  activeBabyCard,
  onSuccess,
}: ScheduleAppointmentDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === "pt-BR" ? "pt-BR" : "es-ES";

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availability, setAvailability] = useState<DayAvailability | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Package selection states
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [catalogPackages, setCatalogPackages] = useState<PackageData[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Baby Card info state
  const [babyCardInfo, setBabyCardInfo] = useState<BabyCardCheckoutInfo | null>(null);
  const [loadingBabyCardInfo, setLoadingBabyCardInfo] = useState(false);

  // Advance payment flow states
  const [showAdvancePaymentConfirm, setShowAdvancePaymentConfirm] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<{
    id: string;
    date: Date;
    startTime: string;
    status: string;
    baby: { id: string; name: string };
    selectedPackage?: { id: string; name: string; basePrice?: number | string | null; advancePaymentAmount?: number | string | null } | null;
  } | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Track if initial auto-selection has been done
  const hasAutoSelected = useRef(false);

  // Get active packages with remaining sessions (memoized to prevent unnecessary recalculations)
  const activePackages = useMemo(
    () => packagePurchases.filter((p) => p.isActive && p.remainingSessions > 0),
    [packagePurchases]
  );

  // Transform baby's package purchases to PackageSelector format
  const babyPackagesForSelector: PackagePurchaseData[] = activePackages.map((pkg) => ({
    id: pkg.id,
    remainingSessions: pkg.remainingSessions,
    totalSessions: pkg.totalSessions,
    usedSessions: pkg.usedSessions,
    package: {
      id: pkg.package.id,
      name: pkg.package.name,
      categoryId: pkg.package.categoryId ?? null,
      duration: pkg.package.duration,
    },
  }));

  // Fetch Baby Card info
  const fetchBabyCardInfo = useCallback(async () => {
    setLoadingBabyCardInfo(true);
    try {
      const response = await fetch(`/api/checkout/baby-card-info/${babyId}`);
      const data = await response.json();
      if (response.ok) {
        setBabyCardInfo(data);
      }
    } catch (error) {
      console.error("Error fetching baby card info:", error);
    } finally {
      setLoadingBabyCardInfo(false);
    }
  }, [babyId]);

  // Fetch package catalog
  const fetchCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const params = new URLSearchParams({ active: "true", serviceType: "BABY" });
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

  // Fetch catalog and baby card info when dialog opens
  useEffect(() => {
    if (open) {
      fetchCatalog();
      fetchBabyCardInfo();
    }
  }, [open, fetchCatalog, fetchBabyCardInfo]);

  // Primitive dependency to prevent unnecessary effect re-runs when activePackages array reference changes
  const singleActivePackageId = activePackages.length === 1 ? activePackages[0].id : null;

  // Auto-select package if baby has exactly one active package (only on initial open)
  useEffect(() => {
    if (open && !hasAutoSelected.current && singleActivePackageId && activePackages.length === 1) {
      setSelectedPurchaseId(activePackages[0].id);
      setSelectedPackageId(activePackages[0].package.id);
      hasAutoSelected.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, singleActivePackageId]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedDate(null);
      setSelectedTime(null);
      setAvailability(null);
      setNotes("");
      setError(null);
      setCurrentMonth(new Date());
      setSelectedPackageId(null);
      setSelectedPurchaseId(null);
      setShowAdvancePaymentConfirm(false);
      setCreatedAppointment(null);
      setShowPaymentDialog(false);
      setBabyCardInfo(null);
      // Reset auto-selection flag so it works again next time dialog opens
      hasAutoSelected.current = false;
    }
  }, [open]);

  // Handle package selection
  const handlePackageSelect = useCallback((packageId: string | null, purchaseId: string | null) => {
    setSelectedPackageId(packageId);
    setSelectedPurchaseId(purchaseId);
    // Reset advance payment confirm when package changes
    setShowAdvancePaymentConfirm(false);
  }, []);

  // Fetch availability when date is selected
  const fetchAvailability = useCallback(async (date: Date) => {
    setIsLoadingAvailability(true);
    setSelectedTime(null);
    setError(null);

    try {
      const dateStr = formatLocalDateString(date);
      const response = await fetch(`/api/appointments/availability?date=${dateStr}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch availability");
      }

      setAvailability(data);
    } catch (err) {
      console.error("Error fetching availability:", err);
      setError(t("common.error"));
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [t]);

  // When date is selected
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    fetchAvailability(date);
  };

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
    if (!selectedDate || !selectedTime) return;
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
  const createAppointment = async (createAsPending: boolean, showPaymentAfter: boolean = false) => {
    if (!selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const dateStr = formatLocalDateString(selectedDate);

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          babyId,
          date: dateStr,
          startTime: selectedTime,
          notes: notes || undefined,
          packageId: selectedPackageId || undefined,
          packagePurchaseId: selectedPurchaseId || undefined,
          createAsPending,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
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
          status: data.appointment.status || "PENDING_PAYMENT",
          baby: { id: babyId, name: babyName },
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

  // Handle register payment now
  const handleRegisterPaymentNow = async () => {
    await createAppointment(true, true);
  };

  // Memoize calendar days computation to avoid recalculating on every render
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of month
    const startDayOfWeek = firstDay.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [currentMonth]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays = WEEK_DAYS[locale] || WEEK_DAYS["es"];

  const isDateDisabled = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today || d.getDay() === 0; // Past dates or Sundays
  };

  const availableSlots = availability?.slots.filter(s => s.available > 0) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            {t("babyProfile.appointments.scheduleNew")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Baby info */}
          <div className="flex items-center gap-3 rounded-xl bg-teal-50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500">
              <Baby className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{babyName}</p>
              {activePackages.length > 0 ? (
                <p className="flex items-center gap-1 text-sm text-emerald-600">
                  <Package className="h-3 w-3" />
                  {activePackages.length === 1
                    ? `${activePackages[0].remainingSessions} ${t("calendar.sessionsAvailable")}`
                    : `${activePackages.length} ${t("packages.title").toLowerCase()}`
                  }
                </p>
              ) : activeBabyCard ? (
                <p className="flex items-center gap-1 text-sm text-violet-600">
                  <CreditCard className="h-3 w-3" />
                  {activeBabyCard.babyCard.name}
                </p>
              ) : (
                <p className="text-sm text-amber-600">
                  {t("calendar.noActivePackage")}
                </p>
              )}
            </div>
          </div>

          {/* Baby Card info - shown when baby has active Baby Card */}
          {babyCardInfo && babyCardInfo.hasActiveCard && babyCardInfo.purchase && (
            <div className="rounded-xl border-2 border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-md">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{babyCardInfo.purchase.babyCardName}</p>
                  <p className="text-sm text-violet-600">
                    {t("babyCard.checkout.sessionNumber", {
                      number: babyCardInfo.purchase.completedSessions + 1,
                      total: babyCardInfo.purchase.totalSessions,
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1">
                    <Sparkles className="h-4 w-4 text-violet-600 mr-1.5" />
                    <span className="text-sm font-bold text-violet-700">
                      {Math.round(babyCardInfo.purchase.progressPercent)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-violet-200/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                    style={{ width: `${babyCardInfo.purchase.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* First Session Discount Available */}
              {babyCardInfo.firstSessionDiscount && !babyCardInfo.firstSessionDiscount.used && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5">
                  <Star className="h-4 w-4 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">
                      {t("babyCard.checkout.firstSessionDiscount")}
                    </p>
                    <p className="text-xs text-amber-600">
                      {t("babyCard.checkout.firstSessionDiscountValue", {
                        amount: babyCardInfo.firstSessionDiscount.amount.toFixed(0) + " " + getCurrencySymbol(locale),
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Special prices badge */}
              {babyCardInfo.specialPrices.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-violet-700">
                  <Sparkles className="h-4 w-4" />
                  <span>{t("babyCard.checkout.hasSpecialPrices")}</span>
                </div>
              )}
            </div>
          )}

          {/* Package selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700">
              <Package className="h-4 w-4" />
              {t("packages.selectPackage")}
            </Label>
            {loadingCatalog || loadingBabyCardInfo ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
              </div>
            ) : (
              <PackageSelector
                babyId={babyId}
                packages={catalogPackages}
                babyPackages={babyPackagesForSelector}
                specialPrices={babyCardInfo?.specialPrices}
                selectedPackageId={selectedPackageId}
                selectedPurchaseId={selectedPurchaseId}
                onSelectPackage={handlePackageSelect}
                showCategories={true}
                showPrices={true}
                showExistingFirst={true}
                allowNewPackage={true}
                compact={true}
                showProvisionalMessage={true}
              />
            )}
          </div>

          {/* Step 1: Date selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4" />
              {t("babyProfile.appointments.selectDate")}
            </Label>

            {/* Calendar header */}
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                disabled={currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear()}
                className="h-8 w-8 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-gray-700">
                {currentMonth.toLocaleDateString(dateLocale, { month: "long", year: "numeric" })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="h-8 w-8 rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => (
                <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
                  {day}
                </div>
              ))}
              {calendarDays.map((date, i) => {
                if (!date) {
                  return <div key={`empty-${i}`} className="p-2" />;
                }

                const disabled = isDateDisabled(date);
                const isSelected = selectedDate &&
                  date.getDate() === selectedDate.getDate() &&
                  date.getMonth() === selectedDate.getMonth() &&
                  date.getFullYear() === selectedDate.getFullYear();
                const isToday = date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear();

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => !disabled && handleDateSelect(date)}
                    disabled={disabled}
                    className={cn(
                      "p-2 text-sm rounded-lg transition-all",
                      disabled && "text-gray-300 cursor-not-allowed",
                      !disabled && !isSelected && "hover:bg-teal-50 text-gray-700",
                      isSelected && "bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium",
                      isToday && !isSelected && "ring-2 ring-teal-300"
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Time selection */}
          {selectedDate && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-gray-700">
                <Clock className="h-4 w-4" />
                {t("babyProfile.appointments.selectTime")}
              </Label>

              {isLoadingAvailability ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                </div>
              ) : availability?.isClosed ? (
                <div className="rounded-xl bg-gray-100 p-4 text-center">
                  <p className="text-gray-600">{t("calendar.closed")}</p>
                  {availability.closedReason && (
                    <p className="text-sm text-gray-500">{availability.closedReason}</p>
                  )}
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedTime(slot.time)}
                      className={cn(
                        "rounded-lg p-2 text-sm transition-all",
                        selectedTime === slot.time
                          ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium"
                          : "bg-gray-100 text-gray-700 hover:bg-teal-50"
                      )}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-amber-50 p-4 text-center">
                  <p className="text-amber-700">{t("babyProfile.appointments.noSlots")}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Notes */}
          {selectedTime && !showAdvancePaymentConfirm && (
            <div className="space-y-3">
              <Label className="text-gray-700">{t("calendar.notes")}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("calendar.notesPlaceholder")}
                className="min-h-[80px] rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
              />
            </div>
          )}

          {/* Summary */}
          {selectedDate && selectedTime && !showAdvancePaymentConfirm && (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <div className="text-sm">
                <p className="font-medium text-emerald-800">
                  {selectedDate.toLocaleDateString(dateLocale, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <p className="text-emerald-600">
                  {selectedTime}
                </p>
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

          {/* Actions */}
          {!showAdvancePaymentConfirm && (
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl border-2 border-gray-200"
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedDate || !selectedTime || isSubmitting || (!selectedPackageId && !selectedPurchaseId)}
                className={cn(
                  "rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600",
                  (!selectedDate || !selectedTime || (!selectedPackageId && !selectedPurchaseId)) && "opacity-50"
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
          )}
        </div>
      </DialogContent>

      {/* Payment registration dialog */}
      {createdAppointment && (
        <RegisterPaymentDialog
          open={showPaymentDialog}
          onOpenChange={(open) => {
            if (!open) {
              // If closed without payment, the appointment remains as PENDING_PAYMENT
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
