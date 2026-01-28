"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, Calendar, Loader2, CalendarDays, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeekView } from "./week-view";
import { DayView } from "./day-view";
import { cn } from "@/lib/utils";
import { formatLocalDateString } from "@/lib/utils/date-utils";

// Dynamic imports for heavy dialog components (reduces initial bundle size)
const AppointmentDialog = dynamic(
  () => import("./appointment-dialog").then((mod) => mod.AppointmentDialog),
  { ssr: false }
);
const AppointmentDetails = dynamic(
  () => import("./appointment-details").then((mod) => mod.AppointmentDetails),
  { ssr: false }
);

interface Appointment {
  id: string;
  babyId: string | null;
  parentId: string | null;
  packagePurchaseId: string | null;
  date: Date;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "PENDING_PAYMENT";
  notes: string | null;
  cancelReason: string | null;
  baby?: {
    id: string;
    name: string;
    birthDate: Date;
    gender: string;
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
  session?: {
    id: string;
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
}

type ViewMode = "week" | "day";

// Get start of week (Monday)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get end of week (Saturday)
function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 5); // Monday + 5 = Saturday
  end.setHours(23, 59, 59, 999);
  return end;
}

// Format week range for display
function formatWeekRange(weekStart: Date, dateLocale: string): string {
  const weekEnd = getWeekEnd(weekStart);
  const startMonth = weekStart.toLocaleDateString(dateLocale, { month: "short" });
  const endMonth = weekEnd.toLocaleDateString(dateLocale, { month: "short" });
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const year = weekStart.getFullYear();

  if (startMonth === endMonth) {
    return `${startDay} - ${endDay} ${startMonth} ${year}`;
  } else {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  }
}

