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

    // Get parent data with their babies
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        babies: {
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
                  orderBy: {
                    createdAt: "desc",
                  },
                },
                appointments: {
                  where: {
                    status: "SCHEDULED",
                    date: {
                      gte: new Date(),
                    },
                  },
                  orderBy: [
                    { date: "asc" },
                    { startTime: "asc" },
                  ],
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Calculate total remaining sessions across all babies and packages
    let totalRemainingSessions = 0;

    // Transform babies data
    const babies = parent.babies.map((bp) => {
      const baby = bp.baby;

      // Calculate total remaining sessions for this baby
      const babyRemainingSessions = baby.packagePurchases.reduce(
        (sum, pkg) => sum + pkg.remainingSessions,
        0
      );

      totalRemainingSessions += babyRemainingSessions;

      // Calculate age in months
      const birthDate = new Date(baby.birthDate);
      const now = new Date();
      const ageMonths =
        (now.getFullYear() - birthDate.getFullYear()) * 12 +
        (now.getMonth() - birthDate.getMonth());

      // Format age display
      let ageDisplay: string;
      if (ageMonths < 12) {
        ageDisplay = `${ageMonths} meses`;
      } else {
        const years = Math.floor(ageMonths / 12);
        const months = ageMonths % 12;
        if (months > 0) {
          ageDisplay = `${years} año${years > 1 ? "s" : ""} y ${months} mes${months > 1 ? "es" : ""}`;
        } else {
          ageDisplay = `${years} año${years > 1 ? "s" : ""}`;
        }
      }

      // Get next appointment for this baby
      const nextAppointment = baby.appointments[0] || null;

      return {
        id: baby.id,
        name: baby.name,
        gender: baby.gender,
        birthDate: baby.birthDate,
        ageMonths,
        ageDisplay,
        relationship: bp.relationship,
        remainingSessions: babyRemainingSessions,
        packages: baby.packagePurchases.map((pkg) => ({
          id: pkg.id,
          totalSessions: pkg.totalSessions,
          usedSessions: pkg.usedSessions,
          remainingSessions: pkg.remainingSessions,
          package: {
            id: pkg.package.id,
            name: pkg.package.name,
            categoryId: pkg.package.categoryId,
            duration: pkg.package.duration,
          },
        })),
        nextAppointment: nextAppointment
          ? {
              id: nextAppointment.id,
              date: nextAppointment.date,
              startTime: nextAppointment.startTime,
              endTime: nextAppointment.endTime,
            }
          : null,
      };
    });

    // Get next appointment across all babies
    const allNextAppointments = babies
      .filter((b) => b.nextAppointment)
      .map((b) => ({
        ...b.nextAppointment!,
        babyName: b.name,
        babyId: b.id,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        return a.startTime.localeCompare(b.startTime);
      });

    const nextAppointment = allNextAppointments[0] || null;

    return NextResponse.json({
      parent: {
        id: parent.id,
        name: parent.name,
        noShowCount: parent.noShowCount,
        requiresPrepayment: parent.requiresPrepayment,
      },
      babies,
      totalRemainingSessions,
      nextAppointment,
    });
  } catch (error) {
    console.error("Portal dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
