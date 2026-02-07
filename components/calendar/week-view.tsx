"use client";

import { useMemo } from "react";
import { DayColumn } from "./day-column";
import { generateTimeSlots, MAX_APPOINTMENTS_PER_SLOT } from "@/lib/constants/business-hours";

interface Appointment {
  id: string;
  babyId: string | null;
  parentId?: string | null;
  date: Date;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  status: "PENDING_PAYMENT" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  baby?: {
    id: string;
    name: string;
    parents: {
      isPrimary: boolean;
      parent: {
        id: string;
        name: string;
        phone: string;
      };
    }[];
  } | null;
  parent?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    pregnancyWeeks: number | null;
  } | null;
  packagePurchase?: {
    id: string;
    package: {
      id: string;
      name: string;
    };
  } | null;
  selectedPackage?: {
    id: string;
    name: string;
  } | null;
}

interface ClosedDate {
  date: Date;
  reason?: string;
}

interface Event {
  id: string;
  name: string;
  type: "BABIES" | "PARENTS";
  date: string | Date;
  startTime: string;
  endTime: string;
  status: string;
  blockedTherapists: number;
  maxParticipants: number;
  _count?: { participants: number };
  participants?: unknown[]; // Support both _count and participants array
}

interface WeekViewProps {
  weekStart: Date;
  appointments: Appointment[];
  events?: Event[];
  closedDates: ClosedDate[];
  onSlotClick?: (date: Date, time: string) => void;
  onAppointmentClick?: (appointmentId: string) => void;
  onEventClick?: (eventId: string) => void;
  onDayClick?: (date: Date) => void;
}

// Generate array of dates for the week (Mon-Sat)
function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(weekStart);

  // Start from Monday (1) to Saturday (6)
  for (let i = 1; i <= 6; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i - start.getDay());
    days.push(day);
  }

  return days;
}

// Format time string to HH:mm (handles both "09:00" and "09:00:00" formats)
function formatTime(time: string): string {
  return time.slice(0, 5);
}

// Get all unique time slots across all days
function getAllTimeSlots(): string[] {
  const allSlots = new Set<string>();

  // Get slots for each day type
  for (let day = 1; day <= 6; day++) {
    const slots = generateTimeSlots(day);
    slots.forEach((slot) => allSlots.add(slot));
  }

  return Array.from(allSlots).sort();
}

export function WeekView({
  weekStart,
  appointments,
  events = [],
  closedDates,
  onSlotClick,
  onAppointmentClick,
  onEventClick,
  onDayClick,
}: WeekViewProps) {
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const allTimeSlots = useMemo(() => getAllTimeSlots(), []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Memoize all per-day data in a single pass to avoid recalculating on every render
  const weekData = useMemo(() => {
    // Helper to extract date string from various formats
    const toDateStr = (value: unknown): string => {
      if (typeof value === "string") return value.split("T")[0];
      if (value instanceof Date) {
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
      }
      return "";
    };

    return weekDays.map((date) => {
      const dayOfWeek = date.getDay();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      // Check closed status
      let closed = false;
      let reason: string | undefined;
      const closedEntry = closedDates.find((cd) => toDateStr(cd.date) === dateStr);
      if (closedEntry) {
        closed = true;
        reason = closedEntry.reason;
      } else if (dayOfWeek === 0) {
        closed = true;
        reason = "Domingo";
      }

      // Filter appointments for this date
      const dayAppointments = appointments.filter(
        (apt) => toDateStr(apt.date) === dateStr
      );

      // Filter events for this date
      const dayEvents = events.filter(
        (event) => toDateStr(event.date) === dateStr
      );

      // Generate time slots
      const slots = generateTimeSlots(dayOfWeek);
      const timeSlots = slots.map((time) => ({
        time,
        available: MAX_APPOINTMENTS_PER_SLOT,
        total: MAX_APPOINTMENTS_PER_SLOT,
      }));

      // Transform appointments for DayColumn
      const transformedAppointments = dayAppointments.map((apt) => {
        const isParentAppointment = !apt.babyId && apt.parentId && apt.parent;
        return {
          id: apt.id,
          babyName: isParentAppointment
            ? apt.parent?.name || "Unknown"
            : apt.baby?.name || "Unknown",
          clientType: isParentAppointment ? "PARENT" as const : "BABY" as const,
          parentName: !isParentAppointment
            ? apt.baby?.parents?.find((p) => p.isPrimary)?.parent.name
            : undefined,
          packageName: apt.packagePurchase?.package.name || apt.selectedPackage?.name,
          startTime: formatTime(apt.startTime),
          endTime: formatTime(apt.endTime),
          status: apt.status,
        };
      });

      const isToday = date.toDateString() === today.toDateString();

      return {
        date,
        closed,
        reason,
        timeSlots,
        appointments: transformedAppointments,
        events: dayEvents,
        isToday,
      };
    });
  }, [weekDays, appointments, events, closedDates, today]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-lg shadow-teal-500/10 backdrop-blur-md">
      <div className="flex flex-1 overflow-hidden">
        {/* Time labels column */}
        <div className="flex w-16 flex-shrink-0 flex-col border-r border-gray-200 bg-gray-50/50">
          {/* Empty header space */}
          <div className="h-[72px] border-b border-gray-200" />

          {/* Time labels */}
          <div className="flex-1 overflow-y-auto">
            {allTimeSlots.map((time) => (
              <div
                key={time}
                className="flex h-[80px] items-start justify-end border-b border-gray-100 pr-2 pt-1"
              >
                <span className="text-xs font-medium text-gray-500">{time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Days columns */}
        <div className="flex flex-1 overflow-x-auto">
          {weekData.map((dayData) => (
            <DayColumn
              key={dayData.date.toISOString()}
              date={dayData.date}
              timeSlots={dayData.timeSlots}
              appointments={dayData.appointments}
              events={dayData.events}
              isClosed={dayData.closed}
              closedReason={dayData.reason}
              isToday={dayData.isToday}
              onSlotClick={(time) => onSlotClick?.(dayData.date, time)}
              onAppointmentClick={onAppointmentClick}
              onEventClick={onEventClick}
              onDayClick={() => onDayClick?.(dayData.date)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
