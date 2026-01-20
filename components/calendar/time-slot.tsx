"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SLOT_HEIGHT_PX } from "@/lib/constants/business-hours";

interface Appointment {
  id: string;
  babyName: string;
  parentName?: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
}

interface TimeSlotProps {
  appointments: Appointment[];
  maxAppointments: number;
  occupiedCount?: number; // Count of appointments overlapping this slot
  isPast?: boolean;
  onSlotClick?: () => void;
}

export function TimeSlot({
  appointments,
  maxAppointments,
  occupiedCount = 0,
  isPast = false,
  onSlotClick,
}: TimeSlotProps) {
  // Use occupiedCount if provided, otherwise fall back to appointments.length
  const occupied = occupiedCount > 0 ? occupiedCount : appointments.length;
  const availableSlots = maxAppointments - occupied;
  const hasAvailability = availableSlots > 0 && !isPast;

  return (
    <div
      className={cn(
        "group relative border-b border-gray-100 p-1 transition-colors",
        hasAvailability && "hover:bg-teal-50/50",
        isPast && "bg-gray-50/50"
      )}
      style={{ height: `${SLOT_HEIGHT_PX}px` }}
    >
      {/* Add appointment badge (only if has availability) */}
      {hasAvailability && (
        <button
          onClick={onSlotClick}
          className={cn(
            "absolute right-1 top-1 z-30 flex h-6 items-center gap-0.5 rounded-md px-1.5 text-xs font-medium transition-all",
            occupied > 0
              ? "bg-teal-100 text-teal-700 shadow-sm hover:bg-teal-200"
              : "bg-white/80 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-teal-50 hover:text-teal-600"
          )}
        >
          <Plus className="h-3 w-3" />
          <span>{availableSlots}</span>
        </button>
      )}
    </div>
  );
}
