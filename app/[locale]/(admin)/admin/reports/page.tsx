import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";
import { reportService } from "@/lib/services/report-service";
import { formatCurrency } from "@/lib/utils/currency-utils";
import { formatLocalDateString } from "@/lib/utils/date-utils";
import { DateRangeFilter } from "@/components/reports/date-range-filter";
import {
  DollarSign,
  TrendingUp,
  CalendarCheck,
  AlertTriangle,
  ArrowRight,
  Package,
  ClipboardList,
  CreditCard,
  Users,
  Calendar,
  BarChart3,
  Wallet,
  UserPlus,
  CalendarX,
  Award,
  PartyPopper,
} from "lucide-react";

interface ReportsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
}

// Categorías de reportes con colores distintivos
const REPORT_CATEGORIES = {
  finance: {
    color: "emerald",
    bgGradient: "from-emerald-50 to-green-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    borderColor: "border-emerald-200",
    hoverBorder: "hover:border-emerald-300",
  },
  operations: {
    color: "teal",
    bgGradient: "from-teal-50 to-cyan-50",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    borderColor: "border-teal-200",
    hoverBorder: "hover:border-teal-300",
  },
  services: {
    color: "violet",
    bgGradient: "from-violet-50 to-purple-50",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    borderColor: "border-violet-200",
    hoverBorder: "hover:border-violet-300",
  },
  management: {
    color: "amber",
    bgGradient: "from-amber-50 to-orange-50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    borderColor: "border-amber-200",
    hoverBorder: "hover:border-amber-300",
  },
};

