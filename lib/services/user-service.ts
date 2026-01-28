import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { CreateUserInput, UpdateUserInput } from "@/lib/validations/user";
import { UserRole, PayFrequency } from "@prisma/client";

interface ListUsersParams {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export const userService = {
  async list(params: ListUsersParams = {}) {
    const { role, isActive, search, page = 1, limit = 20 } = params;

    const where: Record<string, unknown> = {};

    if (role) {
      where.role = role;
    }

    if (typeof isActive === "boolean") {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          isActive: true,
          baseSalary: true,
          payFrequency: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              sessionsAsTherapist: true,
              appointmentsAssigned: true,
            },
          },
        },
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        baseSalary: true,
        payFrequency: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            sessionsAsTherapist: true,
            appointmentsAssigned: true,
            staffPaymentsReceived: true,
          },
        },
      },
    });
  },

  async create(data: CreateUserInput) {
    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      throw new Error("USERNAME_ALREADY_EXISTS");
    }

    // Check if email already exists (if provided)
    if (data.email) {
      const existingEmail = await prisma.user.findFirst({
        where: { email: data.email },
      });

      if (existingEmail) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }
    }

    // Hash password
    const passwordHash = await hash(data.password, 12);

    return prisma.user.create({
      data: {
        username: data.username,
        email: data.email || null,
        passwordHash,
        name: data.name,
        role: data.role as UserRole,
        phone: data.phone || null,
        baseSalary: data.baseSalary ?? null,
        payFrequency: (data.payFrequency as PayFrequency) || "MONTHLY",
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        baseSalary: true,
        payFrequency: true,
        createdAt: true,
      },
    });
  },

  async update(id: string, data: UpdateUserInput) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Check if username is being changed and if it's already taken
    if (data.username && data.username !== user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: data.username },
      });

      if (existingUser) {
        throw new Error("USERNAME_ALREADY_EXISTS");
      }
    }

    // Check if email is being changed and if it's already taken
    if (data.email && data.email !== user.email) {
      const existingEmail = await prisma.user.findFirst({
        where: { email: data.email },
      });

      if (existingEmail) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (data.username) updateData.username = data.username;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.name) updateData.name = data.name;
    if (data.role) updateData.role = data.role as UserRole;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.baseSalary !== undefined) updateData.baseSalary = data.baseSalary;
    if (data.payFrequency) updateData.payFrequency = data.payFrequency as PayFrequency;
    if (typeof data.isActive === "boolean") updateData.isActive = data.isActive;

    // Hash new password if provided
    if (data.password) {
      updateData.passwordHash = await hash(data.password, 12);
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        baseSalary: true,
        payFrequency: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async toggleActive(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    return prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        isActive: true,
      },
    });
  },

  async getActiveTherapists() {
    return prisma.user.findMany({
      where: {
        role: "THERAPIST",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });
  },
};
