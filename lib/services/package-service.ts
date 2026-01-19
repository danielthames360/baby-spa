import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// Types
export interface PackageWithPurchases {
  id: string;
  name: string;
  namePortuguese: string | null;
  description: string | null;
  sessionCount: number;
  basePrice: Prisma.Decimal;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    purchases: number;
  };
}

export interface PackageCreateInput {
  name: string;
  namePortuguese?: string;
  description?: string;
  sessionCount: number;
  basePrice: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface PackagePurchaseWithDetails {
  id: string;
  babyId: string;
  packageId: string;
  basePrice: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  discountReason: string | null;
  finalPrice: Prisma.Decimal;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  package: {
    id: string;
    name: string;
    namePortuguese: string | null;
  };
  payment: {
    id: string;
    amount: Prisma.Decimal;
    method: string;
    notes: string | null;
    createdAt: Date;
  } | null;
}

export interface SellPackageInput {
  babyId: string;
  packageId: string;
  discountAmount?: number;
  discountReason?: string;
  paymentMethod: "CASH" | "TRANSFER" | "CARD" | "OTHER";
  paymentNotes?: string;
}

// Package Service
export const packageService = {
  // Get all packages (for catalog)
  async list(includeInactive = false): Promise<PackageWithPurchases[]> {
    const packages = await prisma.package.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });

