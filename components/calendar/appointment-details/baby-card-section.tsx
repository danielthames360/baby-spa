"use client";

import { useTranslations, useLocale } from "next-intl";
import { getCurrencySymbol } from "@/lib/utils/currency-utils";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CreditCard,
  Sparkles,
  Star,
  Gift,
} from "lucide-react";
import type { BabyCardCheckoutInfo } from "./types";

interface BabyCardSectionProps {
  babyName: string;
  babyCardInfo: BabyCardCheckoutInfo | null;
  loading: boolean;
}

export function BabyCardSection({
  babyName,
  babyCardInfo,
  loading,
}: BabyCardSectionProps) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="rounded-xl border-2 border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50 p-4">
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
        </div>
      ) : babyCardInfo?.hasActiveCard && babyCardInfo.purchase ? (
        <div className="space-y-3">
          {/* Card header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-md">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">
                {babyCardInfo.purchase.babyCardName}
              </p>
              <p className="text-sm text-violet-600">
                {t("babyCard.portal.sessionProgress", {
                  current: babyCardInfo.purchase.completedSessions + 1,
                  total: babyCardInfo.purchase.totalSessions,
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1">
                <Sparkles className="mr-1.5 h-4 w-4 text-violet-600" />
                <span className="text-sm font-bold text-violet-700">
                  {Math.round(babyCardInfo.purchase.progressPercent)}%
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-violet-200/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
              style={{ width: `${babyCardInfo.purchase.progressPercent}%` }}
            />
          </div>

          {/* Available rewards */}
          {babyCardInfo.availableRewards.length > 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <Gift className="h-4 w-4" />
                {t("babyCard.profile.availableRewards")} (
                {babyCardInfo.availableRewards.length})
              </div>
              <div className="mt-2 space-y-2">
                {babyCardInfo.availableRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between rounded-lg bg-white p-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{reward.displayIcon || "🎁"}</span>
                      <span className="text-sm font-medium text-gray-700">
                        {reward.displayName}
                      </span>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      {t("babyCard.rewards.readyToUse")}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-emerald-600">
                {t("babyCard.profile.useReward")}: {t("common.view")} → {babyName}
              </p>
            </div>
          )}

          {/* Next reward */}
          {babyCardInfo.nextReward && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
              <Star className="h-4 w-4 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  {t("babyCard.portal.nextRewardIn", {
                    sessions: babyCardInfo.nextReward.sessionsUntilUnlock,
                    reward: babyCardInfo.nextReward.displayName,
                  })}
                </p>
              </div>
            </div>
          )}

          {/* First session discount available */}
          {babyCardInfo.firstSessionDiscount &&
            !babyCardInfo.firstSessionDiscount.used && (
              <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 p-2.5">
                <Sparkles className="h-4 w-4 text-teal-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-teal-800">
                    {t("babyCard.checkout.firstSessionDiscount")}
                  </p>
                  <p className="text-xs text-teal-600">
                    {t("babyCard.checkout.firstSessionDiscountValue", {
                      amount: babyCardInfo.firstSessionDiscount.amount.toFixed(0) + " " + getCurrencySymbol(locale),
                    })}
                  </p>
                </div>
              </div>
            )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200">
            <CreditCard className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-600">
              {t("babyCard.profile.noActiveCard")}
            </p>
            <p className="text-sm text-gray-500">
              {t("babyCard.profile.noActiveCardDesc")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
