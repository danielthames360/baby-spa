"use client";

import { useMemo } from "react";
import { DayColumn } from "./day-column";
import { generateTimeSlots, MAX_APPOINTMENTS_PER_HOUR } from "@/lib/constants/business-hours";

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

  // Check if a date is in closedDates (using local date comparison)
  const isDateClosed = (date: Date): { closed: boolean; reason?: string } => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const closed = closedDates.find((cd) => {
      // Extract date portion from ISO string directly to avoid timezone issues
      // API returns dates as strings (JSON serialization), cast to handle both
      const cdDateValue = cd.date as unknown as string | Date;
      const cdDateStr = typeof cdDateValue === "string"
        ? cdDateValue.split("T")[0]
        : `${cdDateValue.getFullYear()}-${String(cdDateValue.getMonth() + 1).padStart(2, "0")}-${String(cdDateValue.getDate()).padStart(2, "0")}`;
      return cdDateStr === dateStr;
    });
    if (closed) {
      return { closed: true, reason: closed.reason };
    }
    // Sunday is always closed
    if (date.getDay() === 0) {
      return { closed: true, reason: "Domingo" };
    }
    return { closed: false };
  };

  // Get appointments for a specific date (using local date comparison)
  const getAppointmentsForDate = (date: Date): Appointment[] => {
    // Use local date string to avoid timezone issues
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return appointments.filter((apt) => {
      // Extract date portion from ISO string directly (e.g., "2026-01-23" from "2026-01-23T00:00:00.000Z")
      // API returns dates as strings (JSON serialization), cast to handle both
      const aptDateValue = apt.date as unknown as string | Date;
      const aptDateStr = typeof aptDateValue === "string"
        ? aptDateValue.split("T")[0]
        : `${aptDateValue.getFullYear()}-${String(aptDateValue.getMonth() + 1).padStart(2, "0")}-${String(aptDateValue.getDate()).padStart(2, "0")}`;
      return aptDateStr === dateStr && apt.status !== "CANCELLED";
    });
  };

  // Get time slots for a specific day
  const getTimeSlotsForDay = (dayOfWeek: number) => {
    const slots = generateTimeSlots(dayOfWeek);
    return slots.map((time) => ({
      time,
      available: MAX_APPOINTMENTS_PER_HOUR,
      total: MAX_APPOINTMENTS_PER_HOUR,
    }));
  };

  // Get events for a specific date (using local date comparison)
  const getEventsForDate = (date: Date): Event[] => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return events.filter((event) => {
      const eventDateValue = event.date;
      const eventDateStr = typeof eventDateValue === "string"
        ? eventDateValue.split("T")[0]
        : `${eventDateValue.getFullYear()}-${String(eventDateValue.getMonth() + 1).padStart(2, "0")}-${String(eventDateValue.getDate()).padStart(2, "0")}`;
      return eventDateStr === dateStr;
    });
  };

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
          {weekDays.map((date) => {
            const dayOfWeek = date.getDay();
            const { closed, reason } = isDateClosed(date);
            const dayAppointments = getAppointmentsForDate(date);
            const dayEvents = getEventsForDate(date);
            const timeSlots = getTimeSlotsForDay(dayOfWeek);
            const isToday = date.toDateString() === today.toDateString();

            // Transform appointments for DayColumn
            const transformedAppointments = dayAppointments.map((apt) => {
              // Determine if this is a parent or baby appointment
              const isParentAppointment = !apt.babyId && apt.parentId && apt.parent;

              return {
                id: apt.id,
                // For parent appointments, use parent name; for baby appointments, use baby name
                babyName: isParentAppointment
                  ? apt.parent?.name || "Unknown"
                  : apt.baby?.name || "Unknown",
                clientType: isParentAppointment ? "PARENT" as const : "BABY" as const,
                // Parent name is only relevant for baby appointments (shows the accompanying parent)
                parentName: !isParentAppointment
                  ? apt.baby?.parents?.find((p) => p.isPrimary)?.parent.name
                  : undefined,
                packageName: apt.packagePurchase?.package.name || apt.selectedPackage?.name,
                startTime: formatTime(apt.startTime),
                endTime: formatTime(apt.endTime),
                status: apt.status,
              };
            });

            return (
              <DayColumn
                key={date.toISOString()}
                date={date}
                timeSlots={timeSlots}
                appointments={transformedAppointments}
                events={dayEvents}
                isClosed={closed}
                closedReason={reason}
                isToday={isToday}
                onSlotClick={(time) => onSlotClick?.(date, time)}
                onAppointmentClick={onAppointmentClick}
                onEventClick={onEventClick}
                onDayClick={() => onDayClick?.(date)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
