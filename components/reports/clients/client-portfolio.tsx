"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency-utils";
import { formatDateForDisplay } from "@/lib/utils/date-utils";
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Star,
  AlertTriangle,
  Phone,
  Baby,
} from "lucide-react";

interface ClientPortfolioProps {
  data: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    topClients: {
      babyId: string;
      babyName: string;
      parentName: string;
      totalSpent: number;
      totalSessions: number;
    }[];
    atRisk: {
      babyId: string;
      babyName: string;
      parentName: string;
      parentPhone: string | null;
      lastVisit: Date | null;
      reason: "inactive" | "no_show" | "aging_out";
    }[];
  };
  locale: string;
}

export function ClientPortfolio({ data, locale }: ClientPortfolioProps) {
  const t = useTranslations("reports");

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          title={t("clients.total")}
          value={data.total.toString()}
          icon={<Users className="h-5 w-5" />}
          variant="default"
        />
        <SummaryCard
          title={t("clients.active")}
          value={data.active.toString()}
          icon={<UserCheck className="h-5 w-5" />}
          variant="success"
        />
        <SummaryCard
          title={t("clients.inactive")}
          value={data.inactive.toString()}
          icon={<UserX className="h-5 w-5" />}
          variant={data.inactive > 10 ? "warning" : "default"}
        />
        <SummaryCard
          title={t("clients.newThisMonth")}
          value={`+${data.newThisMonth}`}
          icon={<UserPlus className="h-5 w-5" />}
          variant="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Clients */}
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-800">
              {t("clients.topClients")}
            </h3>
          </div>

          {data.topClients.length === 0 ? (
            <p className="py-8 text-center text-gray-500">{t("clients.noTopClients")}</p>
          ) : (
            <div className="space-y-3">
              {data.topClients.slice(0, 5).map((client, index) => (
                <div
                  key={client.babyId}
                  className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-50/50 to-orange-50/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-orange-200">
                      <span className="text-sm font-bold text-amber-800">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{client.babyName}</p>
                      <p className="text-sm text-gray-500">{client.parentName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-amber-700">
                      {formatCurrency(client.totalSpent, locale)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {client.totalSessions} {t("clients.sessions")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* At Risk Clients */}
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            <h3 className="text-lg font-semibold text-gray-800">
              {t("clients.atRisk")}
            </h3>
          </div>

          {data.atRisk.length === 0 ? (
            <div className="py-8 text-center">
              <UserCheck className="mx-auto h-12 w-12 text-emerald-300" />
              <p className="mt-4 text-gray-500">{t("clients.noAtRisk")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.atRisk.slice(0, 5).map((client) => (
                <div
                  key={client.babyId}
                  className="flex items-center justify-between rounded-xl bg-gradient-to-r from-rose-50/50 to-pink-50/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-200 to-pink-200">
                      <Baby className="h-5 w-5 text-rose-700" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{client.babyName}</p>
                      <p className="text-sm text-gray-500">{client.parentName}</p>
                      <p className="text-xs text-rose-600">
                        {client.lastVisit
                          ? `${t("clients.lastVisit")}: ${formatDateForDisplay(new Date(client.lastVisit), locale === "pt-BR" ? "pt-BR" : "es-BO", { dateStyle: "short" })}`
                          : t("clients.noVisit")}
                      </p>
                    </div>
                  </div>
                  {client.parentPhone && (
                    <a
                      href={`tel:${client.parentPhone}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-600 transition-colors hover:bg-teal-200"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Style constants hoisted outside component to prevent re-creation on every render
const SUMMARY_VARIANT_STYLES = {
  default: {
    cardBg: "bg-gradient-to-br from-teal-100/70 via-cyan-50/60 to-white",
    border: "border-l-teal-400",
    iconBg: "bg-gradient-to-br from-teal-200/80 to-cyan-200/80",
    iconColor: "text-teal-700",
    valueColor: "text-teal-700",
  },
  success: {
    cardBg: "bg-gradient-to-br from-emerald-100/70 via-green-50/60 to-white",
    border: "border-l-emerald-400",
    iconBg: "bg-gradient-to-br from-emerald-200/80 to-green-200/80",
    iconColor: "text-emerald-700",
    valueColor: "text-emerald-700",
  },
  warning: {
    cardBg: "bg-gradient-to-br from-amber-100/70 via-orange-50/60 to-white",
    border: "border-l-amber-500",
    iconBg: "bg-gradient-to-br from-amber-200/80 to-orange-200/80",
    iconColor: "text-amber-700",
    valueColor: "text-amber-700",
  },
};

function SummaryCard({
  title,
  value,
  icon,
  variant,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  variant: "default" | "success" | "warning";
}) {
  const styles = SUMMARY_VARIANT_STYLES[variant];

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-white/50 p-4 shadow-lg backdrop-blur-md border-l-4",
      styles.cardBg,
      styles.border
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={cn("text-2xl font-bold", styles.valueColor)}>{value}</p>
        </div>
        <div className={cn("rounded-xl p-2", styles.iconBg, styles.iconColor)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
