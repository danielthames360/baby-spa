"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  Phone,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { formatDateForDisplay } from "@/lib/utils/date-utils";
import {
  type AppointmentForActions,
} from "@/components/portal/appointment-actions";

import { AppointmentCard } from "./appointment-card";
import { PaymentInstructionsDialog } from "./payment-instructions-dialog";
import { ScheduleDialog } from "./schedule-dialog";
import type { Appointment, BabyData, ParentInfo, PaymentSettings } from "./types";

// Dynamic imports for heavy dialog components (bundle-dynamic-imports)
const CancelAppointmentDialog = dynamic(
  () =>
    import("@/components/portal/appointment-actions").then(
      (m) => m.CancelAppointmentDialog
    ),
  { ssr: false }
);

const RescheduleAppointmentDialog = dynamic(
  () =>
    import("@/components/portal/appointment-actions").then(
      (m) => m.RescheduleAppointmentDialog
    ),
  { ssr: false }
);

export function PortalAppointments() {
  const t = useTranslations();
  const locale = useLocale();

  // Data state
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [babies, setBabies] = useState<BabyData[]>([]);
  const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null);
  const [canSchedule, setCanSchedule] = useState(true);
  const [requiresPrepayment, setRequiresPrepayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  // Dialog state
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showPaymentInstructionsDialog, setShowPaymentInstructionsDialog] = useState(false);
  const [selectedAppointmentForPayment, setSelectedAppointmentForPayment] = useState<Appointment | null>(null);
  const [paymentSettingsForDialog, setPaymentSettingsForDialog] = useState<PaymentSettings | null>(null);
  const [loadingPaymentSettings, setLoadingPaymentSettings] = useState(false);

  // Cancel/Reschedule dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [selectedAppointmentForAction, setSelectedAppointmentForAction] = useState<AppointmentForActions | null>(null);

  // Payment settings for WhatsApp contact
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);

  // Fetch all data in parallel using Promise.all (async-parallel)
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [appointmentsRes, settingsRes] = await Promise.all([
        fetch("/api/portal/appointments"),
        fetch("/api/settings/payment"),
      ]);

      if (!appointmentsRes.ok) throw new Error("Failed to fetch");
      const data = await appointmentsRes.json();
      setUpcoming(data.upcoming);
      setPast(data.past);
      setBabies(data.babies);
      setParentInfo(data.parentInfo);
      setCanSchedule(data.canSchedule);
      setRequiresPrepayment(data.requiresPrepayment);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setPaymentSettings(settingsData.settings);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(
      dateString,
      locale === "pt-BR" ? "pt-BR" : "es-ES",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
      }
    );
  };

  const canScheduleBabies = babies;
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

  // Handle cancel appointment
  const handleCancelAppointment = (appointment: Appointment) => {
    setSelectedAppointmentForAction({
      id: appointment.id,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      baby: appointment.baby,
      parent: appointment.parent,
      selectedPackage: appointment.selectedPackage
        ? {
            id: appointment.selectedPackage.id,
            name: appointment.selectedPackage.name,
          }
        : null,
      hasPayments: false,
    });
    setShowCancelDialog(true);
  };

  // Handle reschedule appointment
  const handleRescheduleAppointment = (appointment: Appointment) => {
    setSelectedAppointmentForAction({
      id: appointment.id,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      baby: appointment.baby,
      parent: appointment.parent,
      selectedPackage: appointment.selectedPackage
        ? {
            id: appointment.selectedPackage.id,
            name: appointment.selectedPackage.name,
            duration: 60,
          }
        : null,
      hasPayments: false,
    });
    setShowRescheduleDialog(true);
  };

  // Download QR handler for payment instructions dialog
  const handleDownloadQrDialog = async () => {
    if (!paymentSettingsForDialog?.paymentQrImage) return;

    try {
      const response = await fetch(paymentSettingsForDialog.paymentQrImage);
      const blob = await response.blob();
      const file = new File([blob], "QR-Pago-BabySpa.png", { type: "image/png" });

      const isMobileDevice =
        window.innerWidth < 640 ||
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (
        isMobileDevice &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: "QR Pago Baby Spa",
        });
        return;
      }
    } catch {
      // Share API not available or user cancelled, fall through to download
    }

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
              <a
                href="https://wa.me/59170000000"
                target="_blank"
                rel="noopener noreferrer"
              >
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
            <p className="mt-3 text-gray-500">
              {t("portal.appointments.noUpcoming")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                formatDate={formatDate}
                onViewPaymentInstructions={handleViewPaymentInstructions}
                onCancel={handleCancelAppointment}
                onReschedule={handleRescheduleAppointment}
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
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                formatDate={formatDate}
                isPast
              />
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

      {/* Payment Instructions Dialog */}
      <PaymentInstructionsDialog
        open={showPaymentInstructionsDialog}
        onOpenChange={setShowPaymentInstructionsDialog}
        appointment={selectedAppointmentForPayment}
        paymentSettings={paymentSettingsForDialog}
        loading={loadingPaymentSettings}
        onDownloadQr={handleDownloadQrDialog}
      />

      {/* Cancel Appointment Dialog */}
      <CancelAppointmentDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        appointment={selectedAppointmentForAction}
        onSuccess={() => {
          fetchData();
        }}
        whatsappNumber={paymentSettings?.whatsappNumber}
        whatsappCountryCode={paymentSettings?.whatsappCountryCode}
      />

      {/* Reschedule Appointment Dialog */}
      <RescheduleAppointmentDialog
        open={showRescheduleDialog}
        onOpenChange={setShowRescheduleDialog}
        appointment={selectedAppointmentForAction}
        onSuccess={() => {
          fetchData();
        }}
        whatsappNumber={paymentSettings?.whatsappNumber}
        whatsappCountryCode={paymentSettings?.whatsappCountryCode}
      />
    </div>
  );
}
