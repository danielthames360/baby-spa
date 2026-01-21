import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sessionService } from "@/lib/services/session-service";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const evaluationSchema = z.object({
  babyAgeMonths: z.number().int().positive(),
  babyWeight: z.number().positive().optional(),
  // Activities
  hydrotherapy: z.boolean(),
  massage: z.boolean(),
  motorStimulation: z.boolean(),
  sensoryStimulation: z.boolean(),
  relaxation: z.boolean(),
  otherActivities: z.string().optional(),
  // Sensory
  visualTracking: z.boolean().optional(),
  eyeContact: z.boolean().optional(),
  auditoryResponse: z.boolean().optional(),
  // Muscle development
  muscleTone: z.enum(["LOW", "NORMAL", "TENSE"]).optional(),
  cervicalControl: z.boolean().optional(),
  headUp: z.boolean().optional(),
  // Milestones
  sits: z.boolean().optional(),
  crawls: z.boolean().optional(),
  walks: z.boolean().optional(),
  // State
  mood: z.enum(["CALM", "IRRITABLE"]).optional(),
  // Notes
  internalNotes: z.string().optional(),
  externalNotes: z.string().optional(),
});

// POST /api/sessions/[id]/evaluate - Save evaluation (Therapist only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only THERAPIST and ADMIN can save evaluations
    if (!["ADMIN", "THERAPIST"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: sessionId } = await params;

    // If therapist, verify they are assigned to this session
    if (session.user.role === "THERAPIST") {
      const sessionData = await sessionService.getById(sessionId);
      if (!sessionData || sessionData.therapistId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await request.json();
    const validationResult = evaluationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const evaluation = await sessionService.saveEvaluation({
      sessionId,
      ...validationResult.data,
    });

    return NextResponse.json({ evaluation }, { status: 201 });
  } catch (error) {
    console.error("Error saving evaluation:", error);

    if (error instanceof Error) {
      const errorMap: Record<string, { message: string; status: number }> = {
        SESSION_NOT_FOUND: { message: "SESSION_NOT_FOUND", status: 404 },
        EVALUATION_ALREADY_EXISTS: {
          message: "EVALUATION_ALREADY_EXISTS",
          status: 400,
        },
        SESSION_NOT_STARTED: {
          message: "SESSION_NOT_STARTED",
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
