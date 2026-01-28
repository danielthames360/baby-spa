"use client";

import React, { useEffect, useState, useCallback, useRef, useLayoutEffect } from "react";
import { useTranslations, useLocale } from "next-intl";

// Hook for mobile fullscreen modal (iOS Safari compatible)
function useMobileViewport() {
  const [styles, setStyles] = useState<{ height?: number; isMobile: boolean }>({ isMobile: false });

  useLayoutEffect(() => {
    function update() {
      const isMobile = window.innerWidth < 640;
      // Use visualViewport for most accurate height (handles iOS Safari toolbar)
      const height = window.visualViewport?.height ?? window.innerHeight;
      setStyles({ height, isMobile });
    }

    update();

    // visualViewport is the most reliable for iOS Safari
    const viewport = window.visualViewport;
    if (viewport) {
      viewport.addEventListener('resize', update);
      viewport.addEventListener('scroll', update);
    }
    window.addEventListener('orientationchange', update);

    return () => {
      if (viewport) {
        viewport.removeEventListener('resize', update);
        viewport.removeEventListener('scroll', update);
      }
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return styles;
}
import {
  Calendar,
  CalendarClock,
  Clock,
  Baby,
  Plus,
  AlertTriangle,
  AlertCircle,
  Phone,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Package,
  X,
  CreditCard,
  Download,
  QrCode,
  UserRound,
  Sparkles,
  Gift,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import { formatLocalDateString, formatDateForDisplay } from "@/lib/utils/date-utils";
import {
  PackageSelector,
  type PackageData,
  type PackagePurchaseData,
  type SpecialPriceInfo,
} from "@/components/packages/package-selector";
import confetti from "canvas-confetti";
import { SchedulePreferenceSelector } from "@/components/appointments/schedule-preference-selector";
import { SchedulePreference } from "@/lib/types/scheduling";

export interface BabyPackage {
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
}

export interface ScheduleBabyData {
  id: string;
  name: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  totalRemainingSessions: number;
  packages: BabyPackage[];
}

// Alias for internal use
type BabyData = ScheduleBabyData;

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  baby?: {
    id: string;
    name: string;
    gender: "MALE" | "FEMALE" | "OTHER";
  } | null;
  parent?: {
    id: string;
    name: string;
  } | null;
  therapist: {
    name: string;
  } | null;
  packagePurchase: {
    id: string;
    package: {
      name: string;
    };
  } | null;
  selectedPackage: {
    id: string;
    name: string;
    advancePaymentAmount?: string | number | null;
  } | null;
}

// Parent info for self-appointments
export interface ParentInfo {
  id: string;
  name: string;
  pregnancyWeeks?: number | null;
  totalRemainingSessions: number;
  packages: BabyPackage[];
}

interface TimeSlot {
  time: string;
  available: boolean;
  remaining: number;
}

// Constants moved outside component to prevent re-creation on each render
const STATUS_BADGE_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-orange-100 text-orange-700",
  SCHEDULED: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-700",
  NO_SHOW: "bg-rose-100 text-rose-700",
};

export function PortalAppointments() {
  const t = useTranslations();
  const locale = useLocale();

  // Mobile viewport handling for payment dialog (iOS Safari compatible)
  const { height: paymentDialogHeight, isMobile: isPaymentDialogMobile } = useMobileViewport();

  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [babies, setBabies] = useState<BabyData[]>([]);
  const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null);
  const [canSchedule, setCanSchedule] = useState(true);
  const [requiresPrepayment, setRequiresPrepayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  // Payment instructions dialog state
  const [showPaymentInstructionsDialog, setShowPaymentInstructionsDialog] = useState(false);
  const [selectedAppointmentForPayment, setSelectedAppointmentForPayment] = useState<Appointment | null>(null);
  const [paymentSettingsForDialog, setPaymentSettingsForDialog] = useState<PaymentSettings | null>(null);
  const [loadingPaymentSettings, setLoadingPaymentSettings] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/portal/appointments");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setUpcoming(data.upcoming);
      setPast(data.past);
      setBabies(data.babies);
      setParentInfo(data.parentInfo);
      setCanSchedule(data.canSchedule);
      setRequiresPrepayment(data.requiresPrepayment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Use formatDateForDisplay to avoid timezone shift
    // Database dates are UTC, toLocaleDateString would shift them in negative UTC offsets
    return formatDateForDisplay(dateString, locale === "pt-BR" ? "pt-BR" : "es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_BADGE_STYLES[status] || STATUS_BADGE_STYLES.SCHEDULED)}>
        {t(`portal.appointments.status.${status}`)}
      </span>
    );
  };

  // All active babies can schedule (package is selected during booking flow)
  const canScheduleBabies = babies;

  // Can schedule if there are babies OR parent can schedule for themselves
  const hasSchedulingOptions = canScheduleBabies.length > 0 || (parentInfo && parentInfo.id);

  // Handle viewing payment instructions
  const handleViewPaymentInstructions = async (appointment: Appointment) => {
    setSelectedAppointmentForPayment(appointment);
    setLoadingPaymentSettings(true);
    setShowPaymentInstructionsDialog(true);

    try {
      const response = await fetch("/api/settings/payment");
      if (response.ok) {
        const data = await response.json();
        setPaymentSettingsForDialog(data.settings);
      }
    } catch (error) {
      console.error("Error fetching payment settings:", error);
    } finally {
      setLoadingPaymentSettings(false);
    }
  };

  // Generate WhatsApp URL for payment instructions dialog
  const getWhatsAppUrlForDialog = () => {
    if (!paymentSettingsForDialog?.whatsappNumber || !selectedAppointmentForPayment) return "";

    const countryCode = (paymentSettingsForDialog.whatsappCountryCode || "+591").replace("+", "");
    const phone = countryCode + paymentSettingsForDialog.whatsappNumber.replace(/\D/g, "");

    const advanceAmount = selectedAppointmentForPayment.selectedPackage?.advancePaymentAmount
      ? parseFloat(selectedAppointmentForPayment.selectedPackage.advancePaymentAmount.toString())
      : 0;

    let message = paymentSettingsForDialog.whatsappMessage || "";
    message = message
      .replace("{fecha}", formatDateForDisplay(selectedAppointmentForPayment.date, locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
      }))
      .replace("{hora}", selectedAppointmentForPayment.startTime)
      .replace("{bebe}", selectedAppointmentForPayment.baby?.name || selectedAppointmentForPayment.parent?.name || "")
      .replace("{monto}", advanceAmount.toString());

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  // Download QR for dialog (with Web Share API for mobile gallery save)
  const handleDownloadQrDialog = async () => {
    if (!paymentSettingsForDialog?.paymentQrImage) return;

    try {
      // Convert base64 to blob for sharing
      const response = await fetch(paymentSettingsForDialog.paymentQrImage);
      const blob = await response.blob();
      const file = new File([blob], "QR-Pago-BabySpa.png", { type: "image/png" });

      // Only use Web Share API on mobile (avoid Windows share dialog on desktop)
      const isMobileDevice = window.innerWidth < 640 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobileDevice && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "QR Pago Baby Spa",
        });
        return;
      }
    } catch (error) {
      console.log("Share cancelled or failed, using download fallback");
    }

    // Fallback: direct download (used on desktop or when share fails)
    const link = document.createElement("a");
    link.href = paymentSettingsForDialog.paymentQrImage;
    link.download = "QR-Pago-BabySpa.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-200">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {t("portal.appointments.title")}
            </h1>
            <p className="text-sm text-gray-500">
              {t("portal.appointments.subtitle")}
            </p>
          </div>
        </div>

        {canSchedule && hasSchedulingOptions && (
          <Button
            onClick={() => setShowScheduleDialog(true)}
            className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-200 hover:from-teal-600 hover:to-cyan-600"
          >
            <Plus className="h-4 w-4" />
            {t("portal.appointments.scheduleNew")}
          </Button>
        )}
      </div>

      {/* Prepayment Warning */}
      {requiresPrepayment && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800">
                {t("portal.appointments.cannotSchedule")}
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                {t("portal.appointments.contactReception")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
              asChild
            >
              <a href="https://wa.me/59170000000" target="_blank" rel="noopener noreferrer">
                <Phone className="mr-2 h-4 w-4" />
                {t("portal.prepayment.contact")}
              </a>
            </Button>
          </div>
        </div>
      )}


      {/* Upcoming Appointments */}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-700">
          <Clock className="h-5 w-5 text-teal-500" />
          {t("portal.appointments.upcoming")}
        </h2>

        {upcoming.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-gray-500">{t("portal.appointments.noUpcoming")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                formatDate={formatDate}
                getStatusBadge={getStatusBadge}
                onViewPaymentInstructions={handleViewPaymentInstructions}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past Appointments */}
      {past.length > 0 && (
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-700">
            <CheckCircle className="h-5 w-5 text-gray-400" />
            {t("portal.appointments.past")}
          </h2>
          <div className="space-y-3">
            {past.slice(0, 10).map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} formatDate={formatDate} getStatusBadge={getStatusBadge} isPast />
            ))}
          </div>
        </div>
      )}

      {/* Schedule Dialog */}
      <ScheduleDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        babies={canScheduleBabies}
        parentInfo={parentInfo}
        onSuccess={() => {
          setShowScheduleDialog(false);
          fetchData();
        }}
      />

      {/* Payment Instructions Dialog - Mobile responsive */}
      <Dialog open={showPaymentInstructionsDialog} onOpenChange={setShowPaymentInstructionsDialog}>
        <DialogContent
          showCloseButton={false}
          className="flex w-full max-w-full flex-col gap-0 rounded-none border-0 bg-white/95 p-0 backdrop-blur-md sm:h-auto sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl sm:border sm:border-white/50"
          style={paymentDialogHeight && isPaymentDialogMobile ? { height: paymentDialogHeight, maxHeight: paymentDialogHeight } : undefined}
        >
          {/* Header - Fixed */}
          <div className="shrink-0 border-b border-gray-100 px-6 py-4 sm:rounded-t-2xl">
            <DialogHeader className="p-0">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                <CreditCard className="h-5 w-5 text-orange-600" />
                {t("payment.required")}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                {selectedAppointmentForPayment?.selectedPackage?.name}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {loadingPaymentSettings ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
              </div>
            ) : (
              <>
                {/* Amount */}
                <div className="text-center">
                  <p className="text-sm text-gray-500">{t("payment.advanceRequired")}</p>
                  <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-orange-50 px-6 py-3 text-xl font-bold text-orange-700">
                    <span>Bs.</span>
                    <span>
                      {selectedAppointmentForPayment?.selectedPackage?.advancePaymentAmount
                        ? parseFloat(selectedAppointmentForPayment.selectedPackage.advancePaymentAmount.toString())
                        : 0}
                    </span>
                  </div>
                </div>

                {/* QR Code */}
                {paymentSettingsForDialog?.paymentQrImage && (
                  <div className="space-y-3">
                    <p className="text-center text-sm font-medium text-gray-600">
                      {t("payment.scanQr")}
                    </p>
                    <div className="mx-auto w-44 h-44 rounded-xl border-2 border-teal-200 bg-white p-2 shadow-lg">
                      <img
                        src={paymentSettingsForDialog.paymentQrImage}
                        alt="QR Code"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <button
                      onClick={handleDownloadQrDialog}
                      className="mx-auto flex items-center justify-center gap-2 rounded-xl border-2 border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-700 transition-all hover:bg-teal-50"
                    >
                      <Download className="h-4 w-4" />
                      {t("payment.downloadQr")}
                    </button>
                  </div>
                )}

                {/* WhatsApp Button */}
                {paymentSettingsForDialog?.whatsappNumber && (
                  <a
                    href={getWhatsAppUrlForDialog()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-600"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    {t("payment.sendWhatsapp")}
                  </a>
                )}

                {/* Appointment Summary */}
                {selectedAppointmentForPayment && (
                  <div className="rounded-xl bg-gray-50 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {selectedAppointmentForPayment.baby ? t("common.baby") : t("common.client")}:
                      </span>
                      <span className="font-medium text-gray-800">
                        {selectedAppointmentForPayment.baby?.name || selectedAppointmentForPayment.parent?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("common.date")}:</span>
                      <span className="font-medium text-gray-800">{formatDate(selectedAppointmentForPayment.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("common.time")}:</span>
                      <span className="font-medium text-gray-800">{selectedAppointmentForPayment.startTime}</span>
                    </div>
                  </div>
                )}

                {/* Info message */}
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      {t("payment.confirmationPending")}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer - Fixed */}
          <div className="shrink-0 border-t border-gray-100 bg-white px-6 py-4 sm:rounded-b-2xl">
            <Button
              onClick={() => setShowPaymentInstructionsDialog(false)}
              className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-200"
            >
              {t("payment.understood")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface AppointmentCardProps {
  appointment: Appointment;
  formatDate: (date: string) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  isPast?: boolean;
  onViewPaymentInstructions?: (appointment: Appointment) => void;
}

function AppointmentCard({ appointment, formatDate, getStatusBadge, isPast, onViewPaymentInstructions }: AppointmentCardProps) {
  const t = useTranslations();
  const getGenderColor = (gender: string) => {
    switch (gender) {
      case "MALE": return "from-sky-400 to-blue-500";
      case "FEMALE": return "from-rose-400 to-pink-500";
      default: return "from-teal-400 to-cyan-500";
    }
  };

  const isPendingPayment = appointment.status === "PENDING_PAYMENT";
  const advanceAmount = appointment.selectedPackage?.advancePaymentAmount
    ? parseFloat(appointment.selectedPackage.advancePaymentAmount.toString())
    : null;

  // Determine if this is a parent appointment
  const isParentAppointment = !appointment.baby && !!appointment.parent;
  const clientName = appointment.baby?.name || appointment.parent?.name || "";

  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all",
      isPast
        ? "border-gray-100 bg-gray-50/50"
        : isPendingPayment
          ? "border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50"
          : "border-teal-100 bg-gradient-to-r from-white to-teal-50/30 hover:shadow-md"
    )}>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-md",
            isPast
              ? "bg-gray-300"
              : isParentAppointment
                ? "bg-gradient-to-br from-rose-400 to-pink-500"
                : `bg-gradient-to-br ${getGenderColor(appointment.baby?.gender || "OTHER")}`
          )}
        >
          {isParentAppointment ? (
            <UserRound className="h-6 w-6" />
          ) : (
            clientName.charAt(0)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-800">{clientName}</h3>
            {isParentAppointment && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                {t("calendar.clientType.parent")}
              </span>
            )}
            {getStatusBadge(appointment.status)}
            {/* Package badge */}
            {appointment.packagePurchase ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                <Package className="h-3 w-3" />
                {appointment.packagePurchase.package.name}
              </span>
            ) : appointment.selectedPackage ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                <Package className="h-3 w-3" />
                {appointment.selectedPackage.name}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">
                <Package className="h-3 w-3" />
                {t("portal.appointments.provisional")}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(appointment.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {appointment.startTime}
            </span>
          </div>
        </div>
      </div>

      {/* Pending Payment Info */}
      {isPendingPayment && (
        <div className="mt-3 pt-3 border-t border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">
                {t("payment.advanceRequired")}: <span className="font-bold">Bs. {advanceAmount}</span>
              </span>
            </div>
            <button
              onClick={() => onViewPaymentInstructions?.(appointment)}
              className="flex items-center gap-1 rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-200"
            >
              <QrCode className="h-3.5 w-3.5" />
              {t("payment.viewPaymentInstructions")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Wizard step type - 'client' is for choosing baby vs self (parent)
type WizardStep = 'client' | 'baby' | 'package' | 'preferences' | 'datetime' | 'payment' | 'success';

// Client type for appointment
type ClientType = 'baby' | 'self';

// Payment settings interface
interface PaymentSettings {
  paymentQrImage: string | null;
  whatsappNumber: string | null;
  whatsappCountryCode: string | null;
  whatsappMessage: string | null;
}

// Baby Card checkout info for portal
interface BabyCardPortalInfo {
  hasActiveCard: boolean;
  purchase: {
    id: string;
    babyCardName: string;
    completedSessions: number;
    totalSessions: number;
    progressPercent: number;
  } | null;
  nextReward: {
    id: string;
    displayName: string;
    displayIcon: string | null;
    sessionNumber: number;
    sessionsUntilUnlock: number;
  } | null;
  // Reward for the next session (triggers confetti)
  rewardForNextSession: {
    id: string;
    displayName: string;
    displayIcon: string | null;
    sessionNumber: number;
  } | null;
  specialPrices: SpecialPriceInfo[];
}

export interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babies: ScheduleBabyData[];
  parentInfo?: ParentInfo | null; // Parent info for self-appointments
  onSuccess: () => void;
  preselectedBabyId?: string; // Optional: pre-select a baby (e.g., from dashboard)
}

export function ScheduleDialog({ open, onOpenChange, babies, parentInfo, onSuccess, preselectedBabyId }: ScheduleDialogProps) {
  const t = useTranslations();

  // Mobile viewport handling (iOS Safari compatible)
  const { height: viewportHeight, isMobile } = useMobileViewport();

  // Wizard state
  const [step, setStep] = useState<WizardStep>('client');
  const [clientType, setClientType] = useState<ClientType | null>(null);
  const [selectedBaby, setSelectedBaby] = useState<BabyData | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [catalogPackages, setCatalogPackages] = useState<PackageData[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Schedule preferences step state
  const [wantsFixedSchedule, setWantsFixedSchedule] = useState<boolean | null>(null);
  const [schedulePreferences, setSchedulePreferences] = useState<SchedulePreference[]>([]);
  const [autoScheduling, setAutoScheduling] = useState(false);

  // Payment step state
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState<number | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [loadingPaymentSettings, setLoadingPaymentSettings] = useState(false);

  // Animation trigger for button
  const [buttonAnimated, setButtonAnimated] = useState(false);

  // Baby Card info state
  const [babyCardInfo, setBabyCardInfo] = useState<BabyCardPortalInfo | null>(null);
  const [loadingBabyCardInfo, setLoadingBabyCardInfo] = useState(false);
  // Track if this session will unlock a reward (calculated when cita is confirmed)
  const [unlockedReward, setUnlockedReward] = useState<{
    displayName: string;
    displayIcon: string | null;
  } | null>(null);

  // Ref for scrollable container (auto-scroll on mobile)
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch package catalog for PackageSelector - filtered by service type
  const fetchCatalog = useCallback(async (serviceType: "BABY" | "PARENT" = "BABY") => {
    setLoadingCatalog(true);
    try {
      const response = await fetch(`/api/packages?active=true&publicOnly=true&serviceType=${serviceType}`);
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

  // Fetch Baby Card info for the selected baby
  const fetchBabyCardInfo = useCallback(async (babyId: string) => {
    setLoadingBabyCardInfo(true);
    try {
      const response = await fetch(`/api/portal/baby-card/${babyId}`);
      const data = await response.json();
      if (response.ok && data.hasActiveCard) {
        setBabyCardInfo(data);
      } else {
        setBabyCardInfo(null);
      }
    } catch (error) {
      console.error("Error fetching baby card info:", error);
      setBabyCardInfo(null);
    } finally {
      setLoadingBabyCardInfo(false);
    }
  }, []);

  // Trigger confetti celebration
  const triggerConfetti = useCallback(() => {
    const duration = 1000;
    const end = Date.now() + duration;

    const colors = ["#8b5cf6", "#a855f7", "#d946ef", "#f472b6", "#fbbf24"];

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  // Initialize wizard when dialog opens
  useEffect(() => {
    if (open) {
      const hasBabies = babies.length > 0;
      const hasParentServices = !!parentInfo?.id;

      // If preselectedBabyId is provided, use that (skip client step)
      if (preselectedBabyId && hasBabies) {
        const baby = babies.find(b => b.id === preselectedBabyId);
        if (baby) {
          setClientType('baby');
          setSelectedBaby(baby);
          if (baby.packages.length === 1) {
            setSelectedPurchaseId(baby.packages[0].id);
            setSelectedPackageId(baby.packages[0].package.id);
          }
          setStep('package');
          fetchCatalog("BABY");
          return;
        }
      }

      // Determine the starting step based on available options
      if (hasBabies && hasParentServices) {
        // Has both options - show client selection
        setStep('client');
      } else if (hasBabies && !hasParentServices) {
        // Only babies - skip client step
        setClientType('baby');
        if (babies.length === 1) {
          const baby = babies[0];
          setSelectedBaby(baby);
          if (baby.packages.length === 1) {
            setSelectedPurchaseId(baby.packages[0].id);
            setSelectedPackageId(baby.packages[0].package.id);
          }
          setStep('package');
          fetchCatalog("BABY");
        } else {
          setStep('baby');
        }
      } else if (!hasBabies && hasParentServices) {
        // Only parent services - skip client step, go to package
        setClientType('self');
        if (parentInfo?.packages && parentInfo.packages.length === 1) {
          setSelectedPurchaseId(parentInfo.packages[0].id);
          setSelectedPackageId(parentInfo.packages[0].package.id);
        }
        setStep('package');
        fetchCatalog("PARENT");
      } else {
        // Neither - start at client step (will show message)
        setStep('client');
      }
    }
  }, [open, babies, parentInfo, preselectedBabyId, fetchCatalog]);

  // Fetch catalog when package step is reached
  useEffect(() => {
    if (step === 'package' && catalogPackages.length === 0 && clientType) {
      fetchCatalog(clientType === 'self' ? "PARENT" : "BABY");
    }
  }, [step, fetchCatalog, catalogPackages.length, clientType]);

  // Fetch Baby Card info when a baby is selected
  useEffect(() => {
    if (clientType === 'baby' && selectedBaby) {
      fetchBabyCardInfo(selectedBaby.id);
    } else {
      setBabyCardInfo(null);
    }
  }, [clientType, selectedBaby, fetchBabyCardInfo]);

  // Calculate if the next session has a reward (for confetti)
  const calculateUnlockedReward = useCallback(() => {
    if (!babyCardInfo?.hasActiveCard || !babyCardInfo.purchase) return null;

    // Use rewardForNextSession which is pre-calculated by the API
    // This is the reward at session (completedSessions + 1) if any
    if (babyCardInfo.rewardForNextSession) {
      return {
        displayName: babyCardInfo.rewardForNextSession.displayName,
        displayIcon: babyCardInfo.rewardForNextSession.displayIcon,
      };
    }

    return null;
  }, [babyCardInfo]);

  // Generate next 14 days
  const getAvailableDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Skip Sundays
      if (date.getDay() !== 0) {
        dates.push(date);
      }
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  // Find the next date matching a specific day of week (0=Sunday, 1=Monday, etc.)
  const findNextMatchingDate = (dayOfWeek: number): Date => {
    const today = new Date();
    const currentDay = today.getDay();
    let daysToAdd = dayOfWeek - currentDay;

    // If the target day is today or has passed this week, go to next week
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    return nextDate;
  };

  // Auto-schedule appointment based on first preference
  const autoScheduleFromPreferences = async (): Promise<boolean> => {
    const isParentAppointment = clientType === 'self';
    if (!isParentAppointment && !selectedBaby) return false;
    if (schedulePreferences.length === 0) return false;
    if (!selectedPurchaseId && !selectedPackageId) return false;

    setAutoScheduling(true);
    setSubmitError(null);

    const firstPref = schedulePreferences[0];
    const targetDate = findNextMatchingDate(firstPref.dayOfWeek);
    const targetTime = firstPref.time;

    try {
      // Check if slot is available
      const dateStr = formatLocalDateString(targetDate);
      const availabilityResponse = await fetch(`/api/portal/appointments/availability?date=${dateStr}`);
      const availabilityData = await availabilityResponse.json();

      if (!availabilityData.available) {
        // Date is closed, show error and go to datetime step
        setSubmitError(t("portal.appointments.errors.autoScheduleFailed"));
        setAutoScheduling(false);
        return false;
      }

      // Find the matching slot
      const slot = availabilityData.slots?.find((s: TimeSlot) => s.time === targetTime);
      if (!slot || !slot.available) {
        // Slot not available at that time, show error and go to datetime step
        setSubmitError(t("portal.appointments.errors.autoScheduleSlotFull"));
        setAutoScheduling(false);
        return false;
      }

      // Slot is available! Auto-submit the appointment
      const response = await fetch("/api/portal/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isParentAppointment ? { forSelf: true } : { babyId: selectedBaby!.id }),
          packagePurchaseId: selectedPurchaseId,
          packageId: selectedPackageId,
          date: dateStr,
          startTime: targetTime,
          schedulePreferences: schedulePreferences,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error === "Baby already has an appointment at this time") {
          setSubmitError(t("portal.appointments.errors.babyHasAppointment"));
        } else if (data.error === "Time slot is full") {
          setSubmitError(t("portal.appointments.errors.slotFull"));
        } else {
          setSubmitError(t("portal.appointments.errors.generic"));
        }
        setAutoScheduling(false);
        return false;
      }

      const data = await response.json();

      // Set the date and time for display in success/payment screens
      setSelectedDate(targetDate);
      setSelectedTime(targetTime);

      // Check if payment is required
      if (data.requiresAdvancePayment && data.advancePaymentAmount) {
        setRequiresPayment(true);
        setAdvanceAmount(data.advancePaymentAmount);
        await fetchPaymentSettings();
        setStep('payment');
      } else {
        // Calculate if this session unlocks a reward
        const reward = calculateUnlockedReward();
        setUnlockedReward(reward);
        if (reward) {
          // Delay confetti slightly for dramatic effect
          setTimeout(() => triggerConfetti(), 300);
        }
        setStep('success');
      }

      setAutoScheduling(false);
      return true;
    } catch (error) {
      console.error("Error auto-scheduling:", error);
      setSubmitError(t("portal.appointments.errors.generic"));
      setAutoScheduling(false);
      return false;
    }
  };

  // Fetch slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchSlots();
    }
  }, [selectedDate]);

  // Scroll to top when entering payment step
  useEffect(() => {
    if (step === 'payment') {
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [step]);

  const fetchSlots = async () => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    try {
      const dateStr = formatLocalDateString(selectedDate);
      const response = await fetch(`/api/portal/appointments/availability?date=${dateStr}`);
      const data = await response.json();
      if (data.available) {
        setAvailableSlots(data.slots);
      } else {
        setAvailableSlots([]);
      }
      // Auto-scroll to show time slots on mobile
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async () => {
    // Must have date, time, and package selected
    // For baby appointments, must have baby selected
    // For self appointments, clientType must be 'self'
    const isParentAppointment = clientType === 'self';
    if (!isParentAppointment && !selectedBaby) return;
    if (!selectedDate || !selectedTime) return;
    if (!selectedPurchaseId && !selectedPackageId) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/portal/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isParentAppointment ? { forSelf: true } : { babyId: selectedBaby!.id }),
          packagePurchaseId: selectedPurchaseId, // null if new package from catalog
          packageId: selectedPackageId, // For displaying package info (provisional)
          date: formatLocalDateString(selectedDate),
          startTime: selectedTime,
          schedulePreferences: wantsFixedSchedule ? schedulePreferences : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        // Map API errors to user-friendly messages
        if (data.error === "Baby already has an appointment at this time") {
          setSubmitError(t("portal.appointments.errors.babyHasAppointment"));
        } else if (data.error === "Time slot is full") {
          setSubmitError(t("portal.appointments.errors.slotFull"));
        } else {
          setSubmitError(t("portal.appointments.errors.generic"));
        }
        return;
      }

      const data = await response.json();

      // Check if payment is required
      if (data.requiresAdvancePayment && data.advancePaymentAmount) {
        setRequiresPayment(true);
        setAdvanceAmount(data.advancePaymentAmount);
        // Fetch payment settings for QR and WhatsApp
        await fetchPaymentSettings();
        setStep('payment');
      } else {
        // Calculate if this session unlocks a reward
        const reward = calculateUnlockedReward();
        setUnlockedReward(reward);
        if (reward) {
          // Delay confetti slightly for dramatic effect
          setTimeout(() => triggerConfetti(), 300);
        }
        setStep('success');
      }
      // Don't call onSuccess here - will be called when user closes success screen
    } catch {
      setSubmitError(t("portal.appointments.errors.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  const fetchPaymentSettings = async () => {
    setLoadingPaymentSettings(true);
    try {
      const response = await fetch("/api/settings/payment");
      if (response.ok) {
        const data = await response.json();
        setPaymentSettings(data.settings);
      }
    } catch (error) {
      console.error("Error fetching payment settings:", error);
    } finally {
      setLoadingPaymentSettings(false);
    }
  };

  const getWhatsAppUrl = () => {
    if (!paymentSettings?.whatsappNumber || !selectedDate) return "";

    const countryCode = (paymentSettings.whatsappCountryCode || "+591").replace("+", "");
    const phone = countryCode + paymentSettings.whatsappNumber.replace(/\D/g, "");

    let message = paymentSettings.whatsappMessage || "";
    message = message
      .replace("{fecha}", selectedDate.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }))
      .replace("{hora}", selectedTime)
      .replace("{bebe}", selectedBaby?.name || "")
      .replace("{monto}", advanceAmount?.toString() || "");

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const handleDownloadQr = async () => {
    if (!paymentSettings?.paymentQrImage) return;

    try {
      // Convert base64 to blob for sharing
      const response = await fetch(paymentSettings.paymentQrImage);
      const blob = await response.blob();
      const file = new File([blob], "QR-Pago-BabySpa.png", { type: "image/png" });

      // Only use Web Share API on mobile (avoid Windows share dialog on desktop)
      const isMobileDevice = window.innerWidth < 640 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobileDevice && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "QR Pago Baby Spa",
        });
        return;
      }
    } catch (error) {
      // If share fails or is cancelled, fall through to download
      console.log("Share cancelled or failed, using download fallback");
    }

    // Fallback: direct download (used on desktop or when share fails)
    const link = document.createElement("a");
    link.href = paymentSettings.paymentQrImage;
    link.download = "QR-Pago-BabySpa.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAndClose = (fromSuccess = false) => {
    // If closing from success or payment screen, trigger data refresh
    if (fromSuccess || step === 'success' || step === 'payment') {
      onSuccess();
    }
    setStep('client');
    setClientType(null);
    setSelectedBaby(null);
    setSelectedPackageId(null);
    setSelectedPurchaseId(null);
    setCatalogPackages([]);
    setSelectedDate(null);
    setSelectedTime("");
    setButtonAnimated(false);
    setWantsFixedSchedule(null);
    setSchedulePreferences([]);
    setAutoScheduling(false);
    setRequiresPayment(false);
    setAdvanceAmount(null);
    setPaymentSettings(null);
    setBabyCardInfo(null);
    setUnlockedReward(null);
    onOpenChange(false);
  };

  // Handle package selection from PackageSelector
  const handlePackageSelect = (packageId: string | null, purchaseId: string | null) => {
    setSelectedPackageId(packageId);
    setSelectedPurchaseId(purchaseId);
    // Trigger button animation
    if (packageId || purchaseId) {
      setButtonAnimated(true);
      setTimeout(() => setButtonAnimated(false), 2000);
    }
  };

  // Transform baby packages to PackageSelector format
  const getBabyPackagesForSelector = (): PackagePurchaseData[] => {
    if (!selectedBaby) return [];
    return selectedBaby.packages.map((pkg) => ({
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

  // Transform parent packages to PackageSelector format (for self-appointments)
  const getParentPackagesForSelector = (): PackagePurchaseData[] => {
    if (!parentInfo?.packages) return [];
    return parentInfo.packages.map((pkg) => ({
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

  // Get packages for selector based on client type
  const getPackagesForSelector = (): PackagePurchaseData[] => {
    if (clientType === 'self') {
      return getParentPackagesForSelector();
    }
    return getBabyPackagesForSelector();
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  // Navigation handlers
  const handleBack = () => {
    const hasBothOptions = babies.length > 0 && !!parentInfo?.id;

    if (step === 'baby') {
      // Go back to client selection only if both options exist
      if (hasBothOptions) {
        setStep('client');
        setClientType(null);
        setSelectedBaby(null);
        setSelectedPackageId(null);
        setSelectedPurchaseId(null);
        setCatalogPackages([]);
      }
    } else if (step === 'package') {
      if (clientType === 'self') {
        // Go back to client selection if both options exist
        if (hasBothOptions) {
          setStep('client');
          setClientType(null);
          setSelectedPackageId(null);
          setSelectedPurchaseId(null);
          setCatalogPackages([]);
        }
      } else if (babies.length > 1 && !preselectedBabyId) {
        setStep('baby');
        setSelectedBaby(null);
        setSelectedPackageId(null);
        setSelectedPurchaseId(null);
      } else if (hasBothOptions) {
        setStep('client');
        setClientType(null);
        setSelectedBaby(null);
        setSelectedPackageId(null);
        setSelectedPurchaseId(null);
        setCatalogPackages([]);
      }
    } else if (step === 'preferences') {
      setStep('package');
    } else if (step === 'datetime') {
      if (shouldShowPreferencesStep) {
        setStep('preferences');
      } else {
        setStep('package');
      }
    }
  };

  const handleNext = async () => {
    if (step === 'package' && (selectedPackageId || selectedPurchaseId)) {
      if (shouldShowPreferencesStep) {
        setStep('preferences');
      } else {
        setStep('datetime');
      }
    } else if (step === 'preferences') {
      if (wantsFixedSchedule === true && schedulePreferences.length > 0) {
        // Auto-schedule based on first preference
        const success = await autoScheduleFromPreferences();
        if (!success) {
          // If auto-schedule failed, fall back to datetime step
          setStep('datetime');
        }
      } else {
        // Single appointment mode - go to datetime step
        setStep('datetime');
      }
    }
  };

  // Check if back navigation is possible
  const canGoBack = () => {
    const hasBothOptions = babies.length > 0 && !!parentInfo?.id;

    if (step === 'baby') return hasBothOptions;
    if (step === 'package') {
      if (clientType === 'self') return hasBothOptions;
      return babies.length > 1 || hasBothOptions;
    }
    if (step === 'preferences') return true;
    if (step === 'datetime') return true;
    return false;
  };

  // Calculate step numbers for display
  const getStepNumber = () => {
    if (step === 'package') return 1;
    if (step === 'preferences') return 2;
    if (step === 'datetime') return shouldShowPreferencesStep ? 3 : 2;
    return 1;
  };

  const getTotalSteps = () => shouldShowPreferencesStep ? 3 : 2;

  const canProceed = () => {
    if (step === 'package') return !!(selectedPackageId || selectedPurchaseId);
    if (step === 'preferences') {
      // Can proceed if user chose single appointment OR defined at least 1 preference
      return wantsFixedSchedule === false || (wantsFixedSchedule === true && schedulePreferences.length > 0);
    }
    if (step === 'datetime') return !!(selectedDate && selectedTime);
    return false;
  };

  // Get selected package name for summary
  const getSelectedPackageName = () => {
    if (selectedPurchaseId && selectedBaby) {
      const pkg = selectedBaby.packages.find(p => p.id === selectedPurchaseId);
      return pkg?.package.name || '';
    }
    if (selectedPackageId) {
      const pkg = catalogPackages.find(p => p.id === selectedPackageId);
      return pkg?.name || '';
    }
    return '';
  };

  // Check if the selected package has multiple sessions (for preferences step)
  const hasMultipleSessions = (): boolean => {
    if (selectedPurchaseId && selectedBaby) {
      const pkg = selectedBaby.packages.find(p => p.id === selectedPurchaseId);
      return (pkg?.remainingSessions || 0) > 1;
    }
    if (selectedPackageId) {
      const pkg = catalogPackages.find(p => p.id === selectedPackageId);
      return (pkg?.sessionCount || 0) > 1;
    }
    return false;
  };

  // Check if preferences step should be shown
  const shouldShowPreferencesStep = hasMultipleSessions();

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent
        showCloseButton={false}
        className="flex w-full max-w-full flex-col gap-0 rounded-none border-0 p-0 sm:h-auto sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl sm:border"
        style={viewportHeight && isMobile ? { height: viewportHeight, maxHeight: viewportHeight } : undefined}
      >
        {/* Accessibility: Hidden title and description for screen readers */}
        <VisuallyHidden>
          <DialogTitle>{t("portal.appointments.wizard.title")}</DialogTitle>
          <DialogDescription>{t("portal.appointments.wizard.description")}</DialogDescription>
        </VisuallyHidden>

        {/* Header - Fixed */}
        {step !== 'success' && (
          <div className="shrink-0 border-b border-gray-100 bg-white px-4 py-3 sm:rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Back button */}
                {(step === 'baby' || step === 'package' || step === 'preferences' || step === 'datetime') && canGoBack() && (
                  <button
                    onClick={handleBack}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {step === 'client' && t("portal.appointments.wizard.selectClientType")}
                    {step === 'baby' && t("portal.appointments.selectBaby")}
                    {step === 'package' && t("packages.selectPackage")}
                    {step === 'preferences' && t("portal.appointments.wizard.schedulePreferences")}
                    {step === 'datetime' && t("portal.appointments.wizard.selectDateTime")}
                  </h2>
                  {step !== 'client' && step !== 'baby' && (
                    <p className="text-xs text-gray-500">
                      {t("portal.appointments.wizard.step")} {getStepNumber()} {t("portal.appointments.wizard.of")} {getTotalSteps()}
                    </p>
                  )}
                </div>
              </div>
              {/* Client indicator */}
              {clientType === 'self' && step !== 'client' && (
                <div className="flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1">
                  <UserRound className="h-4 w-4 text-rose-600" />
                  <span className="text-sm font-medium text-rose-700">{parentInfo?.name}</span>
                </div>
              )}
              {selectedBaby && step !== 'baby' && step !== 'client' && (
                <div className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1">
                  <Baby className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-medium text-teal-700">{selectedBaby.name}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content - Scrollable */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          {/* Client Type Selection Step */}
          {step === 'client' && (
            <div className="p-4">
              <p className="mb-4 text-sm text-gray-600">
                {t("portal.appointments.wizard.selectClientTypeDescription")}
              </p>
              <div className="space-y-3">
                {/* Option: For my baby */}
                {babies.length > 0 && (
                  <button
                    onClick={() => {
                      setClientType('baby');
                      if (babies.length === 1) {
                        const baby = babies[0];
                        setSelectedBaby(baby);
                        if (baby.packages.length === 1) {
                          setSelectedPurchaseId(baby.packages[0].id);
                          setSelectedPackageId(baby.packages[0].package.id);
                        }
                        setStep('package');
                        fetchCatalog("BABY");
                      } else {
                        setStep('baby');
                      }
                    }}
                    className="flex w-full items-center gap-4 rounded-2xl border-2 border-teal-100 bg-white p-4 text-left transition-all hover:border-teal-300 hover:bg-teal-50/50 hover:shadow-md"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 text-white shadow-md">
                      <Baby className="h-7 w-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-semibold text-gray-800">
                        {t("portal.appointments.wizard.forMyBaby")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {babies.length === 1
                          ? babies[0].name
                          : t("portal.appointments.wizard.forMyBabyDesc", { count: babies.length })}
                      </p>
                    </div>
                    <ChevronRight className="h-6 w-6 shrink-0 text-teal-400" />
                  </button>
                )}

                {/* Option: For myself (parent services) */}
                {parentInfo?.id && (
                  <button
                    onClick={() => {
                      setClientType('self');
                      if (parentInfo?.packages && parentInfo.packages.length === 1) {
                        setSelectedPurchaseId(parentInfo.packages[0].id);
                        setSelectedPackageId(parentInfo.packages[0].package.id);
                      }
                      setStep('package');
                      fetchCatalog("PARENT");
                    }}
                    className="flex w-full items-center gap-4 rounded-2xl border-2 border-rose-100 bg-white p-4 text-left transition-all hover:border-rose-300 hover:bg-rose-50/50 hover:shadow-md"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-md">
                      <UserRound className="h-7 w-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-semibold text-gray-800">
                        {t("portal.appointments.wizard.forMyself")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t("portal.appointments.wizard.forMyselfDesc")}
                      </p>
                    </div>
                    <ChevronRight className="h-6 w-6 shrink-0 text-rose-400" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Baby Selection Step */}
          {step === 'baby' && (
            <div className="p-4">
              <p className="mb-4 text-sm text-gray-600">
                {t("portal.appointments.wizard.selectBabyDescription")}
              </p>
              <div className="space-y-3">
                {babies.map((baby) => {
                  const genderColor = baby.gender === "MALE"
                    ? "from-sky-400 to-blue-500"
                    : baby.gender === "FEMALE"
                    ? "from-rose-400 to-pink-500"
                    : "from-teal-400 to-cyan-500";

                  return (
                    <button
                      key={baby.id}
                      onClick={() => {
                        setSelectedBaby(baby);
                        if (baby.packages.length === 1) {
                          setSelectedPurchaseId(baby.packages[0].id);
                          setSelectedPackageId(baby.packages[0].package.id);
                        } else {
                          setSelectedPurchaseId(null);
                          setSelectedPackageId(null);
                        }
                        setStep('package');
                        fetchCatalog();
                      }}
                      className="flex w-full items-center gap-4 rounded-2xl border-2 border-teal-100 bg-white p-4 text-left transition-all hover:border-teal-300 hover:bg-teal-50/50 hover:shadow-md"
                    >
                      <div className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xl font-bold text-white shadow-md",
                        genderColor
                      )}>
                        {baby.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-semibold text-gray-800">{baby.name}</p>
                        <p className="text-sm text-gray-500">
                          {baby.totalRemainingSessions > 0 ? (
                            <span className="text-emerald-600 font-medium">
                              {baby.totalRemainingSessions} {t("portal.dashboard.sessionsAvailable")}
                            </span>
                          ) : (
                            <span className="text-amber-600">
                              {t("portal.appointments.wizard.noSessions")}
                            </span>
                          )}
                        </p>
                      </div>
                      <ChevronRight className="h-6 w-6 shrink-0 text-teal-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Package Selection Step */}
          {step === 'package' && (selectedBaby || clientType === 'self') && (
            <div className="p-4">
              {loadingCatalog ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                </div>
              ) : (
                <PackageSelector
                  babyId={clientType === 'self' ? undefined : selectedBaby?.id}
                  packages={catalogPackages}
                  babyPackages={getPackagesForSelector()}
                  specialPrices={babyCardInfo?.specialPrices}
                  selectedPackageId={selectedPackageId}
                  selectedPurchaseId={selectedPurchaseId}
                  onSelectPackage={handlePackageSelect}
                  showCategories={true}
                  showPrices={true}
                  showExistingFirst={true}
                  allowNewPackage={true}
                  compact={true}
                  showProvisionalMessage={false}
                  maxHeight="none"
                />
              )}
            </div>
          )}

          {/* Schedule Preferences Step */}
          {step === 'preferences' && (selectedBaby || clientType === 'self') && (
            <div className="p-4 space-y-6">
              {/* Selected package summary */}
              <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 p-3 border border-teal-100">
                <Package className="h-5 w-5 text-teal-600" />
                <span className="text-sm font-medium text-teal-700">
                  {getSelectedPackageName()}
                </span>
              </div>

              {/* Explanation */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <div className="flex items-start gap-3">
                  <CalendarClock className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      {t("portal.appointments.wizard.preferencesExplanation")}
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      {t("portal.appointments.wizard.preferencesHelp")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Choice: Single appointment vs Fixed schedule */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setWantsFixedSchedule(false);
                    setSchedulePreferences([]);
                  }}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                    wantsFixedSchedule === false
                      ? "border-teal-500 bg-gradient-to-r from-teal-50 to-cyan-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-teal-200 hover:bg-teal-50/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      wantsFixedSchedule === false
                        ? "bg-teal-500 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}>
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`font-semibold ${wantsFixedSchedule === false ? "text-teal-700" : "text-gray-700"}`}>
                        {t("portal.appointments.wizard.singleAppointment")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t("portal.appointments.wizard.singleAppointmentDesc")}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setWantsFixedSchedule(true);
                    if (schedulePreferences.length === 0) {
                      setSchedulePreferences([{ dayOfWeek: 2, time: '09:00' }]);
                    }
                  }}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                    wantsFixedSchedule === true
                      ? "border-teal-500 bg-gradient-to-r from-teal-50 to-cyan-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-teal-200 hover:bg-teal-50/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      wantsFixedSchedule === true
                        ? "bg-teal-500 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}>
                      <CalendarClock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`font-semibold ${wantsFixedSchedule === true ? "text-teal-700" : "text-gray-700"}`}>
                        {t("portal.appointments.wizard.fixedSchedule")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t("portal.appointments.wizard.fixedScheduleDesc")}
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Schedule preference selector (only if fixed schedule is chosen) */}
              {wantsFixedSchedule === true && (
                <div className="animate-fadeIn space-y-4">
                  <div className="rounded-xl border border-teal-100 bg-white/50 p-4">
                    <SchedulePreferenceSelector
                      value={schedulePreferences}
                      onChange={setSchedulePreferences}
                      maxPreferences={3}
                      compact={true}
                      showLabel={false}
                    />
                  </div>

                  {/* Auto-schedule preview */}
                  {schedulePreferences.length > 0 && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-emerald-800">
                            {t("portal.appointments.wizard.autoSchedulePreview")}
                          </p>
                          <p className="mt-1 text-sm text-emerald-700 font-semibold">
                            {(() => {
                              const firstPref = schedulePreferences[0];
                              const nextDate = findNextMatchingDate(firstPref.dayOfWeek);
                              const dayNames: Record<string, string[]> = {
                                es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
                                "pt-BR": ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"]
                              };
                              const locale = typeof window !== 'undefined' ? document.documentElement.lang || 'es' : 'es';
                              const dayName = dayNames[locale]?.[firstPref.dayOfWeek] || dayNames['es'][firstPref.dayOfWeek];
                              return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${nextDate.getDate()}/${nextDate.getMonth() + 1} a las ${firstPref.time}`;
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Date & Time Selection Step */}
          {step === 'datetime' && (selectedBaby || clientType === 'self') && (
            <div className="p-4 space-y-6">
              {/* Selected package summary */}
              <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 p-3 border border-teal-100">
                <Package className="h-5 w-5 text-teal-600" />
                <span className="text-sm font-medium text-teal-700">
                  {getSelectedPackageName()}
                </span>
                <span className="ml-auto text-xs text-teal-500">
                  {t("portal.appointments.provisional")}
                </span>
              </div>

              {/* Date selection */}
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">
                  {t("portal.appointments.selectDate")}
                </label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {availableDates.map((date) => {
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedTime("");
                        }}
                        className={cn(
                          "flex flex-col items-center rounded-xl border-2 p-3 transition-all",
                          isSelected
                            ? "border-teal-500 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-sm"
                            : "border-gray-100 bg-white hover:border-teal-200 hover:bg-teal-50/30"
                        )}
                      >
                        <span className={cn(
                          "text-[10px] font-medium uppercase",
                          isSelected ? "text-teal-600" : "text-gray-400"
                        )}>
                          {date.toLocaleDateString("es-ES", { weekday: "short" })}
                        </span>
                        <span className={cn(
                          "text-lg font-bold",
                          isSelected ? "text-teal-700" : "text-gray-800"
                        )}>
                          {date.getDate()}
                        </span>
                        <span className={cn(
                          "text-[10px]",
                          isSelected ? "text-teal-500" : "text-gray-400"
                        )}>
                          {date.toLocaleDateString("es-ES", { month: "short" })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time selection */}
              {selectedDate && (
                <div className="animate-fadeIn">
                  <label className="mb-3 block text-sm font-medium text-gray-700">
                    {t("portal.appointments.selectTime")}
                  </label>
                  {loadingSlots ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="rounded-xl bg-gray-50 p-6 text-center">
                      <Clock className="mx-auto h-10 w-10 text-gray-300" />
                      <p className="mt-2 text-sm text-gray-500">{t("babyProfile.appointments.noSlots")}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            onClick={() => {
                              if (slot.available) {
                                setSelectedTime(slot.time);
                                setSubmitError(null);
                              }
                            }}
                            disabled={!slot.available}
                            className={cn(
                              "rounded-xl border-2 py-3 text-sm font-medium transition-all",
                              !slot.available && "cursor-not-allowed border-gray-50 bg-gray-50 text-gray-300",
                              slot.available && isSelected
                                ? "border-teal-500 bg-gradient-to-br from-teal-50 to-cyan-50 text-teal-700 shadow-sm"
                                : slot.available && "border-gray-100 bg-white text-gray-700 hover:border-teal-200 hover:bg-teal-50/30"
                            )}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payment Step */}
          {step === 'payment' && (
            <div className="p-4 space-y-6">
              {loadingPaymentSettings ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                </div>
              ) : (
                <>
                  {/* Payment header */}
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 shadow-lg shadow-amber-100">
                      <CreditCard className="h-8 w-8 text-amber-600" />
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-gray-800">
                      {t("payment.required")}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {getSelectedPackageName()}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-6 py-3 text-lg font-bold text-amber-700">
                      <span>Bs.</span>
                      <span>{advanceAmount}</span>
                    </div>
                  </div>

                  {/* QR Code */}
                  {paymentSettings?.paymentQrImage && (
                    <div className="space-y-3">
                      <p className="text-center text-sm font-medium text-gray-600">
                        {t("payment.scanQr")}
                      </p>
                      <div className="mx-auto w-48 h-48 rounded-xl border-2 border-teal-200 bg-white p-2 shadow-lg">
                        <img
                          src={paymentSettings.paymentQrImage}
                          alt="QR Code"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      {/* Download QR Button */}
                      <button
                        onClick={handleDownloadQr}
                        className="mx-auto flex items-center justify-center gap-2 rounded-xl border-2 border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-700 transition-all hover:bg-teal-50 hover:border-teal-300"
                      >
                        <Download className="h-4 w-4" />
                        {t("payment.downloadQr")}
                      </button>
                    </div>
                  )}

                  {/* WhatsApp Button */}
                  {paymentSettings?.whatsappNumber && (
                    <div className="space-y-3">
                      <p className="text-center text-sm font-medium text-gray-600">
                        {t("payment.sendWhatsapp")}
                      </p>
                      <a
                        href={getWhatsAppUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-4 font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-600"
                      >
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        {t("payment.sendWhatsapp")}
                      </a>
                    </div>
                  )}

                  {/* Confirmation pending message */}
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">
                          {t("payment.confirmationPending")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Appointment summary */}
                  <div className="rounded-xl bg-gray-50 p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        {clientType === 'self' ? t("common.client") : t("common.baby")}:
                      </span>
                      <span className="font-medium text-gray-800">
                        {clientType === 'self' ? parentInfo?.name : selectedBaby?.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t("common.date")}:</span>
                      <span className="font-medium text-gray-800">
                        {selectedDate?.toLocaleDateString("es-ES", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t("common.time")}:</span>
                      <span className="font-medium text-gray-800">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t("common.package")}:</span>
                      <span className="font-medium text-gray-800">{getSelectedPackageName()}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="flex min-h-full flex-col items-center justify-center p-8 text-center">
              {/* Close button */}
              <button
                onClick={() => resetAndClose(true)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Reward unlocked celebration */}
              {unlockedReward ? (
                <>
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-500 shadow-xl shadow-purple-200 animate-pulse">
                    <Gift className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="mt-6 text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                    {t("babyCard.portal.rewardUnlocked")}
                  </h3>
                  <div className="mt-4 rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-4 shadow-lg">
                    <div className="flex items-center justify-center gap-3">
                      {unlockedReward.displayIcon ? (
                        <span className="text-3xl">{unlockedReward.displayIcon}</span>
                      ) : (
                        <Star className="h-8 w-8 text-amber-500" />
                      )}
                      <span className="text-lg font-bold text-violet-800">
                        {unlockedReward.displayName}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-violet-600">
                      {t("babyCard.portal.rewardUnlockedDesc")}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 shadow-lg shadow-emerald-100">
                    <CheckCircle className="h-10 w-10 text-emerald-500" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-gray-800">
                    {t("portal.appointments.appointmentConfirmed")}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {t("portal.appointments.wizard.successMessage")}
                  </p>
                </>
              )}

              {/* Summary */}
              <div className="mt-6 w-full max-w-xs space-y-2 rounded-xl bg-gray-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {clientType === 'self' ? t("common.client") : t("common.baby")}:
                  </span>
                  <span className="font-medium text-gray-800">
                    {clientType === 'self' ? parentInfo?.name : selectedBaby?.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("common.package")}:</span>
                  <span className="font-medium text-gray-800">{getSelectedPackageName()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("common.date")}:</span>
                  <span className="font-medium text-gray-800">
                    {selectedDate?.toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("common.time")}:</span>
                  <span className="font-medium text-gray-800">{selectedTime}</span>
                </div>
              </div>

              {/* Baby Card progress - show if has card but no reward unlocked */}
              {babyCardInfo?.hasActiveCard && babyCardInfo.purchase && !unlockedReward && (
                <div className="mt-4 w-full max-w-xs rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 shadow-md">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-violet-800">
                        {babyCardInfo.purchase.babyCardName}
                      </p>
                      <p className="text-xs text-violet-600">
                        {t("babyCard.portal.sessionProgress", {
                          current: babyCardInfo.purchase.completedSessions + 1,
                          total: babyCardInfo.purchase.totalSessions,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4 text-violet-500" />
                      <span className="text-sm font-bold text-violet-700">
                        {Math.round(((babyCardInfo.purchase.completedSessions + 1) / babyCardInfo.purchase.totalSessions) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-2 w-full rounded-full bg-violet-200/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                      style={{ width: `${((babyCardInfo.purchase.completedSessions + 1) / babyCardInfo.purchase.totalSessions) * 100}%` }}
                    />
                  </div>

                  {/* Next reward teaser */}
                  {babyCardInfo.nextReward && babyCardInfo.nextReward.sessionsUntilUnlock > 0 && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/50 p-2">
                      <Gift className="h-4 w-4 text-violet-500" />
                      <p className="text-xs text-violet-700">
                        {t("babyCard.portal.nextRewardIn", {
                          sessions: babyCardInfo.nextReward.sessionsUntilUnlock,
                          reward: babyCardInfo.nextReward.displayName,
                        })}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Baby Card Promo - Show if baby appointment and NO active card */}
              {clientType === 'baby' && (!babyCardInfo || !babyCardInfo.hasActiveCard) && (
                <div className="mt-4 w-full max-w-xs rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-fuchsia-400 shadow-md">
                      <Gift className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-violet-800">
                        {t("portal.babyCardPromo.successTeaser")}
                      </p>
                      <p className="text-xs text-violet-600">
                        {t("portal.babyCardPromo.successTeaserDesc")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Close button at bottom */}
              <Button
                onClick={() => resetAndClose(true)}
                className={cn(
                  "mt-6 h-12 w-full max-w-xs gap-2 rounded-xl text-base font-semibold text-white shadow-lg transition-all",
                  unlockedReward
                    ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-violet-200 hover:from-violet-600 hover:to-fuchsia-600"
                    : "bg-gradient-to-r from-teal-500 to-cyan-500 shadow-teal-200 hover:from-teal-600 hover:to-cyan-600"
                )}
              >
                {t("common.close")}
              </Button>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        {step === 'payment' && (
          <div className="shrink-0 border-t border-gray-100 bg-white p-4 sm:rounded-b-2xl">
            <Button
              onClick={() => resetAndClose(true)}
              className="h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-base font-semibold text-white shadow-lg shadow-teal-200 transition-all hover:from-teal-600 hover:to-cyan-600"
            >
              <CheckCircle className="h-5 w-5" />
              {t("payment.understood")}
            </Button>
          </div>
        )}

        {step !== 'success' && step !== 'client' && step !== 'baby' && step !== 'payment' && (
          <div className="shrink-0 border-t border-gray-100 bg-white p-4 sm:rounded-b-2xl">
            {/* Error message */}
            {submitError && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{submitError}</p>
              </div>
            )}

            {/* Provisional message */}
            {step === 'package' && (selectedPackageId || selectedPurchaseId) && !submitError && (
              <p className="mb-3 text-center text-xs text-gray-500">
                {t("packages.provisional")}
              </p>
            )}

            {/* Preferences info message */}
            {step === 'preferences' && wantsFixedSchedule && schedulePreferences.length > 0 && !submitError && (
              <p className="mb-3 text-center text-xs text-gray-500">
                {t("portal.appointments.wizard.preferencesWillBeSaved")}
              </p>
            )}

            <Button
              onClick={step === 'datetime' ? handleSubmit : handleNext}
              disabled={!canProceed() || submitting || autoScheduling}
              className={cn(
                "h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-base font-semibold text-white shadow-lg shadow-teal-200 transition-all hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:shadow-none",
                canProceed() && buttonAnimated && "animate-pulse-subtle"
              )}
            >
              {submitting || autoScheduling ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : step === 'datetime' ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  {t("portal.appointments.confirmAppointment")}
                </>
              ) : step === 'preferences' && wantsFixedSchedule === true && schedulePreferences.length > 0 ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  {t("portal.appointments.confirmAppointment")}
                </>
              ) : (
                <>
                  {t("common.continue")}
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
