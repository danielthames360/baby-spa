import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";
import { reportService } from "@/lib/services/report-service";
import { formatCurrency } from "@/lib/utils/currency-utils";
import { KPICard } from "@/components/reports/kpi-card";
import { InventoryTable } from "@/components/reports/inventory/inventory-table";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InventoryPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    filter?: string;
  }>;
}

export default async function InventoryPage({
  params,
  searchParams,
}: InventoryPageProps) {
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

  const filter = (resolvedSearchParams.filter || "all") as "all" | "low-stock" | "out-of-stock";

  // Fetch inventory report
  const items = await reportService.getInventoryReport(filter);

  // Calculate summary
  const summary = {
    total: items.length,
    ok: items.filter((i) => i.status === "ok").length,
    lowStock: items.filter((i) => i.status === "low").length,
    outOfStock: items.filter((i) => i.status === "out").length,
    totalValue: items.reduce((sum, i) => sum + i.costPrice * i.currentStock, 0),
  };

  // Serialize for client
  const serializedItems = items.map((i) => ({
    ...i,
    lastMovementDate: i.lastMovementDate?.toISOString() || null,
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
            {t("reports.inventory.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("reports.inventory.description")}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "low-stock", "out-of-stock"] as const).map((f) => (
          <Link
            key={f}
            href={`/${locale}/admin/reports/inventory${f !== "all" ? `?filter=${f}` : ""}`}
          >
            <Button
              variant={filter === f ? "default" : "outline"}
              size="sm"
              className={filter === f ? "bg-gradient-to-r from-teal-500 to-cyan-500" : ""}
            >
              {t(`inventory.filters.${f}`)}
              {f === "low-stock" && summary.lowStock > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 text-xs text-white">
                  {summary.lowStock}
                </span>
              )}
              {f === "out-of-stock" && summary.outOfStock > 0 && (
                <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 text-xs text-white">
                  {summary.outOfStock}
                </span>
              )}
            </Button>
          </Link>
        ))}
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={t("inventory.totalProducts")}
          value={summary.total}
          subtitle={`${summary.ok} ${t("inventory.inStock")}`}
          icon="Package"
          variant="default"
        />
        <KPICard
          title={t("inventory.lowStock")}
          value={summary.lowStock}
          subtitle={summary.lowStock > 0 ? t("inventory.needsReorder") : t("inventory.allGood")}
          icon="AlertTriangle"
          variant={summary.lowStock > 0 ? "warning" : "success"}
        />
        <KPICard
          title={t("inventory.outOfStock")}
          value={summary.outOfStock}
          subtitle={summary.outOfStock > 0 ? t("inventory.urgent") : t("inventory.allGood")}
          icon="XCircle"
          variant={summary.outOfStock > 0 ? "danger" : "success"}
        />
        <KPICard
          title={t("inventory.totalValue")}
          value={formatCurrency(summary.totalValue, locale)}
          subtitle={t("inventory.atCost")}
          icon="DollarSign"
          variant="default"
        />
      </div>

      {/* Table */}
      <InventoryTable items={serializedItems} locale={locale} />
    </div>
  );
}
