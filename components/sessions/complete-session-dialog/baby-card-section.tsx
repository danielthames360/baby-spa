"use client";

import { useTranslations } from "next-intl";
import {
  Check,
  CreditCard,
  Gift,
  Loader2,
  Percent,
  Plus,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BabyCardCheckoutInfo, RewardInfo } from "./types";

interface BabyCardSectionProps {
  babyCardInfo: BabyCardCheckoutInfo;
  selectedPackageId: string | null;
  selectedPurchaseId: string | null;
  subtotal: number;
  useFirstSessionDiscount: boolean;
  onToggleFirstSessionDiscount: () => void;
  usedRewardIds: string[];
  isUsingReward: boolean;
  onUseReward: (reward: RewardInfo) => void;
  onBuyCard: () => void;
  formatPrice: (price: number) => string;
}

export function BabyCardSection({
  babyCardInfo,
  selectedPackageId,
  selectedPurchaseId,
  subtotal,
  useFirstSessionDiscount,
  onToggleFirstSessionDiscount,
  usedRewardIds,
  isUsingReward,
  onUseReward,
  onBuyCard,
  formatPrice,
}: BabyCardSectionProps) {
  const t = useTranslations();

  return (
    <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-md">
          <CreditCard className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          {babyCardInfo.hasActiveCard && babyCardInfo.purchase ? (
            <>
              <p className="font-semibold text-gray-800">
                {babyCardInfo.purchase.babyCardName}
              </p>
              <p className="text-sm text-violet-600">
                {t("babyCard.checkout.sessionNumber", {
                  number: babyCardInfo.purchase.completedSessions + 1,
                  total: babyCardInfo.purchase.totalSessions,
                })}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-gray-800">
                {t("babyCard.checkout.noCard")}
              </p>
              <p className="text-sm text-violet-600">
                {t("babyCard.checkout.offerCardDesc")}
              </p>
            </>
          )}
        </div>
        {babyCardInfo.hasActiveCard && babyCardInfo.purchase ? (
          <div className="text-right">
            <div className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1">
              <Sparkles className="h-4 w-4 text-violet-600 mr-1.5" />
              <span className="text-sm font-bold text-violet-700">
                {Math.round(babyCardInfo.purchase.progressPercent)}%
              </span>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={onBuyCard}
            className="h-9 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 px-4 text-white shadow-md"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {t("babyCard.checkout.buyCard")}
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {babyCardInfo.hasActiveCard && babyCardInfo.purchase && (
        <div className="mb-4">
          <div className="h-2 w-full rounded-full bg-violet-200/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
              style={{ width: `${babyCardInfo.purchase.progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* First Session Discount - Toggle to apply */}
      {babyCardInfo.firstSessionDiscount &&
        !babyCardInfo.firstSessionDiscount.used &&
        subtotal > 0 && (
          <div className="mb-3">
            <button
              type="button"
              onClick={onToggleFirstSessionDiscount}
              className={cn(
                "w-full flex items-center justify-between rounded-xl border-2 p-3 transition-all",
                useFirstSessionDiscount
                  ? "border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 ring-2 ring-amber-400"
                  : "border-amber-200 bg-amber-50/50 hover:border-amber-300"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    useFirstSessionDiscount ? "bg-amber-500" : "bg-amber-200"
                  )}
                >
                  <Star
                    className={cn(
                      "h-5 w-5",
                      useFirstSessionDiscount ? "text-white" : "text-amber-600"
                    )}
                  />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">
                    {t("babyCard.checkout.firstSessionDiscount")}
                  </p>
                  <p className="text-sm text-amber-700">
                    {t("babyCard.checkout.firstSessionDiscountValue", {
                      amount: formatPrice(babyCardInfo.firstSessionDiscount.amount),
                    })}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                  useFirstSessionDiscount
                    ? "bg-amber-500 text-white"
                    : "bg-gray-200 text-gray-400"
                )}
              >
                {useFirstSessionDiscount ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </div>
            </button>
          </div>
        )}

      {/* Available Rewards - Can use NOW */}
      {babyCardInfo.availableRewards.filter((r) => !usedRewardIds.includes(r.id))
        .length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 mb-2">
            {t("babyCard.checkout.rewardReadyToUse")} (
            {
              babyCardInfo.availableRewards.filter(
                (r) => !usedRewardIds.includes(r.id)
              ).length
            }
            )
          </p>
          <div className="space-y-2">
            {babyCardInfo.availableRewards
              .filter((r) => !usedRewardIds.includes(r.id))
              .map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{reward.displayIcon || "🎁"}</span>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {reward.displayName}
                      </p>
                      <p className="text-xs text-emerald-600">
                        {t("babyCard.checkout.rewardReadyToUseText")}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onUseReward(reward)}
                    disabled={isUsingReward}
                    className="h-9 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 text-white shadow-md"
                  >
                    {isUsingReward ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Gift className="mr-1.5 h-4 w-4" />
                        {t("babyCard.checkout.useNow")}
                      </>
                    )}
                  </Button>
                </div>
              ))}
          </div>
          {usedRewardIds.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
              <Check className="h-4 w-4" />
              <span>{t("babyCard.checkout.rewardUsedSuccess")}</span>
            </div>
          )}
        </div>
      )}

      {/* Next Session Reward Alert - reward unlocks AFTER completing this session */}
      {babyCardInfo.nextReward &&
        babyCardInfo.purchase &&
        babyCardInfo.nextReward.sessionsUntilUnlock === 1 && (
          <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-semibold text-amber-800">
                  {t("babyCard.checkout.nextSessionReward")}
                </p>
                <p className="text-sm text-amber-700">
                  {t("babyCard.checkout.nextSessionRewardText")}{" "}
                  {babyCardInfo.nextReward.displayIcon || "🎁"}{" "}
                  {babyCardInfo.nextReward.displayName}
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Special Price Applied - if selecting an individual package with special price */}
      {selectedPackageId &&
        !selectedPurchaseId &&
        babyCardInfo.specialPrices.length > 0 && (
          <>
            {babyCardInfo.specialPrices
              .filter((sp) => sp.packageId === selectedPackageId)
              .map((sp) => (
                <div
                  key={sp.packageId}
                  className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 mt-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium text-emerald-800">
                        {t("babyCard.checkout.specialPriceApplied")}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500 line-through mr-2">
                        {formatPrice(sp.normalPrice)}
                      </span>
                      <span className="font-bold text-emerald-600">
                        {formatPrice(sp.specialPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </>
        )}
    </div>
  );
}
