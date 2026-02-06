"use client";

import { useTranslations } from "next-intl";
import { Clock, Loader2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimeSlot } from "../types";

interface DateTimeStepProps {
  selectedPackageName: string;
  availableDates: Date[];
  selectedDate: Date | null;
  selectedTime: string;
  availableSlots: TimeSlot[];
  loadingSlots: boolean;
  onSelectDate: (date: Date) => void;
  onSelectTime: (time: string) => void;
  onClearError: () => void;
}

export function DateTimeStep({
  selectedPackageName,
  availableDates,
  selectedDate,
  selectedTime,
  availableSlots,
  loadingSlots,
  onSelectDate,
  onSelectTime,
  onClearError,
}: DateTimeStepProps) {
  const t = useTranslations();

  return (
    <div className="space-y-6 p-4">
      {/* Selected package summary */}
      <div className="flex items-center gap-2 rounded-xl border border-teal-100 bg-gradient-to-r from-teal-50 to-cyan-50 p-3">
        <Package className="h-5 w-5 text-teal-600" />
        <span className="text-sm font-medium text-teal-700">
          {selectedPackageName}
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
                  onSelectDate(date);
                }}
                className={cn(
                  "flex flex-col items-center rounded-xl border-2 p-3 transition-all",
                  isSelected
                    ? "border-teal-500 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-sm"
                    : "border-gray-100 bg-white hover:border-teal-200 hover:bg-teal-50/30"
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase",
                    isSelected ? "text-teal-600" : "text-gray-400"
                  )}
                >
                  {date.toLocaleDateString("es-ES", { weekday: "short" })}
                </span>
                <span
                  className={cn(
                    "text-lg font-bold",
                    isSelected ? "text-teal-700" : "text-gray-800"
                  )}
                >
                  {date.getDate()}
                </span>
                <span
                  className={cn(
                    "text-[10px]",
                    isSelected ? "text-teal-500" : "text-gray-400"
                  )}
                >
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
              <p className="mt-2 text-sm text-gray-500">
                {t("babyProfile.appointments.noSlots")}
              </p>
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
                        onSelectTime(slot.time);
                        onClearError();
                      }
                    }}
                    disabled={!slot.available}
                    className={cn(
                      "rounded-xl border-2 py-3 text-sm font-medium transition-all",
                      !slot.available &&
                        "cursor-not-allowed border-gray-50 bg-gray-50 text-gray-300",
                      slot.available && isSelected
                        ? "border-teal-500 bg-gradient-to-br from-teal-50 to-cyan-50 text-teal-700 shadow-sm"
                        : slot.available &&
                            "border-gray-100 bg-white text-gray-700 hover:border-teal-200 hover:bg-teal-50/30"
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
  );
}
