"use client";

import { useTranslations } from "next-intl";
import { UserRole } from "@prisma/client";
import {
  Calendar,
  Users,
  Baby,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  CreditCard,
} from "lucide-react";
import { StockAlertsWidget } from "@/components/dashboard";
import { hasPermission } from "@/lib/permissions";

interface DashboardStats {
  todayAppointments: number;
  activeClients: number;
  registeredBabies: number;
  pendingCheckouts: number;
  todayIncome?: number;
  monthIncome?: number;
  pendingPayments?: number;
  lowStockProducts?: number;
}

interface RoleDashboardProps {
  userRole: UserRole;
  userName: string;
  stats: DashboardStats;
}

export function RoleDashboard({ userRole, userName, stats }: RoleDashboardProps) {
  const t = useTranslations();

  const canViewFinance = hasPermission(userRole, "dashboard:view-finance");
  const canViewOperations = hasPermission(userRole, "dashboard:view-operations");

  // Header personalizado por rol
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

  // Color principal del sistema - consistente con nav active
  const getRoleColor = () => "from-teal-500 to-cyan-500";

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

      {/* Stats Cards - Operaciones (todos los que tienen permiso) */}
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
            icon={Clock}
            label={t("dashboard.pendingCheckouts")}
            value={stats.pendingCheckouts}
            bgColor="bg-amber-50"
            iconColor="text-amber-500"
            alert={stats.pendingCheckouts > 0}
          />
          <StatCard
            icon={Users}
            label={t("dashboard.activeClients")}
            value={stats.activeClients}
            bgColor="bg-cyan-50"
            iconColor="text-cyan-500"
          />
          <StatCard
            icon={Baby}
            label={t("dashboard.registeredBabies")}
            value={stats.registeredBabies}
            bgColor="bg-rose-50"
            iconColor="text-rose-400"
          />
        </div>
      )}

      {/* Stats Cards - Finanzas (solo OWNER/ADMIN) */}
      {canViewFinance && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            icon={DollarSign}
            label={t("dashboard.todayIncome")}
            value={stats.todayIncome ?? 0}
            bgColor="bg-emerald-50"
            iconColor="text-emerald-500"
            isCurrency
          />
          <StatCard
            icon={TrendingUp}
            label={t("dashboard.monthIncome")}
            value={stats.monthIncome ?? 0}
            bgColor="bg-blue-50"
            iconColor="text-blue-500"
            isCurrency
          />
          <StatCard
            icon={CreditCard}
            label={t("dashboard.pendingPayments")}
            value={stats.pendingPayments ?? 0}
            bgColor="bg-orange-50"
            iconColor="text-orange-400"
            isCurrency
            alert={(stats.pendingPayments ?? 0) > 0}
          />
        </div>
      )}

      {/* Main content area */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule Summary */}
        {canViewOperations && (
          <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
                <Calendar className="h-5 w-5 text-teal-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-700">
                {t("dashboard.todaySummary")}
              </h2>
            </div>
            <div className="mt-6 space-y-3">
              <SummaryItem
                icon={CheckCircle}
                label={t("dashboard.completedToday")}
                value="--"
                color="text-green-600"
              />
              <SummaryItem
                icon={Clock}
                label={t("dashboard.inProgress")}
                value={String(stats.pendingCheckouts)}
                color="text-amber-600"
              />
              <SummaryItem
                icon={Calendar}
                label={t("dashboard.scheduledRemaining")}
                value={String(stats.todayAppointments)}
                color="text-teal-600"
              />
            </div>
          </div>
        )}

        {/* Stock Alerts */}
        <StockAlertsWidget />
      </div>
    </div>
  );
}

// Componente de tarjeta de estadística
interface StatCardProps {
  icon: typeof Calendar;
  label: string;
  value: number;
  bgColor: string;
  iconColor: string;
  isCurrency?: boolean;
  alert?: boolean;
}

function StatCard({
  icon: Icon,
  label,
  value,
  bgColor,
  iconColor,
  isCurrency,
  alert,
}: StatCardProps) {
  const formatValue = () => {
    if (isCurrency) {
      return new Intl.NumberFormat("es-BO", {
        style: "currency",
        currency: "BOB",
        minimumFractionDigits: 0,
      }).format(value);
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

// Componente de item de resumen
interface SummaryItemProps {
  icon: typeof CheckCircle;
  label: string;
  value: string;
  color: string;
}

function SummaryItem({ icon: Icon, label, value, color }: SummaryItemProps) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-gray-50 to-white p-4">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${color}`} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className={`text-lg font-semibold ${color}`}>{value}</span>
    </div>
  );
}
