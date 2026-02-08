"use client";

import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  CheckCircle,
  CreditCard,
  Gift,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotificationSound } from "@/hooks/use-notification-sound";
import type { BabyCardPortalInfo, ClientType } from "../types";

interface SuccessStepProps {
  clientType: ClientType | null;
  clientName: string;
  selectedPackageName: string;
  selectedDate: Date | null;
  selectedTime: string;
  unlockedReward: {
    displayName: string;
    displayIcon: string | null;
  } | null;
  babyCardInfo: BabyCardPortalInfo | null;
  onClose: () => void;
}

export function SuccessStep({
  clientType,
  clientName,
  selectedPackageName,
  selectedDate,
  selectedTime,
  unlockedReward,
  babyCardInfo,
  onClose,
}: SuccessStepProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === "pt-BR" ? "pt-BR" : "es-BO";
  const { playSound } = useNotificationSound();

  // Play confirmation sound when success step mounts
  useEffect(() => {
    playSound();
  }, [playSound]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-8 text-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Reward unlocked celebration */}
      {unlockedReward ? (
        <>
          <div className="mx-auto flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-500 shadow-xl shadow-purple-200">
            <Gift className="h-12 w-12 text-white" />
          </div>
          <h3 className="mt-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-2xl font-bold text-transparent">
            {t("babyCard.portal.rewardUnlocked")}
          </h3>
          <div className="mt-4 rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-4 shadow-lg">
            <div className="flex items-center justify-center gap-3">
              {unlockedReward.displayIcon ? (
                <span className="text-3xl">{unlockedReward.displayIcon}</span>
              ) : (
                <Star className="h-8 w-8 text-amber-500" />
              )}
              <span className="text-lg font-bold text-violet-800">
                {unlockedReward.displayName}
              </span>
            </div>
            <p className="mt-2 text-sm text-violet-600">
              {t("babyCard.portal.rewardUnlockedDesc")}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 shadow-lg shadow-emerald-100">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <h3 className="mt-6 text-xl font-bold text-gray-800">
            {t("portal.appointments.appointmentConfirmed")}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {t("portal.appointments.wizard.successMessage")}
          </p>
        </>
      )}

      {/* Summary */}
      <div className="mt-6 w-full max-w-xs space-y-2 rounded-xl bg-gray-50 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">
            {clientType === "self" ? t("common.client") : t("common.baby")}:
          </span>
          <span className="font-medium text-gray-800">{clientName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t("common.package")}:</span>
          <span className="font-medium text-gray-800">
            {selectedPackageName}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t("common.date")}:</span>
          <span className="font-medium text-gray-800">
            {selectedDate?.toLocaleDateString(dateLocale, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t("common.time")}:</span>
          <span className="font-medium text-gray-800">{selectedTime}</span>
        </div>
      </div>

      {/* Baby Card progress - show if has card but no reward unlocked */}
      {babyCardInfo?.hasActiveCard &&
        babyCardInfo.purchase &&
        !unlockedReward && (
          <div className="mt-4 w-full max-w-xs rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 shadow-md">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-violet-800">
                  {babyCardInfo.purchase.babyCardName}
                </p>
                <p className="text-xs text-violet-600">
                  {t("babyCard.portal.sessionProgress", {
                    current: babyCardInfo.purchase.completedSessions + 1,
                    total: babyCardInfo.purchase.totalSessions,
                  })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-bold text-violet-700">
                  {Math.round(
                    ((babyCardInfo.purchase.completedSessions + 1) /
                      babyCardInfo.purchase.totalSessions) *
                      100
                  )}
                  %
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-2 w-full rounded-full bg-violet-200/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                style={{
                  width: `${((babyCardInfo.purchase.completedSessions + 1) / babyCardInfo.purchase.totalSessions) * 100}%`,
                }}
              />
            </div>

            {/* Next reward teaser */}
            {babyCardInfo.nextReward &&
              babyCardInfo.nextReward.sessionsUntilUnlock > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/50 p-2">
                  <Gift className="h-4 w-4 text-violet-500" />
                  <p className="text-xs text-violet-700">
                    {t("babyCard.portal.nextRewardIn", {
                      sessions: babyCardInfo.nextReward.sessionsUntilUnlock,
                      reward: babyCardInfo.nextReward.displayName,
                    })}
                  </p>
                </div>
              )}
          </div>
        )}

      {/* Baby Card Promo - Show if baby appointment and NO active card */}
      {clientType === "baby" &&
        (!babyCardInfo || !babyCardInfo.hasActiveCard) && (
          <div className="mt-4 w-full max-w-xs rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-fuchsia-400 shadow-md">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-violet-800">
                  {t("portal.babyCardPromo.successTeaser")}
                </p>
                <p className="text-xs text-violet-600">
                  {t("portal.babyCardPromo.successTeaserDesc")}
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Close button at bottom */}
      <Button
        onClick={onClose}
        className={cn(
          "mt-6 h-12 w-full max-w-xs gap-2 rounded-xl text-base font-semibold text-white shadow-lg transition-all",
          unlockedReward
            ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-violet-200 hover:from-violet-600 hover:to-fuchsia-600"
            : "bg-gradient-to-r from-teal-500 to-cyan-500 shadow-teal-200 hover:from-teal-600 hover:to-cyan-600"
        )}
      >
        {t("common.close")}
      </Button>
    </div>
  );
}
