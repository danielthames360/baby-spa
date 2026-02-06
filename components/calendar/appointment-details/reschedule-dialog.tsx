"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Check, AlertCircle, CalendarClock } from "lucide-react";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rescheduleDate: string;
  rescheduleTime: string;
  rescheduleError: string;
  availableDates: { value: string; label: string }[];
  availableSlots: string[];
  isUpdating: boolean;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onReschedule: () => void;
  onCancel: () => void;
}

export function RescheduleDialog({
  open,
  onOpenChange,
  rescheduleDate,
  rescheduleTime,
  rescheduleError,
  availableDates,
  availableSlots,
  isUpdating,
  onDateChange,
  onTimeChange,
  onReschedule,
  onCancel,
}: RescheduleDialogProps) {
  const t = useTranslations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Select value={rescheduleDate} onValueChange={onDateChange}>
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
              onValueChange={onTimeChange}
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
            onClick={onCancel}
            className="flex-1 rounded-xl"
            disabled={isUpdating}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onReschedule}
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
  );
}