    return packages as PackageWithPurchases[];
  },

  // Get package by ID
  async getById(id: string): Promise<PackageWithPurchases | null> {
    const pkg = await prisma.package.findUnique({
      where: { id },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });

    return pkg as PackageWithPurchases | null;
  },

  // Create package
  async create(data: PackageCreateInput): Promise<PackageWithPurchases> {
    const pkg = await prisma.package.create({
      data: {
        name: data.name,
        namePortuguese: data.namePortuguese,
        description: data.description,
        sessionCount: data.sessionCount,
        basePrice: data.basePrice,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });

    return pkg as PackageWithPurchases;
  },

  // Update package
  async update(
    id: string,
    data: Partial<PackageCreateInput>
  ): Promise<PackageWithPurchases> {
    const pkg = await prisma.package.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.namePortuguese !== undefined && {
          namePortuguese: data.namePortuguese,
        }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.sessionCount && { sessionCount: data.sessionCount }),
        ...(data.basePrice && { basePrice: data.basePrice }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });

    return pkg as PackageWithPurchases;
  },

  // Toggle package active status
  async toggleActive(id: string): Promise<PackageWithPurchases> {
    const current = await prisma.package.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!current) {
      throw new Error("PACKAGE_NOT_FOUND");
    }

    return this.update(id, { isActive: !current.isActive });
  },

  // Sell package to a baby
  async sellPackage(data: SellPackageInput): Promise<PackagePurchaseWithDetails> {
    const pkg = await prisma.package.findUnique({
      where: { id: data.packageId },
    });

    if (!pkg) {
      throw new Error("PACKAGE_NOT_FOUND");
    }

    if (!pkg.isActive) {
      throw new Error("PACKAGE_INACTIVE");
    }

    // Check if baby exists
    const baby = await prisma.baby.findUnique({
      where: { id: data.babyId },
    });

    if (!baby) {
      throw new Error("BABY_NOT_FOUND");
    }

    // Deactivate any current active packages for this baby
    await prisma.packagePurchase.updateMany({
      where: {
        babyId: data.babyId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Calculate final price
    const basePrice = Number(pkg.basePrice);
    const discountAmount = data.discountAmount || 0;
    const finalPrice = basePrice - discountAmount;

    if (finalPrice < 0) {
      throw new Error("INVALID_DISCOUNT");
    }

    // Create purchase with payment in a transaction
    const purchase = await prisma.$transaction(async (tx) => {
      // Create payment first
      const payment = await tx.payment.create({
        data: {
          amount: finalPrice,
          method: data.paymentMethod,
          notes: data.paymentNotes,
        },
      });

      // Create package purchase
      const newPurchase = await tx.packagePurchase.create({
        data: {
          babyId: data.babyId,
          packageId: data.packageId,
          basePrice: basePrice,
          discountAmount: discountAmount,
          discountReason: data.discountReason,
          finalPrice: finalPrice,
          totalSessions: pkg.sessionCount,
          usedSessions: 0,
          remainingSessions: pkg.sessionCount,
          isActive: true,
          paymentId: payment.id,
        },
        include: {
          package: {
            select: {
              id: true,
              name: true,
              namePortuguese: true,
            },
          },
          payment: true,
        },
      });

      return newPurchase;
    });

    return purchase as PackagePurchaseWithDetails;
  },

  // Get purchases for a baby
  async getPurchasesForBaby(babyId: string): Promise<PackagePurchaseWithDetails[]> {
    const purchases = await prisma.packagePurchase.findMany({
      where: { babyId },
      orderBy: { createdAt: "desc" },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            namePortuguese: true,
          },
        },
        payment: true,
      },
    });

    return purchases as PackagePurchaseWithDetails[];
  },

  // Get active package for a baby
  async getActivePackageForBaby(
    babyId: string
  ): Promise<PackagePurchaseWithDetails | null> {
    const purchase = await prisma.packagePurchase.findFirst({
      where: {
        babyId,
        isActive: true,
        remainingSessions: { gt: 0 },
      },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            namePortuguese: true,
          },
        },
        payment: true,
      },
    });

    return purchase as PackagePurchaseWithDetails | null;
  },

  // Use a session from a package
  async useSession(purchaseId: string): Promise<PackagePurchaseWithDetails> {
    const purchase = await prisma.packagePurchase.findUnique({
      where: { id: purchaseId },
    });

    if (!purchase) {
      throw new Error("PURCHASE_NOT_FOUND");
    }

    if (purchase.remainingSessions <= 0) {
      throw new Error("NO_SESSIONS_REMAINING");
    }

    const updated = await prisma.packagePurchase.update({
      where: { id: purchaseId },
      data: {
        usedSessions: { increment: 1 },
        remainingSessions: { decrement: 1 },
      },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            namePortuguese: true,
          },
        },
        payment: true,
      },
    });

    return updated as PackagePurchaseWithDetails;
  },

  // Return a session to a package (e.g., when canceling an appointment)
  async returnSession(purchaseId: string): Promise<PackagePurchaseWithDetails> {
    const purchase = await prisma.packagePurchase.findUnique({
      where: { id: purchaseId },
    });

    if (!purchase) {
      throw new Error("PURCHASE_NOT_FOUND");
    }

    if (purchase.usedSessions <= 0) {
      throw new Error("NO_SESSIONS_TO_RETURN");
    }

    const updated = await prisma.packagePurchase.update({
      where: { id: purchaseId },
      data: {
        usedSessions: { decrement: 1 },
        remainingSessions: { increment: 1 },
      },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            namePortuguese: true,
          },
        },
        payment: true,
      },
    });

    return updated as PackagePurchaseWithDetails;
  },

  // Cancel/void a package purchase (only if no sessions have been used)
  async cancelPurchase(purchaseId: string): Promise<void> {
    const purchase = await prisma.packagePurchase.findUnique({
      where: { id: purchaseId },
      include: { payment: true },
    });

    if (!purchase) {
      throw new Error("PURCHASE_NOT_FOUND");
    }

    if (purchase.usedSessions > 0) {
      throw new Error("SESSIONS_ALREADY_USED");
    }

    // Delete purchase and payment in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the purchase first (due to foreign key)
      await tx.packagePurchase.delete({
        where: { id: purchaseId },
      });

      // Delete the associated payment if exists
      if (purchase.paymentId) {
        await tx.payment.delete({
          where: { id: purchase.paymentId },
        });
      }
    });
  },
};
