import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";
import { reportService } from "@/lib/services/report-service";
import { formatCurrency } from "@/lib/utils/currency-utils";
import { ReceivablesTable } from "@/components/reports/receivables/receivables-table";
import { KPICard } from "@/components/reports/kpi-card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReceivablesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function ReceivablesPage({
  params,
  searchParams,
}: ReceivablesPageProps) {
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

  const status = (resolvedSearchParams.status || "all") as "all" | "overdue" | "pending";

  // Fetch receivables
  const receivables = await reportService.getReceivables(status);

  // Calculate totals
  const totalPending = receivables.reduce((sum, r) => sum + r.pendingAmount, 0);
  const totalOverdue = receivables
    .filter((r) => r.isOverdue)
    .reduce((sum, r) => sum + r.pendingAmount, 0);
  const overdueCount = receivables.filter((r) => r.isOverdue).length;

  // Serialize for client
  const serializedItems = receivables.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
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
            {t("reports.receivables.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("reports.receivables.description")}
          </p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KPICard
          title={t("receivables.totalPending")}
          value={formatCurrency(totalPending, locale)}
          subtitle={`${receivables.length} ${t("receivables.clients")}`}
          icon="CreditCard"
          variant="warning"
        />
        <KPICard
          title={t("receivables.overdue")}
          value={formatCurrency(totalOverdue, locale)}
          subtitle={overdueCount > 0 ? t("receivables.requiresAction") : t("receivables.allOnTime")}
          icon="AlertTriangle"
          variant={overdueCount > 0 ? "danger" : "success"}
        />
        <KPICard
          title={t("receivables.clientsWithDebt")}
          value={receivables.length}
          subtitle={`${overdueCount} ${t("receivables.overduePlural")}`}
          icon="Users"
          variant="default"
        />
      </div>

      {/* Table */}
      <ReceivablesTable items={serializedItems} locale={locale} />
    </div>
  );
}
