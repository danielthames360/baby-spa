import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { babyService } from "@/lib/services/baby-service";
import { updateBabySchema } from "@/lib/validations/baby";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/babies/[id] - Get baby by ID
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const baby = await babyService.getById(id);

    if (!baby) {
      return NextResponse.json({ error: "Baby not found" }, { status: 404 });
    }

    return NextResponse.json({ baby });
  } catch (error) {
    console.error("Error getting baby:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/babies/[id] - Update baby
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only OWNER, ADMIN, and RECEPTION can modify baby data
    const allowedRoles = ["OWNER", "ADMIN", "RECEPTION"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate update data
    const validatedData = updateBabySchema.parse(body);

    // Check baby exists
    const existingBaby = await babyService.getById(id);
    if (!existingBaby) {
      return NextResponse.json({ error: "Baby not found" }, { status: 404 });
    }

    try {
      const baby = await babyService.update(id, {
        name: validatedData.name,
        birthDate: validatedData.birthDate,
        gender: validatedData.gender,
        birthWeeks: validatedData.birthWeeks ?? undefined,
        birthWeight: validatedData.birthWeight ?? undefined,
        birthType: validatedData.birthType ?? undefined,
        birthDifficulty: validatedData.birthDifficulty,
        birthDifficultyDesc: validatedData.birthDifficultyDesc ?? undefined,
        pregnancyIssues: validatedData.pregnancyIssues,
        pregnancyIssuesDesc: validatedData.pregnancyIssuesDesc ?? undefined,
        priorStimulation: validatedData.priorStimulation,
        priorStimulationType: validatedData.priorStimulationType ?? undefined,
        developmentDiagnosis: validatedData.developmentDiagnosis,
        developmentDiagnosisDesc: validatedData.developmentDiagnosisDesc ?? undefined,
        diagnosedIllness: validatedData.diagnosedIllness,
        diagnosedIllnessDesc: validatedData.diagnosedIllnessDesc ?? undefined,
        recentMedication: validatedData.recentMedication,
        recentMedicationDesc: validatedData.recentMedicationDesc ?? undefined,
        allergies: validatedData.allergies ?? undefined,
        specialObservations: validatedData.specialObservations ?? undefined,
        socialMediaConsent: validatedData.socialMediaConsent,
        instagramHandle: validatedData.instagramHandle ?? undefined,
        referralSource: validatedData.referralSource ?? undefined,
      });

      return NextResponse.json({ baby });
    } catch (error) {
      if (error instanceof Error && error.message === "BIRTH_DATE_TOO_OLD") {
        return NextResponse.json(
          { error: "BIRTH_DATE_TOO_OLD" },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error updating baby:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/babies/[id] - Deactivate baby (soft delete)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only OWNER and ADMIN can deactivate
    if (!["OWNER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Check baby exists
    const existingBaby = await babyService.getById(id);
    if (!existingBaby) {
      return NextResponse.json({ error: "Baby not found" }, { status: 404 });
    }

    await babyService.deactivate(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deactivating baby:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