export default async function ReportsPage({
  params,
  searchParams,
}: ReportsPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const userRole = session.user.role as UserRole;
  if (!hasPermission(userRole, "reports:view")) {
    redirect(`/${locale}/admin/dashboard`);
  }

  const t = await getTranslations("reports");
  const resolvedSearchParams = await searchParams;

  const canViewFinancial = hasPermission(userRole, "reports:view-financial");
  const canViewOperational = hasPermission(userRole, "reports:view-operational");

  // Default to current month
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const from = resolvedSearchParams.from
    ? new Date(resolvedSearchParams.from + "T00:00:00")
    : defaultFrom;
  const to = resolvedSearchParams.to
    ? new Date(resolvedSearchParams.to + "T23:59:59")
    : defaultTo;

  const kpis = await reportService.getDashboardKPIs(from, to);

  // Calculate alerts
  const alerts = [];
  if (kpis.totalReceivables > 0) {
    alerts.push({
      type: "warning" as const,
      label: t("alerts.receivables"),
      value: formatCurrency(kpis.totalReceivables, locale),
      href: `/${locale}/admin/reports/receivables`,
    });
  }
  if (kpis.outOfStockProducts > 0) {
    alerts.push({
      type: "danger" as const,
      label: t("alerts.outOfStock"),
      value: `${kpis.outOfStockProducts}`,
      href: `/${locale}/admin/reports/inventory`,
    });
  }
  if (kpis.lowStockProducts > 0) {
    alerts.push({
      type: "warning" as const,
      label: t("alerts.lowStock"),
      value: `${kpis.lowStockProducts}`,
      href: `/${locale}/admin/reports/inventory`,
    });
  }
  if (kpis.pendingEvaluations > 0) {
    alerts.push({
      type: "warning" as const,
      label: t("alerts.pendingEvaluations"),
      value: `${kpis.pendingEvaluations}`,
      href: `/${locale}/admin/reports/evaluations`,
    });
  }
  if (kpis.noShowAppointments > 0) {
    alerts.push({
      type: "danger" as const,
      label: t("alerts.noShows"),
      value: `${kpis.noShowAppointments}`,
      href: `/${locale}/admin/reports/attendance`,
    });
  }

  // Define all reports with categories
  const allReports = [
    // Finance
    {
      key: "income",
      category: "finance" as const,
      icon: TrendingUp,
      href: `/${locale}/admin/reports/income`,
      requiresFinancial: true,
    },
    {
      key: "receivables",
      category: "finance" as const,
      icon: CreditCard,
      href: `/${locale}/admin/reports/receivables`,
      requiresFinancial: true,
    },
    {
      key: "pnl",
      category: "finance" as const,
      icon: BarChart3,
      href: `/${locale}/admin/reports/pnl`,
      requiresFinancial: true,
    },
    {
      key: "cashflow",
      category: "finance" as const,
      icon: Wallet,
      href: `/${locale}/admin/reports/cashflow`,
      requiresFinancial: true,
    },
    // Operations
    {
      key: "attendance",
      category: "operations" as const,
      icon: CalendarX,
      href: `/${locale}/admin/reports/attendance`,
      requiresFinancial: false,
    },
    {
      key: "therapists",
      category: "operations" as const,
      icon: Users,
      href: `/${locale}/admin/reports/therapists`,
      requiresFinancial: true,
    },
    {
      key: "clients",
      category: "operations" as const,
      icon: Users,
      href: `/${locale}/admin/reports/clients`,
      requiresFinancial: true,
    },
    {
      key: "occupancy",
      category: "operations" as const,
      icon: Calendar,
      href: `/${locale}/admin/reports/occupancy`,
      requiresFinancial: true,
    },
    // Services
    {
      key: "packages",
      category: "services" as const,
      icon: Package,
      href: `/${locale}/admin/reports/packages`,
      requiresFinancial: true,
    },
    {
      key: "babyCards",
      category: "services" as const,
      icon: Award,
      href: `/${locale}/admin/reports/baby-cards`,
      requiresFinancial: true,
    },
    {
      key: "events",
      category: "services" as const,
      icon: PartyPopper,
      href: `/${locale}/admin/reports/events`,
      requiresFinancial: true,
    },
    // Management
    {
      key: "inventory",
      category: "management" as const,
      icon: Package,
      href: `/${locale}/admin/reports/inventory`,
      requiresFinancial: false,
    },
    {
      key: "evaluations",
      category: "management" as const,
      icon: ClipboardList,
      href: `/${locale}/admin/reports/evaluations`,
      requiresFinancial: true,
    },
    {
      key: "payroll",
      category: "management" as const,
      icon: DollarSign,
      href: `/${locale}/admin/reports/payroll`,
      requiresFinancial: true,
    },
    {
      key: "acquisition",
      category: "management" as const,
      icon: UserPlus,
      href: `/${locale}/admin/reports/acquisition`,
      requiresFinancial: true,
    },
  ];

  // Filter reports based on permissions
  const visibleReports = allReports.filter((report) => {
    if (report.requiresFinancial && !canViewFinancial) return false;
    if (!report.requiresFinancial && !canViewOperational) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-3xl font-bold text-transparent">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      {/* Date Filter */}
      <DateRangeFilter
        locale={locale}
        basePath="/admin/reports"
        defaultFrom={formatLocalDateString(defaultFrom)}
        defaultTo={formatLocalDateString(defaultTo)}
      />

      {/* Key Metrics - 4 cards only */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {canViewFinancial && (
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-5">
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-100/50" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-100 p-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">{t("kpi.totalIncome")}</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {formatCurrency(kpis.totalIncome, locale)}
              </p>
            </div>
          </div>
        )}

        <div className="relative overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-5">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-teal-100/50" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-teal-100 p-2">
                <CalendarCheck className="h-4 w-4 text-teal-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">{t("kpi.completedSessions")}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-teal-700">
              {kpis.completedAppointments}
              <span className="ml-2 text-sm font-normal text-gray-500">
                / {kpis.totalAppointments}
              </span>
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-5">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-violet-100/50" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-violet-100 p-2">
                <Users className="h-4 w-4 text-violet-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">{t("kpi.activeBabies")}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-violet-700">
              {kpis.activeBabies}
              {kpis.newBabiesThisMonth > 0 && (
                <span className="ml-2 text-sm font-normal text-emerald-600">
                  +{kpis.newBabiesThisMonth}
                </span>
              )}
            </p>
          </div>
        </div>

        {canViewFinancial && (
          <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-amber-100/50" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-amber-100 p-2">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">{t("kpi.attendanceRate")}</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-amber-700">
                {kpis.totalAppointments > 0
                  ? Math.round((kpis.completedAppointments / kpis.totalAppointments) * 100)
                  : 100}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/80 to-orange-50/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            <h2 className="font-semibold text-gray-800">{t("alerts.title")}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.map((alert, idx) => (
              <Link
                key={idx}
                href={alert.href}
                className={`group flex items-center gap-2 rounded-xl px-3 py-2 transition-all hover:scale-105 ${
                  alert.type === "danger"
                    ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                }`}
              >
                <span className="font-medium">{alert.value}</span>
                <span className="text-sm opacity-80">{alert.label}</span>
                <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All Reports Grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("allReports")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleReports.map((report) => {
            const category = REPORT_CATEGORIES[report.category];
            const Icon = report.icon;
            return (
              <Link
                key={report.key}
                href={report.href}
                className={`group flex items-center gap-3 rounded-xl border bg-gradient-to-br p-4 transition-all hover:shadow-md ${category.bgGradient} ${category.borderColor} ${category.hoverBorder}`}
              >
                <div className={`rounded-lg p-2.5 ${category.iconBg}`}>
                  <Icon className={`h-5 w-5 ${category.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {t(`reports.${report.key}.title`)}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    {t(`reports.${report.key}.description`)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Category Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-emerald-200" />
          <span>{t("categories.finance")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-teal-200" />
          <span>{t("categories.operations")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-violet-200" />
          <span>{t("categories.services")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-amber-200" />
          <span>{t("categories.management")}</span>
        </div>
      </div>
    </div>
  );
}
