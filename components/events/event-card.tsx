"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Calendar, Clock, Users, ChevronRight, Baby, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateForDisplay } from "@/lib/utils/date-utils";
import { formatCurrency } from "@/lib/utils/currency-utils";

// Status badge styles
const STATUS_STYLES: Record<string, string> = {
  DRAFT: "border-gray-200 bg-gray-50 text-gray-600",
  PUBLISHED: "border-teal-200 bg-teal-50 text-teal-700",
  IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-600",
};

interface EventCardProps {
  event: {
    id: string;
    name: string;
    type: "BABIES" | "PARENTS";
    date: Date | string;
    startTime: string;
    endTime: string;
    status: string;
    maxParticipants: number;
    basePrice: number | { toString(): string };
    participants?: { status: string }[];
    _count?: { participants: number };
  };
  locale?: string;
}

export function EventCard({ event, locale = "es" }: EventCardProps) {
  const t = useTranslations("events");

  const participantCount = event._count?.participants ??
    event.participants?.filter(p => p.status !== "CANCELLED").length ?? 0;

  const dateStr = formatDateForDisplay(
    event.date,
    locale === "pt-BR" ? "pt-BR" : "es-ES",
    { weekday: "short", day: "numeric", month: "short" }
  );

  return (
    <Link href={`/${locale}/admin/events/${event.id}`}>
      <Card className="group cursor-pointer rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg shadow-teal-500/10 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/20">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
            {event.type === "BABIES" ? (
              <Baby className="h-7 w-7 text-teal-600" />
            ) : (
              <UserRound className="h-7 w-7 text-cyan-600" />
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-lg font-semibold text-gray-800">
                {event.name}
              </h3>
              <Badge
                variant="outline"
                className={`rounded-full text-xs ${STATUS_STYLES[event.status] || STATUS_STYLES.DRAFT}`}
              >
                {t(event.status.toLowerCase())}
              </Badge>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {dateStr}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {event.startTime} - {event.endTime}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <Badge
                variant="outline"
                className="rounded-full border-gray-200 bg-gray-50 text-xs text-gray-600"
              >
                {t(`types.${event.type}`)}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Users className="h-3.5 w-3.5" />
                {participantCount}/{event.maxParticipants}
              </span>
              <span className="text-xs font-medium text-teal-600">
                {formatCurrency(Number(event.basePrice), locale)}
              </span>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-300 transition-colors group-hover:text-teal-500" />
        </div>
      </Card>
    </Link>
  );
}
