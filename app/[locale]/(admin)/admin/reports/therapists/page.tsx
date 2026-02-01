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
import { TherapistTable } from "@/components/reports/therapists/therapist-table";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TherapistsReportPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
}

export default async function TherapistsReportPage({
  params,
  searchParams,
}: TherapistsReportPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const userRole = session.user.role as UserRole;
  if (!hasPermission(userRole, "reports:view-financial")) {
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

  // Fetch therapist performance report
  const report = await reportService.getTherapistPerformance(from, to);

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
            {t("reports.therapists.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("reports.therapists.description")}
          </p>
        </div>
      </div>

      {/* Date Filter */}
      <DateRangeFilter
        locale={locale}
        basePath="/admin/reports/therapists"
        defaultFrom={formatLocalDateString(defaultFrom)}
        defaultTo={formatLocalDateString(defaultTo)}
      />

      {/* Therapist Performance Table */}
      <TherapistTable data={report} />
    </div>
  );
}
