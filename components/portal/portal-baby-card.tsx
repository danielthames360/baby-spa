"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDateForDisplay } from "@/lib/utils/date-utils";
import Link from "next/link";
import {
  Baby,
  CreditCard,
  Gift,
  Lock,
  Check,
  Sparkles,
  ArrowLeft,
  Loader2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BabyCardVisual } from "@/components/baby-cards/baby-card-visual";

interface Reward {
  id: string;
  displayName: string;
  displayIcon: string | null;
  rewardType: string;
  sessionNumber: number;
  status: "AVAILABLE" | "USED" | "LOCKED";
  usedAt: string | null;
}

interface SpecialPrice {
  packageId: string;
  packageName: string;
  normalPrice: number;
  specialPrice: number;
}

interface BabyCardData {
  baby: {
    id: string;
    name: string;
  };
  hasActiveCard: boolean;
  purchase: {
    id: string;
    babyCardName: string;
    babyCardDescription: string | null;
    completedSessions: number;
    totalSessions: number;
    progressPercent: number;
    firstSessionDiscount: number;
    firstSessionDiscountUsed: boolean;
    status: string;
    purchaseDate: string;
  } | null;
  rewards: Reward[];
  specialPrices: SpecialPrice[];
}

interface PortalBabyCardProps {
  babyId: string;
}

export function PortalBabyCard({ babyId }: PortalBabyCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [data, setData] = useState<BabyCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/portal/baby-card/${babyId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch baby card");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [babyId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "es-BO", {
      style: "currency",
      currency: locale === "pt-BR" ? "BRL" : "BOB",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-rose-600">{error || t("common.error")}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/portal/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("portal.backToDashboard")}
          </Link>
        </Button>
      </div>
    );
  }

  // Group rewards by status
  const availableRewards = data.rewards.filter((r) => r.status === "AVAILABLE");
  const usedRewards = data.rewards.filter((r) => r.status === "USED");
  const lockedRewards = data.rewards.filter((r) => r.status === "LOCKED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link href="/portal/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {t("babyCard.portal.myCard")}
            </h1>
            <p className="text-sm text-gray-500">
              {t("babyCard.portal.cardFor", { babyName: data.baby.name })}
            </p>
          </div>
        </div>
      </div>

      {!data.hasActiveCard || !data.purchase ? (
        /* No active card */
        <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
              <CreditCard className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">
            {t("babyCard.portal.noCard")}
          </h2>
          <p className="mt-2 text-gray-500">
            {t("babyCard.portal.noCardDesc")}
          </p>
        </div>
      ) : (
        <>
          {/* Baby Card Visual */}
          <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
            {/* Card Header - simplified */}
            <div className="mb-4 text-center">
              <p className="text-xs text-gray-500">
                {t("babyCard.profile.purchasedOn", {
                  date: formatDateForDisplay(data.purchase.purchaseDate, locale),
                })}
              </p>
            </div>

            {/* Visual Card - shows name, progress, sessions, rewards */}
            <div className="flex justify-center px-0 sm:px-4">
              <BabyCardVisual
                name={data.purchase.babyCardName}
                totalSessions={data.purchase.totalSessions}
                completedSessions={data.purchase.completedSessions}
                firstSessionDiscount={data.purchase.firstSessionDiscount}
                firstSessionDiscountUsed={data.purchase.firstSessionDiscountUsed}
                rewards={data.rewards.map((r) => ({
                  id: r.id,
                  sessionNumber: r.sessionNumber,
                  displayName: r.displayName,
                  displayIcon: r.displayIcon,
                  rewardType: r.rewardType,
                }))}
                usedRewardIds={usedRewards.map((r) => r.id)}
                variant="preview"
                className="w-full sm:max-w-lg"
              />
            </div>

            {/* First Session Discount Badge */}
            {data.purchase.firstSessionDiscount > 0 && (
              <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-emerald-600" />
                  <span className="font-medium text-emerald-800">
                    {t("babyCard.info.firstSessionDiscount", { amount: data.purchase.firstSessionDiscount })}
                  </span>
                  {data.purchase.firstSessionDiscountUsed && (
                    <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      <Check className="inline-block h-3 w-3 mr-1" />
                      {t("common.used")}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Rewards Section */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
              <Gift className="h-5 w-5 text-violet-600" />
              {t("babyCard.portal.myRewards")}
            </h3>

            {data.rewards.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                {t("babyCard.rewards.empty")}
              </p>
            ) : (
              <div className="space-y-3">
                {/* Available Rewards */}
                {availableRewards.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                      {t("babyCard.profile.availableRewards")} ({availableRewards.length})
                    </p>
                    {availableRewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="flex items-center gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4"
                      >
                        <span className="text-2xl">{reward.displayIcon || "🎁"}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{reward.displayName}</p>
                          <p className="text-xs text-emerald-600">
                            {t("babyCard.rewards.readyToUse")}
                          </p>
                        </div>
                        <Gift className="h-5 w-5 text-emerald-500" />
                      </div>
                    ))}
                    <p className="text-xs text-gray-500 italic">
                      {t("babyCard.portal.requestReward")}
                    </p>
                  </div>
                )}

                {/* Locked Rewards */}
                {lockedRewards.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {t("babyCard.profile.upcomingRewards")} ({lockedRewards.length})
                    </p>
                    {lockedRewards.map((reward) => {
                      // Sessions away = sessionNumber - 1 - completedSessions (since reward unlocks at sessionNumber - 1)
                      const sessionsAway = reward.sessionNumber - 1 - data.purchase!.completedSessions;
                      return (
                        <div
                          key={reward.id}
                          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 opacity-70"
                        >
                          <span className="text-2xl grayscale">{reward.displayIcon || "🎁"}</span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-600">{reward.displayName}</p>
                            <p className="text-xs text-gray-500">
                              {t("babyCard.rewards.unlocksAt", { session: reward.sessionNumber })}
                              {" - "}
                              <span className="font-medium">
                                {sessionsAway} {t("babyCard.profile.sessionsAway")}
                              </span>
                            </p>
                          </div>
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Used Rewards */}
                {usedRewards.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      {t("common.used")} ({usedRewards.length})
                    </p>
                    {usedRewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-100 p-4 opacity-60"
                      >
                        <span className="text-2xl grayscale">{reward.displayIcon || "🎁"}</span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-500 line-through">{reward.displayName}</p>
                          {reward.usedAt && (
                            <p className="text-xs text-gray-400">
                              {formatDateForDisplay(reward.usedAt, locale)}
                            </p>
                          )}
                        </div>
                        <Check className="h-5 w-5 text-emerald-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Special Prices Section */}
          {data.specialPrices.length > 0 && (
            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
                <Sparkles className="h-5 w-5 text-teal-600" />
                {t("babyCard.portal.specialPriceActive")}
              </h3>
              <div className="space-y-2">
                {data.specialPrices.map((sp) => (
                  <div
                    key={sp.packageId}
                    className="flex items-center justify-between rounded-xl bg-white p-4"
                  >
                    <span className="font-medium text-gray-800">{sp.packageName}</span>
                    <div className="text-right">
                      <span className="text-sm text-gray-400 line-through mr-2">
                        {formatPrice(sp.normalPrice)}
                      </span>
                      <span className="font-bold text-teal-600">{formatPrice(sp.specialPrice)}</span>
                      <p className="text-xs text-teal-600">
                        {t("babyCard.portal.youSave", {
                          amount: (sp.normalPrice - sp.specialPrice).toFixed(2),
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Back to Dashboard Button */}
      <div className="flex justify-center pt-4">
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/portal/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("portal.backToDashboard")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
