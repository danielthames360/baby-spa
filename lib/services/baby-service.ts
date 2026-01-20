import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  calculateExactAge,
  isBabyEligible as checkBabyEligible,
  type AgeResult,
} from "@/lib/utils/age";

// Types
export interface BabyWithRelations {
  id: string;
  name: string;
  birthDate: Date;
  gender: string;
  birthWeeks: number | null;
  birthWeight: Prisma.Decimal | null;
  birthType: string | null;
  birthDifficulty: boolean;
  birthDifficultyDesc: string | null;
  pregnancyIssues: boolean;
  pregnancyIssuesDesc: string | null;
  priorStimulation: boolean;
  priorStimulationType: string | null;
  developmentDiagnosis: boolean;
  developmentDiagnosisDesc: string | null;
  diagnosedIllness: boolean;
  diagnosedIllnessDesc: string | null;
  recentMedication: boolean;
  recentMedicationDesc: string | null;
  allergies: string | null;
  specialObservations: string | null;
  socialMediaConsent: boolean;
  instagramHandle: string | null;
  referralSource: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  parents: {
    id: string;
    relationship: string;
    isPrimary: boolean;
    parent: {
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      accessCode: string;
      noShowCount: number;
      requiresPrepayment: boolean;
    };
  }[];
  packagePurchases: {
    id: string;
    totalSessions: number;
    usedSessions: number;
    remainingSessions: number;
    isActive: boolean;
    package: {
      id: string;
      name: string;
    };
  }[];
  _count?: {
    sessions: number;
    appointments: number;
  };
}

export interface BabyListItem {
  id: string;
  name: string;
  birthDate: Date;
  gender: string;
  isActive: boolean;
  parents: {
    relationship: string;
    isPrimary: boolean;
    parent: {
      id: string;
      name: string;
      phone: string | null;
    };
  }[];
  packagePurchases: {
    remainingSessions: number;
    isActive: boolean;
    package: {
      name: string;
    };
  }[];
  _count: {
    sessions: number;
  };
}

export interface BabyCreateInput {
  name: string;
  birthDate: Date;
  gender: "MALE" | "FEMALE" | "OTHER";
  birthWeeks?: number;
  birthWeight?: number;
  birthType?: "NATURAL" | "CESAREAN";
  birthDifficulty?: boolean;
  birthDifficultyDesc?: string;
  pregnancyIssues?: boolean;
  pregnancyIssuesDesc?: string;
  priorStimulation?: boolean;
  priorStimulationType?: string;
  developmentDiagnosis?: boolean;
  developmentDiagnosisDesc?: string;
  diagnosedIllness?: boolean;
  diagnosedIllnessDesc?: string;
  recentMedication?: boolean;
  recentMedicationDesc?: string;
  allergies?: string;
  specialObservations?: string;
  socialMediaConsent?: boolean;
  instagramHandle?: string;
  referralSource?: string;
}

export interface BabySearchParams {
  search?: string;
  status?: "active" | "inactive" | "all";
  hasActivePackage?: boolean;
  page?: number;
  limit?: number;
}

// Helper functions - re-export from age utility
export function calculateAge(birthDate: Date): {
  months: number;
  years: number;
  remainingMonths: number;
  ageResult: AgeResult;
} {
  const ageResult = calculateExactAge(birthDate);
  return {
    months: ageResult.totalMonths,
    years: ageResult.years,
    remainingMonths: ageResult.months,
    ageResult,
  };
}

export function isBabyEligible(birthDate: Date): boolean {
  return checkBabyEligible(birthDate);
}

