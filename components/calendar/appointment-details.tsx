"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDateForDisplay } from "@/lib/utils/date-utils";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogDestructiveAction,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StartSessionDialog } from "@/components/sessions/start-session-dialog";
import { CompleteSessionDialog } from "@/components/sessions/complete-session-dialog";
import { ViewBabyDialog } from "@/components/sessions/view-baby-dialog";
import { RegisterPaymentDialog } from "@/components/appointments/register-payment-dialog";

// Dynamic import for installment payment dialog
const RegisterInstallmentPaymentDialog = dynamic(
  () => import("@/components/packages/register-installment-payment-dialog").then(mod => mod.RegisterInstallmentPaymentDialog),
  { ssr: false }
);
import {
  PackageSelector,
  type PackageData,
  type PackagePurchaseData,
} from "@/components/packages/package-selector";
import {
  Baby,
  Calendar,
  Clock,
  User,
  Phone,
  MessageCircle,
  Loader2,
  Play,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  CalendarClock,
  Info,
  Package,
  Pencil,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateTimeSlots, BUSINESS_HOURS } from "@/lib/constants/business-hours";
import { getPaymentStatus, type PaymentStatus } from "@/lib/utils/installments";
import { parseSchedulePreferences, formatPreferencesText } from "@/lib/utils/bulk-scheduling";

interface AppointmentDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    date: Date;
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
    status: "PENDING_PAYMENT" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
    isPendingPayment?: boolean;
    notes: string | null;
    cancelReason: string | null;
    packagePurchaseId?: string | null;
    // Pending schedule preferences (from portal, before checkout)
    pendingSchedulePreferences?: string | null;
    session?: {
      id: string;
    } | null;
    baby: {
      id: string;
      name: string;
      parents: {
        isPrimary: boolean;
        parent: {
          id: string;
          name: string;
          phone: string;
        };
      }[];
    };
    packagePurchase?: {
      id: string;
      totalSessions?: number;
      usedSessions?: number;
      remainingSessions?: number;
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
        basePrice?: number | string | null;
        advancePaymentAmount?: number | string | null;
      };
    } | null;
    selectedPackage?: {
      id: string;
      name: string;
      basePrice?: number | string | null;
      advancePaymentAmount?: number | string | null;
    } | null;
  } | null;
  onUpdate?: () => void;
}

