import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseDateToUTCNoon, getStartOfDayUTC } from "@/lib/utils/date-utils";

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
                package: {
                  include: {
                    categoryRef: {
                      select: {
                        id: true,
                        name: true,
                        color: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const babyIds = parentBabies.map((bp) => bp.babyId);

    // Get all appointments (use UTC for consistent date comparison)
    const today = getStartOfDayUTC(new Date());

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
        selectedPackage: {
          select: {
            id: true,
            name: true,
            advancePaymentAmount: true,
          },
        },
      },
      orderBy: [
        { date: "desc" },
        { startTime: "desc" },
      ],
    });

    // Separate upcoming and past
    // Include both SCHEDULED and PENDING_PAYMENT in upcoming
    const upcoming = appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      return aptDate >= today && (apt.status === "SCHEDULED" || apt.status === "PENDING_PAYMENT");
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
      return aptDate < today || (apt.status !== "SCHEDULED" && apt.status !== "PENDING_PAYMENT");
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
        remainingSessions: pkg.remainingSessions,
        totalSessions: pkg.totalSessions,
        usedSessions: pkg.usedSessions,
        package: {
          id: pkg.package.id,
          name: pkg.package.name,
          categoryId: pkg.package.categoryId,
          duration: pkg.package.duration,
        },
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
    const { babyId, packagePurchaseId, packageId, date, startTime } = body;

    // Verify baby belongs to parent
    const babyParent = await prisma.babyParent.findFirst({
      where: { parentId, babyId },
    });

    if (!babyParent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify package belongs to baby and has sessions (only if package provided)
    let validPackagePurchaseId: string | null = null;
    let validSelectedPackageId: string | null = null;
    let sessionDuration = 60; // Default duration

    if (packagePurchaseId) {
      // User selected an existing package purchase
      const packagePurchase = await prisma.packagePurchase.findFirst({
        where: {
          id: packagePurchaseId,
          babyId,
          remainingSessions: { gt: 0 },
        },
        include: {
          package: { select: { duration: true } }
        }
      });

      if (!packagePurchase) {
        return NextResponse.json(
          { error: "No sessions available in selected package" },
          { status: 400 }
        );
      }

      validPackagePurchaseId = packagePurchase.id;
      sessionDuration = packagePurchase.package.duration;
    } else if (packageId) {
      // User selected a package from the catalog (provisional)
      const selectedPackage = await prisma.package.findFirst({
        where: {
          id: packageId,
          isActive: true,
        },
        select: { id: true, duration: true }
      });

      if (selectedPackage) {
        validSelectedPackageId = selectedPackage.id;
        sessionDuration = selectedPackage.duration;
      }
    } else {
      // Use system default package duration if no package specified
      const systemSettings = await prisma.systemSettings.findUnique({
        where: { id: "default" },
        include: { defaultPackage: { select: { id: true, duration: true } } }
      });
      if (systemSettings?.defaultPackage) {
        sessionDuration = systemSettings.defaultPackage.duration;
      }
    }

    // Parse date as UTC noon to avoid timezone day-shift issues
    // Using 12:00 UTC ensures the date never shifts regardless of timezone
    const [year, month, day] = date.split("-").map(Number);
    const appointmentDate = parseDateToUTCNoon(year, month, day);

    // Calculate end time based on package duration
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + sessionDuration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;

    // Check if baby already has an overlapping appointment on this date
    const babyAppointments = await prisma.appointment.findMany({
      where: {
        babyId,
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

    // Check for overlapping appointments for this baby
    const hasOverlap = babyAppointments.some((apt) => {
      const aptStart = toMinutes(apt.startTime);
      const aptEnd = toMinutes(apt.endTime);
      // Overlap: new appointment starts before existing ends AND ends after existing starts
      return requestedStartMins < aptEnd && requestedEndMins > aptStart;
    });

    if (hasOverlap) {
      return NextResponse.json(
        { error: "Baby already has an appointment at this time" },
        { status: 400 }
      );
    }

    // Check slot availability with OVERLAP detection (max 2 per slot)
    // Sessions occupy multiple 30-min slots based on their duration
    const MAX_SLOTS_PER_HOUR = 2;
    const SLOT_DURATION_MINUTES = 30;

    // PENDING_PAYMENT appointments don't block slots
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        date: appointmentDate,
        status: {
          in: ["SCHEDULED", "IN_PROGRESS"],
        },
      },
      select: { startTime: true, endTime: true },
    });

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

    // Check if the selected package requires advance payment
    let requiresAdvancePayment = false;
    let advancePaymentAmount: number | null = null;
    let packageName = "";

    if (validPackagePurchaseId) {
      // Using existing package purchase - no advance payment needed
      requiresAdvancePayment = false;
    } else if (validSelectedPackageId) {
      // Check if catalog package requires advance payment
      const catalogPackage = await prisma.package.findUnique({
        where: { id: validSelectedPackageId },
        select: {
          name: true,
          requiresAdvancePayment: true,
          advancePaymentAmount: true,
        },
      });
      if (catalogPackage) {
        requiresAdvancePayment = catalogPackage.requiresAdvancePayment;
        advancePaymentAmount = catalogPackage.advancePaymentAmount
          ? parseFloat(catalogPackage.advancePaymentAmount.toString())
          : null;
        packageName = catalogPackage.name;
      }
    }

    // Create appointment (NO session deduction - that happens when session is completed)
    const result = await prisma.$transaction(async (tx) => {
      // Create appointment with package pre-selected (provisional until checkout)
      const appointment = await tx.appointment.create({
        data: {
          babyId,
          packagePurchaseId: validPackagePurchaseId,
          selectedPackageId: validSelectedPackageId,
          date: appointmentDate,
          startTime,
          endTime,
          status: requiresAdvancePayment ? "PENDING_PAYMENT" : "SCHEDULED",
          isPendingPayment: requiresAdvancePayment,
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
            status: requiresAdvancePayment ? "PENDING_PAYMENT" : "SCHEDULED",
          },
        },
      });

      return appointment;
    });

    return NextResponse.json({
      appointment: result,
      requiresAdvancePayment,
      advancePaymentAmount,
      packageName,
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
