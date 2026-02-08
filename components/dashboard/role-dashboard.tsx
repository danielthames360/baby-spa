"use client";

import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/lib/utils/currency-utils";
import { UserRole } from "@prisma/client";
import {
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  ClipboardCheck,
  Receipt,
} from "lucide-react";
import { StockAlertsWidget } from "@/components/dashboard";
import { hasPermission } from "@/lib/permissions";

interface DashboardStats {
  todayAppointments: number;
  completedToday: number;
  pendingCheckouts: number;
  pendingEvaluations: number;
  todayIncome?: number;
  todayExpenses?: number;
  monthIncome?: number;
  monthExpenses?: number;
  pendingPayments?: number;
}

interface RoleDashboardProps {
  userRole: UserRole;
  userName: string;
  stats: DashboardStats;
}

export function RoleDashboard({ userRole, userName, stats }: RoleDashboardProps) {
  const t = useTranslations();
  const locale = useLocale();

  const canViewFinance = hasPermission(userRole, "dashboard:view-finance");
  const canViewOperations = hasPermission(userRole, "dashboard:view-operations");

  const getWelcomeMessage = () => {
    switch (userRole) {
      case "OWNER":
        return t("dashboard.welcomeOwner");
      case "ADMIN":
        return t("dashboard.welcomeAdmin");
      case "RECEPTION":
        return t("dashboard.welcomeReception");
      default:
        return t("common.welcomeTo") + " Baby Spa";
    }
  };

  const getRoleColor = () => "from-teal-500 to-cyan-500";

  // Finance calculations
  const todayNet = (stats.todayIncome ?? 0) - (stats.todayExpenses ?? 0);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div
        className={`rounded-2xl border border-white/50 bg-gradient-to-r ${getRoleColor()} p-6 text-white shadow-lg`}
      >
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t("common.hello")}, {userName}
        </h1>
        <p className="mt-1 opacity-90">{getWelcomeMessage()}</p>
      </div>

      {/* Operations Cards */}
      {canViewOperations && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Calendar}
            label={t("dashboard.todayAppointments")}
            value={stats.todayAppointments}
            bgColor="bg-teal-50"
            iconColor="text-teal-500"
          />
          <StatCard
            icon={CheckCircle}
            label={t("dashboard.completedToday")}
            value={stats.completedToday}
            bgColor="bg-emerald-50"
            iconColor="text-emerald-500"
          />
          <StatCard
            icon={Clock}
            label={t("dashboard.pendingCheckouts")}
            value={stats.pendingCheckouts}
            bgColor="bg-amber-50"
            iconColor="text-amber-500"
            alert={stats.pendingCheckouts > 0}
          />
          <StatCard
            icon={ClipboardCheck}
            label={t("dashboard.pendingEvaluations")}
            value={stats.pendingEvaluations}
            bgColor="bg-violet-50"
            iconColor="text-violet-500"
            alert={stats.pendingEvaluations > 0}
          />
        </div>
      )}

      {/* Finance - Today */}
      {canViewFinance && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            icon={DollarSign}
            label={t("dashboard.todayIncome")}
            value={stats.todayIncome ?? 0}
            bgColor="bg-emerald-50"
            iconColor="text-emerald-500"
            isCurrency
            locale={locale}
          />
          <StatCard
            icon={Receipt}
            label={t("dashboard.todayExpenses")}
            value={stats.todayExpenses ?? 0}
            bgColor="bg-rose-50"
            iconColor="text-rose-400"
            isCurrency
            locale={locale}
          />
          <StatCard
            icon={todayNet >= 0 ? TrendingUp : TrendingDown}
            label={t("dashboard.todayNetMargin")}
            value={todayNet}
            bgColor={todayNet >= 0 ? "bg-blue-50" : "bg-red-50"}
            iconColor={todayNet >= 0 ? "text-blue-500" : "text-red-500"}
            isCurrency
            locale={locale}
          />
        </div>
      )}

      {/* Finance - Month */}
      {canViewFinance && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            icon={TrendingUp}
            label={t("dashboard.monthIncome")}
            value={stats.monthIncome ?? 0}
            bgColor="bg-emerald-50"
            iconColor="text-emerald-500"
            isCurrency
            locale={locale}
          />
          <StatCard
            icon={TrendingDown}
            label={t("dashboard.monthExpenses")}
            value={stats.monthExpenses ?? 0}
            bgColor="bg-rose-50"
            iconColor="text-rose-400"
            isCurrency
            locale={locale}
          />
          <StatCard
            icon={CreditCard}
            label={t("dashboard.pendingPayments")}
            value={stats.pendingPayments ?? 0}
            bgColor="bg-orange-50"
            iconColor="text-orange-400"
            isCurrency
            locale={locale}
            alert={(stats.pendingPayments ?? 0) > 0}
          />
        </div>
      )}

      {/* Stock Alerts */}
      <StockAlertsWidget />
    </div>
  );
}

// Stat card component
interface StatCardProps {
  icon: typeof Calendar;
  label: string;
  value: number;
  bgColor: string;
  iconColor: string;
  isCurrency?: boolean;
  locale?: string;
  alert?: boolean;
}

function StatCard({
  icon: Icon,
  label,
  value,
  bgColor,
  iconColor,
  isCurrency,
  locale,
  alert,
}: StatCardProps) {
  const formatValue = () => {
    if (isCurrency && locale) {
      return formatCurrency(value, locale);
    }
    return value.toString();
  };

  return (
    <div
      className={`group rounded-2xl border bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        alert ? "border-amber-200" : "border-white/50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgColor}`}
        >
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        {alert && (
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-gray-800">{formatValue()}</p>
      <p className="mt-1 text-sm font-medium text-gray-600">{label}</p>
    </div>
  );
}
