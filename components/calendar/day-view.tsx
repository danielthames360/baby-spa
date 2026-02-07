"use client";

import { useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  generateTimeSlots,
  BUSINESS_HOURS,
  MAX_APPOINTMENTS_PER_SLOT,
  SLOT_DURATION_MINUTES,
  timeToMinutes,
} from "@/lib/constants/business-hours";
import { Baby, Clock, User, Phone, GripVertical, Package, PartyPopper, AlertTriangle, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  babyId: string | null;
  parentId?: string | null;
  date: Date;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "PENDING_PAYMENT";
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

interface DayViewProps {
  date: Date;
  appointments: Appointment[];
  events?: Event[];
  onSlotClick?: (date: Date, time: string) => void;
  onAppointmentClick?: (appointmentId: string) => void;
  onEventClick?: (eventId: string) => void;
  onDragStart?: (appointmentId: string) => void;
  onDrop?: (appointmentId: string, time: string) => void;
}

const statusConfig = {
  PENDING_PAYMENT: {
    bg: "bg-gradient-to-r from-orange-50 via-orange-100 to-orange-50 bg-[length:10px_10px]",
    border: "border-orange-400 border-dashed",
    text: "text-orange-800",
    dot: "bg-orange-500 animate-pulse",
  },
  SCHEDULED: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-800",
    dot: "bg-amber-500",
  },
  IN_PROGRESS: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-800",
    dot: "bg-blue-500",
  },
  COMPLETED: {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
  },
  CANCELLED: {
    bg: "bg-rose-50",
    border: "border-rose-300",
    text: "text-rose-800",
    dot: "bg-rose-500",
  },
  NO_SHOW: {
    bg: "bg-gray-50",
    border: "border-gray-300",
    text: "text-gray-800",
    dot: "bg-gray-500",
  },
};

// Map status enum values to translation keys
const statusTranslationKey: Record<string, string> = {
  PENDING_PAYMENT: "pendingPayment",
  SCHEDULED: "scheduled",
  IN_PROGRESS: "inProgress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "noShow",
};

