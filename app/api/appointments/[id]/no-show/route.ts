import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sessionService } from "@/lib/services/session-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/appointments/[id]/no-show - Mark appointment as no-show
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and RECEPTION can mark no-shows
    if (!["OWNER", "ADMIN", "RECEPTION"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: appointmentId } = await params;

    const result = await sessionService.markNoShow({
      appointmentId,
      userId: session.user.id,
      userName: session.user.name || "Unknown",
    });

    return NextResponse.json({ appointment: result });
  } catch (error) {
    console.error("Error marking no-show:", error);

    if (error instanceof Error) {
      const errorMap: Record<string, { message: string; status: number }> = {
        APPOINTMENT_NOT_FOUND: { message: "APPOINTMENT_NOT_FOUND", status: 404 },
        APPOINTMENT_NOT_SCHEDULED: {
          message: "APPOINTMENT_NOT_SCHEDULED",
          status: 400,
        },
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
