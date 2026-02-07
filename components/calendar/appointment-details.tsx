"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDateForDisplay } from "@/lib/utils/date-utils";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarClock, AlertTriangle, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateTimeSlots, BUSINESS_HOURS } from "@/lib/constants/business-hours";
import { getPaymentStatus, type PaymentStatus } from "@/lib/utils/installments";
import { parseSchedulePreferences, formatPreferencesText } from "@/lib/utils/bulk-scheduling";
import type { PackageData, PackagePurchaseData } from "@/components/packages/package-selector";

// Import subcomponents from the extracted module
import {
  ClientHeader,
  DateTimePackageRow,
  BabyCardSection,
  PaymentsSection,
  AppointmentActions,
  PackageEditor,
  RescheduleDialog,
  CancelDialog,
  NoShowDialog,
  statusConfig,
  type BabyCardCheckoutInfo,
  type BabyDetails,
  type AppointmentData,
} from "./appointment-details/index";

// bundle-dynamic-imports: Lazy load all dialog components to reduce initial bundle
const StartSessionDialog = dynamic(
  () => import("@/components/sessions/start-session-dialog").then((m) => m.StartSessionDialog),
  { ssr: false }
);
const CompleteSessionDialog = dynamic(
  () => import("@/components/sessions/complete-session-dialog").then((m) => m.CompleteSessionDialog),
  { ssr: false }
);
const ViewBabyDialog = dynamic(
  () => import("@/components/sessions/view-baby-dialog").then((m) => m.ViewBabyDialog),
  { ssr: false }
);
const RegisterPaymentDialog = dynamic(
  () => import("@/components/appointments/register-payment-dialog").then((m) => m.RegisterPaymentDialog),
  { ssr: false }
);
const RegisterInstallmentPaymentDialog = dynamic(
  () => import("@/components/packages/register-installment-payment-dialog").then((m) => m.RegisterInstallmentPaymentDialog),
  { ssr: false }
);

interface AppointmentDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentData | null;
  onUpdate?: () => void;
}

