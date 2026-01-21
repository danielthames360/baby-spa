"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface ActivePackage {
  id: string;
  remainingSessions: number;
  package: {
    name: string;
  };
}

interface ScheduleAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babyId: string;
  babyName: string;
  activePackage: ActivePackage | null;
  onSuccess?: () => void;
}

export function ScheduleAppointmentDialog({
  open,
  onOpenChange,
  babyId,
  babyName,
  activePackage,
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

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedDate(null);
      setSelectedTime(null);
      setAvailability(null);
      setNotes("");
      setError(null);
      setCurrentMonth(new Date());
    }
  }, [open]);

  // Fetch availability when date is selected
  const fetchAvailability = useCallback(async (date: Date) => {
    setIsLoadingAvailability(true);
    setSelectedTime(null);
    setError(null);

    try {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          babyId,
          date: dateStr,
          startTime: selectedTime,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorKey = data.error || "UNKNOWN_ERROR";
        setError(t(`calendar.errors.${errorKey}`));
        return;
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Error creating appointment:", err);
      setError(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays = locale === "pt-BR"
    ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
    : ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

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
              {activePackage ? (
                <p className="flex items-center gap-1 text-sm text-emerald-600">
                  <Package className="h-3 w-3" />
                  {activePackage.remainingSessions} {t("calendar.sessionsAvailable")}
                </p>
              ) : (
                <p className="text-sm text-amber-600">
                  {t("calendar.noActivePackage")}
                </p>
              )}
            </div>
          </div>

          {/* Info when no package - trial session */}
          {!activePackage && (
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">
                  {t("calendar.trialSession")}
                </p>
                <p className="text-sm text-blue-600">
                  {t("calendar.trialSessionDesc")}
                </p>
              </div>
            </div>
          )}

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
          {selectedTime && (
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
          {selectedDate && selectedTime && (
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

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Actions */}
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
              disabled={!selectedDate || !selectedTime || isSubmitting}
              className={cn(
                "rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600",
                (!selectedDate || !selectedTime) && "opacity-50"
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
      </DialogContent>
    </Dialog>
  );
}
