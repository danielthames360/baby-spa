"use client";

import { useTranslations } from "next-intl";
import { Baby, ChevronRight, UserRound } from "lucide-react";
import type { BabyData, ParentInfo } from "../types";

interface ClientStepProps {
  babies: BabyData[];
  parentInfo: ParentInfo | null;
  onSelectBaby: () => void;
  onSelectSelf: () => void;
}

export function ClientStep({
  babies,
  parentInfo,
  onSelectBaby,
  onSelectSelf,
}: ClientStepProps) {
  const t = useTranslations();

  return (
    <div className="p-4">
      <p className="mb-4 text-sm text-gray-600">
        {t("portal.appointments.wizard.selectClientTypeDescription")}
      </p>
      <div className="space-y-3">
        {/* Option: For my baby */}
        {babies.length > 0 && (
          <button
            onClick={onSelectBaby}
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-teal-100 bg-white p-4 text-left transition-all hover:border-teal-300 hover:bg-teal-50/50 hover:shadow-md"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 text-white shadow-md">
              <Baby className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-gray-800">
                {t("portal.appointments.wizard.forMyBaby")}
              </p>
              <p className="text-sm text-gray-500">
                {babies.length === 1
                  ? babies[0].name
                  : t("portal.appointments.wizard.forMyBabyDesc", {
                      count: babies.length,
                    })}
              </p>
            </div>
            <ChevronRight className="h-6 w-6 shrink-0 text-teal-400" />
          </button>
        )}

        {/* Option: For myself (parent services) */}
        {parentInfo?.id && (
          <button
            onClick={onSelectSelf}
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-rose-100 bg-white p-4 text-left transition-all hover:border-rose-300 hover:bg-rose-50/50 hover:shadow-md"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-md">
              <UserRound className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
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
  );
}
