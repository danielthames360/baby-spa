"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { TimeSlot } from "./time-slot";
import { AppointmentCard } from "./appointment-card";
import { EventCalendarCard } from "@/components/events/event-calendar-card";
import {
  SLOT_HEIGHT_PX,
  SLOT_DURATION_MINUTES,
  MAX_APPOINTMENTS_FOR_STAFF,
  timeToMinutes,
  getAppointmentHeight,
} from "@/lib/constants/business-hours";
import { PartyPopper } from "lucide-react";

interface Appointment {
  id: string;
  babyName: string; // Name of baby or parent (legacy name for compatibility)
  clientType?: "BABY" | "PARENT"; // Type of client
  parentName?: string; // Secondary parent name (for baby appointments)
  packageName?: string;
  startTime: string;
  endTime: string;
  status: "PENDING_PAYMENT" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
}

interface TimeSlotData {
  time: string;
  available: number;
  total: number;
}

interface Event {
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
}

interface DayColumnProps {
  date: Date;
  timeSlots: TimeSlotData[];
  appointments: Appointment[];
  events?: Event[];
  isClosed?: boolean;
  closedReason?: string;
  isToday?: boolean;
  onSlotClick?: (time: string) => void;
  onAppointmentClick?: (appointmentId: string) => void;
  onEventClick?: (eventId: string) => void;
  onDayClick?: () => void;
}

const dayNames: Record<string, string[]> = {
  es: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  "pt-BR": ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
};

