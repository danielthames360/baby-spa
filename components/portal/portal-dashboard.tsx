"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDateForDisplay } from "@/lib/utils/date-utils";
import { formatAge, calculateExactAge, isMesversario, AgeResult } from "@/lib/utils/age";
import { getGenderGradient } from "@/lib/utils/gender-utils";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Calendar,
  Sparkles,
  Baby,
  AlertTriangle,
  ChevronRight,
  Package,
  History,
  Loader2,
  Plus,
  CreditCard,
  Gift,
  Star,
  MessageCircle,
  Wallet,
  PartyPopper,
  Cake,
  X,
  Clock,
  FileText,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BabyCardVisual } from "@/components/baby-cards/baby-card-visual";
import type { AppointmentForActions } from "@/components/portal/appointment-actions";

// Dynamic imports for heavy dialog components (bundle-dynamic-imports)
const ScheduleDialog = dynamic(
  () => import("./portal-appointments").then((m) => m.ScheduleDialog),
  { ssr: false }
);

const CancelAppointmentDialog = dynamic(
  () => import("@/components/portal/appointment-actions").then((m) => m.CancelAppointmentDialog),
  { ssr: false }
);

const RescheduleAppointmentDialog = dynamic(
  () => import("@/components/portal/appointment-actions").then((m) => m.RescheduleAppointmentDialog),
  { ssr: false }
);

// LocalStorage key for welcome guide
const WELCOME_GUIDE_KEY = "babyspa_portal_welcomed";

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

