"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { differenceInHours, format, addDays, startOfDay, isBefore } from "date-fns";
import { es, ptBR } from "date-fns/locale";
import { formatDateForDisplay, extractDateString } from "@/lib/utils/date-utils";
import {
  X,
  CalendarDays,
  AlertTriangle,
  MessageCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MIN_HOURS_BEFORE = 24;

// ============================================================
// TYPES
// ============================================================

export interface AppointmentForActions {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  baby?: { id: string; name: string } | null;
  parent?: { id: string; name: string } | null;
  selectedPackage?: { id: string; name: string; duration?: number } | null;
  hasPayments?: boolean;
}

interface TimeSlot {
  time: string;
  endTime: string;
  available: boolean;
}

interface DayAvailability {
  date: string;
  slots: TimeSlot[];
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if appointment can be modified (cancelled/rescheduled)
 */
export function canModifyAppointment(appointment: AppointmentForActions): {
  canModify: boolean;
  reason?: "too_late" | "invalid_status" | "has_payments";
  hoursRemaining?: number;
} {
  // Check status
  if (appointment.status !== "SCHEDULED" && appointment.status !== "PENDING_PAYMENT") {
    return { canModify: false, reason: "invalid_status" };
  }

  // Check payments
  if (appointment.hasPayments) {
    return { canModify: false, reason: "has_payments" };
  }

  // Calculate hours until appointment
  const dateOnly = extractDateString(appointment.date);
  const appointmentDateTime = new Date(`${dateOnly}T${appointment.startTime}:00`);
  const hoursRemaining = differenceInHours(appointmentDateTime, new Date());

  if (hoursRemaining < MIN_HOURS_BEFORE) {
    return { canModify: false, reason: "too_late", hoursRemaining };
  }

  return { canModify: true };
}

/**
 * Generate WhatsApp URL with pre-filled message
 */
export function generateWhatsAppUrl(
  whatsappNumber: string,
  countryCode: string,
  appointment: AppointmentForActions,
  locale: string,
  action: "cancel" | "reschedule"
): string {
  const phone = countryCode + whatsappNumber.replace(/\D/g, "");
  const formattedDate = formatDateForDisplay(appointment.date, locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const clientName = appointment.baby?.name || appointment.parent?.name || "";

  const actionText = action === "cancel"
    ? locale === "pt-BR" ? "cancelar" : "cancelar"
    : locale === "pt-BR" ? "reagendar" : "reagendar";

  const message = encodeURIComponent(
    `Hola, necesito ${actionText} mi cita:\n` +
    `👶 ${clientName}\n` +
    `📅 ${formattedDate} - ${appointment.startTime}\n` +
    `¿Podrían ayudarme?`
  );

  return `https://wa.me/${phone}?text=${message}`;
}

// ============================================================
// CANCEL DIALOG
// ============================================================

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentForActions | null;
  onSuccess: () => void;
  whatsappNumber?: string | null;
  whatsappCountryCode?: string | null;
}

export function CancelAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onSuccess,
  whatsappNumber,
  whatsappCountryCode,
}: CancelDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setReason("");
      setShowConfirm(false);
    }
  }, [open]);

  if (!appointment) return null;

  const modifyCheck = canModifyAppointment(appointment);
  const formattedDate = formatDateForDisplay(appointment.date, locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const clientName = appointment.baby?.name || appointment.parent?.name || "";

  const handleProceedToConfirm = () => {
    // Validate reason is required
    if (!reason.trim()) {
      toast.error(t("portal.appointments.reasonRequired"));
      return;
    }
    setShowConfirm(true);
  };

  const handleCancel = async (e: React.MouseEvent) => {
    // Prevent AlertDialogAction from auto-closing
    e.preventDefault();

    setLoading(true);
    try {
      const response = await fetch(`/api/portal/appointments/${appointment.id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, locale, clientTimestamp: Date.now() }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "TOO_LATE") {
          toast.error(t("portal.appointments.cancelTooLate"));
        } else if (data.code === "HAS_PAYMENTS") {
          toast.error(t("portal.appointments.hasPaymentsError"));
        } else {
          toast.error(data.error || t("common.error"));
        }
        setShowConfirm(false);
        return;
      }

      // Close everything first, then show toast
      setShowConfirm(false);
      onOpenChange(false);
      onSuccess();
      toast.success(t("portal.appointments.cancelSuccess"));
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error(t("common.error"));
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  // If can't modify, show contact option
  if (!modifyCheck.canModify) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-2xl border border-white/50 bg-white/95 p-6 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t("portal.appointments.cannotCancel")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Appointment info */}
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 text-white font-bold">
                  {clientName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{clientName}</p>
                  <p className="text-sm text-gray-500">{formattedDate} - {appointment.startTime}</p>
                </div>
              </div>
            </div>

            {/* Reason message */}
            <div className="rounded-xl bg-amber-50 p-4 border border-amber-200">
              <p className="text-sm text-amber-800">
                {modifyCheck.reason === "too_late" && (
                  <>
                    {t("portal.appointments.tooLateMessage", { hours: MIN_HOURS_BEFORE })}
                    {modifyCheck.hoursRemaining !== undefined && modifyCheck.hoursRemaining > 0 && (
                      <span className="block mt-1 font-medium">
                        {t("portal.appointments.hoursRemaining", { hours: Math.floor(modifyCheck.hoursRemaining) })}
                      </span>
                    )}
                  </>
                )}
                {modifyCheck.reason === "has_payments" && t("portal.appointments.hasPaymentsMessage")}
                {modifyCheck.reason === "invalid_status" && t("portal.appointments.invalidStatusMessage")}
              </p>
            </div>

            {/* Contact option */}
            {whatsappNumber && whatsappCountryCode && (
              <a
                href={generateWhatsAppUrl(whatsappNumber, whatsappCountryCode, appointment, locale, "cancel")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-600"
              >
                <MessageCircle className="h-5 w-5" />
                {t("portal.appointments.contactWhatsApp")}
              </a>
            )}

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full rounded-xl"
            >
              {t("common.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open && !showConfirm} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-2xl border border-white/50 bg-white/95 p-6 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <X className="h-5 w-5 text-red-500" />
              {t("portal.appointments.cancelAppointment")}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {t("portal.appointments.cancelDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Appointment info */}
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 text-white font-bold">
                  {clientName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{clientName}</p>
                  <p className="text-sm text-gray-500">{formattedDate} - {appointment.startTime}</p>
                </div>
              </div>
            </div>

            {/* Reason input - REQUIRED */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("portal.appointments.cancelReason")} <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("portal.appointments.cancelReasonPlaceholder")}
                className="rounded-xl border-gray-200"
                rows={3}
                required
                autoFocus={false}
              />
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{t("portal.appointments.cancelWarning")}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-xl"
              >
                {t("common.back")}
              </Button>
              <Button
                onClick={handleProceedToConfirm}
                className="flex-1 rounded-xl bg-red-500 text-white hover:bg-red-600"
              >
                {t("portal.appointments.confirmCancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Alert */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("portal.appointments.confirmCancelTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("portal.appointments.confirmCancelMessage")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>{t("common.back")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => handleCancel(e)}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("portal.appointments.yesCancel")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================
// RESCHEDULE DIALOG
// ============================================================

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentForActions | null;
  onSuccess: () => void;
  whatsappNumber?: string | null;
  whatsappCountryCode?: string | null;
}

export function RescheduleAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onSuccess,
  whatsappNumber,
  whatsappCountryCode,
}: RescheduleDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfDay(new Date()));

  const dateLocale = locale === "pt-BR" ? ptBR : es;

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedDate(null);
      setSelectedTime(null);
      setAvailability([]);
      setCurrentWeekStart(startOfDay(new Date()));
    }
  }, [open]);

  // Fetch availability when date changes
  const fetchAvailability = useCallback(async (date: string, packageId?: string) => {
    setLoadingSlots(true);
    try {
      const params = new URLSearchParams({ date });
      if (packageId) params.append("packageId", packageId);

      const response = await fetch(`/api/portal/appointments/availability?${params}`);
      if (response.ok) {
        const data = await response.json();
        return data.slots || [];
      }
      return [];
    } catch (error) {
      console.error("Fetch availability error:", error);
      return [];
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  // Fetch week availability
  useEffect(() => {
    if (!open || !appointment) return;

    const fetchWeekAvailability = async () => {
      setLoadingSlots(true);
      const days: DayAvailability[] = [];

      for (let i = 0; i < 7; i++) {
        const date = addDays(currentWeekStart, i);
        if (isBefore(date, startOfDay(new Date()))) continue;

        const dateStr = format(date, "yyyy-MM-dd");
        const slots = await fetchAvailability(dateStr, appointment.selectedPackage?.id);
        days.push({ date: dateStr, slots });
      }

      setAvailability(days);
      setLoadingSlots(false);
    };

    fetchWeekAvailability();
  }, [open, currentWeekStart, appointment, fetchAvailability]);

  if (!appointment) return null;

  const modifyCheck = canModifyAppointment(appointment);
  const formattedCurrentDate = formatDateForDisplay(appointment.date, locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const clientName = appointment.baby?.name || appointment.parent?.name || "";
  const duration = appointment.selectedPackage?.duration || 60;

  // If can't modify, show contact option
  if (!modifyCheck.canModify) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-2xl border border-white/50 bg-white/95 p-6 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t("portal.appointments.cannotReschedule")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 text-white font-bold">
                  {clientName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{clientName}</p>
                  <p className="text-sm text-gray-500">{formattedCurrentDate} - {appointment.startTime}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 p-4 border border-amber-200">
              <p className="text-sm text-amber-800">
                {modifyCheck.reason === "too_late" && (
                  <>
                    {t("portal.appointments.tooLateMessage", { hours: MIN_HOURS_BEFORE })}
                    {modifyCheck.hoursRemaining !== undefined && modifyCheck.hoursRemaining > 0 && (
                      <span className="block mt-1 font-medium">
                        {t("portal.appointments.hoursRemaining", { hours: Math.floor(modifyCheck.hoursRemaining) })}
                      </span>
                    )}
                  </>
                )}
                {modifyCheck.reason === "has_payments" && t("portal.appointments.hasPaymentsMessage")}
                {modifyCheck.reason === "invalid_status" && t("portal.appointments.invalidStatusMessage")}
              </p>
            </div>

            {whatsappNumber && whatsappCountryCode && (
              <a
                href={generateWhatsAppUrl(whatsappNumber, whatsappCountryCode, appointment, locale, "reschedule")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-600"
              >
                <MessageCircle className="h-5 w-5" />
                {t("portal.appointments.contactWhatsApp")}
              </a>
            )}

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full rounded-xl"
            >
              {t("common.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const calculateEndTime = (startTime: string): string => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/portal/appointments/${appointment.id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newDate: selectedDate,
          newStartTime: selectedTime,
          newEndTime: calculateEndTime(selectedTime),
          locale,
          clientTimestamp: Date.now(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "TOO_LATE") {
          toast.error(t("portal.appointments.rescheduleTooLate"));
        } else if (data.code === "SLOT_FULL") {
          toast.error(t("portal.appointments.slotNotAvailable"));
        } else {
          toast.error(data.error || t("common.error"));
        }
        return;
      }

      toast.success(t("portal.appointments.rescheduleSuccess"));
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Reschedule error:", error);
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const selectedDaySlots = availability.find(d => d.date === selectedDate)?.slots || [];
  const availableSlots = selectedDaySlots.filter(s => s.available);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl border border-white/50 bg-white/95 p-0 backdrop-blur-md sm:max-h-[85vh]">
        <DialogHeader className="border-b border-gray-100 px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <CalendarDays className="h-5 w-5 text-teal-500" />
            {t("portal.appointments.rescheduleAppointment")}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            {t("portal.appointments.rescheduleDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-5">
          {/* Current appointment */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-500">{t("portal.appointments.currentAppointment")}</p>
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 text-white font-bold">
                  {clientName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{clientName}</p>
                  <p className="text-sm text-gray-500">{formattedCurrentDate} - {appointment.startTime}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Week navigation */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">{t("portal.appointments.selectNewDate")}</p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentWeekStart(prev => addDays(prev, -7))}
                  disabled={isBefore(addDays(currentWeekStart, -7), startOfDay(new Date()))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-500 min-w-[120px] text-center">
                  {format(currentWeekStart, "MMM d", { locale: dateLocale })} - {format(addDays(currentWeekStart, 6), "MMM d", { locale: dateLocale })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentWeekStart(prev => addDays(prev, 7))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Day buttons */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, i) => {
                const date = addDays(currentWeekStart, i);
                const dateStr = format(date, "yyyy-MM-dd");
                const dayAvailability = availability.find(d => d.date === dateStr);
                const hasAvailableSlots = dayAvailability?.slots.some(s => s.available);
                const isPast = isBefore(date, startOfDay(new Date()));
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setSelectedTime(null);
                    }}
                    disabled={isPast || !hasAvailableSlots}
                    className={cn(
                      "flex flex-col items-center rounded-lg p-2 transition-all",
                      isPast && "opacity-40 cursor-not-allowed",
                      !isPast && !hasAvailableSlots && "opacity-40 cursor-not-allowed",
                      isSelected && "bg-teal-500 text-white",
                      !isSelected && hasAvailableSlots && !isPast && "hover:bg-teal-50"
                    )}
                  >
                    <span className="text-xs font-medium">
                      {format(date, "EEE", { locale: dateLocale })}
                    </span>
                    <span className={cn("text-lg font-bold", isSelected ? "text-white" : "text-gray-800")}>
                      {format(date, "d")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div>
              <p className="mb-3 text-sm font-medium text-gray-700">
                {t("portal.appointments.availableTimes")} - {formatDateForDisplay(selectedDate, locale, { weekday: "long", day: "numeric", month: "long" })}
              </p>

              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="rounded-xl bg-gray-50 p-4 text-center text-gray-500">
                  {t("portal.appointments.noAvailableSlots")}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedTime(slot.time)}
                      className={cn(
                        "rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all",
                        selectedTime === slot.time
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-gray-200 hover:border-teal-300 hover:bg-teal-50/50"
                      )}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* New appointment preview */}
          {selectedDate && selectedTime && (
            <div className="rounded-xl bg-teal-50 border border-teal-200 p-4">
              <div className="flex items-center gap-2 text-teal-700">
                <Check className="h-5 w-5" />
                <span className="font-medium">{t("portal.appointments.newAppointment")}:</span>
              </div>
              <p className="mt-1 text-teal-800 font-semibold">
                {formatDateForDisplay(selectedDate, locale, { weekday: "long", day: "numeric", month: "long" })} - {selectedTime}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl"
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={!selectedDate || !selectedTime || loading}
            className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("portal.appointments.confirmReschedule")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
