"use client";

import { Baby, User, Clock, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppointmentCardProps {
  id: string;
  babyName: string;
  parentName?: string;
  packageName?: string;
  time: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  onClick?: () => void;
  compact?: boolean;
  fillHeight?: boolean;
}

const statusConfig = {
  SCHEDULED: {
    bg: "bg-amber-100",
    border: "border-amber-300",
    text: "text-amber-800",
    dot: "bg-amber-500",
  },
  IN_PROGRESS: {
    bg: "bg-blue-100",
    border: "border-blue-300",
    text: "text-blue-800",
    dot: "bg-blue-500",
  },
  COMPLETED: {
    bg: "bg-emerald-100",
    border: "border-emerald-300",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
  },
  CANCELLED: {
    bg: "bg-rose-100",
    border: "border-rose-300",
    text: "text-rose-800",
    dot: "bg-rose-500",
  },
  NO_SHOW: {
    bg: "bg-gray-100",
    border: "border-gray-300",
    text: "text-gray-800",
    dot: "bg-gray-500",
  },
};

export function AppointmentCard({
  babyName,
  parentName,
  packageName,
  time,
  status,
  onClick,
  compact = false,
  fillHeight = false,
}: AppointmentCardProps) {
  const config = statusConfig[status];

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "group relative cursor-pointer rounded-lg border p-1.5 transition-all hover:shadow-md overflow-hidden",
          fillHeight ? "h-full" : "h-auto",
          config.bg,
          config.border,
          config.text
        )}
      >
        {/* Status indicator */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
            config.dot
          )}
        />

        <div className="ml-1.5 flex flex-col justify-center h-full min-w-0">
          {/* Baby name */}
          <div className="flex items-center gap-1 min-w-0">
            <Baby className="h-3 w-3 flex-shrink-0" />
            <span className="truncate text-xs font-medium">{babyName}</span>
          </div>

          {/* Package name - show in fillHeight mode */}
          {fillHeight && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] mt-0.5 min-w-0",
              packageName ? "text-teal-700" : "text-amber-600"
            )}>
              <Package className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="truncate">{packageName || "A definir"}</span>
            </div>
          )}

          {/* Time */}
          <div className="flex items-center gap-1 text-[10px] opacity-75 mt-0.5">
            <Clock className="h-2.5 w-2.5" />
            <span>{time}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer rounded-lg border p-2 transition-all hover:shadow-md",
        config.bg,
        config.border,
        config.text
      )}
    >
      {/* Status indicator */}
      <div
        className={cn(
          "absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full",
          config.dot
        )}
      />

      <div className="ml-1 space-y-1">
        {/* Time */}
        <div className="flex items-center gap-1 text-xs opacity-75">
          <Clock className="h-3 w-3" />
          <span>{time}</span>
        </div>

        {/* Baby name */}
        <div className="flex items-center gap-1">
          <Baby className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate text-sm font-medium">{babyName}</span>
        </div>

        {/* Package name */}
        <div className={cn(
          "flex items-center gap-1 text-xs",
          packageName ? "text-teal-700" : "text-amber-600"
        )}>
          <Package className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{packageName || "A definir"}</span>
        </div>

        {/* Parent name */}
        {parentName && (
          <div className="flex items-center gap-1 text-xs opacity-75">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{parentName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
