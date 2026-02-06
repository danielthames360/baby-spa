"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Send,
  CheckCircle2,
  Eye,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  TrendingUp,
  Calendar,
  User,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface EmailStats {
  period: {
    start: string;
    end: string;
    days: number;
  };
  stats: {
    total: number;
    delivered: number;
    opened: number;
    bounced: number;
    complained: number;
    sent: number;
  };
  rates: {
    delivery: string;
    open: string;
    bounce: string;
  };
  byCategory: Record<string, { total: number; delivered: number; opened: number; bounced: number }>;
  byDay: Record<string, { total: number; delivered: number; opened: number; bounced: number }>;
  problematicEmails: {
    id: string;
    toEmail: string;
    templateKey: string;
    status: string;
    bounceReason: string | null;
    createdAt: string;
    parent: { id: string; name: string; email: string } | null;
  }[];
  parentsWithIssues: {
    id: string;
    name: string;
    email: string;
    emailBounceCount: number;
  }[];
}

export default function EmailStatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("messagesModule");
  const locale = useLocale();

  const isOwner = session?.user?.role === "OWNER";

  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("7");

  const dateLocale = locale === "pt-BR" ? "pt-BR" : "es-BO";

  // Redirect non-OWNER users
  useEffect(() => {
    if (status === "authenticated" && !isOwner) {
      router.replace("/admin/messages/pending");
    }
  }, [status, isOwner, router]);

  useEffect(() => {
    if (isOwner) {
      fetchStats();
    }
  }, [days, isOwner]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/email-stats?days=${days}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Show nothing while checking auth
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  // Not authorized
  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldAlert className="h-12 w-12 text-amber-500" />
        <h3 className="mt-4 text-lg font-semibold text-gray-800">
          {t("stats.restricted")}
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          {t("stats.restrictedDescription")}
        </p>
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            {t("stats.title")}
          </h2>
          <p className="text-sm text-gray-500">
            {t("stats.lastDays", { days: stats.period.days })}
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-36 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t("stats.last7")}</SelectItem>
              <SelectItem value="14">{t("stats.last14")}</SelectItem>
              <SelectItem value="30">{t("stats.last30")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            className="gap-2 rounded-xl"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="mb-2 inline-flex rounded-lg bg-gray-100 p-2 text-gray-600">
            <Send className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{stats.stats.total}</div>
          <div className="text-xs text-gray-500">{t("stats.sent")}</div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="mb-2 inline-flex rounded-lg bg-emerald-100 p-2 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{stats.stats.delivered}</div>
          <div className="text-xs text-gray-500">{t("stats.delivered")} ({stats.rates.delivery})</div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="mb-2 inline-flex rounded-lg bg-blue-100 p-2 text-blue-600">
            <Eye className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{stats.stats.opened}</div>
          <div className="text-xs text-gray-500">{t("stats.opened")} ({stats.rates.open})</div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="mb-2 inline-flex rounded-lg bg-amber-100 p-2 text-amber-600">
            <XCircle className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{stats.stats.bounced}</div>
          <div className="text-xs text-gray-500">{t("stats.bounced")} ({stats.rates.bounce})</div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="mb-2 inline-flex rounded-lg bg-rose-100 p-2 text-rose-600">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{stats.stats.complained}</div>
          <div className="text-xs text-gray-500">{t("stats.complaints")}</div>
        </div>
      </div>

      {/* By Category */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-800">
          <TrendingUp className="h-5 w-5 text-green-500" />
          {t("stats.byCategory")}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="pb-2">{t("stats.colCategory")}</th>
                <th className="pb-2 text-right">{t("stats.colTotal")}</th>
                <th className="pb-2 text-right">{t("stats.colDelivered")}</th>
                <th className="pb-2 text-right">{t("stats.colOpened")}</th>
                <th className="pb-2 text-right">{t("stats.colBounced")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(stats.byCategory).map(([category, data]) => (
                <tr key={category}>
                  <td className="py-3 font-medium">
                    {t(`stats.categoryLabels.${category}`, { defaultValue: category })}
                  </td>
                  <td className="py-3 text-right">{data.total}</td>
                  <td className="py-3 text-right text-emerald-600">{data.delivered}</td>
                  <td className="py-3 text-right text-blue-600">{data.opened}</td>
                  <td className="py-3 text-right text-amber-600">{data.bounced}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Day */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-800">
          <Calendar className="h-5 w-5 text-green-500" />
          {t("stats.byDay")}
        </h3>
        <div className="space-y-2">
          {Object.entries(stats.byDay)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 7)
            .map(([day, data]) => {
              const maxTotal = Math.max(
                ...Object.values(stats.byDay).map((d) => d.total)
              );
              const width = maxTotal > 0 ? (data.total / maxTotal) * 100 : 0;

              return (
                <div key={day} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-500">
                    {new Date(day).toLocaleDateString(dateLocale, {
                      weekday: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="flex-1">
                    <div className="relative h-6 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                        style={{ width: `${width}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                        {data.total} {t("stats.sentCount")}
                      </div>
                    </div>
                  </div>
                  <div className="flex w-32 gap-2 text-xs">
                    <span className="text-emerald-600">{data.delivered} {t("stats.deliveredShort")}</span>
                    <span className="text-blue-600">{data.opened} {t("stats.openedShort")}</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Parents with Issues */}
      {stats.parentsWithIssues.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            {t("stats.parentsWithIssues")}
          </h3>
          <p className="mb-4 text-sm text-amber-700">
            {t("stats.parentsWithIssuesDescription")}
          </p>
          <div className="space-y-2">
            {stats.parentsWithIssues.map((parent) => (
              <div
                key={parent.id}
                className="flex items-center justify-between rounded-xl bg-white p-3"
              >
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-800">{parent.name}</div>
                    <div className="text-sm text-gray-500">{parent.email}</div>
                  </div>
                </div>
                <div className="rounded-full bg-amber-100 px-2 py-1 text-sm font-medium text-amber-700">
                  {t("stats.bounceCount", { count: parent.emailBounceCount })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Problems */}
      {stats.problematicEmails.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-800">
            <XCircle className="h-5 w-5 text-rose-500" />
            {t("stats.recentProblems")}
          </h3>
          <div className="space-y-2">
            {stats.problematicEmails.slice(0, 10).map((email) => (
              <div
                key={email.id}
                className="flex flex-col gap-2 rounded-xl bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-medium text-gray-800">{email.toEmail}</div>
                  <div className="text-sm text-gray-500">
                    {email.templateKey} • {new Date(email.createdAt).toLocaleDateString(dateLocale)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-xs font-medium",
                      email.status === "BOUNCED"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                    )}
                  >
                    {email.status === "BOUNCED" ? t("stats.statusBounced") : t("stats.statusComplaint")}
                  </span>
                  {email.bounceReason && (
                    <span className="text-xs text-gray-500">
                      {email.bounceReason.slice(0, 50)}...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
