"use client";

import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BabyData } from "../types";

interface BabyStepProps {
  babies: BabyData[];
  onSelectBaby: (baby: BabyData) => void;
}

export function BabyStep({ babies, onSelectBaby }: BabyStepProps) {
  const t = useTranslations();

  return (
    <div className="p-4">
      <p className="mb-4 text-sm text-gray-600">
        {t("portal.appointments.wizard.selectBabyDescription")}
      </p>
      <div className="space-y-3">
        {babies.map((baby) => {
          const genderColor =
            baby.gender === "MALE"
              ? "from-sky-400 to-blue-500"
              : baby.gender === "FEMALE"
                ? "from-rose-400 to-pink-500"
                : "from-teal-400 to-cyan-500";

          return (
            <button
              key={baby.id}
              onClick={() => onSelectBaby(baby)}
              className="flex w-full items-center gap-4 rounded-2xl border-2 border-teal-100 bg-white p-4 text-left transition-all hover:border-teal-300 hover:bg-teal-50/50 hover:shadow-md"
            >
              <div
                className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xl font-bold text-white shadow-md",
                  genderColor
                )}
              >
                {baby.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold text-gray-800">{baby.name}</p>
                <p className="text-sm text-gray-500">
                  {baby.totalRemainingSessions > 0 ? (
                    <span className="font-medium text-emerald-600">
                      {baby.totalRemainingSessions}{" "}
                      {t("portal.dashboard.sessionsAvailable")}
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
  );
}