const statusConfig = {
  PENDING_PAYMENT: {
    label: "pendingPayment",
    color: "bg-orange-100 text-orange-800 border-orange-300",
  },
  SCHEDULED: {
    label: "scheduled",
    color: "bg-amber-100 text-amber-800 border-amber-300",
  },
  IN_PROGRESS: {
    label: "inProgress",
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  COMPLETED: {
    label: "completed",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  CANCELLED: {
    label: "cancelled",
    color: "bg-rose-100 text-rose-800 border-rose-300",
  },
  NO_SHOW: {
    label: "noShow",
    color: "bg-gray-100 text-gray-800 border-gray-300",
  },
};

export function AppointmentDetails({
  open,
  onOpenChange,
  appointment,
  onUpdate,
}: AppointmentDetailsProps) {
  const t = useTranslations();
  const locale = useLocale();
  // Map next-intl locale to date-fns/toLocaleDateString locale
  const dateLocale = locale === "pt-BR" ? "pt-BR" : "es-ES";

  const [isUpdating, setIsUpdating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showNoShowDialog, setShowNoShowDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Start session state
  const [showStartSessionDialog, setShowStartSessionDialog] = useState(false);

  // Complete session state
  const [showCompleteSessionDialog, setShowCompleteSessionDialog] = useState(false);

  // Reschedule state
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<string>("");
  const [rescheduleTime, setRescheduleTime] = useState<string>("");
  const [rescheduleError, setRescheduleError] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // View baby state
  const [showViewBabyDialog, setShowViewBabyDialog] = useState(false);

  // Register payment state
  const [showRegisterPaymentDialog, setShowRegisterPaymentDialog] = useState(false);
  const [babyDetails, setBabyDetails] = useState<{
    id: string;
    name: string;
    birthDate: string;
    gender: string;
    birthWeeks?: number | null;
    birthWeight?: number | string | null;
    birthType?: string | null;
    birthDifficulty?: boolean;
    birthDifficultyDesc?: string | null;
    diagnosedIllness?: boolean;
    diagnosedIllnessDesc?: string | null;
    allergies?: string | null;
    specialObservations?: string | null;
    parents?: Array<{
      isPrimary: boolean;
      parent: {
        id: string;
        name: string;
      };
    }>;
  } | null>(null);
  const [isLoadingBaby, setIsLoadingBaby] = useState(false);

  // Edit package state
  const [isEditingPackage, setIsEditingPackage] = useState(false);
  const [isSavingPackage, setIsSavingPackage] = useState(false);
  const [catalogPackages, setCatalogPackages] = useState<PackageData[]>([]);
  const [babyPackages, setBabyPackages] = useState<PackagePurchaseData[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [packageError, setPackageError] = useState<string | null>(null);

  // Installment payment status
  const [installmentPaymentStatus, setInstallmentPaymentStatus] = useState<PaymentStatus | null>(null);
  const [showInstallmentPaymentDialog, setShowInstallmentPaymentDialog] = useState(false);

  // Reset package editing state when modal closes or appointment changes
  useEffect(() => {
    if (!open) {
      // Reset all package editing state when modal closes
      setIsEditingPackage(false);
      setIsSavingPackage(false);
      setCatalogPackages([]);
      setBabyPackages([]);
      setSelectedPackageId(null);
      setSelectedPurchaseId(null);
      setPackageError(null);
    }
  }, [open]);

  // Also reset when appointment changes
  useEffect(() => {
    setIsEditingPackage(false);
    setIsSavingPackage(false);
    setCatalogPackages([]);
    setBabyPackages([]);
    setSelectedPackageId(null);
    setSelectedPurchaseId(null);
    setPackageError(null);
  }, [appointment?.id]);

  // Calculate installment payment status when appointment has a package with installments
  useEffect(() => {
    if (!appointment?.packagePurchase) {
      setInstallmentPaymentStatus(null);
      return;
    }

    const purchase = appointment.packagePurchase;
    if (purchase.paymentPlan === "INSTALLMENTS" && (purchase.installments || 1) > 1) {
      const status = getPaymentStatus({
        usedSessions: purchase.usedSessions || 0,
        totalSessions: purchase.totalSessions || 0,
        remainingSessions: purchase.remainingSessions || 0,
        paymentPlan: purchase.paymentPlan || "SINGLE",
        installments: purchase.installments || 1,
        installmentAmount: purchase.installmentAmount || null,
        totalPrice: purchase.totalPrice || null,
        finalPrice: purchase.finalPrice || 0,
        paidAmount: purchase.paidAmount || 0,
        installmentsPayOnSessions: purchase.installmentsPayOnSessions || null,
      });

      // Show status if there are overdue payments
      if (status.overdueAmount > 0) {
        setInstallmentPaymentStatus(status);
      } else {
        setInstallmentPaymentStatus(null);
      }
    } else {
      setInstallmentPaymentStatus(null);
    }
  }, [appointment]);

  // Generate dates for next 30 days (excluding closed days)
  const availableDates = useMemo(() => {
    const dates: { value: string; label: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();

      // Skip closed days (Sunday = 0)
      if (BUSINESS_HOURS[dayOfWeek] === null) continue;

      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const dayLabel = date.toLocaleDateString(dateLocale, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      dates.push({ value: dateStr, label: dayLabel });
    }
    return dates;
  }, [dateLocale]);

  // Update available time slots when date changes
  useEffect(() => {
    if (!rescheduleDate) {
      setAvailableSlots([]);
      return;
    }

    const [year, month, day] = rescheduleDate.split("-").map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const dayOfWeek = selectedDate.getDay();
    const slots = generateTimeSlots(dayOfWeek);

    // Filter out past times if it's today
    const today = new Date();
    if (
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate()
    ) {
      const currentHour = today.getHours();
      const currentMinutes = today.getMinutes();
      const filteredSlots = slots.filter((slot) => {
        const [hours, minutes] = slot.split(":").map(Number);
        if (hours > currentHour) return true;
        if (hours === currentHour && minutes > currentMinutes) return true;
        return false;
      });
      setAvailableSlots(filteredSlots);
    } else {
      setAvailableSlots(slots);
    }
    setRescheduleTime(""); // Reset time when date changes
    setRescheduleError("");
  }, [rescheduleDate]);

  if (!appointment) return null;

  const primaryParent = appointment.baby.parents.find((p) => p.isPrimary)?.parent;
  const statusInfo = statusConfig[appointment.status];

  // Format time string to HH:mm
  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  // Format date using utility to avoid timezone issues
  const formatDate = () => {
    return formatDateForDisplay(appointment.date, dateLocale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formattedDate = formatDate();

  // Handle status actions
  const handleAction = async (action: string, reason?: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });

      if (response.ok) {
        onUpdate?.();
        // Close dialog after any action to show fresh data
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
    } finally {
      setIsUpdating(false);
      setShowCancelDialog(false);
      setShowNoShowDialog(false);
      setCancelReason("");
    }
  };

  const canStart = appointment.status === "SCHEDULED";
  const canComplete = appointment.status === "IN_PROGRESS";
  const canCancel = ["SCHEDULED", "IN_PROGRESS", "PENDING_PAYMENT"].includes(appointment.status);
  const canMarkNoShow = appointment.status === "SCHEDULED";
  const canReschedule = appointment.status === "SCHEDULED" || appointment.status === "PENDING_PAYMENT";
  const canRegisterPayment = appointment.status === "PENDING_PAYMENT";

  // Handle reschedule
  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) return;

    setIsUpdating(true);
    setRescheduleError("");

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: rescheduleDate,
          startTime: rescheduleTime,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onUpdate?.();
        setShowRescheduleDialog(false);
        onOpenChange(false);
        setRescheduleDate("");
        setRescheduleTime("");
      } else {
        // Handle validation errors
        const errorKey = data.error || "UNKNOWN_ERROR";
        setRescheduleError(errorKey);
      }
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      setRescheduleError("UNKNOWN_ERROR");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle view baby details
  const handleViewBaby = async () => {
    setIsLoadingBaby(true);
    try {
      const response = await fetch(`/api/babies/${appointment.baby.id}`);
      if (response.ok) {
        const data = await response.json();
        setBabyDetails(data.baby);
        setShowViewBabyDialog(true);
      }
    } catch (error) {
      console.error("Error fetching baby details:", error);
    } finally {
      setIsLoadingBaby(false);
    }
  };

  // Handle edit package
  const handleEditPackage = async () => {
    setIsLoadingPackages(true);
    setPackageError(null);

    // Set initial selection based on current appointment
    if (appointment.packagePurchase) {
      setSelectedPurchaseId(appointment.packagePurchase.id);
      setSelectedPackageId(appointment.packagePurchase.package.id);
    } else if (appointment.selectedPackage) {
      setSelectedPackageId(appointment.selectedPackage.id);
      setSelectedPurchaseId(null);
    }

    try {
      // Fetch baby's packages and catalog in parallel
      const [babyPkgRes, catalogRes] = await Promise.all([
        fetch(`/api/babies/${appointment.baby.id}/packages`),
        fetch("/api/packages?active=true"),
      ]);

      if (babyPkgRes.ok) {
        const data = await babyPkgRes.json();
        const packages = (data.packages || []).filter(
          (p: PackagePurchaseData) => p.remainingSessions > 0
        );
        setBabyPackages(packages);
      }

      if (catalogRes.ok) {
        const data = await catalogRes.json();
        setCatalogPackages(data.packages || []);
      }

      setIsEditingPackage(true);
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setIsLoadingPackages(false);
    }
  };

  // Handle package selection
  const handlePackageSelect = (packageId: string | null, purchaseId: string | null) => {
    setSelectedPackageId(packageId);
    setSelectedPurchaseId(purchaseId);
  };

  // Save package change
  const handleSavePackage = async () => {
    if (!selectedPackageId && !selectedPurchaseId) return;

    setIsSavingPackage(true);
    setPackageError(null);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPurchaseId ? null : selectedPackageId,
          packagePurchaseId: selectedPurchaseId,
        }),
      });

      if (response.ok) {
        setIsEditingPackage(false);
        onUpdate?.();
      } else {
        const data = await response.json();
        setPackageError(data.error || "UNKNOWN_ERROR");
      }
    } catch (error) {
      console.error("Error updating package:", error);
      setPackageError("UNKNOWN_ERROR");
    } finally {
      setIsSavingPackage(false);
    }
  };

  // Cancel package edit
  const handleCancelPackageEdit = () => {
    setIsEditingPackage(false);
    setPackageError(null);
  };

  // Check if baby has medical alerts (based on current appointment data)
  const hasMedicalAlerts = false; // Will be updated when baby details are fetched

  // Get schedule preferences text from either packagePurchase or pending appointment preferences
  const getSchedulePreferencesText = () => {
    const prefsJson = appointment?.packagePurchase?.schedulePreferences
      || appointment?.pendingSchedulePreferences;
    if (!prefsJson) return null;
    const prefs = parseSchedulePreferences(prefsJson);
    return prefs.length > 0 ? formatPreferencesText(prefs, locale) : null;
  };

  const schedulePreferencesText = getSchedulePreferencesText();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-white/50 bg-white/95 p-0 backdrop-blur-md">
          <DialogHeader className="shrink-0 border-b border-gray-100 px-6 py-4">
            <DialogTitle className="flex items-center justify-between">
              <span className="text-xl font-bold text-gray-800">
                {t("calendar.appointmentDetails")}
              </span>
              <Badge className={cn("border", statusInfo.color)}>
                {t(`calendar.status.${statusInfo.label}`)}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {/* Info cards grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Date card */}
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    {t("calendar.date")}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {formattedDate}
                </p>
              </div>

              {/* Time card */}
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    {t("calendar.time")}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                </p>
              </div>
            </div>

            {/* Package card - full width */}
            <div className={cn(
              "rounded-xl p-3",
              appointment.packagePurchase || appointment.selectedPackage
                ? "bg-teal-50 border border-teal-200"
                : "bg-amber-50 border border-amber-200"
            )}>
              {!isEditingPackage ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      appointment.packagePurchase || appointment.selectedPackage
                        ? "bg-teal-100"
                        : "bg-amber-100"
                    )}>
                      <Package className={cn(
                        "h-4 w-4",
                        appointment.packagePurchase || appointment.selectedPackage
                          ? "text-teal-600"
                          : "text-amber-600"
                      )} />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {t("calendar.package")}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-sm font-semibold",
                          appointment.packagePurchase || appointment.selectedPackage
                            ? "text-teal-700"
                            : "text-amber-700"
                        )}>
                          {appointment.packagePurchase
                            ? appointment.packagePurchase.package.name
                            : appointment.selectedPackage
                              ? appointment.selectedPackage.name
                              : t("calendar.sessionToDefine")}
                        </p>
                        {/* Installment payment overdue badge */}
                        {installmentPaymentStatus && installmentPaymentStatus.overdueAmount > 0 && (
                          <Badge className="flex items-center gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-300 px-1.5 py-0">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="text-[10px] font-medium">
                              {t("packages.installments.alerts.paymentWarning")}
                            </span>
                          </Badge>
                        )}
                      </div>
                      {/* Advance payment amount for PENDING_PAYMENT */}
                      {appointment.status === "PENDING_PAYMENT" && appointment.selectedPackage?.advancePaymentAmount && (
                        <p className="mt-1 text-sm font-bold text-orange-600">
                          💰 {t("payment.advanceRequired")}: Bs. {parseFloat(appointment.selectedPackage.advancePaymentAmount.toString()).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Edit button - only for scheduled appointments */}
                  {appointment.status === "SCHEDULED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditPackage}
                      disabled={isLoadingPackages}
                      className="h-8 px-2 text-teal-600 hover:bg-teal-100 hover:text-teal-700"
                    >
                      {isLoadingPackages ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Pencil className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {t("calendar.changePackage")}
                    </p>
                  </div>
                  <PackageSelector
                    babyId={appointment.baby.id}
                    packages={catalogPackages}
                    babyPackages={babyPackages}
                    selectedPackageId={selectedPackageId}
                    selectedPurchaseId={selectedPurchaseId}
                    onSelectPackage={handlePackageSelect}
                    showCategories={true}
                    showPrices={false}
                    showExistingFirst={true}
                    allowNewPackage={true}
                    compact={true}
                    showProvisionalMessage={false}
                    maxHeight="200px"
                    forceShowCatalog={!!appointment.selectedPackage && !appointment.packagePurchase}
                  />
                  {packageError && (
                    <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
                      <AlertCircle className="h-3 w-3" />
                      {t(`calendar.errors.${packageError}`)}
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelPackageEdit}
                      className="h-8"
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSavePackage}
                      disabled={isSavingPackage || (!selectedPackageId && !selectedPurchaseId)}
                      className="h-8 bg-teal-600 text-white hover:bg-teal-700"
                    >
                      {isSavingPackage ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : null}
                      {t("common.save")}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Parent schedule preferences - shows when parent set preferred schedule */}
            {schedulePreferencesText && (
              <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-cyan-600" />
                  <div>
                    <p className="text-xs text-gray-500">{t("calendar.parentPreferredSchedule")}</p>
                    <p className="text-sm font-semibold text-cyan-700">{schedulePreferencesText}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Installment payment alert - shows when package has overdue payments */}
            {installmentPaymentStatus && installmentPaymentStatus.overdueAmount > 0 && appointment.packagePurchase && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="ml-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-amber-800">
                      {installmentPaymentStatus.overdueInstallments.length === 1
                        ? t("packages.installments.alerts.installmentOverdue", {
                            number: installmentPaymentStatus.overdueInstallments[0],
                            amount: installmentPaymentStatus.overdueAmount.toFixed(2),
                          })
                        : t("packages.installments.alerts.installmentsOverdue", {
                            count: installmentPaymentStatus.overdueInstallments.length,
                            amount: installmentPaymentStatus.overdueAmount.toFixed(2),
                          })}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setShowInstallmentPaymentDialog(true)}
                      className="h-8 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 text-xs font-medium text-white shadow-sm hover:from-amber-600 hover:to-orange-600"
                    >
                      <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                      {t("packages.installments.registerPayment")}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Baby info */}
            <div className="rounded-xl border-2 border-teal-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 shadow-md shadow-teal-200">
                    <Baby className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {appointment.baby.name}
                    </p>
                    {primaryParent && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {primaryParent.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {primaryParent.phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleViewBaby}
                    disabled={isLoadingBaby}
                    className="h-8 w-8 p-0 text-cyan-600 hover:bg-cyan-100"
                  >
                    {isLoadingBaby ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Info className="h-4 w-4" />
                    )}
                  </Button>
                  <Link href={`/admin/clients/${appointment.baby.id}`} target="_blank">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-teal-600 hover:bg-teal-100"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* WhatsApp button */}
              {primaryParent && (
                <a
                  href={`https://wa.me/${primaryParent.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("calendar.sendWhatsApp")}
                </a>
              )}
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-500">{t("calendar.notes")}</p>
                <p className="mt-1 text-gray-700">{appointment.notes}</p>
              </div>
            )}

            {/* Cancel reason */}
            {appointment.cancelReason && (
              <div className="rounded-xl bg-rose-50 p-4">
                <p className="text-sm font-medium text-rose-600">
                  {t("calendar.cancelReason")}
                </p>
                <p className="mt-1 text-rose-700">{appointment.cancelReason}</p>
              </div>
            )}

            {/* Actions */}
            {(canStart || canComplete || canCancel || canMarkNoShow || canReschedule || canRegisterPayment) && (
              <div className="space-y-3">
                {/* Register Payment - for PENDING_PAYMENT appointments */}
                {canRegisterPayment && (
                  <Button
                    onClick={() => setShowRegisterPaymentDialog(true)}
                    disabled={isUpdating}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-6 text-base font-semibold text-white shadow-lg shadow-amber-200 hover:from-amber-600 hover:to-orange-600"
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    {t("payment.registerPayment")}
                  </Button>
                )}

                {/* Primary workflow action - Start or Complete */}
                {(canStart || canComplete) && (
                  <div className="flex gap-2">
                    {canStart && (
                      <Button
                        onClick={() => setShowStartSessionDialog(true)}
                        disabled={isUpdating}
                        className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-6 text-base font-semibold text-white shadow-lg shadow-blue-200 hover:from-blue-600 hover:to-blue-700"
                      >
                        {isUpdating ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <Play className="mr-2 h-5 w-5" />
                        )}
                        {t("calendar.actions.start")}
                      </Button>
                    )}

                    {canComplete && appointment.session?.id && (
                      <Button
                        onClick={() => setShowCompleteSessionDialog(true)}
                        disabled={isUpdating}
                        className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-6 text-base font-semibold text-white shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-emerald-700"
                      >
                        {isUpdating ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-5 w-5" />
                        )}
                        {t("calendar.actions.complete")}
                      </Button>
                    )}
                  </div>
                )}

                {/* Reschedule - neutral action */}
                {canReschedule && (
                  <Button
                    onClick={() => setShowRescheduleDialog(true)}
                    disabled={isUpdating}
                    variant="outline"
                    className="w-full rounded-xl border-2 border-teal-200 py-5 text-teal-700 hover:bg-teal-50"
                  >
                    <CalendarClock className="mr-2 h-4 w-4" />
                    {t("calendar.actions.reschedule")}
                  </Button>
                )}

                {/* Negative actions - Cancel and No-Show */}
                {(canCancel || canMarkNoShow) && (
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {canCancel && (
                      <Button
                        onClick={() => setShowCancelDialog(true)}
                        disabled={isUpdating}
                        variant="ghost"
                        className="flex-1 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <X className="mr-2 h-4 w-4" />
                        {t("calendar.actions.cancel")}
                      </Button>
                    )}

                    {canMarkNoShow && (
                      <Button
                        onClick={() => setShowNoShowDialog(true)}
                        disabled={isUpdating}
                        variant="ghost"
                        className="flex-1 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        {t("calendar.actions.noShow")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("calendar.cancelAppointment")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("calendar.cancelConfirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t("calendar.cancelReasonPlaceholder")}
              className="min-h-[80px] rounded-xl border-2 border-gray-200"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogDestructiveAction
              onClick={() => handleAction("cancel", cancelReason)}
              disabled={!cancelReason.trim() || isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("calendar.confirmCancel")}
            </AlertDialogDestructiveAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* No-show confirmation dialog */}
      <AlertDialog open={showNoShowDialog} onOpenChange={setShowNoShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("calendar.markNoShow")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("calendar.noShowConfirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogDestructiveAction
              onClick={() => handleAction("no-show")}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("calendar.confirmNoShow")}
            </AlertDialogDestructiveAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="max-w-md rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <CalendarClock className="h-5 w-5 text-teal-600" />
              {t("calendar.reschedule.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">
              {t("calendar.reschedule.description")}
            </p>

            {/* Date selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("calendar.reschedule.selectDate")}
              </label>
              <Select value={rescheduleDate} onValueChange={setRescheduleDate}>
                <SelectTrigger className="w-full rounded-xl border-2 border-teal-100 focus:border-teal-400">
                  <SelectValue placeholder={t("calendar.reschedule.selectDate")} />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map((date) => (
                    <SelectItem key={date.value} value={date.value}>
                      {date.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("calendar.reschedule.selectTime")}
              </label>
              <Select
                value={rescheduleTime}
                onValueChange={setRescheduleTime}
                disabled={!rescheduleDate || availableSlots.length === 0}
              >
                <SelectTrigger className="w-full rounded-xl border-2 border-teal-100 focus:border-teal-400">
                  <SelectValue
                    placeholder={
                      availableSlots.length === 0 && rescheduleDate
                        ? t("calendar.reschedule.noSlotsAvailable")
                        : t("calendar.reschedule.selectTime")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error message */}
            {rescheduleError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">
                <AlertCircle className="h-4 w-4" />
                {t(`calendar.errors.${rescheduleError}`)}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRescheduleDialog(false);
                setRescheduleDate("");
                setRescheduleTime("");
                setRescheduleError("");
              }}
              className="flex-1 rounded-xl"
              disabled={isUpdating}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!rescheduleDate || !rescheduleTime || isUpdating}
              className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600"
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {t("calendar.reschedule.confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Start session dialog with therapist selection */}
      {appointment && (
        <StartSessionDialog
          open={showStartSessionDialog}
          onOpenChange={setShowStartSessionDialog}
          appointmentId={appointment.id}
          babyId={appointment.baby.id}
          babyName={appointment.baby.name}
          startTime={appointment.startTime}
          preselectedPurchaseId={appointment.packagePurchaseId || undefined}
          preselectedCatalogPackageId={
            // Only pass catalog package if there's NO purchased package
            !appointment.packagePurchaseId && appointment.selectedPackage?.id
              ? appointment.selectedPackage.id
              : undefined
          }
          onSuccess={() => {
            onUpdate?.();
            onOpenChange(false);
          }}
        />
      )}

      {/* Complete session dialog with package selection */}
      {appointment?.session?.id && (
        <CompleteSessionDialog
          open={showCompleteSessionDialog}
          onOpenChange={setShowCompleteSessionDialog}
          sessionId={appointment.session.id}
          onSuccess={() => {
            onUpdate?.();
            onOpenChange(false);
          }}
        />
      )}

      {/* View baby details dialog */}
      <ViewBabyDialog
        open={showViewBabyDialog}
        onOpenChange={setShowViewBabyDialog}
        baby={babyDetails}
      />

      {/* Register payment dialog */}
      {appointment && (
        <RegisterPaymentDialog
          open={showRegisterPaymentDialog}
          onOpenChange={setShowRegisterPaymentDialog}
          appointment={appointment}
          onPaymentRegistered={() => {
            onUpdate?.();
            onOpenChange(false);
          }}
        />
      )}

      {/* Register installment payment dialog */}
      {appointment?.packagePurchase && installmentPaymentStatus && (
        <RegisterInstallmentPaymentDialog
          open={showInstallmentPaymentDialog}
          onOpenChange={setShowInstallmentPaymentDialog}
          purchase={{
            id: appointment.packagePurchase.id,
            totalSessions: appointment.packagePurchase.totalSessions || 0,
            usedSessions: appointment.packagePurchase.usedSessions || 0,
            remainingSessions: appointment.packagePurchase.remainingSessions || 0,
            installments: appointment.packagePurchase.installments || 1,
            installmentAmount: appointment.packagePurchase.installmentAmount ?? null,
            paidAmount: appointment.packagePurchase.paidAmount ?? 0,
            finalPrice: appointment.packagePurchase.finalPrice ?? 0,
            totalPrice: appointment.packagePurchase.totalPrice ?? null,
            paymentPlan: appointment.packagePurchase.paymentPlan || "SINGLE",
            installmentsPayOnSessions: appointment.packagePurchase.installmentsPayOnSessions ?? null,
            package: appointment.packagePurchase.package,
          }}
          onSuccess={() => {
            setShowInstallmentPaymentDialog(false);
            onUpdate?.();
          }}
        />
      )}
    </>
  );
}
