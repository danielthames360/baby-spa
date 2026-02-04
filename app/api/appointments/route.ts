import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { appointmentService } from "@/lib/services/appointment-service";
import { createAppointmentSchema } from "@/lib/validations/appointment";
import { parseDateToUTCNoon, getStartOfDayUTC, getEndOfDayUTC } from "@/lib/utils/date-utils";

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
    const parentId = searchParams.get("parentId");

    // If babyId provided, get upcoming appointments for that baby
    if (babyId) {
      const appointments = await appointmentService.getUpcomingForBaby(babyId);
      return NextResponse.json({ appointments });
    }

    // If parentId provided, get upcoming appointments for that parent
    if (parentId) {
      const appointments = await appointmentService.getUpcomingForParent(parentId);
      return NextResponse.json({ appointments });
    }

    // If single date provided (YYYY-MM-DD format)
    if (date) {
      const [year, month, day] = date.split("-").map(Number);
      // Use UTC noon to avoid server timezone issues
      const dateObj = parseDateToUTCNoon(year, month, day);
      const appointments = await appointmentService.getByDate(dateObj);
      return NextResponse.json({ appointments });
    }

    // If date range provided (YYYY-MM-DD format)
    if (startDate && endDate) {
      const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
      const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
      // Use start/end of day for range queries
      const start = getStartOfDayUTC(parseDateToUTCNoon(startYear, startMonth, startDay));
      const end = getEndOfDayUTC(parseDateToUTCNoon(endYear, endMonth, endDay));
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

    // Only roles with calendar:create permission can create appointments
    if (!["OWNER", "ADMIN", "RECEPTION"].includes(session.user.role)) {
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

    const { babyId, parentId, date, startTime, notes, packageId, packagePurchaseId, createAsPending } = validationResult.data;

    // Parse date string as UTC noon (YYYY-MM-DD format)
    // Using UTC noon ensures date never shifts regardless of server timezone
    const [year, month, day] = date.split("-").map(Number);
    const dateObj = parseDateToUTCNoon(year, month, day);

    const appointment = await appointmentService.create({
      babyId: babyId || undefined,
      parentId: parentId || undefined,
      date: dateObj,
      startTime,
      notes: notes || undefined,
      userId: session.user.id,
      userName: session.user.name || "Unknown",
      selectedPackageId: packageId || undefined,
      packagePurchaseId: packagePurchaseId || undefined,
      createAsPending: createAsPending || false,
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);

    if (error instanceof Error) {
      const errorMap: Record<string, { message: string; status: number }> = {
        BABY_NOT_FOUND: { message: "BABY_NOT_FOUND", status: 404 },
        PARENT_NOT_FOUND: { message: "PARENT_NOT_FOUND", status: 404 },
        CLIENT_REQUIRED: { message: "CLIENT_REQUIRED", status: 400 },
        INVALID_CLIENT_SELECTION: { message: "INVALID_CLIENT_SELECTION", status: 400 },
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
