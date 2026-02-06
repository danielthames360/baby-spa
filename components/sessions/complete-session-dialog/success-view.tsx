"use client";

import { useTranslations } from "next-intl";
import {
  CheckCircle,
  Gift,
  Package,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CompletedPurchaseInfo, RewardInfo } from "./types";

interface SuccessViewProps {
  completedPurchaseInfo: CompletedPurchaseInfo | null;
  newlyUnlockedRewards: RewardInfo[];
  onClose: () => void;
  onScheduleRemaining: () => void;
}

export function SuccessView({
  completedPurchaseInfo,
  newlyUnlockedRewards,
  onClose,
  onScheduleRemaining,
}: SuccessViewProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100">
        <CheckCircle className="h-10 w-10 text-emerald-500" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-800">
          {t("session.completedSuccessfully")}
        </h3>
        {completedPurchaseInfo && (
          <>
            <p className="text-gray-600">
              {t("bulkScheduling.scheduleNow")}
            </p>
            <div className="mt-4 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 p-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-teal-700">
                  {completedPurchaseInfo.babyName || completedPurchaseInfo.parentName}
                </span>
                {" - "}
                <span className="font-medium">{completedPurchaseInfo.packageName}</span>
              </p>
              <p className="text-lg font-bold text-emerald-600 mt-1">
                {t("bulkScheduling.remainingToSchedule", {
                  count: completedPurchaseInfo.remainingSessions,
                })}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Newly Unlocked Baby Card Rewards - available in NEXT appointment */}
      {newlyUnlockedRewards.length > 0 && (
        <div className="w-full max-w-md rounded-2xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
              <Star className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-amber-800">
                {t("babyCard.checkout.nextSessionReward")}
              </p>
              <p className="text-sm text-amber-700">
                {t("babyCard.checkout.nextSessionRewardText")}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {newlyUnlockedRewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center gap-3 rounded-xl bg-white/80 border border-amber-200 p-3"
              >
                <span className="text-2xl">{reward.displayIcon || "🎁"}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{reward.displayName}</p>
                  <p className="text-xs text-amber-600">
                    {t("babyCard.rewards.readyToUse")}
                  </p>
                </div>
                <Gift className="h-5 w-5 text-amber-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          className="rounded-xl border-2 border-gray-200 px-6"
        >
          {t("common.close")}
        </Button>
        {completedPurchaseInfo && (
          <Button
            onClick={onScheduleRemaining}
            className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white shadow-lg shadow-teal-300/50"
          >
            <Package className="mr-2 h-4 w-4" />
            {t("bulkScheduling.scheduleRemaining")}
          </Button>
        )}
      </div>
    </div>
  );
}
