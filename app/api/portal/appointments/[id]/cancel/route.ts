import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notificationService } from "@/lib/services/notification-service";
import { activityService } from "@/lib/services/activity-service";
import { differenceInHours, parseISO } from "date-fns";
import { fromDateOnly } from "@/lib/utils/date-utils";

const MIN_HOURS_BEFORE_CANCEL = 24;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parentId = session.user.parentId;
    if (!parentId) {
      return NextResponse.json({ error: "Parent ID not found" }, { status: 400 });
    }

    const { id: appointmentId } = await params;
    const body = await request.json();
    const { reason, locale = "es", clientTimestamp } = body;

    // Get the appointment with related data
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        baby: {
          include: {
            parents: {
              select: { parentId: true },
            },
          },
        },
        parent: true,
        payments: true,
        selectedPackage: {
          select: { name: true },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Verify ownership: appointment must belong to parent's baby or to parent directly
    const isOwner =
      (appointment.babyId &&
        appointment.baby?.parents.some((bp) => bp.parentId === parentId)) ||
      appointment.parentId === parentId;

    if (!isOwner) {
      return NextResponse.json(
        { error: "You can only cancel your own appointments" },
        { status: 403 }
      );
    }

    // Check if appointment can be cancelled (must be SCHEDULED or PENDING_PAYMENT)
    if (appointment.status !== "SCHEDULED" && appointment.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: "This appointment cannot be cancelled", code: "INVALID_STATUS" },
        { status: 400 }
      );
    }

    // Check if appointment has associated payments
    if (appointment.payments && appointment.payments.length > 0) {
      return NextResponse.json(
        {
          error: "This appointment has associated payments. Please contact reception.",
          code: "HAS_PAYMENTS"
        },
        { status: 400 }
      );
    }

    // Calculate hours until appointment using client's local time
    // The client sends their current timestamp, and we compare using local time interpretation
    // This ensures the calculation matches what the user sees on their screen
    const dateOnly = appointment.date.toISOString().split("T")[0];
    const appointmentDateTime = new Date(`${dateOnly}T${appointment.startTime}:00`);
    const clientNow = clientTimestamp ? new Date(clientTimestamp) : new Date();

    const hoursUntilAppointment = differenceInHours(appointmentDateTime, clientNow);

    if (hoursUntilAppointment < MIN_HOURS_BEFORE_CANCEL) {
      return NextResponse.json(
        {
          error: `Cannot cancel with less than ${MIN_HOURS_BEFORE_CANCEL} hours notice`,
          code: "TOO_LATE",
          hoursRemaining: hoursUntilAppointment
        },
        { status: 400 }
      );
    }

    // Cancel the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CANCELLED",
        cancelReason: reason || "Cancelled by parent from portal",
      },
      include: {
        baby: { select: { name: true } },
        parent: { select: { name: true } },
      },
    });

    // Create notification for reception
    await notificationService.createForCancelledAppointment(
      {
        id: updatedAppointment.id,
        date: updatedAppointment.date,
        startTime: updatedAppointment.startTime,
        status: updatedAppointment.status,
        baby: updatedAppointment.baby,
        parent: updatedAppointment.parent,
      },
      locale
    );

    // Log activity
    const clientName =
      updatedAppointment.baby?.name || updatedAppointment.parent?.name || "Cliente";

    await activityService.logAppointmentCancelledPortal(appointmentId, {
      babyName: clientName,
      date: fromDateOnly(updatedAppointment.date),
      time: updatedAppointment.startTime,
      packageName: appointment.selectedPackage?.name,
      reason: reason || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment: {
        id: updatedAppointment.id,
        status: updatedAppointment.status,
      },
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
