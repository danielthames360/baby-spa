import { prisma } from "@/lib/db";
import { ParentStatus, Prisma } from "@prisma/client";

// Types
export interface ParentWithBabies {
  id: string;
  phone: string | null;
  name: string;
  email: string | null;
  birthDate: Date | null;
  accessCode: string;
  noShowCount: number;
  requiresPrepayment: boolean;
  lastNoShowDate: Date | null;
  // LEAD fields
  status: ParentStatus;
  pregnancyWeeks: number | null;
  leadSource: string | null;
  leadNotes: string | null;
  convertedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  babies: {
    id: string;
    relationship: string;
    isPrimary: boolean;
    baby: {
      id: string;
      name: string;
      birthDate: Date;
      gender: string;
      isActive: boolean;
    };
  }[];
}

export interface ParentCreateInput {
  name: string;
  phone?: string;
  email?: string;
  birthDate?: Date;
  // LEAD fields
  status?: ParentStatus;
  pregnancyWeeks?: number;
  leadSource?: string;
  leadNotes?: string;
}

export interface ParentSearchResult {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  accessCode: string;
  status: ParentStatus;
  pregnancyWeeks: number | null;
  babies: {
    baby: {
      id: string;
      name: string;
    };
  }[];
  packagePurchases?: {
    id: string;
    remainingSessions: number;
    totalSessions: number;
    usedSessions: number;
    isActive: boolean;
    package: {
      id: string;
      name: string;
      categoryId: string | null;
      duration: number;
    };
  }[];
}

export interface ParentListFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: "all" | "withBabies" | "leads";
}

// Generate unique access code: BSB-XXXXX
export function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Sin I/1, O/0 para evitar confusiones
  let code = "BSB-";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Ensure unique access code
async function getUniqueAccessCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = generateAccessCode();
    const existing = await prisma.parent.findUnique({
      where: { accessCode: code },
    });

    if (!existing) {
      return code;
    }

    attempts++;
  }

  throw new Error("Could not generate unique access code");
}

