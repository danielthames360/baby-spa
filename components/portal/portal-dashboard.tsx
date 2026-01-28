"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDateForDisplay } from "@/lib/utils/date-utils";
import { formatAge, AgeResult } from "@/lib/utils/age";
import Link from "next/link";
import {
  Calendar,
  Sparkles,
  Heart,
  Clock,
  Baby,
  AlertTriangle,
  ChevronRight,
  Phone,
  Package,
  History,
  Loader2,
  Plus,
  CreditCard,
  Gift,
  Star,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScheduleDialog, ScheduleBabyData } from "./portal-appointments";
import { BabyCardVisual } from "@/components/baby-cards/baby-card-visual";

interface BabyPackage {
  id: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  package: {
    id: string;
    name: string;
    categoryId: string | null;
    duration: number;
  };
}

interface BabyCardReward {
  id: string;
  sessionNumber: number;
  displayName: string;
  displayIcon: string | null;
  rewardType: string;
}

interface BabyCardInfo {
  purchaseId: string;
  name: string;
  totalSessions: number;
  completedSessions: number;
  progressPercent: number;
  rewards: BabyCardReward[];
  usedRewardIds: string[];
}

interface BabyData {
  id: string;
  name: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  birthDate: string;
  ageMonths: number;
  age: AgeResult;
  relationship: string;
  remainingSessions: number;
  packages: BabyPackage[];
  nextAppointment: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
  } | null;
  babyCard: BabyCardInfo | null;
}

interface NextAppointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  babyName: string;
  babyId: string;
}

interface DashboardData {
  parent: {
    id: string;
    name: string;
    noShowCount: number;
    requiresPrepayment: boolean;
  };
  babies: BabyData[];
  totalRemainingSessions: number;
  nextAppointment: NextAppointment | null;
}

// Payment settings interface for WhatsApp
interface PaymentSettings {
  whatsappNumber: string | null;
  whatsappCountryCode: string | null;
}

// Mock rewards for the promo Baby Card preview (24 sessions)
const MOCK_PROMO_REWARDS = [
  { id: "promo-1", sessionNumber: 1, displayName: "Aceite Relajante", displayIcon: "🎁", rewardType: "PRODUCT" },
  { id: "promo-2", sessionNumber: 4, displayName: "Sesión Gratis", displayIcon: "📸", rewardType: "FREE_SESSION" },
  { id: "promo-3", sessionNumber: 7, displayName: "Foto Profesional", displayIcon: "🎂", rewardType: "OTHER" },
  { id: "promo-4", sessionNumber: 10, displayName: "Kit de Baño", displayIcon: "🌈", rewardType: "PRODUCT" },
  { id: "promo-5", sessionNumber: 13, displayName: "Masaje Especial", displayIcon: "👶🏼", rewardType: "OTHER" },
  { id: "promo-5", sessionNumber: 16, displayName: "Masaje Especial", displayIcon: "🎉 j", rewardType: "OTHER" },
  { id: "promo-5", sessionNumber: 17, displayName: "Masaje Especial", displayIcon: "👨🏼‍⚕️", rewardType: "OTHER" },
  { id: "promo-5", sessionNumber: 20, displayName: "Masaje Especial", displayIcon: "🎈", rewardType: "OTHER" },
  { id: "promo-6", sessionNumber: 24, displayName: "Diploma + Regalo", displayIcon: "🎓", rewardType: "OTHER" },
];