export function AppointmentDetails({
  open,
  onOpenChange,
  appointment,
  onUpdate,
}: AppointmentDetailsProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === "pt-BR" ? "pt-BR" : "es-ES";

  // Core state
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showNoShowDialog, setShowNoShowDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Dialog states
  const [showStartSessionDialog, setShowStartSessionDialog] = useState(false);
  const [showCompleteSessionDialog, setShowCompleteSessionDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showViewBabyDialog, setShowViewBabyDialog] = useState(false);
  const [showRegisterPaymentDialog, setShowRegisterPaymentDialog] = useState(false);
  const [showInstallmentPaymentDialog, setShowInstallmentPaymentDialog] = useState(false);

  // Reschedule state
  const [rescheduleDate, setRescheduleDate] = useState<string>("");
  const [rescheduleTime, setRescheduleTime] = useState<string>("");
  const [rescheduleError, setRescheduleError] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Baby details state
  const [babyDetails, setBabyDetails] = useState<BabyDetails | null>(null);
  const [isLoadingBaby, setIsLoadingBaby] = useState(false);

  // Package editing state
  const [isEditingPackage, setIsEditingPackage] = useState(false);
  const [isSavingPackage, setIsSavingPackage] = useState(false);
  const [catalogPackages, setCatalogPackages] = useState<PackageData[]>([]);
  const [babyPackages, setBabyPackages] = useState<PackagePurchaseData[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [packageError, setPackageError] = useState<string | null>(null);

  // Payment status
  const [installmentPaymentStatus, setInstallmentPaymentStatus] = useState<PaymentStatus | null>(null);

  // Baby Card info
  const [babyCardInfo, setBabyCardInfo] = useState<BabyCardCheckoutInfo | null>(null);
  const [loadingBabyCardInfo, setLoadingBabyCardInfo] = useState(false);

  // Reset package editing state when modal closes
  useEffect(() => {
    if (!open) {
      setIsEditingPackage(false);
      setIsSavingPackage(false);
      setCatalogPackages([]);
      setBabyPackages([]);
      setSelectedPackageId(null);
      setSelectedPurchaseId(null);
      setPackageError(null);
    }
  }, [open]);

  // Reset when appointment changes
  useEffect(() => {
    setIsEditingPackage(false);
    setIsSavingPackage(false);
    setCatalogPackages([]);
    setBabyPackages([]);
    setSelectedPackageId(null);
    setSelectedPurchaseId(null);
    setPackageError(null);
    setBabyCardInfo(null);
  }, [appointment?.id]);

  // Fetch Baby Card info
  useEffect(() => {
    if (!open || !appointment?.baby?.id) {
      setBabyCardInfo(null);
      return;
    }

    const fetchBabyCardInfo = async () => {
      setLoadingBabyCardInfo(true);
      try {
        const response = await fetch(`/api/checkout/baby-card-info/${appointment.baby!.id}`);
        if (response.ok) {
          const data = await response.json();
          setBabyCardInfo(data);
        }
      } catch (error) {
        console.error("Error fetching baby card info:", error);
      } finally {
        setLoadingBabyCardInfo(false);
      }
    };

    fetchBabyCardInfo();
  }, [open, appointment?.baby?.id]);

  // Calculate installment payment status (narrow dependency to packagePurchase identity)
  const packagePurchaseId = appointment?.packagePurchase?.id;
  const packagePurchasePaidAmount = appointment?.packagePurchase?.paidAmount;
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

      setInstallmentPaymentStatus(status.overdueAmount > 0 ? status : null);
    } else {
      setInstallmentPaymentStatus(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only recalculate when purchase identity or payment amount changes
  }, [packagePurchaseId, packagePurchasePaidAmount]);

  // Generate available dates for rescheduling
  const availableDates = useMemo(() => {
    const dates: { value: string; label: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();

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
        return hours > currentHour || (hours === currentHour && minutes > currentMinutes);
      });
      setAvailableSlots(filteredSlots);
    } else {
      setAvailableSlots(slots);
    }
    setRescheduleTime("");
    setRescheduleError("");
  }, [rescheduleDate]);

  if (!appointment) return null;

  // Determine appointment type and client info
  const isParentAppointment = !appointment.babyId && appointment.parentId && appointment.parent;
  const primaryParent = !isParentAppointment
    ? appointment.baby?.parents?.find((p) => p.isPrimary)?.parent || null
    : null;
  const statusInfo = statusConfig[appointment.status];

  // Format date
  const formattedDate = formatDateForDisplay(appointment.date, dateLocale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Permission checks
  const canStart = appointment.status === "SCHEDULED";
  const canComplete = appointment.status === "IN_PROGRESS";
  const canCancel = ["SCHEDULED", "IN_PROGRESS", "PENDING_PAYMENT"].includes(appointment.status);
  const canMarkNoShow = appointment.status === "SCHEDULED";
  const canReschedule = appointment.status === "SCHEDULED" || appointment.status === "PENDING_PAYMENT";
  const canRegisterPayment = appointment.status === "PENDING_PAYMENT" || appointment.status === "SCHEDULED";

  // Action handlers - wrapped in useCallback since passed to child components
  const handleAction = useCallback(async (action: string, reason?: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });

      if (response.ok) {
        onUpdate?.();
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
  }, [appointment.id, onUpdate, onOpenChange]);

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) return;

    setIsUpdating(true);
    setRescheduleError("");

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: rescheduleDate, startTime: rescheduleTime }),
      });

      const data = await response.json();

      if (response.ok) {
        onUpdate?.();
        setShowRescheduleDialog(false);
        onOpenChange(false);
        setRescheduleDate("");
        setRescheduleTime("");
      } else {
        setRescheduleError(data.error || "UNKNOWN_ERROR");
      }
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      setRescheduleError("UNKNOWN_ERROR");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewBaby = async () => {
    if (!appointment.baby) return;
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

  const handleEditPackage = async () => {
    setIsLoadingPackages(true);
    setPackageError(null);

    if (appointment.packagePurchase) {
      setSelectedPurchaseId(appointment.packagePurchase.id);
      setSelectedPackageId(appointment.packagePurchase.package.id);
    } else if (appointment.selectedPackage) {
      setSelectedPackageId(appointment.selectedPackage.id);
      setSelectedPurchaseId(null);
    }

    try {
      const promises: Promise<Response>[] = [fetch("/api/packages?active=true&publicOnly=true")];
      if (appointment.baby) {
        promises.unshift(fetch(`/api/babies/${appointment.baby.id}/packages`));
      }

      const responses = await Promise.all(promises);
      const babyPkgRes = appointment.baby ? responses[0] : null;
      const catalogRes = appointment.baby ? responses[1] : responses[0];

      if (babyPkgRes && babyPkgRes.ok) {
        const data = await babyPkgRes.json();
        setBabyPackages((data.packages || []).filter((p: PackagePurchaseData) => p.remainingSessions > 0));
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

  // Get schedule preferences text
  const schedulePreferencesText = (() => {
    const prefsJson = appointment?.packagePurchase?.schedulePreferences || appointment?.pendingSchedulePreferences;
    if (!prefsJson) return null;
    const prefs = parseSchedulePreferences(prefsJson);
    return prefs.length > 0 ? formatPreferencesText(prefs, locale) : null;
  })();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-white/50 bg-white/95 p-0 backdrop-blur-md">
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
            {/* Client header */}
            <ClientHeader
              appointment={appointment}
              isParentAppointment={!!isParentAppointment}
              primaryParent={primaryParent}
              isLoadingBaby={isLoadingBaby}
              onViewBaby={handleViewBaby}
            />

            {/* Date/Time + Package row */}
            <DateTimePackageRow
              appointment={appointment}
              formattedDate={formattedDate}
              installmentPaymentStatus={installmentPaymentStatus}
              isLoadingPackages={isLoadingPackages}
              onEditPackage={handleEditPackage}
            />

            {/* Therapist info - shown when session is active */}
            {appointment.session?.therapist?.name && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                  {appointment.session.therapist.name.charAt(0)}
                </div>
                <span className="text-gray-500">{t("session.therapist")}:</span>
                <span className="font-medium text-blue-700">{appointment.session.therapist.name}</span>
              </div>
            )}

            {/* Package editor */}
            {isEditingPackage && (
              <PackageEditor
                appointment={appointment}
                catalogPackages={catalogPackages}
                babyPackages={babyPackages}
                selectedPackageId={selectedPackageId}
                selectedPurchaseId={selectedPurchaseId}
                isSaving={isSavingPackage}
                error={packageError}
                onSelectPackage={(pkgId, purchaseId) => {
                  setSelectedPackageId(pkgId);
                  setSelectedPurchaseId(purchaseId);
                }}
                onSave={handleSavePackage}
                onCancel={() => {
                  setIsEditingPackage(false);
                  setPackageError(null);
                }}
              />
            )}

            {/* Schedule preferences */}
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

            {/* Installment payment alert */}
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

            {/* Baby Card section */}
            {!isParentAppointment && appointment.baby && (
              <BabyCardSection
                babyName={appointment.baby.name}
                babyCardInfo={babyCardInfo}
                loading={loadingBabyCardInfo}
              />
            )}

            {/* Registered Payments */}
            <PaymentsSection
              appointmentId={appointment.id}
              onPaymentVoided={onUpdate}
              canRegisterPayment={canRegisterPayment}
              onRegisterPayment={() => setShowRegisterPaymentDialog(true)}
              packagePrice={Number(appointment.packagePurchase?.package?.basePrice || appointment.selectedPackage?.basePrice || 0)}
            />

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
                <p className="text-sm font-medium text-rose-600">{t("calendar.cancelReason")}</p>
                <p className="mt-1 text-rose-700">{appointment.cancelReason}</p>
              </div>
            )}

            {/* Actions */}
            <AppointmentActions
              canStart={canStart}
              canComplete={canComplete}
              canCancel={canCancel}
              canMarkNoShow={canMarkNoShow}
              canReschedule={canReschedule}
              hasSessionId={!!appointment.session?.id}
              isUpdating={isUpdating}
              onStart={() => setShowStartSessionDialog(true)}
              onComplete={() => setShowCompleteSessionDialog(true)}
              onCancel={() => setShowCancelDialog(true)}
              onNoShow={() => setShowNoShowDialog(true)}
              onReschedule={() => setShowRescheduleDialog(true)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialogs */}
      <CancelDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        cancelReason={cancelReason}
        onCancelReasonChange={setCancelReason}
        onConfirm={() => handleAction("cancel", cancelReason)}
        isUpdating={isUpdating}
      />

      <NoShowDialog
        open={showNoShowDialog}
        onOpenChange={setShowNoShowDialog}
        onConfirm={() => handleAction("no-show")}
        isUpdating={isUpdating}
      />

      {/* Reschedule dialog */}
      <RescheduleDialog
        open={showRescheduleDialog}
        onOpenChange={setShowRescheduleDialog}
        rescheduleDate={rescheduleDate}
        rescheduleTime={rescheduleTime}
        rescheduleError={rescheduleError}
        availableDates={availableDates}
        availableSlots={availableSlots}
        isUpdating={isUpdating}
        onDateChange={setRescheduleDate}
        onTimeChange={setRescheduleTime}
        onReschedule={handleReschedule}
        onCancel={() => {
          setShowRescheduleDialog(false);
          setRescheduleDate("");
          setRescheduleTime("");
          setRescheduleError("");
        }}
      />

      {/* Start session dialog */}
      {appointment && (appointment.baby || isParentAppointment) && (
        <StartSessionDialog
          open={showStartSessionDialog}
          onOpenChange={setShowStartSessionDialog}
          appointmentId={appointment.id}
          babyId={appointment.baby?.id}
          babyName={appointment.baby?.name}
          parentId={appointment.parent?.id}
          parentName={appointment.parent?.name}
          startTime={appointment.startTime}
          preselectedPurchaseId={appointment.packagePurchaseId || undefined}
          preselectedCatalogPackageId={
            !appointment.packagePurchaseId && appointment.selectedPackage?.id
              ? appointment.selectedPackage.id
              : undefined
          }
          preselectedCategoryId={
            appointment.packagePurchase?.package?.categoryId ||
            appointment.selectedPackage?.categoryId ||
            undefined
          }
          onSuccess={() => {
            onUpdate?.();
            onOpenChange(false);
          }}
        />
      )}

      {/* Complete session dialog */}
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
