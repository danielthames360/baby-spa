import { prisma } from "@/lib/db";
import { Prisma, MovementType } from "@prisma/client";

// Types
export interface ProductWithMovements {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryRef?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  costPrice: Prisma.Decimal;
  salePrice: Prisma.Decimal;
  currentStock: number;
  minStock: number;
  isActive: boolean;
  isChargeableByDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    movements: number;
    sessionUsages: number;
  };
}

export interface ProductCreateInput {
  name: string;
  description?: string;
  categoryId?: string | null;
  costPrice: number;
  salePrice: number;
  currentStock?: number;
  minStock?: number;
  isActive?: boolean;
  isChargeableByDefault?: boolean;
}

export interface ProductUpdateInput {
  name?: string;
  description?: string;
  categoryId?: string | null;
  costPrice?: number;
  salePrice?: number;
  minStock?: number;
  isActive?: boolean;
  isChargeableByDefault?: boolean;
}

export interface MovementWithProduct {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  unitPrice: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  notes: string | null;
  stockAfter: number;
  createdAt: Date;
  product: {
    id: string;
    name: string;
  };
}

export interface RegisterPurchaseInput {
  productId: string;
  quantity: number;
  unitCost: number;
  supplier?: string;
  notes?: string;
}

export interface AdjustStockInput {
  productId: string;
  newStock: number;
  reason: string;
}

export interface UseProductInput {
  productId: string;
  quantity: number;
  sessionId?: string;
}

export interface ProductListFilters {
  search?: string;
  categoryId?: string;
  status?: "all" | "active" | "inactive" | "lowStock" | "outOfStock";
  page?: number;
  limit?: number;
}

export interface ProductListResult {
  products: ProductWithMovements[];
  total: number;
  page: number;
  totalPages: number;
}

