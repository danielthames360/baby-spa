"use client";

import { useTranslations } from "next-intl";
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
  babyName: string;
  parentName?: string;
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
  const locale = "es"; // This will be dynamic based on actual locale
  const dayName = dayNames[locale]?.[dayOfWeek] || dayNames["es"][dayOfWeek];

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
              {timeSlots.map((slot) => {
                // Count appointments that overlap with this slot
                const overlappingCount = appointments.filter((apt) => {
                  const aptStart = timeToMinutes(apt.startTime);
                  const aptEnd = timeToMinutes(apt.endTime);
                  const slotStart = timeToMinutes(slot.time);
                  const slotEnd = slotStart + SLOT_DURATION_MINUTES;
                  // Check if appointment overlaps with slot
                  return aptStart < slotEnd && aptEnd > slotStart;
                }).length;

                return (
                  <TimeSlot
                    key={slot.time}
                    appointments={[]}
                    maxAppointments={slot.total}
                    occupiedCount={overlappingCount}
                    isPast={isSlotPast(slot.time)}
                    onSlotClick={() => onSlotClick?.(slot.time)}
                  />
                );
              })}
            </div>

            {/* Absolutely positioned appointments */}
            {timeSlots.length > 0 && (
              <div className="pointer-events-none absolute inset-0">
                {(() => {
                  const firstSlotTime = timeSlots[0].time;
                  const firstSlotMinutes = timeToMinutes(firstSlotTime);
                  const maxSlots = MAX_APPOINTMENTS_FOR_STAFF;

                  // Sort appointments by start time
                  const sortedAppointments = [...appointments].sort((a, b) =>
                    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
                  );

                  // Assign lanes to appointments based on overlaps
                  // Lane 0 = leftmost, Lane 4 = rightmost (up to 5 lanes for staff)
                  const appointmentLanes: Map<string, number> = new Map();
                  const laneEndTimes: number[] = Array(maxSlots).fill(0); // Track when each lane becomes free

                  for (const apt of sortedAppointments) {
                    const aptStart = timeToMinutes(apt.startTime);
                    const aptEnd = timeToMinutes(apt.endTime);

                    // Find the first available lane (one that ends before this appointment starts)
                    let assignedLane = 0;
                    for (let i = 0; i < maxSlots; i++) {
                      if (laneEndTimes[i] <= aptStart) {
                        assignedLane = i;
                        break;
                      }
                      // If this lane is occupied, try the next one
                      assignedLane = i + 1;
                    }
                    // If all lanes are occupied, assign to the last lane (will overlap visually)
                    if (assignedLane >= maxSlots) {
                      assignedLane = maxSlots - 1;
                    }

                    appointmentLanes.set(apt.id, assignedLane);
                    laneEndTimes[assignedLane] = aptEnd;
                  }

                  // Calculate the maximum number of lanes actually used
                  // This allows cards to expand when there are fewer concurrent appointments
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

                  // Render appointments
                  const appointmentElements = sortedAppointments.map((apt) => {
                    const startMinutes = timeToMinutes(apt.startTime);
                    const endMinutes = timeToMinutes(apt.endTime);
                    const topPosition =
                      ((startMinutes - firstSlotMinutes) / SLOT_DURATION_MINUTES) *
                      SLOT_HEIGHT_PX;

                    const height = getAppointmentHeight(apt.startTime, apt.endTime);
                    const lane = appointmentLanes.get(apt.id) || 0;

                    // If appointment overlaps with event, shift to the right (35% offset) and reduce width
                    const overlapsEvent = appointmentOverlapsEvent(startMinutes, endMinutes);
                    const availableWidth = overlapsEvent ? 65 : 100; // 65% if event exists, 100% otherwise
                    const baseOffset = overlapsEvent ? 35 : 0; // Start at 35% if event exists

                    // Use effectiveLanes for width calculation so cards expand when fewer appointments
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
                          zIndex: 10, // Appointments on top for click handling
                        }}
                      >
                        <AppointmentCard
                          id={apt.id}
                          babyName={apt.babyName}
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

                  // Render events (left portion, leaving room for appointments)
                  // Events take 35% width on the left, appointments use remaining 65%
                  const eventElements = events.map((event, eventIndex) => {
                    const eventStartMinutes = timeToMinutes(event.startTime.slice(0, 5));
                    const topPosition =
                      ((eventStartMinutes - firstSlotMinutes) / SLOT_DURATION_MINUTES) *
                      SLOT_HEIGHT_PX;
                    const height = getAppointmentHeight(
                      event.startTime.slice(0, 5),
                      event.endTime.slice(0, 5)
                    );

                    // If multiple events overlap, stack them horizontally within the 35% area
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
                          zIndex: 5, // Below appointments for click handling
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

                  return [...eventElements, ...appointmentElements];
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
