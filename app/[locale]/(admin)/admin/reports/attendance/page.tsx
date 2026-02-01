import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";
import { reportService } from "@/lib/services/report-service";
import { formatLocalDateString } from "@/lib/utils/date-utils";
import { DateRangeFilter } from "@/components/reports/date-range-filter";
import { KPICard } from "@/components/reports/kpi-card";
import { AttendanceChart } from "@/components/reports/attendance/attendance-chart";
import { NoShowList } from "@/components/reports/attendance/no-show-list";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttendancePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
}

export default async function AttendancePage({
  params,
  searchParams,
}: AttendancePageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const userRole = session.user.role as UserRole;
  if (!hasPermission(userRole, "reports:view-operational")) {
    redirect(`/${locale}/admin/reports`);
  }

  const t = await getTranslations("reports");
  const resolvedSearchParams = await searchParams;

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

  // Fetch attendance data
  const [stats, noShows] = await Promise.all([
    reportService.getAttendanceStats(from, to),
    reportService.getNoShows(from, to),
  ]);

  // Calculate totals
  const totals = stats.reduce(
    (acc, s) => ({
      completed: acc.completed + s.completed,
      noShow: acc.noShow + s.noShow,
      cancelled: acc.cancelled + s.cancelled,
      total: acc.total + s.total,
    }),
    { completed: 0, noShow: 0, cancelled: 0, total: 0 }
  );

  const attendanceRate = totals.total > 0
    ? ((totals.completed / totals.total) * 100).toFixed(1)
    : "100";

  // Serialize noShows for client
  const serializedNoShows = noShows.map((ns) => ({
    ...ns,
    date: ns.date.toISOString(),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/admin/reports`}>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-3xl font-bold text-transparent">
            {t("reports.attendance.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("reports.attendance.description")}
          </p>
        </div>
      </div>

      {/* Date Filter */}
      <DateRangeFilter
        locale={locale}
        basePath="/admin/reports/attendance"
        defaultFrom={formatLocalDateString(defaultFrom)}
        defaultTo={formatLocalDateString(defaultTo)}
      />

      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={t("attendance.completed")}
          value={totals.completed}
          subtitle={`${t("attendance.ofTotal")} ${totals.total}`}
          icon="CalendarCheck"
          variant="success"
        />
        <KPICard
          title={t("attendance.noShows")}
          value={totals.noShow}
          subtitle={totals.noShow > 0 ? t("attendance.requiresFollowUp") : t("attendance.perfect")}
          icon="CalendarX"
          variant={totals.noShow > 0 ? "danger" : "success"}
        />
        <KPICard
          title={t("attendance.cancelled")}
          value={totals.cancelled}
          subtitle={t("attendance.inPeriod")}
          icon="XCircle"
          variant={totals.cancelled > 5 ? "warning" : "default"}
        />
        <KPICard
          title={t("attendance.rate")}
          value={`${attendanceRate}%`}
          subtitle={t("attendance.attendanceRate")}
          icon="Percent"
          variant={parseFloat(attendanceRate) >= 90 ? "success" : parseFloat(attendanceRate) >= 75 ? "warning" : "danger"}
        />
      </div>

      {/* Chart */}
      <AttendanceChart data={stats} locale={locale} />

      {/* No-Show List */}
      <NoShowList items={serializedNoShows} locale={locale} />
    </div>
  );
}