// Format time string to HH:mm (handles both "09:00" and "09:00:00" formats)
function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function DayView({
  date,
  appointments,
  events = [],
  onSlotClick,
  onAppointmentClick,
  onEventClick,
  onDragStart,
  onDrop,
}: DayViewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === "pt-BR" ? "pt-BR" : "es-ES";
  const dayOfWeek = date.getDay();

  // Get time slots for this day
  const timeSlots = useMemo(() => {
    const slots = generateTimeSlots(dayOfWeek);
    return slots.map((time) => ({
      time,
      available: MAX_APPOINTMENTS_PER_SLOT,
      total: MAX_APPOINTMENTS_PER_SLOT,
    }));
  }, [dayOfWeek]);

  // Check if day is closed
  const isClosed = dayOfWeek === 0 || !BUSINESS_HOURS[dayOfWeek];

  // Get active appointments (excluding cancelled)
  const activeAppointments = useMemo(() => {
    return appointments.filter((apt) => apt.status !== "CANCELLED");
  }, [appointments]);

  // Memoize per-slot data: overlapping count and appointments starting at each slot
  const slotData = useMemo(() => {
    const data = new Map<string, { overlappingCount: number; slotAppointments: Appointment[] }>();
    for (const { time } of timeSlots) {
      const slotStart = timeToMinutes(time);
      const slotEnd = slotStart + SLOT_DURATION_MINUTES;
      const overlappingCount = activeAppointments.filter((apt) => {
        const aptStart = timeToMinutes(apt.startTime);
        const aptEnd = timeToMinutes(apt.endTime);
        return aptStart < slotEnd && aptEnd > slotStart;
      }).length;
      // Appointments that START at this slot (show ALL including cancelled)
      const slotAppointments = appointments.filter(
        (apt) => formatTime(apt.startTime) === time
      );
      data.set(time, { overlappingCount, slotAppointments });
    }
    return data;
  }, [timeSlots, activeAppointments, appointments]);

  // Format date for header
  const formattedDate = date.toLocaleDateString(dateLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("bg-teal-100/50");
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("bg-teal-100/50");
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, time: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove("bg-teal-100/50");
    const appointmentId = e.dataTransfer.getData("appointmentId");
    if (appointmentId && onDrop) {
      onDrop(appointmentId, time);
    }
  };

  if (isClosed) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-white/50 bg-white/70 p-8 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-500">{formattedDate}</p>
          <p className="mt-2 text-2xl font-bold text-gray-400">{t("calendar.closed")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-lg shadow-teal-500/10 backdrop-blur-md">
      {/* Day header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-4">
        <h2 className="text-xl font-bold text-white">{formattedDate}</h2>
        <p className="mt-1 text-sm text-teal-100">
          {appointments.filter((a) => a.status !== "CANCELLED").length} {t("calendar.appointmentsToday")}
        </p>
      </div>

      {/* Events for this day */}
      {events.length > 0 && (
        <div className="space-y-2 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => onEventClick?.(event.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-purple-200 bg-white/80 p-3 text-left transition-all hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-pink-100">
                <PartyPopper className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{event.name}</p>
                <p className="text-xs text-gray-500">
                  {event.startTime} - {event.endTime} · {event._count?.participants ?? event.participants?.length ?? 0}/{event.maxParticipants} {t("events.participants.title").toLowerCase()}
                </p>
              </div>
              {event.blockedTherapists > 0 && (
                <div className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                  event.blockedTherapists === 4
                    ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-700"
                )}>
                  <AlertTriangle className="h-3 w-3" />
                  {event.blockedTherapists === 4
                    ? t("events.calendar.noAppointments")
                    : t("events.calendar.therapistsAvailable", { count: 4 - event.blockedTherapists })}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Time slots */}
      <div className="flex-1 overflow-y-auto">
        {timeSlots.map(({ time }) => {
          const { overlappingCount, slotAppointments } = slotData.get(time) || { overlappingCount: 0, slotAppointments: [] };
          const availableSlots = MAX_APPOINTMENTS_PER_SLOT - overlappingCount;
          const isFull = availableSlots <= 0;

          return (
            <div
              key={time}
              className="border-b border-gray-100 transition-colors"
              onDragOver={!isFull ? handleDragOver : undefined}
              onDragLeave={!isFull ? handleDragLeave : undefined}
              onDrop={!isFull ? (e) => handleDrop(e, time) : undefined}
            >
              {/* Time header */}
              <div className="flex items-center gap-4 bg-gray-50/70 px-6 py-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-teal-600" />
                  <span className="text-lg font-semibold text-gray-700">{time}</span>
                </div>
                {!isFull && (
                  <button
                    onClick={() => onSlotClick?.(date, time)}
                    className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-200"
                  >
                    + {t("calendar.addAppointment")}
                  </button>
                )}
                <span className="ml-auto text-sm text-gray-500">
                  {availableSlots > 0
                    ? `${availableSlots} ${availableSlots === 1 ? t("calendar.slotAvailable") : t("calendar.slotsAvailable")}`
                    : t("calendar.full")}
                </span>
              </div>

              {/* Appointments that START at this slot */}
              <div className="space-y-2 px-6 py-3">
                {slotAppointments.length > 0 ? (
                  slotAppointments.map((apt) => {
                    const status = statusConfig[apt.status];
                    // Determine if this is a parent appointment
                    const isParentAppointment = !apt.babyId && apt.parentId && apt.parent;
                    // For baby appointments, get primary parent; for parent appointments, the parent IS the client
                    const primaryParent = isParentAppointment ? null : apt.baby?.parents?.find((p) => p.isPrimary)?.parent;
                    // For parent appointments, show their phone
                    const clientPhone = isParentAppointment ? apt.parent?.phone : null;
                    const isDraggable = apt.status === "SCHEDULED";
                    const timeRange = `${formatTime(apt.startTime)} - ${formatTime(apt.endTime)}`;
                    // Client name and icon
                    const clientName = isParentAppointment ? apt.parent?.name : apt.baby?.name;
                    const ClientIcon = isParentAppointment ? UserRound : Baby;

                    return (
                      <div
                        key={apt.id}
                        draggable={isDraggable}
                        onDragStart={(e) => {
                          if (isDraggable) {
                            e.dataTransfer.setData("appointmentId", apt.id);
                            onDragStart?.(apt.id);
                          }
                        }}
                        onClick={() => onAppointmentClick?.(apt.id)}
                        className={cn(
                          "flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition-all hover:shadow-md",
                          status.bg,
                          status.border,
                          isDraggable && "cursor-grab active:cursor-grabbing"
                        )}
                      >
                        {/* Drag handle */}
                        {isDraggable && (
                          <div className="flex h-full items-center text-gray-400">
                            <GripVertical className="h-5 w-5" />
                          </div>
                        )}

                        {/* Status indicator */}
                        <div className={cn("mt-1.5 h-3 w-3 flex-shrink-0 rounded-full", status.dot)} />

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <div className={cn(
                              "flex items-center gap-2",
                              isParentAppointment && "text-rose-700"
                            )}>
                              <ClientIcon className={cn(
                                "h-4 w-4",
                                isParentAppointment ? "text-rose-600" : "text-teal-600"
                              )} />
                              <p className={cn("font-semibold", status.text)}>{clientName}</p>
                              {isParentAppointment && (
                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                                  {t("calendar.clientType.parent")}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-500">{timeRange}</span>
                          </div>

                          {/* For baby appointments, show primary parent */}
                          {primaryParent && (
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {primaryParent.name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                {primaryParent.phone}
                              </span>
                            </div>
                          )}

                          {/* For parent appointments, show phone */}
                          {isParentAppointment && clientPhone && (
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                {clientPhone}
                              </span>
                            </div>
                          )}

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {/* Package badge */}
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                                apt.packagePurchase
                                  ? "bg-teal-100 text-teal-700"
                                  : "bg-amber-100 text-amber-700"
                              )}
                            >
                              <Package className="h-3 w-3" />
                              {apt.packagePurchase?.package.name || apt.selectedPackage?.name || t("calendar.sessionToDefine")}
                            </span>

                            {/* Status badge */}
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                status.bg,
                                status.text
                              )}
                            >
                              {t(`calendar.status.${statusTranslationKey[apt.status]}`)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-4 text-center text-sm text-gray-400">
                    {t("calendar.noAppointments")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
