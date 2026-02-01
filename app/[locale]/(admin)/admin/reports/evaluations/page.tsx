import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";
import { reportService } from "@/lib/services/report-service";
import { KPICard } from "@/components/reports/kpi-card";
import { PendingList } from "@/components/reports/evaluations/pending-list";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EvaluationsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function EvaluationsPage({
  params,
}: EvaluationsPageProps) {
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

  // Fetch pending evaluations
  const evaluations = await reportService.getPendingEvaluations(100);

  // Calculate stats
  const now = new Date();
  const getDaysSince = (date: Date | null) => {
    if (!date) return 0;
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  };

  const urgent = evaluations.filter((e) => getDaysSince(e.completedAt) > 7).length;
  const warning = evaluations.filter((e) => {
    const days = getDaysSince(e.completedAt);
    return days > 3 && days <= 7;
  }).length;
  const recent = evaluations.filter((e) => getDaysSince(e.completedAt) <= 3).length;

  // Serialize for client
  const serializedItems = evaluations.map((e) => ({
    ...e,
    date: e.date.toISOString(),
    completedAt: e.completedAt?.toISOString() || null,
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
            {t("reports.evaluations.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("reports.evaluations.description")}
          </p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={t("evaluations.total")}
          value={evaluations.length}
          subtitle={evaluations.length === 0 ? t("evaluations.allComplete") : t("evaluations.pending")}
          icon="ClipboardList"
          variant={evaluations.length === 0 ? "success" : "warning"}
        />
        <KPICard
          title={t("evaluations.urgent")}
          value={urgent}
          subtitle={urgent > 0 ? t("evaluations.moreThan7Days") : t("evaluations.none")}
          icon="AlertTriangle"
          variant={urgent > 0 ? "danger" : "success"}
        />
        <KPICard
          title={t("evaluations.warning")}
          value={warning}
          subtitle={t("evaluations.between3And7Days")}
          icon="Clock"
          variant={warning > 0 ? "warning" : "success"}
        />
        <KPICard
          title={t("evaluations.recent")}
          value={recent}
          subtitle={t("evaluations.lessThan3Days")}
          icon="CheckCircle"
          variant="default"
        />
      </div>

      {/* List */}
      <PendingList items={serializedItems} locale={locale} />
    </div>
  );
}
