"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency-utils";
import {
  Wallet,
  Users,
  TrendingUp,
  AlertTriangle,
  Briefcase,
} from "lucide-react";

interface PayrollReportProps {
  data: {
    summary: {
      totalPayroll: number;
      salaries: number;
      commissions: number;
      bonuses: number;
      benefits: number;
      deductions: number;
    };
    byEmployee: {
      name: string;
      total: number;
    }[];
    advances: {
      pending: {
        staffId: string;
        staffName: string;
        balance: number;
      }[];
      totalPending: number;
    };
  };
  locale: string;
}

export function PayrollReportComponent({ data, locale }: PayrollReportProps) {
  const t = useTranslations("reports");

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-teal-100/70 via-cyan-50/60 to-white p-6 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{t("payroll.totalPayroll")}</p>
            <p className="text-3xl font-bold text-teal-700">
              {formatCurrency(data.summary.totalPayroll, locale)}
            </p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-teal-200/80 to-cyan-200/80 p-3">
            <Wallet className="h-6 w-6 text-teal-700" />
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid gap-4 md:grid-cols-5">
        <BreakdownCard
          title={t("payroll.salaries")}
          value={formatCurrency(data.summary.salaries, locale)}
          variant="default"
        />
        <BreakdownCard
          title={t("payroll.commissions")}
          value={formatCurrency(data.summary.commissions, locale)}
          variant="success"
        />
        <BreakdownCard
          title={t("payroll.bonuses")}
          value={formatCurrency(data.summary.bonuses, locale)}
          variant="success"
        />
        <BreakdownCard
          title={t("payroll.benefits")}
          value={formatCurrency(data.summary.benefits, locale)}
          variant="default"
        />
        <BreakdownCard
          title={t("payroll.deductions")}
          value={`-${formatCurrency(data.summary.deductions, locale)}`}
          variant="danger"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Employee */}
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              {t("payroll.byEmployee")}
            </h3>
          </div>

          {data.byEmployee.length === 0 ? (
            <p className="py-8 text-center text-gray-500">{t("payroll.noPayments")}</p>
          ) : (
            <div className="space-y-3">
              {data.byEmployee.map((emp, index) => {
                const maxTotal = data.byEmployee[0]?.total || 1;
                const percent = (emp.total / maxTotal) * 100;

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-800">{emp.name}</span>
                      <span className="font-semibold text-teal-700">
                        {formatCurrency(emp.total, locale)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-300 to-cyan-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Advances */}
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                {t("payroll.pendingAdvances")}
              </h3>
            </div>
            <div className="rounded-lg bg-amber-100 px-3 py-1">
              <span className="font-semibold text-amber-700">
                {formatCurrency(data.advances.totalPending, locale)}
              </span>
            </div>
          </div>

          {data.advances.pending.length === 0 ? (
            <div className="py-8 text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-emerald-300" />
              <p className="mt-4 text-gray-500">{t("payroll.noAdvances")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.advances.pending.map((adv) => (
                <div
                  key={adv.staffId}
                  className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-50/50 to-orange-50/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-orange-200">
                      <AlertTriangle className="h-5 w-5 text-amber-700" />
                    </div>
                    <span className="font-medium text-gray-800">{adv.staffName}</span>
                  </div>
                  <span className="font-semibold text-amber-700">
                    {formatCurrency(adv.balance, locale)}
                  </span>
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
const BREAKDOWN_VARIANT_STYLES = {
  default: "bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700",
  success: "bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-700",
  danger: "bg-gradient-to-br from-rose-50 to-pink-50 text-rose-700",
};

function BreakdownCard({
  title,
  value,
  variant,
}: {
  title: string;
  value: string;
  variant: "default" | "success" | "danger";
}) {
  return (
    <div className={cn("rounded-xl p-4 text-center", BREAKDOWN_VARIANT_STYLES[variant])}>
      <p className="text-xs font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
