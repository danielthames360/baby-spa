"use client";

import { useTranslations } from "next-intl";
import { Calendar, CalendarClock, CheckCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { SchedulePreferenceSelector } from "@/components/appointments/schedule-preference-selector";
import type { SchedulePreference } from "@/lib/types/scheduling";

interface PreferencesStepProps {
  selectedPackageName: string;
  wantsFixedSchedule: boolean | null;
  schedulePreferences: SchedulePreference[];
  onWantsFixedScheduleChange: (value: boolean) => void;
  onSchedulePreferencesChange: (preferences: SchedulePreference[]) => void;
  findNextMatchingDate: (dayOfWeek: number) => Date;
}

export function PreferencesStep({
  selectedPackageName,
  wantsFixedSchedule,
  schedulePreferences,
  onWantsFixedScheduleChange,
  onSchedulePreferencesChange,
  findNextMatchingDate,
}: PreferencesStepProps) {
  const t = useTranslations();

  return (
    <div className="space-y-6 p-4">
      {/* Selected package summary */}
      <div className="flex items-center gap-2 rounded-xl border border-teal-100 bg-gradient-to-r from-teal-50 to-cyan-50 p-3">
        <Package className="h-5 w-5 text-teal-600" />
        <span className="text-sm font-medium text-teal-700">
          {selectedPackageName}
        </span>
      </div>

      {/* Explanation */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
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
            onWantsFixedScheduleChange(false);
            onSchedulePreferencesChange([]);
          }}
          className={cn(
            "w-full rounded-xl border-2 p-4 text-left transition-all",
            wantsFixedSchedule === false
              ? "border-teal-500 bg-gradient-to-r from-teal-50 to-cyan-50 shadow-md"
              : "border-gray-200 bg-white hover:border-teal-200 hover:bg-teal-50/30"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                wantsFixedSchedule === false
                  ? "bg-teal-500 text-white"
                  : "bg-gray-100 text-gray-400"
              )}
            >
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p
                className={cn(
                  "font-semibold",
                  wantsFixedSchedule === false
                    ? "text-teal-700"
                    : "text-gray-700"
                )}
              >
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
            onWantsFixedScheduleChange(true);
            if (schedulePreferences.length === 0) {
              onSchedulePreferencesChange([{ dayOfWeek: 2, time: "09:00" }]);
            }
          }}
          className={cn(
            "w-full rounded-xl border-2 p-4 text-left transition-all",
            wantsFixedSchedule === true
              ? "border-teal-500 bg-gradient-to-r from-teal-50 to-cyan-50 shadow-md"
              : "border-gray-200 bg-white hover:border-teal-200 hover:bg-teal-50/30"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                wantsFixedSchedule === true
                  ? "bg-teal-500 text-white"
                  : "bg-gray-100 text-gray-400"
              )}
            >
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <p
                className={cn(
                  "font-semibold",
                  wantsFixedSchedule === true
                    ? "text-teal-700"
                    : "text-gray-700"
                )}
              >
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
              onChange={onSchedulePreferencesChange}
              maxPreferences={3}
              compact={true}
              showLabel={false}
            />
          </div>

          {/* Auto-schedule preview */}
          {schedulePreferences.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    {t("portal.appointments.wizard.autoSchedulePreview")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-emerald-700">
                    {(() => {
                      const firstPref = schedulePreferences[0];
                      const nextDate = findNextMatchingDate(firstPref.dayOfWeek);
                      const dayNames: Record<string, string[]> = {
                        es: [
                          "domingo",
                          "lunes",
                          "martes",
                          "miércoles",
                          "jueves",
                          "viernes",
                          "sábado",
                        ],
                        "pt-BR": [
                          "domingo",
                          "segunda",
                          "terça",
                          "quarta",
                          "quinta",
                          "sexta",
                          "sábado",
                        ],
                      };
                      const locale =
                        typeof window !== "undefined"
                          ? document.documentElement.lang || "es"
                          : "es";
                      const dayName =
                        dayNames[locale]?.[firstPref.dayOfWeek] ||
                        dayNames["es"][firstPref.dayOfWeek];
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
  );
}
