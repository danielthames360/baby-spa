import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateExactAge } from "@/lib/utils/age";

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
                // Include active Baby Card purchase
                babyCardPurchases: {
                  where: {
                    status: "ACTIVE",
                  },
                  include: {
                    babyCard: {
                      include: {
                        rewards: {
                          orderBy: { sessionNumber: "asc" },
                        },
                      },
                    },
                    rewardUsages: true,
                  },
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

      // Calculate exact age using utility
      const exactAge = calculateExactAge(baby.birthDate);

      // Get next appointment for this baby
      const nextAppointment = baby.appointments[0] || null;

      // Get active Baby Card
      const activeBabyCard = baby.babyCardPurchases[0] || null;
      const babyCardInfo = activeBabyCard
        ? {
            purchaseId: activeBabyCard.id,
            name: activeBabyCard.babyCard.name,
            totalSessions: activeBabyCard.babyCard.totalSessions,
            completedSessions: activeBabyCard.completedSessions,
            progressPercent:
              (activeBabyCard.completedSessions /
                activeBabyCard.babyCard.totalSessions) *
              100,
            rewards: activeBabyCard.babyCard.rewards.map((r) => ({
              id: r.id,
              sessionNumber: r.sessionNumber,
              displayName: r.displayName,
              displayIcon: r.displayIcon,
              rewardType: r.rewardType,
            })),
            usedRewardIds: activeBabyCard.rewardUsages.map(
              (u) => u.babyCardRewardId
            ),
          }
        : null;

      return {
        id: baby.id,
        name: baby.name,
        gender: baby.gender,
        birthDate: baby.birthDate,
        ageMonths: exactAge.totalMonths,
        age: {
          years: exactAge.years,
          months: exactAge.months,
          days: exactAge.days,
          totalMonths: exactAge.totalMonths,
        },
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
        babyCard: babyCardInfo,
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