// Format single date for display
function formatSingleDate(date: Date, dateLocale: string): string {
  return date.toLocaleDateString(dateLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CalendarView() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateLocale = locale === "pt-BR" ? "pt-BR" : "es-ES";

  // Track which params we've already processed to avoid duplicates
  const lastProcessedParamsRef = useRef<string>("");
  const [pendingAppointmentId, setPendingAppointmentId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Initialize from localStorage if available (client-side only)
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("calendar-view-mode");
      if (saved === "day" || saved === "week") {
        return saved;
      }
    }
    return "week";
  });
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // Persist view mode preference to localStorage
  useEffect(() => {
    localStorage.setItem("calendar-view-mode", viewMode);
  }, [viewMode]);

  // Handle URL params (date and appointmentId)
  useEffect(() => {
    const dateParam = searchParams.get("date");
    const appointmentIdParam = searchParams.get("appointmentId");

    // Create a unique key for the current params
    const paramsKey = `${dateParam || ""}-${appointmentIdParam || ""}`;

    // Skip if we've already processed these exact params (or if no params)
    if (paramsKey === "-" || paramsKey === lastProcessedParamsRef.current) {
      return;
    }

    // Mark these params as processed
    lastProcessedParamsRef.current = paramsKey;

    if (dateParam) {
      // Parse the date (format: YYYY-MM-DD)
      const [year, month, day] = dateParam.split("-").map(Number);
      if (year && month && day) {
        const targetDate = new Date(year, month - 1, day);

        // Set the selected date and week
        setSelectedDate(targetDate);
        setCurrentWeekStart(getWeekStart(targetDate));
      }
    }

    if (appointmentIdParam) {
      // Store the appointment ID to open after data loads
      setPendingAppointmentId(appointmentIdParam);
    }
  }, [searchParams]);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoving, setIsMoving] = useState(false);

  // Dialog states
  const [newAppointmentDialog, setNewAppointmentDialog] = useState<{
    open: boolean;
    date: Date;
    time: string;
  }>({ open: false, date: new Date(), time: "" });

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Fetch appointments for current week
  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const weekEnd = getWeekEnd(currentWeekStart);
      const response = await fetch(
        `/api/appointments?startDate=${formatLocalDateString(currentWeekStart)}&endDate=${formatLocalDateString(weekEnd)}`
      );
      const data = await response.json();
      const newAppointments = data.appointments || [];
      setAppointments(newAppointments);

      // Update selectedAppointment if it exists in the new data
      // This ensures the details dialog shows fresh data after updates
      setSelectedAppointment((current) => {
        if (current) {
          const updatedAppointment = newAppointments.find(
            (a: Appointment) => a.id === current.id
          );
          return updatedAppointment || current;
        }
        return current;
      });
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentWeekStart]);

  // Fetch closed dates
  const fetchClosedDates = useCallback(async () => {
    try {
      // TODO: Implement closed dates API
      // For now, return empty array
      setClosedDates([]);
    } catch (error) {
      console.error("Error fetching closed dates:", error);
    }
  }, []);

  // Fetch events for current week
  const fetchEvents = useCallback(async () => {
    try {
      const weekEnd = getWeekEnd(currentWeekStart);
      const response = await fetch(
        `/api/events?dateFrom=${formatLocalDateString(currentWeekStart)}&dateTo=${formatLocalDateString(weekEnd)}&status=PUBLISHED,IN_PROGRESS`
      );
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }, [currentWeekStart]);

  useEffect(() => {
    fetchAppointments();
    fetchClosedDates();
    fetchEvents();
  }, [fetchAppointments, fetchClosedDates, fetchEvents]);

  // Handle pending appointment ID after appointments are loaded
  useEffect(() => {
    if (!pendingAppointmentId || isLoading) return;

    const apt = appointments.find((a) => a.id === pendingAppointmentId);

    if (apt) {
      // Found the appointment - open modal and clear pending ID
      setSelectedAppointment(apt);
      setDetailsDialogOpen(true);
      setPendingAppointmentId(null);

      // Clear the URL params after opening the modal
      const url = new URL(window.location.href);
      url.searchParams.delete("appointmentId");
      router.replace(url.pathname + url.search, { scroll: false });
    }
    // If not found, keep pendingAppointmentId and wait for correct data to load
  }, [pendingAppointmentId, appointments, isLoading, router]);

  // Week navigation
  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  // Day navigation
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
    // Update week if needed
    const newWeekStart = getWeekStart(newDate);
    if (newWeekStart.getTime() !== currentWeekStart.getTime()) {
      setCurrentWeekStart(newWeekStart);
    }
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
    // Update week if needed
    const newWeekStart = getWeekStart(newDate);
    if (newWeekStart.getTime() !== currentWeekStart.getTime()) {
      setCurrentWeekStart(newWeekStart);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentWeekStart(getWeekStart(today));
  };

  // Handle slot click (open new appointment dialog)
  const handleSlotClick = (date: Date, time: string) => {
    setNewAppointmentDialog({ open: true, date, time });
  };

  // Handle appointment click (open details dialog)
  const handleAppointmentClick = (appointmentId: string) => {
    const apt = appointments.find((a) => a.id === appointmentId);
    if (apt) {
      setSelectedAppointment(apt);
      setDetailsDialogOpen(true);
    }
  };

  // Handle day click from week view to switch to day view
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode("day");
  };

  // Handle event click to navigate to event details
  const handleEventClick = (eventId: string) => {
    router.push(`/${locale}/admin/events/${eventId}`);
  };

  // Handle drag and drop to move appointment
  const handleMoveAppointment = async (appointmentId: string, newTime: string, newDate?: Date) => {
    const appointment = appointments.find((a) => a.id === appointmentId);
    if (!appointment || appointment.status !== "SCHEDULED") {
      return;
    }

    setIsMoving(true);
    try {
      // Build the update data
      const targetDate = newDate || selectedDate;
      const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          startTime: newTime,
        }),
      });

      if (response.ok) {
        fetchAppointments();
      } else {
        const data = await response.json();
        console.error("Error moving appointment:", data.error);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error("Error moving appointment:", error);
    } finally {
      setIsMoving(false);
    }
  };

  // Check if current week/day is the actual current
  const isCurrentWeek = getWeekStart(new Date()).getTime() === currentWeekStart.getTime();
  const isToday = new Date().toDateString() === selectedDate.toDateString();

  // Get appointments for selected date (day view)
  const dayAppointments = appointments.filter((apt) => {
    const aptDateValue = apt.date as unknown as string | Date;
    const aptDateStr = typeof aptDateValue === "string"
      ? aptDateValue.split("T")[0]
      : `${aptDateValue.getFullYear()}-${String(aptDateValue.getMonth() + 1).padStart(2, "0")}-${String(aptDateValue.getDate()).padStart(2, "0")}`;
    const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    return aptDateStr === selectedDateStr;
  });

  // Get events for selected date (day view)
  const dayEvents = events.filter((event) => {
    const eventDateValue = event.date;
    const eventDateStr = typeof eventDateValue === "string"
      ? eventDateValue.split("T")[0]
      : `${eventDateValue.getFullYear()}-${String(eventDateValue.getMonth() + 1).padStart(2, "0")}-${String(eventDateValue.getDate()).padStart(2, "0")}`;
    const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    return eventDateStr === selectedDateStr;
  });

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Title and Date */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-4">
          <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-xl font-bold text-transparent sm:text-2xl">
            {t("calendar.title")}
          </h1>
          <div className="flex items-center gap-2 rounded-xl bg-white/70 px-2 py-1 backdrop-blur-sm sm:px-3 sm:py-1.5">
            <Calendar className="h-4 w-4 text-teal-600" />
            <span className="text-xs font-medium text-gray-700 sm:text-sm">
              {viewMode === "week" ? formatWeekRange(currentWeekStart, dateLocale) : formatSingleDate(selectedDate, dateLocale)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* View mode toggle */}
          <div className="flex rounded-xl bg-white/70 p-1 backdrop-blur-sm">
            <button
              onClick={() => setViewMode("week")}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm",
                viewMode === "week"
                  ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <CalendarRange className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {t("calendar.weekView")}
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm",
                viewMode === "day"
                  ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {t("calendar.dayView")}
            </button>
          </div>

          {/* Navigation controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={viewMode === "week" ? goToPreviousWeek : goToPreviousDay}
              className="h-8 w-8 rounded-xl border-2 border-teal-200 hover:bg-teal-50 sm:h-10 sm:w-10"
            >
              <ChevronLeft className="h-4 w-4 text-teal-600 sm:h-5 sm:w-5" />
            </Button>

            <Button
              variant="outline"
              onClick={goToToday}
              disabled={viewMode === "week" ? isCurrentWeek : isToday}
              className="h-8 rounded-xl border-2 border-teal-200 px-2 text-xs text-teal-600 hover:bg-teal-50 disabled:opacity-50 sm:h-10 sm:px-4 sm:text-sm"
            >
              {t("common.today")}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={viewMode === "week" ? goToNextWeek : goToNextDay}
              className="h-8 w-8 rounded-xl border-2 border-teal-200 hover:bg-teal-50 sm:h-10 sm:w-10"
            >
              <ChevronRight className="h-4 w-4 text-teal-600 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-white/70 px-4 py-2 backdrop-blur-sm">
        <span className="text-sm font-medium text-gray-500">{t("calendar.legend")}:</span>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-xs text-gray-600">{t("calendar.status.scheduled")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-xs text-gray-600">{t("calendar.status.inProgress")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-600">{t("calendar.status.completed")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-500" />
          <span className="text-xs text-gray-600">{t("calendar.status.cancelled")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-gray-500" />
          <span className="text-xs text-gray-600">{t("calendar.status.noShow")}</span>
        </div>
        {viewMode === "day" && (
          <span className="ml-auto text-xs text-gray-500">
            {t("calendar.dragToMove")}
          </span>
        )}
      </div>

      {/* Calendar */}
      <div className="relative flex-1">
        {(isLoading || isMoving) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          </div>
        )}

        {viewMode === "week" ? (
          <WeekView
            weekStart={currentWeekStart}
            appointments={appointments}
            events={events}
            closedDates={closedDates}
            onSlotClick={handleSlotClick}
            onAppointmentClick={handleAppointmentClick}
            onEventClick={handleEventClick}
            onDayClick={handleDayClick}
          />
        ) : (
          <DayView
            date={selectedDate}
            appointments={dayAppointments}
            events={dayEvents}
            onSlotClick={handleSlotClick}
            onAppointmentClick={handleAppointmentClick}
            onEventClick={handleEventClick}
            onDrop={(appointmentId, time) => handleMoveAppointment(appointmentId, time)}
          />
        )}
      </div>

      {/* New appointment dialog */}
      <AppointmentDialog
        open={newAppointmentDialog.open}
        onOpenChange={(open) =>
          setNewAppointmentDialog((prev) => ({ ...prev, open }))
        }
        date={newAppointmentDialog.date}
        time={newAppointmentDialog.time}
        onSuccess={fetchAppointments}
      />

      {/* Appointment details dialog */}
      <AppointmentDetails
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        appointment={selectedAppointment}
        onUpdate={fetchAppointments}
      />
    </div>
  );
}