// Financial summary interface
interface FinancialSummary {
  totalPending: number;
  packagesWithPending: number;
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

// Welcome Guide Component
function WelcomeGuide({
  onDismiss,
  parentName
}: {
  onDismiss: () => void;
  parentName: string;
}) {
  const t = useTranslations();

  const features = [
    { icon: Calendar, color: "from-teal-500 to-cyan-500", key: "appointments" },
    { icon: Clock, color: "from-purple-500 to-violet-500", key: "history" },
    { icon: Wallet, color: "from-amber-500 to-orange-500", key: "account" },
    { icon: User, color: "from-rose-500 to-pink-500", key: "profile" },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 via-cyan-50 to-white p-5 shadow-xl">
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="absolute right-3 top-3 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Decorative elements */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-teal-200/30 blur-2xl" />
      <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-cyan-200/30 blur-2xl" />

      <div className="relative">
        {/* Welcome header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">
              {t("portal.welcome.title", { name: parentName.split(" ")[0] })}
            </h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{t("portal.welcome.subtitle")}</p>
        </div>

        {/* Feature grid - single column on mobile, 2 cols on larger screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.key}
                className="flex items-center gap-3 rounded-xl bg-white/70 p-3 border border-white/50 shadow-sm"
              >
                <div className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                  feature.color
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    {t(`portal.welcome.feature.${feature.key}.title`)}
                  </p>
                  <p className="text-xs text-gray-500 leading-snug">
                    {t(`portal.welcome.feature.${feature.key}.desc`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <Button
          onClick={onDismiss}
          className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md hover:from-teal-600 hover:to-cyan-600"
        >
          {t("portal.welcome.cta")}
        </Button>
      </div>
    </div>
  );
}

export function PortalDashboard() {
  const t = useTranslations();
  const locale = useLocale();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);

  // Schedule dialog state
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedBabyId, setSelectedBabyId] = useState<string | undefined>(undefined);

  // Cancel/Reschedule dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [selectedAppointmentForAction, setSelectedAppointmentForAction] = useState<AppointmentForActions | null>(null);

  // Check welcome guide on mount
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(WELCOME_GUIDE_KEY);
    if (!hasSeenWelcome) {
      setShowWelcomeGuide(true);
    }
  }, []);

  const dismissWelcomeGuide = () => {
    localStorage.setItem(WELCOME_GUIDE_KEY, "true");
    setShowWelcomeGuide(false);
  };

  // Fetch all data in parallel using Promise.all (async-parallel)
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);

      // Parallel fetch for all independent requests (async-parallel)
      const [dashboardRes, settingsRes, financialRes] = await Promise.all([
        fetch("/api/portal/dashboard"),
        fetch("/api/settings/payment"),
        fetch("/api/portal/financial-summary"),
      ]);

      // Process dashboard data (critical)
      if (!dashboardRes.ok) {
        throw new Error("Failed to fetch data");
      }
      const dashboardData = await dashboardRes.json();
      setData(dashboardData);

      // Process payment settings (non-critical)
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setPaymentSettings(settingsData.settings);
      }

      // Process financial summary (non-critical)
      if (financialRes.ok) {
        const financialData = await financialRes.json();
        setFinancialSummary({
          totalPending: financialData.summary.totalPending,
          packagesWithPending: financialData.summary.packagesWithPending,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

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

  // Handler to open cancel dialog for next appointment
  const handleCancelClick = () => {
    if (!data?.nextAppointment) return;
    setSelectedAppointmentForAction({
      id: data.nextAppointment.id,
      date: data.nextAppointment.date,
      startTime: data.nextAppointment.startTime,
      endTime: data.nextAppointment.endTime,
      status: "SCHEDULED",
      baby: { id: data.nextAppointment.babyId, name: data.nextAppointment.babyName },
      hasPayments: false,
    });
    setShowCancelDialog(true);
  };

  // Handler to open reschedule dialog for next appointment
  const handleRescheduleClick = () => {
    if (!data?.nextAppointment) return;
    setSelectedAppointmentForAction({
      id: data.nextAppointment.id,
      date: data.nextAppointment.date,
      startTime: data.nextAppointment.startTime,
      endTime: data.nextAppointment.endTime,
      status: "SCHEDULED",
      baby: { id: data.nextAppointment.babyId, name: data.nextAppointment.babyName },
      hasPayments: false,
    });
    setShowRescheduleDialog(true);
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

  // Generate WhatsApp URL for general contact
  const getWhatsAppUrl = () => {
    if (!paymentSettings?.whatsappNumber) return "";
    const countryCode = (paymentSettings.whatsappCountryCode || "+591").replace("+", "");
    const phone = countryCode + paymentSettings.whatsappNumber.replace(/\D/g, "");
    return `https://wa.me/${phone}`;
  };

  return (
    <div className="space-y-5 pb-20">
      {/* ===== 1. WELCOME HEADER - Desktop only ===== */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-2xl">👋</span>
        <h1 className="text-xl font-bold text-gray-800">
          {t("portal.dashboard.hello")}, {data.parent.name.split(" ")[0]}!
        </h1>
      </div>

      {/* ===== 2. WELCOME GUIDE - First time only ===== */}
      {showWelcomeGuide && (
        <WelcomeGuide
          onDismiss={dismissWelcomeGuide}
          parentName={data.parent.name}
        />
      )}

      {/* ===== 3. MESVERSARIO BANNER ===== */}
      {data.babies.filter((b) => isMesversario(b.birthDate)).map((baby) => {
        const ageInMonths = calculateExactAge(baby.birthDate).totalMonths;
        return (
          <div
            key={`mesversario-${baby.id}`}
            className="relative overflow-hidden rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 p-4 shadow-lg"
          >
            <div className="absolute -right-4 -top-4 text-5xl opacity-20">🎂</div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-lg">
                <Cake className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <PartyPopper className="h-4 w-4 text-pink-500" />
                  <h3 className="font-bold text-pink-700 text-sm">
                    {t("portal.dashboard.happyMesversario")}
                  </h3>
                </div>
                <p className="text-sm text-pink-600 truncate">
                  {t("portal.dashboard.mesversarioMessage", { name: baby.name, months: ageInMonths })}
                </p>
              </div>
              <Button
                size="sm"
                className="shrink-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs px-3"
                onClick={() => handleScheduleClick(baby.id)}
                disabled={data.parent.requiresPrepayment}
              >
                <Gift className="mr-1.5 h-3.5 w-3.5" />
                {t("portal.dashboard.scheduleCelebration")}
              </Button>
            </div>
          </div>
        );
      })}

      {/* ===== 4. PREPAYMENT WARNING ===== */}
      {data.parent.requiresPrepayment && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800 text-sm">{t("portal.prepayment.title")}</p>
              <p className="text-xs text-amber-700">{t("portal.prepayment.message")}</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== 5. NEXT APPOINTMENT CARD ===== */}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-5 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-teal-600" />
          <h2 className="font-semibold text-gray-700">{t("portal.dashboard.nextAppointment")}</h2>
        </div>

        {data.nextAppointment ? (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white text-2xl shadow-md">
                👶🏻
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{data.nextAppointment.babyName}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  📆 {formatDate(data.nextAppointment.date)} - {data.nextAppointment.startTime}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <Link
                href="/portal/appointments"
                className="flex-1 text-center py-2 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
              >
                {t("portal.dashboard.viewDetails")}
              </Link>
              <button
                onClick={handleRescheduleClick}
                className="flex-1 text-center py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                📅 {t("portal.appointments.reschedule")}
              </button>
              <button
                onClick={handleCancelClick}
                className="flex-1 text-center py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                ❌ {t("portal.appointments.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">{t("portal.dashboard.noUpcomingAppointments")}</p>
            {!data.parent.requiresPrepayment && data.babies.length > 0 && (
              <Button
                onClick={() => handleScheduleClick(data.babies[0].id)}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("portal.dashboard.scheduleNow")}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ===== 6. MY BABIES SECTION ===== */}
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

      {/* ===== 7. BABY CARD SECTION - Active card OR Promo ===== */}
      {data.babies.some((b) => b.babyCard) ? (
        // Active Baby Card
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
      ) : data.babies.length > 0 ? (
        // Baby Card Promo
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
      ) : null}

      {/* ===== 8. SUMMARY + ACCOUNT GRID ===== */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Summary Card */}
        <div className="rounded-2xl border border-white/50 bg-white/70 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-teal-600" />
            <h2 className="font-semibold text-gray-700">{t("portal.dashboard.summary")}</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <Baby className="h-4 w-4" /> {t("portal.dashboard.babiesCount")}
              </span>
              <span className="font-semibold text-gray-800">{data.babies.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <Package className="h-4 w-4" /> {t("portal.dashboard.packagesCount")}
              </span>
              <span className="font-semibold text-gray-800">
                {data.babies.reduce((sum, b) => sum + b.packages.length, 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> {t("portal.dashboard.sessionsAvailableShort")}
              </span>
              <span className="font-bold text-lg bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                {data.totalRemainingSessions}
              </span>
            </div>
          </div>
        </div>

        {/* Account Card */}
        <Link
          href="/portal/account"
          className="group rounded-2xl border border-white/50 bg-white/70 p-5 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-teal-600" />
              <h2 className="font-semibold text-gray-700">{t("portal.dashboard.myAccount")}</h2>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </div>
          {financialSummary ? (
            financialSummary.totalPending > 0 ? (
              <div>
                <p className="text-sm text-gray-500">{t("portal.dashboard.pendingLabel")}</p>
                <p className="text-2xl font-bold text-amber-600">
                  Bs {financialSummary.totalPending.toLocaleString(locale)}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <span className="font-semibold text-emerald-600">{t("portal.dashboard.noPendingBalance")}</span>
              </div>
            )
          ) : (
            <p className="text-sm text-gray-400">{t("portal.dashboard.viewAccount")}</p>
          )}
        </Link>
      </div>

      {/* ===== 9. QUICK ACTIONS ===== */}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔗</span>
          <h2 className="font-semibold text-gray-700">{t("portal.dashboard.quickAccess")}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Link
            href="/portal/appointments"
            className="flex flex-col items-center gap-2 rounded-xl bg-teal-50 p-3 text-center hover:bg-teal-100 transition-colors"
          >
            <Calendar className="h-6 w-6 text-teal-600" />
            <span className="text-xs font-medium text-gray-700">{t("portal.dashboard.myAppointments")}</span>
          </Link>
          <Link
            href="/portal/history"
            className="flex flex-col items-center gap-2 rounded-xl bg-purple-50 p-3 text-center hover:bg-purple-100 transition-colors"
          >
            <History className="h-6 w-6 text-purple-600" />
            <span className="text-xs font-medium text-gray-700">{t("nav.history")}</span>
          </Link>
          <Link
            href="/portal/account"
            className="flex flex-col items-center gap-2 rounded-xl bg-amber-50 p-3 text-center hover:bg-amber-100 transition-colors"
          >
            <Wallet className="h-6 w-6 text-amber-600" />
            <span className="text-xs font-medium text-gray-700">{t("nav.account")}</span>
          </Link>
          {paymentSettings?.whatsappNumber && (
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-xl bg-green-50 p-3 text-center hover:bg-green-100 transition-colors"
            >
              <MessageCircle className="h-6 w-6 text-green-600" />
              <span className="text-xs font-medium text-gray-700">WhatsApp</span>
            </a>
          )}
        </div>
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
            fetchAllData(); // Refresh data
          }}
          preselectedBabyId={selectedBabyId}
        />
      )}

      {/* Cancel Appointment Dialog */}
      <CancelAppointmentDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        appointment={selectedAppointmentForAction}
        onSuccess={fetchAllData}
        whatsappNumber={paymentSettings?.whatsappNumber}
        whatsappCountryCode={paymentSettings?.whatsappCountryCode}
      />

      {/* Reschedule Appointment Dialog */}
      <RescheduleAppointmentDialog
        open={showRescheduleDialog}
        onOpenChange={setShowRescheduleDialog}
        appointment={selectedAppointmentForAction}
        onSuccess={fetchAllData}
        whatsappNumber={paymentSettings?.whatsappNumber}
        whatsappCountryCode={paymentSettings?.whatsappCountryCode}
      />
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

  return (
    <div className="rounded-xl border border-teal-100 bg-gradient-to-r from-white to-teal-50/30 p-4 transition-all hover:shadow-md">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-2xl shadow-md",
            getGenderGradient(baby.gender)
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
