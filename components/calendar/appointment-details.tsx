"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
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
import { StartSessionDialog } from "@/components/sessions/start-session-dialog";
import { CompleteSessionDialog } from "@/components/sessions/complete-session-dialog";
import { ViewBabyDialog } from "@/components/sessions/view-baby-dialog";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateTimeSlots, BUSINESS_HOURS } from "@/lib/constants/business-hours";

interface AppointmentDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    date: Date;
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
    status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
    notes: string | null;
    cancelReason: string | null;
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
  } | null;
  onUpdate?: () => void;
}

const statusConfig = {
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

  // Format date - parse from ISO string directly to avoid timezone conversion
  const formatDate = () => {
    const dateValue = appointment.date as unknown as string | Date;
    let dateObj: Date;

    if (typeof dateValue === "string") {
      // Extract date portion from ISO string (e.g., "2026-01-23" from "2026-01-23T00:00:00.000Z")
      const datePart = dateValue.split("T")[0];
      const [year, month, day] = datePart.split("-").map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      dateObj = dateValue;
    }

    return dateObj.toLocaleDateString(dateLocale, {
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
  const canCancel = ["SCHEDULED", "IN_PROGRESS"].includes(appointment.status);
  const canMarkNoShow = appointment.status === "SCHEDULED";
  const canReschedule = appointment.status === "SCHEDULED";

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

  // Check if baby has medical alerts (based on current appointment data)
  const hasMedicalAlerts = false; // Will be updated when baby details are fetched

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="text-xl font-bold text-gray-800">
                {t("calendar.appointmentDetails")}
              </span>
              <Badge className={cn("border", statusInfo.color)}>
                {t(`calendar.status.${statusInfo.label}`)}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Date & Time */}
            <div className="flex gap-4 rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {formattedDate}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                </span>
              </div>
            </div>

            {/* Baby info */}
            <div className="rounded-xl border-2 border-teal-100 bg-teal-50/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500">
                    <Baby className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {appointment.baby.name}
                    </p>
                    {primaryParent && (
                      <div className="flex items-center gap-3 text-sm text-gray-500">
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
                    className="text-cyan-600 hover:bg-cyan-100"
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
                      className="text-teal-600 hover:bg-teal-100"
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
            {(canStart || canComplete || canCancel || canMarkNoShow || canReschedule) && (
              <div className="space-y-3">
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
    </>
  );
}
