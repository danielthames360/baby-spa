import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  publicPrimaryParentSchema,
  publicSecondaryParentSchema,
  publicBabySchema,
} from "@/lib/validations/registration";

interface RouteParams {
  params: Promise<{ token: string }>;
}

// Generate access code for parent portal
function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "BSB-";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/registration-links/[token] - Validate token and get pre-filled data
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const registrationLink = await prisma.registrationLink.findUnique({
      where: { token },
    });

    if (!registrationLink) {
      return NextResponse.json({ error: "LINK_NOT_FOUND" }, { status: 404 });
    }

    if (registrationLink.isUsed) {
      return NextResponse.json({ error: "LINK_ALREADY_USED" }, { status: 400 });
    }

    if (new Date() > registrationLink.expiresAt) {
      return NextResponse.json({ error: "LINK_EXPIRED" }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      parentName: registrationLink.parentName,
      parentPhone: registrationLink.parentPhone,
      expiresAt: registrationLink.expiresAt,
    });
  } catch (error) {
    console.error("Error validating registration link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/registration-links/[token] - Complete registration
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    // Validate token first
    const registrationLink = await prisma.registrationLink.findUnique({
      where: { token },
    });

    if (!registrationLink) {
      return NextResponse.json({ error: "LINK_NOT_FOUND" }, { status: 404 });
    }

    if (registrationLink.isUsed) {
      return NextResponse.json({ error: "LINK_ALREADY_USED" }, { status: 400 });
    }

    if (new Date() > registrationLink.expiresAt) {
      return NextResponse.json({ error: "LINK_EXPIRED" }, { status: 400 });
    }

    const body = await request.json();
    const { parent1: parent1Data, parent2: parent2Data, baby: babyData } = body;

    // Validate parent1 (primary)
    const parent1Validation = publicPrimaryParentSchema.safeParse(parent1Data);
    if (!parent1Validation.success) {
      return NextResponse.json(
        { error: "INVALID_PARENT1_DATA", details: parent1Validation.error.issues },
        { status: 400 }
      );
    }

    // Validate parent2 (optional)
    let validatedParent2 = null;
    if (parent2Data && Object.keys(parent2Data).length > 0 && parent2Data.name) {
      const parent2Validation = publicSecondaryParentSchema.safeParse(parent2Data);
      if (!parent2Validation.success) {
        return NextResponse.json(
          { error: "INVALID_PARENT2_DATA", details: parent2Validation.error.issues },
          { status: 400 }
        );
      }
      validatedParent2 = parent2Validation.data;
    }

    // Validate baby
    const babyValidation = publicBabySchema.safeParse(babyData);
    if (!babyValidation.success) {
      return NextResponse.json(
        { error: "INVALID_BABY_DATA", details: babyValidation.error.issues },
        { status: 400 }
      );
    }

    const validatedParent1 = parent1Validation.data;
    const validatedBaby = babyValidation.data;

    // Use transaction to ensure all-or-nothing
    const result = await prisma.$transaction(async (tx) => {
      // Find or create Parent 1
      // Try to find an existing parent by phone (unique identifier)
      let parent1 = await tx.parent.findFirst({
        where: { phone: validatedParent1.phone },
      });

      // If found an existing parent, optionally update email and birthDate if not set
      if (parent1 && (validatedParent1.email || validatedParent1.birthDate)) {
        const updateData: { email?: string; birthDate?: Date } = {};
        if (validatedParent1.email && !parent1.email) {
          updateData.email = validatedParent1.email;
        }
        if (validatedParent1.birthDate && !parent1.birthDate) {
          updateData.birthDate = validatedParent1.birthDate;
        }
        if (Object.keys(updateData).length > 0) {
          parent1 = await tx.parent.update({
            where: { id: parent1.id },
            data: updateData,
          });
        }
      }

      if (!parent1) {
        // Generate unique access code
        let accessCode = generateAccessCode();
        let accessCodeAttempts = 0;
        while (accessCodeAttempts < 10) {
          const existingCode = await tx.parent.findUnique({
            where: { accessCode },
          });
          if (!existingCode) break;
          accessCode = generateAccessCode();
          accessCodeAttempts++;
        }

        parent1 = await tx.parent.create({
          data: {
            name: validatedParent1.name,
            phone: validatedParent1.phone,
            email: validatedParent1.email || null,
            birthDate: validatedParent1.birthDate || null,
            accessCode,
          },
        });
      }

      // Find or create Parent 2 (if provided)
      let parent2 = null;
      if (validatedParent2) {
        // Only try to find by phone if phone is provided (unique identifier)
        if (validatedParent2.phone) {
          parent2 = await tx.parent.findFirst({
            where: { phone: validatedParent2.phone },
          });

          // If found, optionally update email and birthDate if not set
          if (parent2 && (validatedParent2.email || validatedParent2.birthDate)) {
            const updateData: { email?: string; birthDate?: Date } = {};
            if (validatedParent2.email && !parent2.email) {
              updateData.email = validatedParent2.email;
            }
            if (validatedParent2.birthDate && !parent2.birthDate) {
              updateData.birthDate = validatedParent2.birthDate;
            }
            if (Object.keys(updateData).length > 0) {
              parent2 = await tx.parent.update({
                where: { id: parent2.id },
                data: updateData,
              });
            }
          }
        }

        if (!parent2) {
          // Generate unique access code for parent 2
          let accessCode2 = generateAccessCode();
          let accessCode2Attempts = 0;
          while (accessCode2Attempts < 10) {
            const existingCode = await tx.parent.findUnique({
              where: { accessCode: accessCode2 },
            });
            if (!existingCode) break;
            accessCode2 = generateAccessCode();
            accessCode2Attempts++;
          }

          parent2 = await tx.parent.create({
            data: {
              name: validatedParent2.name,
              phone: validatedParent2.phone || null,
              email: validatedParent2.email || null,
              birthDate: validatedParent2.birthDate || null,
              accessCode: accessCode2,
            },
          });
        }
      }

      // Create baby
      const baby = await tx.baby.create({
        data: {
          name: validatedBaby.name,
          birthDate: validatedBaby.birthDate,
          gender: validatedBaby.gender,
          birthType: validatedBaby.birthType || null,
          birthWeeks: validatedBaby.birthWeeks || null,
          birthWeight: validatedBaby.birthWeight || null,
          birthDifficulty: validatedBaby.birthDifficulty,
          birthDifficultyDesc: validatedBaby.birthDifficultyDesc || null,
          pregnancyIssues: validatedBaby.pregnancyIssues,
          pregnancyIssuesDesc: validatedBaby.pregnancyIssuesDesc || null,
          priorStimulation: validatedBaby.priorStimulation,
          priorStimulationType: validatedBaby.priorStimulationType || null,
          developmentDiagnosis: validatedBaby.developmentDiagnosis,
          developmentDiagnosisDesc: validatedBaby.developmentDiagnosisDesc || null,
          diagnosedIllness: validatedBaby.diagnosedIllness,
          diagnosedIllnessDesc: validatedBaby.diagnosedIllnessDesc || null,
          recentMedication: validatedBaby.recentMedication,
          recentMedicationDesc: validatedBaby.recentMedicationDesc || null,
          allergies: validatedBaby.allergies || null,
          specialObservations: validatedBaby.specialObservations || null,
          socialMediaConsent: validatedBaby.socialMediaConsent,
          instagramHandle: validatedBaby.instagramHandle || null,
          referralSource: validatedBaby.referralSource || null,
        },
      });

      // Link Parent 1 to Baby (primary contact)
      await tx.babyParent.create({
        data: {
          babyId: baby.id,
          parentId: parent1.id,
          relationship: validatedParent1.relationship,
          isPrimary: true,
        },
      });

      // Link Parent 2 to Baby (if exists)
      if (parent2 && validatedParent2) {
        await tx.babyParent.create({
          data: {
            babyId: baby.id,
            parentId: parent2.id,
            relationship: validatedParent2.relationship,
            isPrimary: false,
          },
        });
      }

      // Mark registration link as used
      await tx.registrationLink.update({
        where: { id: registrationLink.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
          babyId: baby.id,
          parentId: parent1.id,
        },
      });

      return {
        baby,
        parent1,
        parent2,
        accessCode: parent1.accessCode,
      };
    });

    return NextResponse.json({
      success: true,
      baby: {
        id: result.baby.id,
        name: result.baby.name,
      },
      accessCode: result.accessCode,
      parentName: result.parent1.name,
    }, { status: 201 });
  } catch (error) {
    console.error("Error completing registration:", error);

    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "DUPLICATE_DATA" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
