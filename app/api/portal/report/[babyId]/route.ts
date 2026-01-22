import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ babyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parentId = session.user.parentId;
    const { babyId } = await params;

    if (!parentId) {
      return NextResponse.json({ error: "Parent ID not found" }, { status: 400 });
    }

    // Verify baby belongs to parent
    const babyParent = await prisma.babyParent.findFirst({
      where: { parentId, babyId },
      include: {
        parent: true,
        baby: {
          include: {
            sessions: {
              where: { status: "COMPLETED" },
              include: {
                therapist: { select: { name: true } },
                appointment: { select: { date: true } },
                evaluation: {
                  select: {
                    babyAgeMonths: true,
                    babyWeight: true,
                    hydrotherapy: true,
                    massage: true,
                    motorStimulation: true,
                    sensoryStimulation: true,
                    relaxation: true,
                    muscleTone: true,
                    mood: true,
                    sits: true,
                    crawls: true,
                    walks: true,
                    visualTracking: true,
                    eyeContact: true,
                    auditoryResponse: true,
                    externalNotes: true,
                  },
                },
              },
              orderBy: { completedAt: "asc" },
            },
          },
        },
      },
    });

    if (!babyParent) {
      return NextResponse.json({ error: "Baby not found" }, { status: 404 });
    }

    // Get locale from query params or default to es
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "es";

    // Transform sessions data
    const sessions = babyParent.baby.sessions.map((s) => {
      const activities: string[] = [];
      if (s.evaluation?.hydrotherapy) activities.push("hydrotherapy");
      if (s.evaluation?.massage) activities.push("massage");
      if (s.evaluation?.motorStimulation) activities.push("motorStimulation");
      if (s.evaluation?.sensoryStimulation) activities.push("sensoryStimulation");
      if (s.evaluation?.relaxation) activities.push("relaxation");

      return {
        sessionNumber: s.sessionNumber,
        date: s.appointment.date.toISOString(),
        therapistName: s.therapist.name,
        babyAgeMonths: s.evaluation?.babyAgeMonths || 0,
        babyWeight: s.evaluation?.babyWeight?.toString() || null,
        activities,
        muscleTone: s.evaluation?.muscleTone || null,
        mood: s.evaluation?.mood || null,
        milestones: {
          sits: s.evaluation?.sits ?? null,
          crawls: s.evaluation?.crawls ?? null,
          walks: s.evaluation?.walks ?? null,
        },
        sensory: {
          visualTracking: s.evaluation?.visualTracking ?? null,
          eyeContact: s.evaluation?.eyeContact ?? null,
          auditoryResponse: s.evaluation?.auditoryResponse ?? null,
        },
        externalNotes: s.evaluation?.externalNotes || null,
      };
    });

    // Return the data for client-side PDF generation
    return NextResponse.json({
      babyName: babyParent.baby.name,
      babyBirthDate: babyParent.baby.birthDate.toISOString(),
      babyGender: babyParent.baby.gender,
      parentName: babyParent.parent.name,
      totalSessions: sessions.length,
      sessions,
      generatedAt: new Date().toISOString(),
      locale,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