// Service functions
export const parentService = {
  async search(query: string, statusFilter?: ParentStatus): Promise<ParentSearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const where: Prisma.ParentWhereInput = {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
      ],
    };

    if (statusFilter) {
      where.status = statusFilter;
    }

    const parents = await prisma.parent.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        accessCode: true,
        status: true,
        pregnancyWeeks: true,
        babies: {
          select: {
            baby: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        packagePurchases: {
          where: { isActive: true },
          select: {
            id: true,
            remainingSessions: true,
            totalSessions: true,
            usedSessions: true,
            isActive: true,
            package: {
              select: {
                id: true,
                name: true,
                categoryId: true,
                duration: true,
              },
            },
          },
        },
      },
      take: 10,
    });

    return parents;
  },

  async getById(id: string): Promise<ParentWithBabies | null> {
    const parent = await prisma.parent.findUnique({
      where: { id },
      include: {
        babies: {
          include: {
            baby: {
              select: {
                id: true,
                name: true,
                birthDate: true,
                gender: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    return parent as ParentWithBabies | null;
  },

  async getByAccessCode(accessCode: string): Promise<ParentWithBabies | null> {
    const parent = await prisma.parent.findUnique({
      where: { accessCode: accessCode.toUpperCase() },
      include: {
        babies: {
          include: {
            baby: {
              select: {
                id: true,
                name: true,
                birthDate: true,
                gender: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    return parent as ParentWithBabies | null;
  },

  async getByPhone(phone: string): Promise<ParentWithBabies | null> {
    const parent = await prisma.parent.findUnique({
      where: { phone },
      include: {
        babies: {
          include: {
            baby: {
              select: {
                id: true,
                name: true,
                birthDate: true,
                gender: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    return parent as ParentWithBabies | null;
  },

  async create(data: ParentCreateInput): Promise<ParentWithBabies> {
    // Check for existing phone (only if phone provided)
    if (data.phone) {
      const existingByPhone = await prisma.parent.findUnique({
        where: { phone: data.phone },
      });

      if (existingByPhone) {
        throw new Error("PHONE_EXISTS");
      }
    }

    // Generate unique access code
    const accessCode = await getUniqueAccessCode();

    // Default status: LEAD if no babies, ACTIVE if created with babies
    const status = data.status || ParentStatus.LEAD;

    const parent = await prisma.parent.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email,
        birthDate: data.birthDate,
        accessCode,
        status,
        pregnancyWeeks: data.pregnancyWeeks,
        leadSource: data.leadSource,
        leadNotes: data.leadNotes,
      },
      include: {
        babies: {
          include: {
            baby: {
              select: {
                id: true,
                name: true,
                birthDate: true,
                gender: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    return parent as ParentWithBabies;
  },

  async update(
    id: string,
    data: Partial<ParentCreateInput>
  ): Promise<ParentWithBabies> {
    // If updating phone, check it's not already taken
    if (data.phone) {
      const existingByPhone = await prisma.parent.findFirst({
        where: {
          phone: data.phone,
          NOT: { id },
        },
      });

      if (existingByPhone) {
        throw new Error("PHONE_EXISTS");
      }
    }

    const parent = await prisma.parent.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.birthDate !== undefined && { birthDate: data.birthDate }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.pregnancyWeeks !== undefined && { pregnancyWeeks: data.pregnancyWeeks }),
        ...(data.leadSource !== undefined && { leadSource: data.leadSource }),
        ...(data.leadNotes !== undefined && { leadNotes: data.leadNotes }),
      },
      include: {
        babies: {
          include: {
            baby: {
              select: {
                id: true,
                name: true,
                birthDate: true,
                gender: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    return parent as ParentWithBabies;
  },

  async incrementNoShow(id: string): Promise<void> {
    const parent = await prisma.parent.findUnique({
      where: { id },
      select: { noShowCount: true },
    });

    if (!parent) {
      throw new Error("Parent not found");
    }

    const newCount = parent.noShowCount + 1;

    await prisma.parent.update({
      where: { id },
      data: {
        noShowCount: newCount,
        lastNoShowDate: new Date(),
        requiresPrepayment: newCount >= 3,
      },
    });
  },

  async resetNoShowCount(id: string): Promise<void> {
    await prisma.parent.update({
      where: { id },
      data: {
        noShowCount: 0,
        // Don't reset requiresPrepayment automatically - admin must do it manually
      },
    });
  },

  async setRequiresPrepayment(
    id: string,
    requiresPrepayment: boolean
  ): Promise<void> {
    await prisma.parent.update({
      where: { id },
      data: { requiresPrepayment },
    });
  },

  async regenerateAccessCode(id: string): Promise<string> {
    const newCode = await getUniqueAccessCode();

    await prisma.parent.update({
      where: { id },
      data: { accessCode: newCode },
    });

    return newCode;
  },

  // Convert a LEAD to ACTIVE when they register a baby
  async convertLeadToActive(id: string): Promise<ParentWithBabies> {
    const parent = await prisma.parent.update({
      where: { id },
      data: {
        status: ParentStatus.ACTIVE,
        convertedAt: new Date(),
      },
      include: {
        babies: {
          include: {
            baby: {
              select: {
                id: true,
                name: true,
                birthDate: true,
                gender: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    return parent as ParentWithBabies;
  },

  // Get appointments for a parent (parent services like prenatal massage)
  async getAppointments(parentId: string) {
    return prisma.appointment.findMany({
      where: { parentId },
      include: {
        selectedPackage: {
          select: {
            id: true,
            name: true,
          },
        },
        packagePurchase: {
          select: {
            id: true,
            package: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });
  },

  // Get package purchases for a parent (parent services)
  async getPackagePurchases(parentId: string) {
    return prisma.packagePurchase.findMany({
      where: { parentId, isActive: true },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            sessionCount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // Get detailed parent with all related data
  async getWithDetails(id: string) {
    const [parent, appointments, packagePurchases] = await Promise.all([
      this.getById(id),
      this.getAppointments(id),
      this.getPackagePurchases(id),
    ]);

    if (!parent) return null;

    return {
      ...parent,
      appointments,
      packagePurchases,
    };
  },

  // List parents with filters
  async list(params: ParentListFilters = {}): Promise<{
    parents: ParentSearchResult[];
    total: number;
    page: number;
    totalPages: number;
    counts: {
      all: number;
      withBabies: number;
      leads: number;
    };
  }> {
    const { page = 1, limit = 10, search, status = "all" } = params;

    // Build where clause
    const where: Prisma.ParentWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    // Status filter
    if (status === "leads") {
      where.status = ParentStatus.LEAD;
    } else if (status === "withBabies") {
      where.babies = { some: {} };
    }

    // async-parallel: Run count queries in parallel
    const [parents, total, allCount, withBabiesCount, leadsCount] = await Promise.all([
      prisma.parent.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          accessCode: true,
          status: true,
          pregnancyWeeks: true,
          babies: {
            select: {
              baby: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.parent.count({ where }),
      // Count all parents (with search if applied)
      prisma.parent.count({
        where: search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
          ],
        } : {},
      }),
      // Count parents with babies (with search if applied)
      prisma.parent.count({
        where: {
          ...(search ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ],
          } : {}),
          babies: { some: {} },
        },
      }),
      // Count LEADS (with search if applied)
      prisma.parent.count({
        where: {
          ...(search ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ],
          } : {}),
          status: ParentStatus.LEAD,
        },
      }),
    ]);

    return {
      parents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      counts: {
        all: allCount,
        withBabies: withBabiesCount,
        leads: leadsCount,
      },
    };
  },

  // Delete parent (only if no babies, appointments, or purchases)
  async delete(id: string): Promise<void> {
    const parent = await prisma.parent.findUnique({
      where: { id },
      include: {
        babies: { select: { id: true } },
        appointments: { select: { id: true } },
        packagePurchases: { select: { id: true } },
      },
    });

    if (!parent) {
      throw new Error("PARENT_NOT_FOUND");
    }

    if (parent.babies.length > 0) {
      throw new Error("PARENT_HAS_BABIES");
    }

    if (parent.appointments.length > 0) {
      throw new Error("PARENT_HAS_APPOINTMENTS");
    }

    if (parent.packagePurchases.length > 0) {
      throw new Error("PARENT_HAS_PURCHASES");
    }

    await prisma.parent.delete({ where: { id } });
  },
};
