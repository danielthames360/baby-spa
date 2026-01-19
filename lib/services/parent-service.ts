import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

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
}

export interface ParentSearchResult {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  accessCode: string;
  babies: {
    baby: {
      id: string;
      name: string;
    };
  }[];
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
  async search(query: string): Promise<ParentSearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const parents = await prisma.parent.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        accessCode: true,
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

    const parent = await prisma.parent.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email,
        birthDate: data.birthDate,
        accessCode,
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

  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<{
    parents: ParentSearchResult[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, search } = params;

    const where: Prisma.ParentWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const [parents, total] = await Promise.all([
      prisma.parent.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          accessCode: true,
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
    ]);

    return {
      parents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },
};
