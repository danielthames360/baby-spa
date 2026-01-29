import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for profile update
const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().min(6, "Invalid phone number").max(20).optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
});

// Validation schema for baby update
const updateBabySchema = z.object({
  babyId: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  birthWeeks: z.number().min(20).max(45).optional().nullable(),
  birthWeight: z.number().min(0.5).max(10).optional().nullable(),
  birthType: z.enum(["NATURAL", "CESAREAN"]).optional().nullable(),
  birthDifficulty: z.boolean().optional(),
  birthDifficultyDesc: z.string().max(1000).optional().nullable(),
  diagnosedIllness: z.boolean().optional(),
  diagnosedIllnessDesc: z.string().max(1000).optional().nullable(),
  allergies: z.string().max(1000).optional().nullable(),
  specialObservations: z.string().max(1000).optional().nullable(),
  socialMediaConsent: z.boolean().optional(),
  instagramHandle: z.string().max(100).optional().nullable(),
});

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

    // Get parent with babies
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        accessCode: true,
        createdAt: true,
        noShowCount: true,
        requiresPrepayment: true,
        babies: {
          select: {
            baby: {
              select: {
                id: true,
                name: true,
                birthDate: true,
                gender: true,
                birthWeeks: true,
                birthWeight: true,
                birthType: true,
                birthDifficulty: true,
                birthDifficultyDesc: true,
                diagnosedIllness: true,
                diagnosedIllnessDesc: true,
                allergies: true,
                specialObservations: true,
                socialMediaConsent: true,
                instagramHandle: true,
                _count: {
                  select: {
                    appointments: true,
                  },
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

    // Transform babies data
    const babies = parent.babies.map((bp) => ({
      id: bp.baby.id,
      name: bp.baby.name,
      birthDate: bp.baby.birthDate,
      gender: bp.baby.gender,
      birthWeeks: bp.baby.birthWeeks,
      birthWeight: bp.baby.birthWeight ? Number(bp.baby.birthWeight) : null,
      birthType: bp.baby.birthType,
      birthDifficulty: bp.baby.birthDifficulty,
      birthDifficultyDesc: bp.baby.birthDifficultyDesc,
      diagnosedIllness: bp.baby.diagnosedIllness,
      diagnosedIllnessDesc: bp.baby.diagnosedIllnessDesc,
      allergies: bp.baby.allergies,
      specialObservations: bp.baby.specialObservations,
      socialMediaConsent: bp.baby.socialMediaConsent,
      instagramHandle: bp.baby.instagramHandle,
      hasAppointments: bp.baby._count.appointments > 0,
    }));

    return NextResponse.json({
      profile: {
        id: parent.id,
        name: parent.name,
        phone: parent.phone,
        email: parent.email,
        accessCode: parent.accessCode,
        createdAt: parent.createdAt,
        noShowCount: parent.noShowCount,
        requiresPrepayment: parent.requiresPrepayment,
      },
      babies,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parentId = session.user.parentId;
    if (!parentId) {
      return NextResponse.json({ error: "Parent ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const { type } = body;

    // Update parent profile
    if (type === "profile") {
      const validation = updateProfileSchema.safeParse(body.data);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Validation error", details: validation.error.flatten() },
          { status: 400 }
        );
      }

      const { name, phone, email } = validation.data;

      // Check if phone is already used by another parent
      if (phone) {
        const existingParent = await prisma.parent.findFirst({
          where: {
            phone,
            id: { not: parentId },
          },
        });

        if (existingParent) {
          return NextResponse.json(
            { error: "Phone number is already registered", code: "PHONE_EXISTS" },
            { status: 400 }
          );
        }
      }

      const updatedParent = await prisma.parent.update({
        where: { id: parentId },
        data: {
          name,
          phone: phone || null,
          email: email || null,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      });

      return NextResponse.json({
        success: true,
        profile: updatedParent,
      });
    }

    // Update baby
    if (type === "baby") {
      const validation = updateBabySchema.safeParse(body.data);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Validation error", details: validation.error.flatten() },
          { status: 400 }
        );
      }

      const {
        babyId,
        name,
        birthWeeks,
        birthWeight,
        birthType,
        birthDifficulty,
        birthDifficultyDesc,
        diagnosedIllness,
        diagnosedIllnessDesc,
        allergies,
        specialObservations,
        socialMediaConsent,
        instagramHandle,
      } = validation.data;

      // Verify parent owns this baby
      const babyParent = await prisma.babyParent.findUnique({
        where: {
          babyId_parentId: {
            babyId,
            parentId,
          },
        },
      });

      if (!babyParent) {
        return NextResponse.json(
          { error: "Baby not found or not authorized" },
          { status: 403 }
        );
      }

      const updatedBaby = await prisma.baby.update({
        where: { id: babyId },
        data: {
          name,
          birthWeeks,
          birthWeight,
          birthType,
          birthDifficulty,
          birthDifficultyDesc: birthDifficulty ? birthDifficultyDesc : null,
          diagnosedIllness,
          diagnosedIllnessDesc: diagnosedIllness ? diagnosedIllnessDesc : null,
          allergies,
          specialObservations,
          socialMediaConsent,
          instagramHandle: socialMediaConsent ? instagramHandle : null,
        },
        select: {
          id: true,
          name: true,
          birthWeeks: true,
          birthWeight: true,
          birthType: true,
          birthDifficulty: true,
          birthDifficultyDesc: true,
          diagnosedIllness: true,
          diagnosedIllnessDesc: true,
          allergies: true,
          specialObservations: true,
          socialMediaConsent: true,
          instagramHandle: true,
        },
      });

      return NextResponse.json({
        success: true,
        baby: {
          ...updatedBaby,
          birthWeight: updatedBaby.birthWeight ? Number(updatedBaby.birthWeight) : null,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid update type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