// Service functions
export const babyService = {
  async list(params: BabySearchParams = {}): Promise<{
    babies: BabyListItem[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { search, status = "active", hasActivePackage, page = 1, limit = 10 } = params;

    const where: Prisma.BabyWhereInput = {};

    // Status filter
    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        {
          parents: {
            some: {
              parent: {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { phone: { contains: search } },
                ],
              },
            },
          },
        },
      ];
    }

    // Package filter
    if (hasActivePackage !== undefined) {
      if (hasActivePackage) {
        where.packagePurchases = {
          some: { isActive: true, remainingSessions: { gt: 0 } },
        };
      } else {
        where.NOT = {
          packagePurchases: {
            some: { isActive: true, remainingSessions: { gt: 0 } },
          },
        };
      }
    }

    const [babies, total] = await Promise.all([
      prisma.baby.findMany({
        where,
        include: {
          parents: {
            include: {
              parent: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
          packagePurchases: {
            where: { isActive: true },
            include: {
              package: {
                select: {
                  name: true,
                },
              },
            },
          },
          _count: {
            select: { sessions: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.baby.count({ where }),
    ]);

    return {
      babies: babies as BabyListItem[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getById(id: string): Promise<BabyWithRelations | null> {
    const baby = await prisma.baby.findUnique({
      where: { id },
      include: {
        parents: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                accessCode: true,
                noShowCount: true,
                requiresPrepayment: true,
              },
            },
          },
        },
        packagePurchases: {
          include: {
            package: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            sessions: true,
            appointments: true,
          },
        },
      },
    });

    return baby as BabyWithRelations | null;
  },

  async create(
    data: BabyCreateInput,
    parentId: string,
    relationship: string = "MOTHER"
  ): Promise<BabyWithRelations> {
    // Validate baby age
    if (!isBabyEligible(data.birthDate)) {
      throw new Error("BIRTH_DATE_TOO_OLD");
    }

    const baby = await prisma.baby.create({
      data: {
        name: data.name,
        birthDate: data.birthDate,
        gender: data.gender,
        birthWeeks: data.birthWeeks,
        birthWeight: data.birthWeight,
        birthType: data.birthType,
        birthDifficulty: data.birthDifficulty ?? false,
        birthDifficultyDesc: data.birthDifficultyDesc,
        pregnancyIssues: data.pregnancyIssues ?? false,
        pregnancyIssuesDesc: data.pregnancyIssuesDesc,
        priorStimulation: data.priorStimulation ?? false,
        priorStimulationType: data.priorStimulationType,
        developmentDiagnosis: data.developmentDiagnosis ?? false,
        developmentDiagnosisDesc: data.developmentDiagnosisDesc,
        diagnosedIllness: data.diagnosedIllness ?? false,
        diagnosedIllnessDesc: data.diagnosedIllnessDesc,
        recentMedication: data.recentMedication ?? false,
        recentMedicationDesc: data.recentMedicationDesc,
        allergies: data.allergies,
        specialObservations: data.specialObservations,
        socialMediaConsent: data.socialMediaConsent ?? false,
        instagramHandle: data.instagramHandle,
        referralSource: data.referralSource,
        parents: {
          create: {
            parentId,
            relationship,
            isPrimary: true,
          },
        },
      },
      include: {
        parents: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                accessCode: true,
                noShowCount: true,
                requiresPrepayment: true,
              },
            },
          },
        },
        packagePurchases: {
          include: {
            package: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            sessions: true,
            appointments: true,
          },
        },
      },
    });

    return baby as BabyWithRelations;
  },

  // Create baby with multiple parents support
  async createWithParents(
    data: BabyCreateInput,
    parents: Array<{
      parentId: string;
      relationship: string;
      isPrimary: boolean;
    }>
  ): Promise<BabyWithRelations> {
    // Validate baby age
    if (!isBabyEligible(data.birthDate)) {
      throw new Error("BIRTH_DATE_TOO_OLD");
    }

    if (parents.length === 0) {
      throw new Error("AT_LEAST_ONE_PARENT");
    }

    const baby = await prisma.baby.create({
      data: {
        name: data.name,
        birthDate: data.birthDate,
        gender: data.gender,
        birthWeeks: data.birthWeeks,
        birthWeight: data.birthWeight,
        birthType: data.birthType,
        birthDifficulty: data.birthDifficulty ?? false,
        birthDifficultyDesc: data.birthDifficultyDesc,
        pregnancyIssues: data.pregnancyIssues ?? false,
        pregnancyIssuesDesc: data.pregnancyIssuesDesc,
        priorStimulation: data.priorStimulation ?? false,
        priorStimulationType: data.priorStimulationType,
        developmentDiagnosis: data.developmentDiagnosis ?? false,
        developmentDiagnosisDesc: data.developmentDiagnosisDesc,
        diagnosedIllness: data.diagnosedIllness ?? false,
        diagnosedIllnessDesc: data.diagnosedIllnessDesc,
        recentMedication: data.recentMedication ?? false,
        recentMedicationDesc: data.recentMedicationDesc,
        allergies: data.allergies,
        specialObservations: data.specialObservations,
        socialMediaConsent: data.socialMediaConsent ?? false,
        instagramHandle: data.instagramHandle,
        referralSource: data.referralSource,
        parents: {
          create: parents.map((p) => ({
            parentId: p.parentId,
            relationship: p.relationship,
            isPrimary: p.isPrimary,
          })),
        },
      },
      include: {
        parents: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                accessCode: true,
                noShowCount: true,
                requiresPrepayment: true,
              },
            },
          },
        },
        packagePurchases: {
          include: {
            package: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            sessions: true,
            appointments: true,
          },
        },
      },
    });

    return baby as BabyWithRelations;
  },

  // Add a parent to an existing baby
  async addParent(
    babyId: string,
    parentId: string,
    relationship: string,
    isPrimary: boolean = false
  ): Promise<void> {
    // If setting as primary, first unset other primary parents
    if (isPrimary) {
      await prisma.babyParent.updateMany({
        where: { babyId },
        data: { isPrimary: false },
      });
    }

    await prisma.babyParent.create({
      data: {
        babyId,
        parentId,
        relationship,
        isPrimary,
      },
    });
  },

  // Set a parent as primary for a baby
  async setParentAsPrimary(babyId: string, parentId: string): Promise<void> {
    // First unset all other primary parents
    await prisma.babyParent.updateMany({
      where: { babyId },
      data: { isPrimary: false },
    });

    // Set the specified parent as primary
    await prisma.babyParent.update({
      where: {
        babyId_parentId: {
          babyId,
          parentId,
        },
      },
      data: { isPrimary: true },
    });
  },

  // Remove a parent from a baby
  async removeParent(babyId: string, parentId: string): Promise<void> {
    // Check if this is the only parent
    const parentCount = await prisma.babyParent.count({
      where: { babyId },
    });

    if (parentCount <= 1) {
      throw new Error("CANNOT_REMOVE_ONLY_PARENT");
    }

    // Check if removing primary parent
    const babyParent = await prisma.babyParent.findFirst({
      where: { babyId, parentId },
    });

    await prisma.babyParent.delete({
      where: {
        babyId_parentId: {
          babyId,
          parentId,
        },
      },
    });

    // If removed parent was primary, set another as primary
    if (babyParent?.isPrimary) {
      const remainingParent = await prisma.babyParent.findFirst({
        where: { babyId },
      });
      if (remainingParent) {
        await prisma.babyParent.update({
          where: {
            babyId_parentId: {
              babyId: remainingParent.babyId,
              parentId: remainingParent.parentId,
            },
          },
          data: { isPrimary: true },
        });
      }
    }
  },

  async update(id: string, data: Partial<BabyCreateInput>): Promise<BabyWithRelations> {
    // Validate baby age if birthDate is being updated
    if (data.birthDate && !isBabyEligible(data.birthDate)) {
      throw new Error("BIRTH_DATE_TOO_OLD");
    }

    const baby = await prisma.baby.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.birthDate && { birthDate: data.birthDate }),
        ...(data.gender && { gender: data.gender }),
        ...(data.birthWeeks !== undefined && { birthWeeks: data.birthWeeks }),
        ...(data.birthWeight !== undefined && { birthWeight: data.birthWeight }),
        ...(data.birthType !== undefined && { birthType: data.birthType }),
        ...(data.birthDifficulty !== undefined && {
          birthDifficulty: data.birthDifficulty,
        }),
        ...(data.birthDifficultyDesc !== undefined && {
          birthDifficultyDesc: data.birthDifficultyDesc,
        }),
        ...(data.pregnancyIssues !== undefined && {
          pregnancyIssues: data.pregnancyIssues,
        }),
        ...(data.pregnancyIssuesDesc !== undefined && {
          pregnancyIssuesDesc: data.pregnancyIssuesDesc,
        }),
        ...(data.priorStimulation !== undefined && {
          priorStimulation: data.priorStimulation,
        }),
        ...(data.priorStimulationType !== undefined && {
          priorStimulationType: data.priorStimulationType,
        }),
        ...(data.developmentDiagnosis !== undefined && {
          developmentDiagnosis: data.developmentDiagnosis,
        }),
        ...(data.developmentDiagnosisDesc !== undefined && {
          developmentDiagnosisDesc: data.developmentDiagnosisDesc,
        }),
        ...(data.diagnosedIllness !== undefined && {
          diagnosedIllness: data.diagnosedIllness,
        }),
        ...(data.diagnosedIllnessDesc !== undefined && {
          diagnosedIllnessDesc: data.diagnosedIllnessDesc,
        }),
        ...(data.recentMedication !== undefined && {
          recentMedication: data.recentMedication,
        }),
        ...(data.recentMedicationDesc !== undefined && {
          recentMedicationDesc: data.recentMedicationDesc,
        }),
        ...(data.allergies !== undefined && { allergies: data.allergies }),
        ...(data.specialObservations !== undefined && {
          specialObservations: data.specialObservations,
        }),
        ...(data.socialMediaConsent !== undefined && {
          socialMediaConsent: data.socialMediaConsent,
        }),
        ...(data.instagramHandle !== undefined && {
          instagramHandle: data.instagramHandle,
        }),
        ...(data.referralSource !== undefined && {
          referralSource: data.referralSource,
        }),
      },
      include: {
        parents: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                accessCode: true,
                noShowCount: true,
                requiresPrepayment: true,
              },
            },
          },
        },
        packagePurchases: {
          include: {
            package: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            sessions: true,
            appointments: true,
          },
        },
      },
    });

    return baby as BabyWithRelations;
  },

  async deactivate(id: string): Promise<void> {
    await prisma.baby.update({
      where: { id },
      data: { isActive: false },
    });
  },

  async activate(id: string): Promise<void> {
    await prisma.baby.update({
      where: { id },
      data: { isActive: true },
    });
  },

  async getNotes(babyId: string) {
    return prisma.babyNote.findMany({
      where: { babyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async addNote(babyId: string, userId: string, note: string) {
    return prisma.babyNote.create({
      data: {
        babyId,
        userId,
        note,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  async deleteNote(noteId: string): Promise<void> {
    await prisma.babyNote.delete({
      where: { id: noteId },
    });
  },
};
