"use client";

import { Baby, User, Clock, Package, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type ClientType = "BABY" | "PARENT";

interface AppointmentCardProps {
  id: string;
  clientName: string; // Name of baby or parent
  clientType?: ClientType; // BABY or PARENT - defaults to BABY
  parentName?: string; // Secondary parent name (only for baby appointments)
  packageName?: string;
  time: string;
  status: "PENDING_PAYMENT" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  onClick?: () => void;
  compact?: boolean;
  fillHeight?: boolean;
}

// Legacy prop name support
interface LegacyAppointmentCardProps extends Omit<AppointmentCardProps, "clientName"> {
  babyName?: string;
  clientName?: string;
}

const statusConfig = {
  PENDING_PAYMENT: {
    bg: "bg-[repeating-linear-gradient(135deg,rgb(255,237,213),rgb(255,237,213)_4px,rgb(254,215,170)_4px,rgb(254,215,170)_8px)]",
    border: "border-2 border-orange-400 border-dashed",
    text: "text-orange-800",
    dot: "bg-orange-500 animate-pulse",
  },
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
  clientName,
  babyName, // Legacy prop support
  clientType = "BABY",
  parentName,
  packageName,
  time,
  status,
  onClick,
  compact = false,
  fillHeight = false,
}: LegacyAppointmentCardProps) {
  const t = useTranslations();
  const config = statusConfig[status];
  const isPendingPayment = status === "PENDING_PAYMENT";

  // Support legacy babyName prop
  const displayName = clientName || babyName || "";
  const isParentAppointment = clientType === "PARENT";

  // Icon component based on client type
  const ClientIcon = isParentAppointment ? UserRound : Baby;

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
          {/* Client name (baby or parent) */}
          <div className={cn(
            "flex items-center gap-1 min-w-0",
            isParentAppointment && "text-rose-700"
          )}>
            <ClientIcon className={cn(
              "h-3 w-3 flex-shrink-0",
              isParentAppointment && "text-rose-600"
            )} />
            <span className="truncate text-xs font-medium">{displayName}</span>
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

          {/* Pending payment badge - inline below time */}
          {isPendingPayment && (
            <div className="flex items-center gap-1 text-[10px] mt-0.5">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[8px] font-bold text-white shadow-sm animate-pulse">
                ⏳ {t("calendar.status.pendingPayment")}
              </span>
            </div>
          )}
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
      {/* Pending payment badge */}
      {isPendingPayment && (
        <div className="absolute -top-2 right-1 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm animate-pulse">
            ⏳ {t("calendar.status.pendingPayment")}
          </span>
        </div>
      )}

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

        {/* Client name (baby or parent) */}
        <div className={cn(
          "flex items-center gap-1",
          isParentAppointment && "text-rose-700"
        )}>
          <ClientIcon className={cn(
            "h-3.5 w-3.5 flex-shrink-0",
            isParentAppointment && "text-rose-600"
          )} />
          <span className="truncate text-sm font-medium">{displayName}</span>
        </div>

        {/* Package name */}
        <div className={cn(
          "flex items-center gap-1 text-xs",
          packageName ? "text-teal-700" : "text-amber-600"
        )}>
          <Package className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{packageName || "A definir"}</span>
        </div>

        {/* Parent name (only for baby appointments) */}
        {parentName && !isParentAppointment && (
          <div className="flex items-center gap-1 text-xs opacity-75">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{parentName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
