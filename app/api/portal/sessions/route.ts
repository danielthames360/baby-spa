import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parentId = session.user.parentId;

    if (!parentId) {
      return NextResponse.json({ error: "Parent ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const babyId = searchParams.get("babyId");

    // Get parent's babies
    const parentBabies = await prisma.babyParent.findMany({
      where: { parentId },
      select: { babyId: true },
    });

    const babyIds = parentBabies.map((bp) => bp.babyId);

    // Verify the requested baby belongs to this parent
    if (babyId && !babyIds.includes(babyId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get sessions with evaluations (excluding internal notes)
    const sessions = await prisma.session.findMany({
      where: {
        babyId: babyId || { in: babyIds },
        status: "COMPLETED",
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
        appointment: {
          select: {
            date: true,
            startTime: true,
          },
        },
        packagePurchase: {
          select: {
            package: {
              select: {
                name: true,
              },
            },
          },
        },
        evaluation: {
          select: {
            id: true,
            babyAgeMonths: true,
            babyWeight: true,
            // Activities
            hydrotherapy: true,
            massage: true,
            motorStimulation: true,
            sensoryStimulation: true,
            relaxation: true,
            otherActivities: true,
            // Sensory
            visualTracking: true,
            eyeContact: true,
            auditoryResponse: true,
            // Motor
            muscleTone: true,
            cervicalControl: true,
            headUp: true,
            // Milestones
            sits: true,
            crawls: true,
            walks: true,
            // Mood
            mood: true,
            // Only external notes (NO internalNotes!)
            externalNotes: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { completedAt: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Get babies list for filter
    const babies = await prisma.baby.findMany({
      where: { id: { in: babyIds } },
      select: {
        id: true,
        name: true,
        gender: true,
      },
    });

    return NextResponse.json({
      sessions,
      babies,
    });
  } catch (error) {
    console.error("Portal sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
