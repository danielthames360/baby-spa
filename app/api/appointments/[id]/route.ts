import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { appointmentService } from "@/lib/services/appointment-service";
import { updateAppointmentSchema } from "@/lib/validations/appointment";
import { AppointmentStatus } from "@prisma/client";
import { parseDateToUTCNoon } from "@/lib/utils/date-utils";

// GET /api/appointments/[id] - Get single appointment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const appointment = await appointmentService.getById(id);

    if (!appointment) {
      return NextResponse.json(
        { error: "APPOINTMENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id] - Update appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and RECEPTION can update appointments
    if (!["OWNER", "ADMIN", "RECEPTION"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = updateAppointmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { date, startTime, status, notes, cancelReason, packageId, packagePurchaseId } = validationResult.data;

    // Parse date as UTC noon (YYYY-MM-DD format) to avoid server timezone issues
    let dateObj: Date | undefined;
    if (date) {
      const [year, month, day] = date.split("-").map(Number);
      dateObj = parseDateToUTCNoon(year, month, day);
    }

    const appointment = await appointmentService.update(
      id,
      {
        date: dateObj,
        startTime,
        status: status as AppointmentStatus | undefined,
        notes,
        cancelReason,
        selectedPackageId: packageId || undefined,
        packagePurchaseId: packagePurchaseId || undefined,
      },
      session.user.id,
      session.user.name || "Unknown"
    );

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Error updating appointment:", error);

    if (error instanceof Error) {
      const errorMap: Record<string, { message: string; status: number }> = {
        APPOINTMENT_NOT_FOUND: { message: "APPOINTMENT_NOT_FOUND", status: 404 },
        DATE_CLOSED: { message: "DATE_CLOSED", status: 400 },
        OUTSIDE_BUSINESS_HOURS: { message: "OUTSIDE_BUSINESS_HOURS", status: 400 },
        BABY_ALREADY_HAS_APPOINTMENT: { message: "BABY_ALREADY_HAS_APPOINTMENT", status: 400 },
        TIME_SLOT_FULL: { message: "TIME_SLOT_FULL", status: 400 },
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

// PATCH /api/appointments/[id] - Quick status updates
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;

    let appointment;

    switch (action) {
      case "start":
        // Start appointment (mark as in progress)
        if (!["OWNER", "ADMIN", "RECEPTION", "THERAPIST"].includes(session.user.role)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        appointment = await appointmentService.startAppointment(
          id,
          session.user.id,
          session.user.name || "Unknown"
        );
        break;

      case "complete":
        // Complete appointment
        if (!["OWNER", "ADMIN", "RECEPTION"].includes(session.user.role)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        appointment = await appointmentService.completeAppointment(
          id,
          session.user.id,
          session.user.name || "Unknown"
        );
        break;

      case "cancel":
        // Cancel appointment
        if (!["OWNER", "ADMIN", "RECEPTION"].includes(session.user.role)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (!reason) {
          return NextResponse.json(
            { error: "CANCEL_REASON_REQUIRED" },
            { status: 400 }
          );
        }
        appointment = await appointmentService.cancel(
          id,
          reason,
          session.user.id,
          session.user.name || "Unknown"
        );
        break;

      case "no-show":
        // Mark as no-show
        if (!["OWNER", "ADMIN", "RECEPTION"].includes(session.user.role)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        appointment = await appointmentService.markNoShow(
          id,
          session.user.id,
          session.user.name || "Unknown"
        );
        break;

      default:
        return NextResponse.json(
          { error: "INVALID_ACTION" },
          { status: 400 }
        );
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Error updating appointment:", error);

    if (error instanceof Error) {
      if (error.message === "APPOINTMENT_NOT_FOUND") {
        return NextResponse.json(
          { error: "APPOINTMENT_NOT_FOUND" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Delete appointment (cancel)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only OWNER and ADMIN can delete
    if (!["OWNER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Cancel instead of hard delete
    await appointmentService.cancel(
      id,
      "Deleted by admin",
      session.user.id,
      session.user.name || "Unknown"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting appointment:", error);

    if (error instanceof Error) {
      if (error.message === "APPOINTMENT_NOT_FOUND") {
        return NextResponse.json(
          { error: "APPOINTMENT_NOT_FOUND" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
