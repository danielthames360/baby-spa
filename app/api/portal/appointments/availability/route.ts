import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseDateToUTCNoon, formatLocalDateString } from "@/lib/utils/date-utils";

const MAX_SLOTS_PER_HOUR = 2;

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json({ error: "Date required" }, { status: 400 });
    }

    // Parse date as UTC noon to avoid server timezone issues
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = parseDateToUTCNoon(year, month, day);

    // Check if date is closed
    const closedDate = await prisma.closedDate.findFirst({
      where: { date },
    });

    if (closedDate) {
      return NextResponse.json({
        available: false,
        reason: closedDate.reason || "Closed",
        slots: [],
      });
    }

    // Get business hours for this day
    const dayOfWeek = date.getDay();
    const businessHours = await prisma.businessHours.findFirst({
      where: { dayOfWeek },
    });

    if (!businessHours || !businessHours.isOpen) {
      return NextResponse.json({
        available: false,
        reason: "Closed",
        slots: [],
      });
    }

    // Generate time slots based on business hours
    const slots: string[] = [];

    const addSlots = (openTime: string | null, closeTime: string | null) => {
      if (!openTime || !closeTime) return;

      const [openHour, openMin] = openTime.split(":").map(Number);
      const [closeHour, closeMin] = closeTime.split(":").map(Number);

      let currentHour = openHour;
      let currentMin = openMin;

      while (
        currentHour < closeHour ||
        (currentHour === closeHour && currentMin < closeMin)
      ) {
        slots.push(
          `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`
        );

        // Add 30 minutes (or 1 hour depending on your slot duration)
        currentMin += 30;
        if (currentMin >= 60) {
          currentHour += 1;
          currentMin = 0;
        }
      }
    };

    // Morning slots
    addSlots(businessHours.morningOpen, businessHours.morningClose);
    // Afternoon slots
    addSlots(businessHours.afternoonOpen, businessHours.afternoonClose);

    // Get existing appointments and events in parallel
    // PENDING_PAYMENT appointments don't block slots
    const [existingAppointments, events] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          date,
          status: {
            in: ["SCHEDULED", "IN_PROGRESS"],
          },
        },
        select: {
          startTime: true,
          endTime: true,
        },
      }),
      prisma.event.findMany({
        where: {
          date,
          status: "PUBLISHED",
          blockedTherapists: { gt: 0 },
        },
        select: {
          startTime: true,
          endTime: true,
          blockedTherapists: true,
        },
      }),
    ]);

    // Helper: convert time string to minutes
    const toMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    // For each slot, count appointments that OVERLAP with it
    // A 60-min appointment occupies 2 consecutive 30-min slots
    const SLOT_DURATION = 30; // minutes
    const MIN_BUFFER_MINUTES = 60; // Minimum 1 hour from now for same-day bookings

    // Check if requested date is today (for filtering past slots)
    const now = new Date();
    const isToday = dateStr === formatLocalDateString(now);
    const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() + MIN_BUFFER_MINUTES : 0;

    const availableSlots = slots.map((slot) => {
      const slotStart = toMinutes(slot);
      const slotEnd = slotStart + SLOT_DURATION;

      // Count appointments that overlap with this slot
      const overlappingCount = existingAppointments.filter((apt) => {
        const aptStart = toMinutes(apt.startTime);
        const aptEnd = toMinutes(apt.endTime);
        // Overlap: appointment starts before slot ends AND ends after slot starts
        return aptStart < slotEnd && aptEnd > slotStart;
      }).length;

      // Calculate max blocked therapists from overlapping events
      const maxBlockedByEvents = events.reduce((max, event) => {
        const eventStart = toMinutes(event.startTime);
        const eventEnd = toMinutes(event.endTime);
        // Check if event overlaps with this slot
        if (eventStart < slotEnd && eventEnd > slotStart) {
          return Math.max(max, event.blockedTherapists);
        }
        return max;
      }, 0);

      // Reduce capacity based on events - if event blocks >= 2, slot is unavailable for parents
      const effectiveCapacity = Math.max(0, MAX_SLOTS_PER_HOUR - maxBlockedByEvents);

      // For today, filter out slots that have already passed (with buffer)
      const isPastSlot = isToday && slotStart < currentMinutes;

      return {
        time: slot,
        available: !isPastSlot && overlappingCount < effectiveCapacity,
        remaining: isPastSlot ? 0 : Math.max(0, effectiveCapacity - overlappingCount),
      };
    });

    return NextResponse.json({
      available: true,
      slots: availableSlots,
    });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
