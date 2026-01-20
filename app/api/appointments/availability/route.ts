import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { appointmentService } from "@/lib/services/appointment-service";

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

    const date = new Date(dateStr);

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate < today) {
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
