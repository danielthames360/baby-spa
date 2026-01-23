import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { appointmentService } from "@/lib/services/appointment-service";
import { createAppointmentSchema } from "@/lib/validations/appointment";

// GET /api/appointments - Get appointments by date range or baby
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const date = searchParams.get("date");
    const babyId = searchParams.get("babyId");

    // If babyId provided, get upcoming appointments for that baby
    if (babyId) {
      const appointments = await appointmentService.getUpcomingForBaby(babyId);
      return NextResponse.json({ appointments });
    }

    // If single date provided (YYYY-MM-DD format)
    if (date) {
      const [year, month, day] = date.split("-").map(Number);
      const dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
      const appointments = await appointmentService.getByDate(dateObj);
      return NextResponse.json({ appointments });
    }

    // If date range provided (YYYY-MM-DD format)
    if (startDate && endDate) {
      const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
      const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
      const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
      const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
      const appointments = await appointmentService.getByDateRange(start, end);
      return NextResponse.json({ appointments });
    }

    // Default: return today's appointments
    const today = new Date();
    const appointments = await appointmentService.getByDate(today);
    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and RECEPTION can create appointments
    if (!["ADMIN", "RECEPTION"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = createAppointmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { babyId, date, startTime, notes, packageId, packagePurchaseId } = validationResult.data;

    // Parse date string as local date (YYYY-MM-DD format)
    // Using new Date(string) parses as UTC which causes timezone issues
    const [year, month, day] = date.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);

    const appointment = await appointmentService.create({
      babyId,
      date: dateObj,
      startTime,
      notes: notes || undefined,
      userId: session.user.id,
      userName: session.user.name || "Unknown",
      selectedPackageId: packageId || undefined,
      packagePurchaseId: packagePurchaseId || undefined,
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);

    if (error instanceof Error) {
      const errorMap: Record<string, { message: string; status: number }> = {
        BABY_NOT_FOUND: { message: "BABY_NOT_FOUND", status: 404 },
        DATE_CLOSED: { message: "DATE_CLOSED", status: 400 },
        OUTSIDE_BUSINESS_HOURS: { message: "OUTSIDE_BUSINESS_HOURS", status: 400 },
        BABY_ALREADY_HAS_APPOINTMENT: { message: "BABY_ALREADY_HAS_APPOINTMENT", status: 400 },
        TIME_SLOT_FULL: { message: "TIME_SLOT_FULL", status: 400 },
        NO_ACTIVE_PACKAGE: { message: "NO_ACTIVE_PACKAGE", status: 400 },
        NO_SESSIONS_REMAINING: { message: "NO_SESSIONS_REMAINING", status: 400 },
      };

      const mappedError = errorMap[error.message];
      if (mappedError) {
        return NextResponse.json(
          { error: mappedError.message },
          { status: mappedError.status }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
