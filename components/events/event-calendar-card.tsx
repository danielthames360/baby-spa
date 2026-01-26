"use client";

import { useTranslations } from "next-intl";
import { PartyPopper, Baby, Heart, Users, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventCalendarCardProps {
  event: {
    id: string;
    name: string;
    type: "BABIES" | "PARENTS";
    startTime: string;
    endTime: string;
    status: string;
    blockedTherapists: number;
    maxParticipants: number;
    _count?: { participants: number };
    participants?: unknown[]; // Support both _count and participants array
  };
  onClick?: () => void;
  compact?: boolean;
  fillHeight?: boolean;
}

export function EventCalendarCard({ event, onClick, compact = false, fillHeight = false }: EventCalendarCardProps) {
  const t = useTranslations("events");
  // Support both _count.participants and participants array length
  const participantCount = event._count?.participants ?? event.participants?.length ?? 0;

  // fillHeight version for time slot display (similar to appointment cards)
  if (fillHeight) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-lg border p-1.5 text-left transition-all hover:shadow-md",
          event.type === "BABIES"
            ? "border-teal-300 bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-800"
            : "border-purple-300 bg-gradient-to-br from-purple-100 to-pink-100 text-purple-800"
        )}
      >
        {/* Left accent bar */}
        <div
          className={cn(
            "absolute bottom-0 left-0 top-0 w-1 rounded-l-lg",
            event.type === "BABIES" ? "bg-teal-500" : "bg-purple-500"
          )}
        />

        <div className="ml-1.5 flex h-full min-w-0 flex-col justify-center">
          {/* Event name with icon */}
          <div className="flex items-center gap-1 min-w-0">
            <PartyPopper className="h-3 w-3 flex-shrink-0" />
            <span className="truncate text-xs font-semibold">{event.name}</span>
          </div>

          {/* Time */}
          <div className="mt-0.5 flex items-center gap-1 text-[10px] opacity-75">
            <span>{event.startTime.slice(0, 5)} - {event.endTime.slice(0, 5)}</span>
          </div>

          {/* Participants */}
          <div className="mt-0.5 flex items-center gap-1 text-[10px]">
            <Users className="h-2.5 w-2.5 flex-shrink-0" />
            <span>{participantCount}/{event.maxParticipants}</span>
          </div>
        </div>
      </button>
    );
  }

  if (compact) {
    // Compact version for week view cells (legacy - now using fillHeight)
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left text-xs transition-all hover:shadow-md",
          event.type === "BABIES"
            ? "bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 hover:from-teal-100 hover:to-cyan-100"
            : "bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:from-purple-100 hover:to-pink-100"
        )}
      >
        <PartyPopper className="h-3 w-3 shrink-0" />
        <span className="truncate font-medium">{event.name}</span>
      </button>
    );
  }

  // Full version for day view
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all hover:shadow-md",
        event.type === "BABIES"
          ? "border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50"
          : "border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          event.type === "BABIES" ? "bg-teal-100" : "bg-purple-100"
        )}
      >
        {event.type === "BABIES" ? (
          <Baby className="h-5 w-5 text-teal-600" />
        ) : (
          <Heart className="h-5 w-5 text-purple-600" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-medium",
            event.type === "BABIES" ? "text-teal-800" : "text-purple-800"
          )}
        >
          {event.name}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>
            {event.startTime} - {event.endTime}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {participantCount}/{event.maxParticipants}
          </span>
        </div>
      </div>

      {/* Blocking indicator */}
      {event.blockedTherapists > 0 && (
        <div
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
            event.blockedTherapists === 4
              ? "bg-rose-100 text-rose-700"
              : "bg-amber-100 text-amber-700"
          )}
        >
          <AlertTriangle className="h-3 w-3" />
          {event.blockedTherapists === 4
            ? t("calendar.noAppointments")
            : t("calendar.therapistsAvailable", { count: 4 - event.blockedTherapists })}
        </div>
      )}
    </button>
  );
}
