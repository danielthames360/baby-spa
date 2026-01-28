"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  IdCard,
  Gift,
  Plus,
  Loader2,
  Check,
  Lock,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BabyCardVisual } from "./baby-card-visual";

interface Reward {
  id: string;
  sessionNumber: number;
  displayName: string;
  displayIcon: string | null;
  rewardType: string;
  packageId: string | null;
  productId: string | null;
  customName: string | null;
  customDescription: string | null;
}

interface BabyCardPurchase {
  id: string;
  purchasedAt: string;
  pricePaid: number;
  status: string;
  completedSessions: number;
  babyCard: {
    id: string;
    name: string;
    totalSessions: number;
    firstSessionDiscount: number;
    rewards: Reward[];
  };
  unlockedRewards: Array<{
    id: string;
    rewardId: string;
    usedAt: string | null;
    reward: Reward;
  }>;
}

interface BabyCardProfileSectionProps {
  babyId: string;
  onSellCard: () => void;
  onUseReward: (purchaseId: string, rewardId: string, rewardName: string) => void;
}

export function BabyCardProfileSection({
  babyId,
  onSellCard,
  onUseReward,
}: BabyCardProfileSectionProps) {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const [purchases, setPurchases] = useState<BabyCardPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const fetchPurchases = useCallback(async () => {
    try {
      const response = await fetch(`/api/baby-cards/purchases/by-baby/${babyId}`);
      if (response.ok) {
        const data = await response.json();
        setPurchases(data);
      }
    } catch (error) {
      console.error("Error fetching baby card purchases:", error);
    } finally {
      setIsLoading(false);
    }
  }, [babyId]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "es-BO", {
      style: "currency",
      currency: locale === "pt-BR" ? "BRL" : "BOB",
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      locale === "pt-BR" ? "pt-BR" : "es-ES",
      { day: "numeric", month: "short", year: "numeric" }
    );
  };

  // Separate active and history purchases
  const activePurchase = purchases.find((p) => p.status === "ACTIVE");
  const historyPurchases = purchases.filter((p) => p.status !== "ACTIVE");

  // Calculate used reward IDs for the active purchase
  const usedRewardIds = (activePurchase?.unlockedRewards || [])
    .filter((ur) => ur.usedAt)
    .map((ur) => ur.rewardId);

  // Get unlocked and unused rewards
  const availableRewards = (activePurchase?.unlockedRewards || []).filter(
    (ur) => !ur.usedAt
  );

  if (isLoading) {
    return (
      <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Baby Card */}
      {activePurchase ? (
        <Card className="rounded-2xl border border-teal-200 bg-gradient-to-br from-white to-teal-50/50 p-6 shadow-lg shadow-teal-500/10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
                <IdCard className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  {activePurchase.babyCard.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {t("babyCard.profile.purchasedOn", {
                    date: formatDate(activePurchase.purchasedAt),
                  })}
                </p>
              </div>
            </div>
            <Badge className="rounded-full bg-emerald-100 text-emerald-700">
              {t("babyCard.status.active")}
            </Badge>
          </div>

          {/* Visual Card */}
          <div className="flex justify-center">
            <BabyCardVisual
              name={activePurchase.babyCard.name}
              totalSessions={activePurchase.babyCard.totalSessions}
              completedSessions={activePurchase.completedSessions}
              firstSessionDiscount={activePurchase.babyCard.firstSessionDiscount}
              firstSessionDiscountUsed={activePurchase.completedSessions > 0}
              rewards={activePurchase.babyCard.rewards}
              usedRewardIds={usedRewardIds}
              variant="preview"
            />
          </div>

          {/* Session Info */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-teal-50 p-3">
            <span className="text-sm text-gray-600">
              {t("babyCard.profile.sessionsCompleted")}
            </span>
            <span className="font-bold text-teal-700">
              {activePurchase.completedSessions} / {activePurchase.babyCard.totalSessions}
            </span>
          </div>

          {/* Available Rewards */}
          {availableRewards.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-3 flex items-center gap-2 font-medium text-gray-800">
                <Gift className="h-4 w-4 text-emerald-500" />
                {t("babyCard.profile.availableRewards")}
              </h4>
              <div className="space-y-2">
                {availableRewards.map((unlockedReward) => (
                  <div
                    key={unlockedReward.id}
                    className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                        {unlockedReward.reward.displayIcon ? (
                          <span className="text-lg">{unlockedReward.reward.displayIcon}</span>
                        ) : (
                          <Gift className="h-4 w-4 text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {unlockedReward.reward.displayName}
                        </p>
                        <p className="text-xs text-emerald-600">
                          {t("babyCard.rewards.unlockedAt", {
                            session: unlockedReward.reward.sessionNumber,
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        onUseReward(
                          activePurchase.id,
                          unlockedReward.rewardId,
                          unlockedReward.reward.displayName
                        )
                      }
                      className="h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                    >
                      {t("babyCard.rewards.use")}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Rewards - locked rewards (sessionNumber > completedSessions + 1) */}
          {activePurchase.babyCard.rewards.filter(
            (r) =>
              r.sessionNumber > activePurchase.completedSessions + 1 &&
              !usedRewardIds.includes(r.id)
          ).length > 0 && (
            <div className="mt-4">
              <h4 className="mb-3 flex items-center gap-2 font-medium text-gray-700">
                <Lock className="h-4 w-4 text-gray-400" />
                {t("babyCard.profile.upcomingRewards")}
              </h4>
              <div className="space-y-2">
                {activePurchase.babyCard.rewards
                  .filter(
                    (r) =>
                      r.sessionNumber > activePurchase.completedSessions + 1 &&
                      !usedRewardIds.includes(r.id)
                  )
                  .slice(0, 3)
                  .map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                          {reward.displayIcon ? (
                            <span className="text-lg grayscale">{reward.displayIcon}</span>
                          ) : (
                            <Gift className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">
                            {reward.displayName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t("babyCard.rewards.unlocksAt", {
                              session: reward.sessionNumber,
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="rounded-full border-gray-300 text-gray-500"
                      >
                        <Clock className="mr-1 h-3 w-3" />
                        {reward.sessionNumber - activePurchase.completedSessions - 1}{" "}
                        {t("babyCard.profile.sessionsAway")}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <IdCard className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="font-medium text-gray-700">
                  {t("babyCard.profile.noActiveCard")}
                </p>
                <p className="text-sm text-gray-500">
                  {t("babyCard.profile.noActiveCardDesc")}
                </p>
              </div>
            </div>
            <Button
              onClick={onSellCard}
              className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("babyCard.profile.sellCard")}
            </Button>
          </div>
        </Card>
      )}

      {/* Sell Another Card Button (when has active card) */}
      {activePurchase && (
        <Button
          variant="outline"
          onClick={onSellCard}
          className="w-full rounded-xl border-2 border-dashed border-teal-300 text-teal-600 transition-all hover:border-teal-400 hover:bg-teal-50"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("babyCard.profile.sellAnotherCard")}
        </Button>
      )}

      {/* History */}
      {historyPurchases.length > 0 && (
        <Card className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex w-full items-center justify-between"
          >
            <h3 className="font-semibold text-gray-800">
              {t("babyCard.profile.history")} ({historyPurchases.length})
            </h3>
            {showHistory ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {showHistory && (
            <div className="mt-4 space-y-3">
              {historyPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <IdCard className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">
                        {purchase.babyCard.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(purchase.purchasedAt)} •{" "}
                        {purchase.completedSessions}/{purchase.babyCard.totalSessions}{" "}
                        {t("common.sessionsUnit")}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`rounded-full ${
                      purchase.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-700"
                        : purchase.status === "REPLACED"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {purchase.status === "COMPLETED" && (
                      <Check className="mr-1 h-3 w-3" />
                    )}
                    {t(`babyCard.status.${purchase.status.toLowerCase()}`)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
