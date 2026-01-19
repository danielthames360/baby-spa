import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { babyService } from "@/lib/services/baby-service";
import { parentService } from "@/lib/services/parent-service";
import {
  babySearchParamsSchema,
  babySchema,
  parentSchema,
} from "@/lib/validations/baby";

// GET /api/babies - List babies with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = babySearchParamsSchema.parse({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || "active",
      hasActivePackage: searchParams.get("hasActivePackage") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 10,
    });

    const result = await babyService.list(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error listing babies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to create or get parent ID
async function resolveParentId(
  parentData: unknown,
  existingParentId: string | null | undefined
): Promise<{ parentId: string; relationship: string } | null> {
  if (existingParentId) {
    // Use existing parent
    const parent = await parentService.getById(existingParentId);
    if (!parent) {
      throw new Error("PARENT_NOT_FOUND");
    }
    return {
      parentId: existingParentId,
      relationship: (parentData as { relationship?: string } | null)?.relationship || "MOTHER",
    };
  }

  if (!parentData) {
    return null;
  }

  // Create new parent
  const validatedParent = parentSchema.parse(parentData);

  const newParent = await parentService.create({
    name: validatedParent.name,
    documentId: validatedParent.documentId,
    documentType: validatedParent.documentType,
    phone: validatedParent.phone,
    email: validatedParent.email || undefined,
    birthDate: validatedParent.birthDate || undefined,
  });

  return {
    parentId: newParent.id,
    relationship: validatedParent.relationship,
  };
}

// POST /api/babies - Create baby with parent(s)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Support both old format (parent, existingParentId) and new format (parent1, parent2, etc.)
    const {
      baby: babyData,
      // Old format (backward compatible)
      parent: parentData,
      existingParentId,
      // New format for multiple parents
      parent1: parent1Data,
      existingParent1Id,
      parent2: parent2Data,
      existingParent2Id,
    } = body;

    // Validate baby data
    const validatedBaby = babySchema.parse(babyData);

    // Resolve parents
    const parentsToLink: Array<{
      parentId: string;
      relationship: string;
      isPrimary: boolean;
    }> = [];

    try {
      // Handle old format (single parent)
      if (parentData || existingParentId) {
        const resolved = await resolveParentId(parentData, existingParentId);
        if (resolved) {
          parentsToLink.push({
            ...resolved,
            isPrimary: true,
          });
        }
      }
      // Handle new format (multiple parents)
      else {
        // Parent 1 (primary)
        const resolved1 = await resolveParentId(parent1Data, existingParent1Id);
        if (resolved1) {
          parentsToLink.push({
            ...resolved1,
            isPrimary: true,
          });
        }

        // Parent 2 (secondary, optional)
        const resolved2 = await resolveParentId(parent2Data, existingParent2Id);
        if (resolved2) {
          parentsToLink.push({
            ...resolved2,
            isPrimary: false,
          });
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "DOCUMENT_EXISTS") {
          return NextResponse.json(
            { error: "DOCUMENT_EXISTS" },
            { status: 400 }
          );
        }
        if (error.message === "PHONE_EXISTS") {
          return NextResponse.json(
            { error: "PHONE_EXISTS" },
            { status: 400 }
          );
        }
        if (error.message === "PARENT_NOT_FOUND") {
          return NextResponse.json(
            { error: "PARENT_NOT_FOUND" },
            { status: 400 }
          );
        }
      }
      throw error;
    }

    // Ensure at least one parent
    if (parentsToLink.length === 0) {
      return NextResponse.json(
        { error: "AT_LEAST_ONE_PARENT" },
        { status: 400 }
      );
    }

    // Create baby with parents
    try {
      const baby = await babyService.createWithParents(
        {
          name: validatedBaby.name,
          birthDate: validatedBaby.birthDate,
          gender: validatedBaby.gender,
          birthWeeks: validatedBaby.birthWeeks ?? undefined,
          birthWeight: validatedBaby.birthWeight ?? undefined,
          birthType: validatedBaby.birthType ?? undefined,
          birthDifficulty: validatedBaby.birthDifficulty,
          birthDifficultyDesc: validatedBaby.birthDifficultyDesc ?? undefined,
          pregnancyIssues: validatedBaby.pregnancyIssues,
          pregnancyIssuesDesc: validatedBaby.pregnancyIssuesDesc ?? undefined,
          priorStimulation: validatedBaby.priorStimulation,
          priorStimulationType: validatedBaby.priorStimulationType ?? undefined,
          developmentDiagnosis: validatedBaby.developmentDiagnosis,
          developmentDiagnosisDesc: validatedBaby.developmentDiagnosisDesc ?? undefined,
          diagnosedIllness: validatedBaby.diagnosedIllness,
          diagnosedIllnessDesc: validatedBaby.diagnosedIllnessDesc ?? undefined,
          recentMedication: validatedBaby.recentMedication,
          recentMedicationDesc: validatedBaby.recentMedicationDesc ?? undefined,
          allergies: validatedBaby.allergies ?? undefined,
          specialObservations: validatedBaby.specialObservations ?? undefined,
          socialMediaConsent: validatedBaby.socialMediaConsent,
          instagramHandle: validatedBaby.instagramHandle ?? undefined,
          referralSource: validatedBaby.referralSource ?? undefined,
        },
        parentsToLink
      );

      return NextResponse.json({ baby }, { status: 201 });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "BIRTH_DATE_TOO_OLD") {
          return NextResponse.json(
            { error: "BIRTH_DATE_TOO_OLD" },
            { status: 400 }
          );
        }
        if (error.message === "AT_LEAST_ONE_PARENT") {
          return NextResponse.json(
            { error: "AT_LEAST_ONE_PARENT" },
            { status: 400 }
          );
        }
      }
      throw error;
    }
  } catch (error) {
    console.error("Error creating baby:", error);

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
