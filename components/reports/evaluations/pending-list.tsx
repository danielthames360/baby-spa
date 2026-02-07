"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, ClipboardList, Clock } from "lucide-react";

interface PendingEvaluation {
  id: string;
  appointmentId: string;
  date: string;
  startTime: string;
  babyId: string;
  babyName: string;
  therapistId: string;
  therapistName: string;
  sessionNumber: number;
  completedAt: string | null;
}

interface PendingListProps {
  items: PendingEvaluation[];
  locale: string;
}

// Helper functions hoisted outside component to prevent re-creation on every render
function formatEvaluationDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(
    locale === "pt-BR" ? "pt-BR" : "es-BO",
    { weekday: "short", day: "2-digit", month: "short" }
  );
}

function getDaysSince(dateStr: string | null) {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function PendingList({ items, locale }: PendingListProps) {
  const t = useTranslations("reports.evaluations");

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/50 bg-white/70 p-8 text-center shadow-lg backdrop-blur-md">
        <div className="flex flex-col items-center gap-2">
          <ClipboardList className="h-12 w-12 text-emerald-500" />
          <p className="font-medium text-gray-900">{t("allComplete")}</p>
          <p className="text-sm text-gray-500">{t("noDataDescription")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/50 bg-white/70 shadow-lg backdrop-blur-md">
      <div className="border-b border-gray-100 p-4">
        <h3 className="font-semibold text-gray-900">{t("pendingList")}</h3>
        <p className="text-sm text-gray-500">{t("pendingListDescription")}</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-100">
            <TableHead className="text-gray-500">{t("date")}</TableHead>
            <TableHead className="text-gray-500">{t("session")}</TableHead>
            <TableHead className="text-gray-500">{t("baby")}</TableHead>
            <TableHead className="text-gray-500">{t("therapist")}</TableHead>
            <TableHead className="text-center text-gray-500">{t("daysPending")}</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const daysSince = getDaysSince(item.completedAt);
            const isUrgent = daysSince > 7;
            const isWarning = daysSince > 3;

            return (
              <TableRow
                key={item.id}
                className={cn(
                  "border-b border-gray-50",
                  isUrgent && "bg-rose-50/50",
                  isWarning && !isUrgent && "bg-amber-50/30"
                )}
              >
                <TableCell className="text-gray-600">
                  <div>
                    <p>{formatEvaluationDate(item.date, locale)}</p>
                    <p className="text-xs text-gray-400">{item.startTime}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-1 text-xs font-medium text-teal-700">
                    #{item.sessionNumber}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-gray-900">
                  {item.babyName}
                </TableCell>
                <TableCell className="text-gray-600">
                  {item.therapistName}
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                    isUrgent && "bg-rose-100 text-rose-700",
                    isWarning && !isUrgent && "bg-amber-100 text-amber-700",
                    !isWarning && "bg-gray-100 text-gray-700"
                  )}>
                    <Clock className="h-3 w-3" />
                    {daysSince} {t("days")}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <Link href={`/${locale}/admin/calendar?date=${item.date.split("T")[0]}`}>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
