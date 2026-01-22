import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    // Parse date as local (flat date - no UTC conversion)
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day, 0, 0, 0, 0);

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

    // Get existing appointments for this date (include endTime for overlap check)
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        date,
        status: "SCHEDULED",
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Helper: convert time string to minutes
    const toMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    // For each slot, count appointments that OVERLAP with it
    // A 60-min appointment occupies 2 consecutive 30-min slots
    const SLOT_DURATION = 30; // minutes

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

      return {
        time: slot,
        available: overlappingCount < MAX_SLOTS_PER_HOUR,
        remaining: Math.max(0, MAX_SLOTS_PER_HOUR - overlappingCount),
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