// Inventory Service
export const inventoryService = {
  // ============================================================
  // PRODUCT CRUD
  // ============================================================

  // List products with filters
  async list(filters: ProductListFilters = {}): Promise<ProductListResult> {
    const {
      search,
      categoryId,
      status = "all",
      page = 1,
      limit = 20,
    } = filters;

    const where: Prisma.ProductWhereInput = {};

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Status filter
    switch (status) {
      case "active":
        where.isActive = true;
        break;
      case "inactive":
        where.isActive = false;
        break;
      case "lowStock":
        // Handled separately with in-memory filtering below
        break;
      case "outOfStock":
        where.currentStock = 0;
        break;
    }

    // For lowStock, we need a different approach
    let products: ProductWithMovements[];
    let total: number;

    if (status === "lowStock") {
      // Get all active products and filter in memory
      const allProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          ...(search && {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
            ],
          }),
          ...(categoryId && { categoryId }),
        },
        include: {
          categoryRef: {
            select: { id: true, name: true, color: true },
          },
          _count: {
            select: { movements: true, sessionUsages: true },
          },
        },
        orderBy: { name: "asc" },
      });

      const lowStockProducts = allProducts.filter(
        (p) => p.currentStock > 0 && p.currentStock <= p.minStock
      );

      total = lowStockProducts.length;
      const skip = (page - 1) * limit;
      products = lowStockProducts.slice(skip, skip + limit) as ProductWithMovements[];
    } else {
      // Standard query
      const [fetchedProducts, count] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            categoryRef: {
              select: { id: true, name: true, color: true },
            },
            _count: {
              select: { movements: true, sessionUsages: true },
            },
          },
          orderBy: { name: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);
      products = fetchedProducts as ProductWithMovements[];
      total = count;
    }

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Get product by ID
  async getById(id: string): Promise<ProductWithMovements | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        categoryRef: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { movements: true, sessionUsages: true },
        },
      },
    });

    return product as ProductWithMovements | null;
  },

  // Create product
  async create(data: ProductCreateInput): Promise<ProductWithMovements> {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        costPrice: data.costPrice,
        salePrice: data.salePrice,
        currentStock: data.currentStock ?? 0,
        minStock: data.minStock ?? 5,
        isActive: data.isActive ?? true,
        isChargeableByDefault: data.isChargeableByDefault ?? true,
      },
      include: {
        categoryRef: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { movements: true, sessionUsages: true },
        },
      },
    });

    return product as ProductWithMovements;
  },

  // Update product
  async update(
    id: string,
    data: ProductUpdateInput
  ): Promise<ProductWithMovements> {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.salePrice !== undefined && { salePrice: data.salePrice }),
        ...(data.minStock !== undefined && { minStock: data.minStock }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isChargeableByDefault !== undefined && {
          isChargeableByDefault: data.isChargeableByDefault,
        }),
      },
      include: {
        categoryRef: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { movements: true, sessionUsages: true },
        },
      },
    });

    return product as ProductWithMovements;
  },

  // Toggle product active status
  async toggleActive(id: string): Promise<ProductWithMovements> {
    const current = await prisma.product.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!current) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    return this.update(id, { isActive: !current.isActive });
  },

  // ============================================================
  // INVENTORY MOVEMENTS
  // ============================================================

  // Get movements for a product
  async getMovements(
    productId: string,
    limit = 50
  ): Promise<MovementWithProduct[]> {
    const movements = await prisma.inventoryMovement.findMany({
      where: { productId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return movements as MovementWithProduct[];
  },

  // Get all recent movements
  async getRecentMovements(limit = 50): Promise<MovementWithProduct[]> {
    const movements = await prisma.inventoryMovement.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return movements as MovementWithProduct[];
  },

  // Register a purchase (add stock)
  async registerPurchase(
    data: RegisterPurchaseInput
  ): Promise<MovementWithProduct> {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    if (data.quantity <= 0) {
      throw new Error("QUANTITY_INVALID");
    }

    const totalAmount = data.quantity * data.unitCost;
    const stockAfter = product.currentStock + data.quantity;

    // Build notes
    const notes = [
      data.supplier && `Proveedor: ${data.supplier}`,
      data.notes,
    ]
      .filter(Boolean)
      .join(" | ");

    // Create movement and update stock in transaction
    const movement = await prisma.$transaction(async (tx) => {
      // Update product stock
      await tx.product.update({
        where: { id: data.productId },
        data: { currentStock: stockAfter },
      });

      // Create movement record
      const newMovement = await tx.inventoryMovement.create({
        data: {
          productId: data.productId,
          type: "PURCHASE",
          quantity: data.quantity,
          unitPrice: data.unitCost,
          totalAmount,
          notes: notes || null,
          stockAfter,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return newMovement;
    });

    return movement as MovementWithProduct;
  },

  // Adjust stock manually
  async adjustStock(data: AdjustStockInput): Promise<MovementWithProduct> {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    if (data.newStock < 0) {
      throw new Error("STOCK_INVALID");
    }

    if (!data.reason || data.reason.trim() === "") {
      throw new Error("REASON_REQUIRED");
    }

    const difference = data.newStock - product.currentStock;

    // Create movement and update stock in transaction
    const movement = await prisma.$transaction(async (tx) => {
      // Update product stock
      await tx.product.update({
        where: { id: data.productId },
        data: { currentStock: data.newStock },
      });

      // Create adjustment movement
      const newMovement = await tx.inventoryMovement.create({
        data: {
          productId: data.productId,
          type: "ADJUSTMENT",
          quantity: difference,
          unitPrice: 0,
          totalAmount: 0,
          notes: data.reason,
          stockAfter: data.newStock,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return newMovement;
    });

    return movement as MovementWithProduct;
  },

  // Use product (deduct stock) - typically called from session
  async useProduct(data: UseProductInput): Promise<MovementWithProduct> {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    if (data.quantity <= 0) {
      throw new Error("QUANTITY_INVALID");
    }

    if (product.currentStock < data.quantity) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    const stockAfter = product.currentStock - data.quantity;
    const totalAmount = data.quantity * Number(product.salePrice);

    // Create movement and update stock in transaction
    const movement = await prisma.$transaction(async (tx) => {
      // Update product stock
      await tx.product.update({
        where: { id: data.productId },
        data: { currentStock: stockAfter },
      });

      // Create usage movement
      const newMovement = await tx.inventoryMovement.create({
        data: {
          productId: data.productId,
          type: "USAGE",
          quantity: -data.quantity, // Negative for outgoing
          unitPrice: product.salePrice,
          totalAmount,
          notes: data.sessionId ? `Sesión: ${data.sessionId}` : null,
          stockAfter,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return newMovement;
    });

    return movement as MovementWithProduct;
  },

  // ============================================================
  // ALERTS & REPORTS
  // ============================================================

  // Get products with low stock
  async getLowStockProducts(): Promise<ProductWithMovements[]> {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        categoryRef: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { movements: true, sessionUsages: true },
        },
      },
      orderBy: { currentStock: "asc" },
    });

    // Filter products where stock <= minStock
    const lowStock = products.filter((p) => p.currentStock <= p.minStock);

    return lowStock as ProductWithMovements[];
  },

  // Get out of stock products
  async getOutOfStockProducts(): Promise<ProductWithMovements[]> {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        currentStock: 0,
      },
      include: {
        categoryRef: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { movements: true, sessionUsages: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return products as ProductWithMovements[];
  },

  // Get stock alerts count (for dashboard widget)
  async getStockAlertsCount(): Promise<number> {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { currentStock: true, minStock: true },
    });

    return products.filter((p) => p.currentStock <= p.minStock).length;
  },

  // Get active products for selector (used in sessions)
  async getActiveProductsForSelector(): Promise<
    Array<{
      id: string;
      name: string;
      categoryId: string | null;
      categoryRef: {
        id: string;
        name: string;
        color: string | null;
      } | null;
      salePrice: Prisma.Decimal;
      currentStock: number;
      isChargeableByDefault: boolean;
    }>
  > {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        currentStock: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        categoryId: true,
        categoryRef: {
          select: { id: true, name: true, color: true },
        },
        salePrice: true,
        currentStock: true,
        isChargeableByDefault: true,
      },
      orderBy: { name: "asc" },
    });

    return products;
  },
};
