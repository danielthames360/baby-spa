import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { appointmentService } from "@/lib/services/appointment-service";
import { parseDateToUTCNoon, getStartOfDayUTC } from "@/lib/utils/date-utils";

// GET /api/appointments/availability - Get availability for a date
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json(
        { error: "DATE_REQUIRED" },
        { status: 400 }
      );
    }

    // Parse date string as UTC noon (YYYY-MM-DD format)
    // Using UTC noon ensures date never shifts regardless of timezone
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = parseDateToUTCNoon(year, month, day);

    // Validate date is not in the past (using UTC for consistency)
    const today = getStartOfDayUTC(new Date());

    if (date < today) {
      return NextResponse.json(
        { error: "DATE_IN_PAST" },
        { status: 400 }
      );
    }

    const availability = await appointmentService.getAvailability(date);

    return NextResponse.json(availability);
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
