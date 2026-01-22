import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parentId = session.user.parentId;

    if (!parentId) {
      return NextResponse.json({ error: "Parent ID not found" }, { status: 400 });
    }

    // Get parent data
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      select: {
        requiresPrepayment: true,
        noShowCount: true,
      },
    });

    // Get parent's babies with their packages (ALL babies, not just with sessions)
    const parentBabies = await prisma.babyParent.findMany({
      where: { parentId },
      include: {
        baby: {
          include: {
            packagePurchases: {
              where: {
                remainingSessions: { gt: 0 },
              },
              include: {
                package: true,
              },
            },
          },
        },
      },
    });

    const babyIds = parentBabies.map((bp) => bp.babyId);

    // Get all appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = await prisma.appointment.findMany({
      where: {
        babyId: { in: babyIds },
      },
      include: {
        baby: {
          select: {
            id: true,
            name: true,
            gender: true,
          },
        },
        therapist: {
          select: {
            name: true,
          },
        },
        packagePurchase: {
          select: {
            id: true,
            package: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { date: "desc" },
        { startTime: "desc" },
      ],
    });

    // Separate upcoming and past
    const upcoming = appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      return aptDate >= today && apt.status === "SCHEDULED";
    }).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return a.startTime.localeCompare(b.startTime);
    });

    const past = appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      return aptDate < today || apt.status !== "SCHEDULED";
    });

    // Transform babies for selection
    const babies = parentBabies.map((bp) => ({
      id: bp.baby.id,
      name: bp.baby.name,
      gender: bp.baby.gender,
      totalRemainingSessions: bp.baby.packagePurchases.reduce(
        (sum, pkg) => sum + pkg.remainingSessions,
        0
      ),
      packages: bp.baby.packagePurchases.map((pkg) => ({
        id: pkg.id,
        name: pkg.package.name,
        remainingSessions: pkg.remainingSessions,
      })),
    }));

    return NextResponse.json({
      upcoming,
      past,
      babies,
      canSchedule: !parent?.requiresPrepayment,
      requiresPrepayment: parent?.requiresPrepayment || false,
    });
  } catch (error) {
    console.error("Portal appointments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parentId = session.user.parentId;

    if (!parentId) {
      return NextResponse.json({ error: "Parent ID not found" }, { status: 400 });
    }

    // Check if parent requires prepayment
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
    });

    if (parent?.requiresPrepayment) {
      return NextResponse.json(
        { error: "Prepayment required. Contact reception." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { babyId, packagePurchaseId, date, startTime } = body;

    // Verify baby belongs to parent
    const babyParent = await prisma.babyParent.findFirst({
      where: { parentId, babyId },
    });

    if (!babyParent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify package belongs to baby and has sessions (only if package provided)
    // If no package provided, it's a "session to define"
    let validPackagePurchaseId: string | null = null;

    if (packagePurchaseId) {
      const packagePurchase = await prisma.packagePurchase.findFirst({
        where: {
          id: packagePurchaseId,
          babyId,
          remainingSessions: { gt: 0 },
        },
      });

      if (!packagePurchase) {
        return NextResponse.json(
          { error: "No sessions available in selected package" },
          { status: 400 }
        );
      }

      validPackagePurchaseId = packagePurchase.id;
    }
    // If no packagePurchaseId, appointment will be created as "session to define"

    // Parse date as local (flat date - no UTC conversion)
    const [year, month, day] = date.split("-").map(Number);
    const appointmentDate = new Date(year, month - 1, day, 0, 0, 0, 0);

    // Check if baby already has appointment on this date
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        babyId,
        date: appointmentDate,
        status: "SCHEDULED",
      },
    });

    if (existingAppointment) {
      return NextResponse.json(
        { error: "Baby already has appointment on this date" },
        { status: 400 }
      );
    }

    // Calculate end time (1 hour sessions)
    const [hours, minutes] = startTime.split(":").map(Number);
    const endTime = `${String(hours + 1).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

    // Check slot availability with OVERLAP detection (max 2 per slot)
    // A 60-min session occupies two 30-min slots, so we need to check both
    const MAX_SLOTS_PER_HOUR = 2;
    const SLOT_DURATION_MINUTES = 30;

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        date: appointmentDate,
        status: "SCHEDULED",
      },
      select: { startTime: true, endTime: true },
    });

    // Convert time string to minutes for comparison
    const toMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    const requestedStartMins = toMinutes(startTime);
    const requestedEndMins = toMinutes(endTime);

    // Check each 30-minute slot within the requested time range
    for (let slotStart = requestedStartMins; slotStart < requestedEndMins; slotStart += SLOT_DURATION_MINUTES) {
      const slotEnd = slotStart + SLOT_DURATION_MINUTES;

      // Count appointments that OVERLAP with this slot
      const conflictCount = existingAppointments.filter((apt) => {
        const aptStart = toMinutes(apt.startTime);
        const aptEnd = toMinutes(apt.endTime);
        // Overlap: appointment starts before slot ends AND ends after slot starts
        return aptStart < slotEnd && aptEnd > slotStart;
      }).length;

      if (conflictCount >= MAX_SLOTS_PER_HOUR) {
        return NextResponse.json(
          { error: "Time slot is full" },
          { status: 400 }
        );
      }
    }

    // Create appointment (NO session deduction - that happens when session is completed)
    const result = await prisma.$transaction(async (tx) => {
      // Create appointment with optional package pre-selected
      const appointment = await tx.appointment.create({
        data: {
          babyId,
          packagePurchaseId: validPackagePurchaseId, // null = "session to define"
          date: appointmentDate,
          startTime,
          endTime,
          status: "SCHEDULED",
        },
      });

      // Create history record
      await tx.appointmentHistory.create({
        data: {
          appointmentId: appointment.id,
          action: "CREATED",
          performedBy: parentId,
          performerType: "PARENT",
          performerName: parent?.name || "Parent",
          newValue: {
            date: appointmentDate.toISOString(),
            startTime,
            endTime,
            packagePurchaseId: validPackagePurchaseId,
          },
        },
      });

      return appointment;
    });

    return NextResponse.json({ appointment: result });
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