export function PortalDashboard() {
  const t = useTranslations();
  const locale = useLocale();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);

  // Schedule dialog state
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedBabyId, setSelectedBabyId] = useState<string | undefined>(undefined);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/portal/dashboard");
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch("/api/settings/payment");
      if (response.ok) {
        const result = await response.json();
        setPaymentSettings(result.settings);
      }
    } catch (err) {
      console.error("Error fetching payment settings:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPaymentSettings();
  }, []);

  // Generate WhatsApp URL for Baby Card inquiry
  const getBabyCardWhatsAppUrl = () => {
    if (!paymentSettings?.whatsappNumber) return "";

    const countryCode = (paymentSettings.whatsappCountryCode || "+591").replace("+", "");
    const phone = countryCode + paymentSettings.whatsappNumber.replace(/\D/g, "");

    const message = t("portal.babyCardPromo.whatsappMessage");
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  // Handler to open schedule dialog for a specific baby
  const handleScheduleClick = (babyId: string) => {
    setSelectedBabyId(babyId);
    setShowScheduleDialog(true);
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
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString, locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  return (
    <div className="space-y-6">
      {/* Prepayment Warning Banner */}
      {data.parent.requiresPrepayment && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800">
                {t("portal.prepayment.title")}
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                {t("portal.prepayment.message")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
              asChild
            >
              <a href="https://wa.me/59170000000" target="_blank" rel="noopener noreferrer">
                <Phone className="mr-2 h-4 w-4" />
                {t("portal.prepayment.contact")}
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-gradient-to-r from-teal-500 to-cyan-500 p-6 text-white shadow-lg shadow-teal-200/50">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-200" />
            <h1 className="text-2xl font-bold">
              {t("auth.welcome")}, {data.parent.name.split(" ")[0]}!
            </h1>
          </div>
          <p className="mt-1 text-teal-100">
            {t("portal.dashboard.welcomeSubtitle")}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Total Sessions */}
        <div className="group rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-gray-600">
              {t("portal.dashboard.totalSessions")}
            </p>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-4xl font-bold text-transparent">
              {data.totalRemainingSessions}
            </span>
            <span className="text-sm text-gray-500">
              {t("portal.dashboard.sessionsAvailable")}
            </span>
          </div>
        </div>

        {/* Next Appointment */}
        <div className="group rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-md shadow-amber-200">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-gray-600">
              {t("portal.dashboard.nextAppointment")}
            </p>
          </div>
          <div className="mt-4">
            {data.nextAppointment ? (
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  {formatDate(data.nextAppointment.date)}
                </p>
                <p className="text-sm text-gray-500">
                  {data.nextAppointment.startTime} - {data.nextAppointment.babyName}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                {t("portal.dashboard.noAppointments")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Baby Card Section - Only show if any baby has an active card */}
      {data.babies.some((b) => b.babyCard) && (
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-200">
                <CreditCard className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-700">
                {t("babyCard.portal.myCard")}
              </h2>
            </div>
            {(() => {
              const babyWithCard = data.babies.find((b) => b.babyCard);
              if (babyWithCard) {
                return (
                  <Link
                    href={`/portal/baby-card/${babyWithCard.id}`}
                    className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    {t("common.seeMore")}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                );
              }
              return null;
            })()}
          </div>

          {data.babies
            .filter((baby) => baby.babyCard)
            .map((baby) => (
              <Link
                key={baby.id}
                href={`/portal/baby-card/${baby.id}`}
                className="block max-w-md mx-auto"
              >
                <div className="mb-2 text-sm text-gray-600 text-center">
                  {t("babyCard.portal.cardFor", { babyName: baby.name })}
                </div>
                <BabyCardVisual
                  name={baby.babyCard!.name}
                  totalSessions={baby.babyCard!.totalSessions}
                  completedSessions={baby.babyCard!.completedSessions}
                  rewards={baby.babyCard!.rewards}
                  usedRewardIds={baby.babyCard!.usedRewardIds}
                  variant="preview"
                />
              </Link>
            ))}
        </div>
      )}

      {/* My Babies Section */}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-pink-400 text-white shadow-md shadow-rose-200">
              <Baby className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700">
              {t("portal.dashboard.myBabies")}
            </h2>
          </div>
        </div>

        {data.babies.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-8 text-center">
            <Baby className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 font-medium text-gray-500">
              {t("portal.dashboard.noBabies")}
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {t("portal.dashboard.noBabiesDescription")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.babies.map((baby) => (
              <BabyCard
                key={baby.id}
                baby={baby}
                requiresPrepayment={data.parent.requiresPrepayment}
                onScheduleClick={() => handleScheduleClick(baby.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Baby Card Promo Section - Only show if NO baby has an active card */}
      {data.babies.length > 0 && !data.babies.some((b) => b.babyCard) && (
        <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-lg backdrop-blur-sm">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {t("portal.babyCardPromo.title")}
                </h3>
                <p className="text-sm text-white/80">
                  {t("portal.babyCardPromo.subtitle")}
                </p>
              </div>
            </div>
          </div>

          {/* Baby Card Preview */}
          <div className="p-6 space-y-5">
            {/* Mock Baby Card Visual */}
            <div className="max-w-md mx-auto">
              <BabyCardVisual
                name="Baby Card"
                totalSessions={24}
                completedSessions={0}
                rewards={MOCK_PROMO_REWARDS}
                usedRewardIds={[]}
                variant="preview"
              />
            </div>

            {/* Benefits Grid */}
            <div className="grid gap-3">
              {/* Benefit 1: Rewards */}
              <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 p-3 border border-teal-100">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 shadow-md">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {t("portal.babyCardPromo.benefit1Title")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("portal.babyCardPromo.benefit1Desc")}
                  </p>
                </div>
              </div>

              {/* Benefit 2: Special Prices */}
              <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 p-3 border border-teal-100">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-400 shadow-md">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {t("portal.babyCardPromo.benefit2Title")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("portal.babyCardPromo.benefit2Desc")}
                  </p>
                </div>
              </div>

              {/* Benefit 3: First Session Discount */}
              <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 p-3 border border-teal-100">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400 to-pink-400 shadow-md">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {t("portal.babyCardPromo.benefit3Title")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("portal.babyCardPromo.benefit3Desc")}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            {paymentSettings?.whatsappNumber && (
              <a
                href={getBabyCardWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-teal-200 transition-all hover:from-teal-600 hover:to-cyan-600 hover:shadow-xl"
              >
                <MessageCircle className="h-5 w-5" />
                {t("portal.babyCardPromo.cta")}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/portal/appointments"
          className="group flex items-center justify-between rounded-2xl border border-white/50 bg-white/70 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
              <Calendar className="h-5 w-5 text-teal-600" />
            </div>
            <span className="font-medium text-gray-700">
              {t("portal.dashboard.viewAppointments")}
            </span>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/portal/history"
          className="group flex items-center justify-between rounded-2xl border border-white/50 bg-white/70 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-violet-100">
              <History className="h-5 w-5 text-purple-600" />
            </div>
            <span className="font-medium text-gray-700">
              {t("portal.dashboard.viewHistory")}
            </span>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Schedule Dialog */}
      {data && !data.parent.requiresPrepayment && (
        <ScheduleDialog
          open={showScheduleDialog}
          onOpenChange={(open) => {
            setShowScheduleDialog(open);
            if (!open) setSelectedBabyId(undefined);
          }}
          babies={data.babies.map((baby) => ({
            id: baby.id,
            name: baby.name,
            gender: baby.gender,
            totalRemainingSessions: baby.remainingSessions,
            packages: baby.packages.map((pkg) => ({
              id: pkg.id,
              totalSessions: pkg.totalSessions,
              usedSessions: pkg.usedSessions,
              remainingSessions: pkg.remainingSessions,
              package: pkg.package,
            })),
          }))}
          onSuccess={() => {
            setShowScheduleDialog(false);
            setSelectedBabyId(undefined);
            fetchData(); // Refresh data
          }}
          preselectedBabyId={selectedBabyId}
        />
      )}
    </div>
  );
}

interface BabyCardProps {
  baby: BabyData;
  requiresPrepayment: boolean;
  onScheduleClick: () => void;
}

function BabyCard({ baby, requiresPrepayment, onScheduleClick }: BabyCardProps) {
  const t = useTranslations();
  const locale = useLocale();

  const getGenderEmoji = (gender: string) => {
    switch (gender) {
      case "MALE":
        return "👶🏻";
      case "FEMALE":
        return "👧🏻";
      default:
        return "👶";
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case "MALE":
        return "from-sky-400 to-blue-500";
      case "FEMALE":
        return "from-rose-400 to-pink-500";
      default:
        return "from-teal-400 to-cyan-500";
    }
  };

  return (
    <div className="rounded-xl border border-teal-100 bg-gradient-to-r from-white to-teal-50/30 p-4 transition-all hover:shadow-md">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-2xl shadow-md",
            getGenderColor(baby.gender)
          )}
        >
          {getGenderEmoji(baby.gender)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-800">{baby.name}</h3>
              <p className="text-sm text-gray-500">{formatAge(baby.age, t)}</p>
            </div>

            {/* Sessions Badge */}
            <div className="shrink-0 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-3 py-1 text-sm font-medium text-white shadow-sm">
              {baby.remainingSessions} {t("common.sessionsUnit")}
            </div>
          </div>

          {/* Packages */}
          {baby.packages.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {baby.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-2 py-1 text-xs"
                >
                  <Package className="h-3 w-3 text-teal-500" />
                  <span className="text-teal-700">{pkg.package.name}</span>
                  <span className="text-teal-500">
                    ({pkg.remainingSessions}/{pkg.totalSessions})
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Next Appointment for this baby */}
          {baby.nextAppointment && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>
                {t("portal.dashboard.nextAppointment")}:{" "}
                {formatDateForDisplay(baby.nextAppointment.date, locale, {
                  day: "numeric",
                  month: "short",
                })}{" "}
                - {baby.nextAppointment.startTime}
              </span>
            </div>
          )}

          {/* Schedule button if no appointment (available for all babies, even without packages) */}
          {!baby.nextAppointment && !requiresPrepayment && (
            <div className="mt-3">
              <button
                onClick={onScheduleClick}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-teal-200/50 transition-all hover:from-teal-600 hover:to-cyan-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                <Calendar className="h-4 w-4" />
                {t("portal.dashboard.scheduleNow")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
