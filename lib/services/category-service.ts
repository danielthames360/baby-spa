import { prisma } from "@/lib/db";
import { CategoryType, Prisma } from "@prisma/client";

export interface CreateCategoryInput {
  name: string;
  description?: string | null;
  type: CategoryType;
  color?: string | null;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
  color?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export const categoryService = {
  // List categories by type
  async list(type?: CategoryType, includeInactive = false) {
    const where: Prisma.CategoryWhereInput = {};

    if (type) {
      where.type = type;
    }

    if (!includeInactive) {
      where.isActive = true;
    }

    return prisma.category.findMany({
      where,
      orderBy: [
        { type: "asc" },
        { sortOrder: "asc" },
        { name: "asc" },
      ],
      include: {
        _count: {
          select: {
            packages: true,
            products: true,
          },
        },
      },
    });
  },

  // Get single category by ID
  async getById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            packages: true,
            products: true,
          },
        },
      },
    });
  },

  // Create category
  async create(data: CreateCategoryInput) {
    // Check for duplicate name+type
    const existing = await prisma.category.findFirst({
      where: {
        name: data.name,
        type: data.type,
      },
    });

    if (existing) {
      throw new Error("CATEGORY_NAME_EXISTS");
    }

    // Get next sortOrder if not provided
    if (data.sortOrder === undefined) {
      const maxSort = await prisma.category.aggregate({
        where: { type: data.type },
        _max: { sortOrder: true },
      });
      data.sortOrder = (maxSort._max.sortOrder ?? -1) + 1;
    }

    return prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        color: data.color,
        sortOrder: data.sortOrder,
      },
      include: {
        _count: {
          select: {
            packages: true,
            products: true,
          },
        },
      },
    });
  },

  // Update category
  async update(id: string, data: UpdateCategoryInput) {
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new Error("CATEGORY_NOT_FOUND");
    }

    // Check for duplicate name+type if name is being changed
    if (data.name && data.name !== category.name) {
      const existing = await prisma.category.findFirst({
        where: {
          name: data.name,
          type: category.type,
          id: { not: id },
        },
      });

      if (existing) {
        throw new Error("CATEGORY_NAME_EXISTS");
      }
    }

    return prisma.category.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            packages: true,
            products: true,
          },
        },
      },
    });
  },

  // Delete category (only if no items are using it)
  async delete(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            packages: true,
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new Error("CATEGORY_NOT_FOUND");
    }

    // Check if category is in use
    if (category._count.packages > 0 || category._count.products > 0) {
      throw new Error("CATEGORY_IN_USE");
    }

    return prisma.category.delete({
      where: { id },
    });
  },

  // Soft delete (deactivate)
  async deactivate(id: string) {
    return this.update(id, { isActive: false });
  },

  // Activate
  async activate(id: string) {
    return this.update(id, { isActive: true });
  },
};
