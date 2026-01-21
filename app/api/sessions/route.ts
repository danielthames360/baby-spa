import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sessionService } from "@/lib/services/session-service";

// GET /api/sessions - Get today's sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "today", "pending-evaluations"

    if (type === "pending-evaluations") {
      // Only ADMIN can see pending evaluations
      if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const appointments = await sessionService.getPendingEvaluations();
      const count = await sessionService.getPendingEvaluationsCount();

      return NextResponse.json({ appointments, count });
    }

    // Default: get sessions for a specific date (or today)
    const dateParam = searchParams.get("date");
    let targetDate: Date | undefined;

    if (dateParam) {
      // Parse date string (YYYY-MM-DD) in local timezone to avoid UTC offset issues
      const [year, month, day] = dateParam.split("-").map(Number);
      targetDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    }

    if (session.user.role === "THERAPIST") {
      // Therapist sees only their sessions
      const appointments = await sessionService.getSessionsForTherapist(
        session.user.id,
        targetDate
      );
      return NextResponse.json({ appointments });
    }

    // Admin/Reception sees all
    const appointments = await sessionService.getTodayAll();
    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
