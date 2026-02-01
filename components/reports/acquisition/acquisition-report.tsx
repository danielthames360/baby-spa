"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  UserPlus,
  Users,
  TrendingUp,
  Phone,
  Calendar,
  Target,
} from "lucide-react";

interface AcquisitionReportProps {
  data: {
    newClients: {
      count: number;
      list: {
        babyId: string;
        babyName: string;
        parentName: string;
        registeredAt: Date;
        firstPackage: string | null;
      }[];
    };
    leads: {
      total: number;
      list: {
        id: string;
        name: string;
        phone: string | null;
        pregnancyWeeks: number | null;
        source: string | null;
        createdAt: Date;
      }[];
    };
    convertedLeads: number;
    conversionRate: number;
  };
}

export function AcquisitionReport({ data }: AcquisitionReportProps) {
  const t = useTranslations("reports");

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title={t("acquisition.newClients")}
          value={data.newClients.count.toString()}
          icon={<UserPlus className="h-5 w-5" />}
          variant="success"
        />
        <SummaryCard
          title={t("acquisition.activeLeads")}
          value={data.leads.total.toString()}
          icon={<Users className="h-5 w-5" />}
          variant="default"
        />
        <SummaryCard
          title={t("acquisition.conversionRate")}
          value={`${data.conversionRate.toFixed(1)}%`}
          subtitle={`${data.convertedLeads} ${t("acquisition.converted")}`}
          icon={<TrendingUp className="h-5 w-5" />}
          variant={data.conversionRate >= 20 ? "success" : "warning"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* New Clients */}
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              {t("acquisition.newClients")}
            </h3>
          </div>

          {data.newClients.list.length === 0 ? (
            <p className="py-8 text-center text-gray-500">{t("acquisition.noNewClients")}</p>
          ) : (
            <div className="space-y-3">
              {data.newClients.list.slice(0, 8).map((client) => (
                <div
                  key={client.babyId}
                  className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-50/50 to-green-50/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-200 to-green-200">
                      <UserPlus className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{client.babyName}</p>
                      <p className="text-sm text-gray-500">{client.parentName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {new Date(client.registeredAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leads Funnel */}
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              {t("acquisition.leadsFunnel")}
            </h3>
          </div>

          {/* Funnel Visualization */}
          <div className="space-y-3">
            <FunnelStep
              label={t("acquisition.totalLeads")}
              value={data.leads.total}
              percent={100}
              variant="full"
            />
            <FunnelStep
              label={t("acquisition.converted")}
              value={data.convertedLeads}
              percent={data.conversionRate}
              variant="partial"
            />
          </div>

          {/* Leads List */}
          <div className="mt-6">
            <h4 className="mb-3 text-sm font-medium text-gray-600">
              {t("acquisition.activeLeadsList")}
            </h4>
            {data.leads.list.length === 0 ? (
              <p className="py-4 text-center text-gray-500">{t("acquisition.noLeads")}</p>
            ) : (
              <div className="space-y-2">
                {data.leads.list.slice(0, 5).map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{lead.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {lead.pregnancyWeeks && (
                          <span>{lead.pregnancyWeeks} {t("acquisition.weeks")}</span>
                        )}
                        {lead.source && (
                          <span className="rounded bg-teal-100 px-2 py-0.5 text-xs text-teal-700">
                            {lead.source}
                          </span>
                        )}
                      </div>
                    </div>
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
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
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  variant,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  variant: "default" | "success" | "warning";
}) {
  const VARIANT_STYLES = {
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

  const styles = VARIANT_STYLES[variant];

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
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>
        <div className={cn("rounded-xl p-2", styles.iconBg, styles.iconColor)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function FunnelStep({
  label,
  value,
  percent,
  variant,
}: {
  label: string;
  value: number;
  percent: number;
  variant: "full" | "partial";
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-800">{value} ({percent.toFixed(0)}%)</span>
      </div>
      <div
        className={cn(
          "h-8 rounded-lg flex items-center justify-center",
          variant === "full"
            ? "bg-gradient-to-r from-teal-200 to-cyan-200"
            : "bg-gradient-to-r from-emerald-200 to-green-200"
        )}
        style={{ width: `${Math.max(percent, 10)}%` }}
      >
        <span className={cn(
          "text-xs font-medium",
          variant === "full" ? "text-teal-800" : "text-emerald-800"
        )}>
          {value}
        </span>
      </div>
    </div>
  );
}