export function DayColumn({
  date,
  timeSlots,
  appointments,
  events = [],
  isClosed = false,
  closedReason,
  isToday = false,
  onSlotClick,
  onAppointmentClick,
  onEventClick,
  onDayClick,
}: DayColumnProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dayOfWeek = date.getDay();
  const dayNumber = date.getDate();

  // Check if date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPastDate = date < today;

  // Get current time for highlighting past slots
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  const isSlotPast = (time: string): boolean => {
    if (isPastDate) return true;
    if (!isToday) return false;

    const [hours, minutes] = time.split(":").map(Number);
    if (hours < currentHour) return true;
    if (hours === currentHour && minutes <= currentMinutes) return true;
    return false;
  };

  // Get day name based on locale (fallback to Spanish)
  const dayName = dayNames[locale]?.[dayOfWeek] || dayNames["es"][dayOfWeek];

  // Memoize slot overlapping counts to avoid recalculating on every render
  const slotOverlappingCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const slot of timeSlots) {
      const count = appointments.filter((apt) => {
        if (apt.status === "CANCELLED" || apt.status === "NO_SHOW") return false;
        const aptStart = timeToMinutes(apt.startTime);
        const aptEnd = timeToMinutes(apt.endTime);
        const slotStart = timeToMinutes(slot.time);
        const slotEnd = slotStart + SLOT_DURATION_MINUTES;
        return aptStart < slotEnd && aptEnd > slotStart;
      }).length;
      counts.set(slot.time, count);
    }
    return counts;
  }, [appointments, timeSlots]);

  // Memoize lane assignment computation and positioned elements
  const { eventElements, appointmentElements } = useMemo(() => {
    if (timeSlots.length === 0) {
      return { eventElements: [] as React.ReactNode[], appointmentElements: [] as React.ReactNode[] };
    }

    const firstSlotTime = timeSlots[0].time;
    const firstSlotMinutes = timeToMinutes(firstSlotTime);
    const maxSlots = MAX_APPOINTMENTS_FOR_STAFF;

    // Sort appointments by start time
    const sortedAppointments = [...appointments].sort((a, b) =>
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    // Assign lanes to appointments based on overlaps
    const appointmentLanes: Map<string, number> = new Map();
    const laneEndTimes: number[] = Array(maxSlots).fill(0);

    for (const apt of sortedAppointments) {
      const aptStart = timeToMinutes(apt.startTime);
      const aptEnd = timeToMinutes(apt.endTime);

      // Find the first available lane
      let assignedLane = 0;
      for (let i = 0; i < maxSlots; i++) {
        if (laneEndTimes[i] <= aptStart) {
          assignedLane = i;
          break;
        }
        assignedLane = i + 1;
      }
      if (assignedLane >= maxSlots) {
        assignedLane = maxSlots - 1;
      }

      appointmentLanes.set(apt.id, assignedLane);
      laneEndTimes[assignedLane] = aptEnd;
    }

    // Calculate effective lanes for width distribution
    const maxLaneUsed = Math.max(0, ...Array.from(appointmentLanes.values())) + 1;
    const effectiveLanes = Math.max(1, maxLaneUsed);

    // Check if appointment overlaps with any event
    const appointmentOverlapsEvent = (aptStart: number, aptEnd: number): boolean => {
      return events.some((event) => {
        const eventStart = timeToMinutes(event.startTime.slice(0, 5));
        const eventEnd = timeToMinutes(event.endTime.slice(0, 5));
        return aptStart < eventEnd && aptEnd > eventStart;
      });
    };

    // Build appointment elements
    const aptElements = sortedAppointments.map((apt) => {
      const startMinutes = timeToMinutes(apt.startTime);
      const endMinutes = timeToMinutes(apt.endTime);
      const topPosition =
        ((startMinutes - firstSlotMinutes) / SLOT_DURATION_MINUTES) *
        SLOT_HEIGHT_PX;

      const height = getAppointmentHeight(apt.startTime, apt.endTime);
      const lane = appointmentLanes.get(apt.id) || 0;

      const overlapsEvent = appointmentOverlapsEvent(startMinutes, endMinutes);
      const availableWidth = overlapsEvent ? 65 : 100;
      const baseOffset = overlapsEvent ? 35 : 0;

      const width = `${availableWidth / effectiveLanes}%`;
      const left = `${baseOffset + (availableWidth / effectiveLanes) * lane}%`;

      return (
        <div
          key={apt.id}
          className="pointer-events-auto absolute p-0.5"
          style={{
            top: `${topPosition}px`,
            height: `${height}px`,
            width,
            left,
            zIndex: 10,
          }}
        >
          <AppointmentCard
            id={apt.id}
            clientName={apt.babyName}
            clientType={apt.clientType}
            parentName={apt.parentName}
            packageName={apt.packageName}
            time={`${apt.startTime}-${apt.endTime}`}
            status={apt.status}
            onClick={() => onAppointmentClick?.(apt.id)}
            compact
            fillHeight
          />
        </div>
      );
    });

    // Build event elements
    const evtElements = events.map((event, eventIndex) => {
      const eventStartMinutes = timeToMinutes(event.startTime.slice(0, 5));
      const topPosition =
        ((eventStartMinutes - firstSlotMinutes) / SLOT_DURATION_MINUTES) *
        SLOT_HEIGHT_PX;
      const height = getAppointmentHeight(
        event.startTime.slice(0, 5),
        event.endTime.slice(0, 5)
      );

      const eventWidth = events.length > 1 ? 35 / events.length : 35;
      const eventLeft = events.length > 1 ? eventWidth * eventIndex : 0;

      return (
        <div
          key={`event-${event.id}`}
          className="pointer-events-auto absolute p-0.5"
          style={{
            top: `${topPosition}px`,
            height: `${height}px`,
            width: `${eventWidth}%`,
            left: `${eventLeft}%`,
            zIndex: 5,
          }}
        >
          <EventCalendarCard
            event={event}
            onClick={() => onEventClick?.(event.id)}
            fillHeight
          />
        </div>
      );
    });

    return { eventElements: evtElements, appointmentElements: aptElements };
  }, [appointments, events, timeSlots, onAppointmentClick, onEventClick]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Day header */}
      <button
        onClick={onDayClick}
        className={cn(
          "sticky top-0 z-10 flex w-full flex-col items-center border-b border-gray-200 bg-white/90 py-2 backdrop-blur-sm transition-colors hover:bg-teal-50/50",
          isToday && "bg-teal-50/90"
        )}
      >
        <span className="text-xs font-medium uppercase text-gray-500">
          {dayName}
        </span>
        <div className="mt-1 flex items-center gap-1">
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
              isToday
                ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                : "text-gray-700"
            )}
          >
            {dayNumber}
          </span>
          {/* Event indicator */}
          {events.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <PartyPopper className="h-3 w-3" />
            </span>
          )}
        </div>
      </button>

      {/* Day content */}
      <div className="flex-1">
        {isClosed ? (
          <div className="flex h-full items-center justify-center bg-gray-50 p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">
                {t("calendar.closed")}
              </p>
              {closedReason && (
                <p className="mt-1 text-xs text-gray-400">{closedReason}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Background slots grid */}
            <div className="divide-y divide-gray-100">
              {timeSlots.map((slot) => (
                <TimeSlot
                  key={slot.time}
                  appointments={[]}
                  maxAppointments={slot.total}
                  occupiedCount={slotOverlappingCounts.get(slot.time) || 0}
                  isPast={isSlotPast(slot.time)}
                  onSlotClick={() => onSlotClick?.(slot.time)}
                />
              ))}
            </div>

            {/* Absolutely positioned appointments and events */}
            {timeSlots.length > 0 && (
              <div className="pointer-events-none absolute inset-0">
                {eventElements}
                {appointmentElements}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
