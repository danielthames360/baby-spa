"use client";

import { useTranslations } from "next-intl";
import { CalendarX } from "lucide-react";
import { EventCard } from "./event-card";
import { fromDateOnly, formatDateForDisplay } from "@/lib/utils/date-utils";

interface Event {
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
}

interface EventListProps {
  events: Event[];
  locale?: string;
  groupByDate?: boolean;
  emptyMessage?: string;
}

export function EventList({
  events,
  locale = "es",
  groupByDate = true,
  emptyMessage,
}: EventListProps) {
  const t = useTranslations("events");

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/50 bg-white/50 py-16 text-center backdrop-blur-sm">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <CalendarX className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-700">
          {emptyMessage || t("empty.title")}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t("empty.description")}
        </p>
      </div>
    );
  }

  if (!groupByDate) {
    return (
      <div className="space-y-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} locale={locale} />
        ))}
      </div>
    );
  }

  // Group events by date
  const groupedEvents = events.reduce<Record<string, Event[]>>((acc, event) => {
    const dateKey = typeof event.date === "string"
      ? event.date.split("T")[0]
      : fromDateOnly(event.date);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedEvents).sort();

  return (
    <div className="space-y-6">
      {sortedDates.map((dateKey) => {
        const dateEvents = groupedEvents[dateKey];
        const formattedDate = formatDateForDisplay(
          `${dateKey}T12:00:00Z`,
          locale === "pt-BR" ? "pt-BR" : "es-ES",
          { weekday: "long", day: "numeric", month: "long" }
        );

        return (
          <div key={dateKey}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {formattedDate}
            </h3>
            <div className="space-y-3">
              {dateEvents.map((event) => (
                <EventCard key={event.id} event={event} locale={locale} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
