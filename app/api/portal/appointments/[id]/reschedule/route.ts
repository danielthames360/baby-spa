import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notificationService } from "@/lib/services/notification-service";
import { activityService } from "@/lib/services/activity-service";
import { emailService } from "@/lib/services/email-service";
import { differenceInHours } from "date-fns";
import { fromDateOnly, toDateOnly } from "@/lib/utils/date-utils";
import { getPortalSlotLimit } from "@/lib/services/settings-service";

const MIN_HOURS_BEFORE_RESCHEDULE = 24;

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
    const { newDate, newStartTime, newEndTime, locale = "es", clientTimestamp } = body;

    // Validate required fields
    if (!newDate || !newStartTime || !newEndTime) {
      return NextResponse.json(
        { error: "New date and time are required" },
        { status: 400 }
      );
    }

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
        selectedPackage: {
          select: { name: true, duration: true },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Verify ownership
    const isOwner =
      (appointment.babyId &&
        appointment.baby?.parents.some((bp) => bp.parentId === parentId)) ||
      appointment.parentId === parentId;

    if (!isOwner) {
      return NextResponse.json(
        { error: "You can only reschedule your own appointments" },
        { status: 403 }
      );
    }

    // Check if appointment can be rescheduled (must be SCHEDULED or PENDING_PAYMENT)
    if (appointment.status !== "SCHEDULED" && appointment.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: "This appointment cannot be rescheduled", code: "INVALID_STATUS" },
        { status: 400 }
      );
    }

    // Calculate hours until current appointment using client's local time
    // The client sends their current timestamp, and we compare using local time interpretation
    // This ensures the calculation matches what the user sees on their screen
    const currentDateOnly = appointment.date.toISOString().split("T")[0];
    const currentAppointmentDateTime = new Date(`${currentDateOnly}T${appointment.startTime}:00`);
    const clientNow = clientTimestamp ? new Date(clientTimestamp) : new Date();

    const hoursUntilAppointment = differenceInHours(currentAppointmentDateTime, clientNow);

    if (hoursUntilAppointment < MIN_HOURS_BEFORE_RESCHEDULE) {
      return NextResponse.json(
        {
          error: `Cannot reschedule with less than ${MIN_HOURS_BEFORE_RESCHEDULE} hours notice`,
          code: "TOO_LATE",
          hoursRemaining: hoursUntilAppointment
        },
        { status: 400 }
      );
    }

    // Parse new date
    const newDateParsed = toDateOnly(newDate);

    // Verify new date is in the future using client's local time
    const newAppointmentDateTime = new Date(`${newDate}T${newStartTime}:00`);

    if (newAppointmentDateTime <= clientNow) {
      return NextResponse.json(
        { error: "New appointment time must be in the future", code: "PAST_DATE" },
        { status: 400 }
      );
    }

    // Check slot availability (configurable max per slot for portal)
    const [existingAppointments, maxSlotsPortal] = await Promise.all([
      prisma.appointment.count({
        where: {
          date: newDateParsed,
          startTime: newStartTime,
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          id: { not: appointmentId }, // Exclude current appointment
        },
      }),
      getPortalSlotLimit(),
    ]);

    if (existingAppointments >= maxSlotsPortal) {
      return NextResponse.json(
        { error: "This time slot is no longer available", code: "SLOT_FULL" },
        { status: 400 }
      );
    }

    // Store old values for notification
    const oldDate = appointment.date;
    const oldStartTime = appointment.startTime;

    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        date: newDateParsed,
        startTime: newStartTime,
        endTime: newEndTime,
      },
      include: {
        baby: { select: { name: true } },
        parent: { select: { name: true } },
      },
    });

    // Create notification for reception
    await notificationService.createForRescheduledAppointment(
      {
        id: updatedAppointment.id,
        date: updatedAppointment.date,
        startTime: updatedAppointment.startTime,
        status: updatedAppointment.status,
        baby: updatedAppointment.baby,
        parent: updatedAppointment.parent,
      },
      oldDate,
      oldStartTime,
      locale
    );

    // Log activity
    const clientName =
      updatedAppointment.baby?.name || updatedAppointment.parent?.name || "Cliente";

    await activityService.logAppointmentRescheduledPortal(appointmentId, {
      babyName: clientName,
      date: fromDateOnly(updatedAppointment.date),
      time: updatedAppointment.startTime,
      packageName: appointment.selectedPackage?.name,
      oldDate: fromDateOnly(oldDate),
      oldTime: oldStartTime,
    });

    // Send reschedule email (non-blocking)
    // Get parent email
    const parentForEmail = await prisma.parent.findUnique({
      where: { id: parentId },
      select: { id: true, name: true, email: true },
    });

    if (parentForEmail?.email) {
      const serviceName = appointment.selectedPackage?.name || "Sesión";
      const sessionDuration = appointment.selectedPackage?.duration || 60;

      emailService.sendAppointmentRescheduled({
        parentId: parentForEmail.id,
        parentName: parentForEmail.name,
        parentEmail: parentForEmail.email,
        babyName: appointment.baby?.name || undefined,
        serviceName,
        date: newDateParsed,
        time: newStartTime,
        duration: sessionDuration,
        oldDate,
        oldTime: oldStartTime,
      }).catch((emailError) => {
        console.error("Failed to send reschedule email:", emailError);
      });
    }

    return NextResponse.json({
      success: true,
      message: "Appointment rescheduled successfully",
      appointment: {
        id: updatedAppointment.id,
        date: fromDateOnly(updatedAppointment.date),
        startTime: updatedAppointment.startTime,
        endTime: updatedAppointment.endTime,
        status: updatedAppointment.status,
      },
    });
  } catch (error) {
    console.error("Reschedule appointment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
