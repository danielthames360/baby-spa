import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// Types
export interface PackageWithPurchases {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryRef?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  serviceType: "BABY" | "PARENT" | null; // BABY = services for babies, PARENT = services for parents
  sessionCount: number;
  basePrice: Prisma.Decimal;
  duration: number;
  requiresAdvancePayment: boolean;
  advancePaymentAmount: Prisma.Decimal | null;
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
  description?: string;
  categoryId?: string | null;
  serviceType?: "BABY" | "PARENT"; // BABY = services for babies, PARENT = services for parents
  sessionCount: number;
  basePrice: number;
  duration?: number;
  requiresAdvancePayment?: boolean;
  advancePaymentAmount?: number | null;
  // Installment configuration
  allowInstallments?: boolean;
  installmentsCount?: number | null;
  installmentsTotalPrice?: number | null;
  installmentsPayOnSessions?: string | null;
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
  // Payment plan fields
  paymentPlan: string;
  totalPrice: Prisma.Decimal | null;
  installments: number;
  installmentAmount: Prisma.Decimal | null;
  installmentsPayOnSessions: string | null;
  paidAmount: Prisma.Decimal;
  package: {
    id: string;
    name: string;
    categoryId?: string | null;
    categoryRef?: {
      id: string;
      name: string;
      color: string | null;
    } | null;
  };
  payment: {
    id: string;
    amount: Prisma.Decimal;
    method: string;
    notes: string | null;
    createdAt: Date;
  } | null;
  installmentPayments?: Array<{
    id: string;
    installmentNumber: number;
    amount: Prisma.Decimal;
    paymentMethod: string;
    paidAt: Date;
  }>;
}

export interface SellPackageInput {
  babyId: string;
  packageId: string;
  discountAmount?: number;
  discountReason?: string;
  paymentMethod: "CASH" | "TRANSFER" | "CARD" | "OTHER";
  paymentNotes?: string;
  // Payment plan options
  paymentPlan?: "SINGLE" | "INSTALLMENTS"; // SINGLE = full payment, INSTALLMENTS = use package config
  installments?: number; // Legacy field - ignored if paymentPlan is set
  createdById?: string; // User who created the sale (for installment tracking)
}

// Package Service
export const packageService = {
  // Get all packages (for catalog)
  async list(includeInactive = false): Promise<PackageWithPurchases[]> {
    const packages = await prisma.package.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
      include: {
        categoryRef: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
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
        categoryRef: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
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
        description: data.description,
        categoryId: data.categoryId,
        serviceType: data.serviceType,
        sessionCount: data.sessionCount,
        basePrice: data.basePrice,
        duration: data.duration ?? 60,
        requiresAdvancePayment: data.requiresAdvancePayment ?? false,
        advancePaymentAmount: data.advancePaymentAmount,
        // Installment configuration
        allowInstallments: data.allowInstallments ?? false,
        installmentsCount: data.installmentsCount,
        installmentsTotalPrice: data.installmentsTotalPrice,
        installmentsPayOnSessions: data.installmentsPayOnSessions,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
      include: {
        categoryRef: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
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
        ...(data.description !== undefined && { description: data.description }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.serviceType !== undefined && { serviceType: data.serviceType }),
        ...(data.sessionCount && { sessionCount: data.sessionCount }),
        ...(data.basePrice && { basePrice: data.basePrice }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.requiresAdvancePayment !== undefined && { requiresAdvancePayment: data.requiresAdvancePayment }),
        ...(data.advancePaymentAmount !== undefined && { advancePaymentAmount: data.advancePaymentAmount }),
        // Installment configuration
        ...(data.allowInstallments !== undefined && { allowInstallments: data.allowInstallments }),
        ...(data.installmentsCount !== undefined && { installmentsCount: data.installmentsCount }),
        ...(data.installmentsTotalPrice !== undefined && { installmentsTotalPrice: data.installmentsTotalPrice }),
        ...(data.installmentsPayOnSessions !== undefined && { installmentsPayOnSessions: data.installmentsPayOnSessions }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
      include: {
        categoryRef: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
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

    // NOTE: We no longer deactivate previous packages
    // Multiple packages can now be active simultaneously

    // Determine payment plan and calculate prices
    const basePrice = Number(pkg.basePrice);
    const discountAmount = data.discountAmount || 0;

    // New payment plan logic: SINGLE = full payment at base price, INSTALLMENTS = use package config
    const isInstallments = data.paymentPlan === "INSTALLMENTS" &&
      pkg.allowInstallments &&
      pkg.installmentsCount &&
      pkg.installmentsCount > 1;

    // For INSTALLMENTS, use package's installment total price (can be higher than base price)
    const totalPrice = isInstallments && pkg.installmentsTotalPrice
      ? Number(pkg.installmentsTotalPrice) - discountAmount
      : basePrice - discountAmount;

    // Final price is what client will pay (same as totalPrice for single, or installmentsTotalPrice for installments)
    const finalPrice = isInstallments && pkg.installmentsTotalPrice
      ? Number(pkg.installmentsTotalPrice) - discountAmount
      : basePrice - discountAmount;

    if (finalPrice < 0) {
      throw new Error("INVALID_DISCOUNT");
    }

    // Installment configuration from package
    const installments = isInstallments ? pkg.installmentsCount! : 1;
    const installmentAmount = isInstallments ? finalPrice / installments : finalPrice;
    const paymentPlan = isInstallments ? "INSTALLMENTS" : "SINGLE";
    const installmentsPayOnSessions = isInstallments ? pkg.installmentsPayOnSessions : null;

    // Create purchase with payment in a transaction
    const purchase = await prisma.$transaction(async (tx) => {
      // Create initial payment (first installment or full payment)
      const payment = await tx.payment.create({
        data: {
          amount: installmentAmount,
          method: data.paymentMethod,
          notes: data.paymentNotes,
        },
      });

      // Create package purchase with installment info
      const newPurchase = await tx.packagePurchase.create({
        data: {
          babyId: data.babyId,
          packageId: data.packageId,
          basePrice: basePrice,
          discountAmount: discountAmount,
          discountReason: data.discountReason,
          finalPrice: isInstallments ? basePrice - discountAmount : finalPrice, // finalPrice = single payment price
          totalSessions: pkg.sessionCount,
          usedSessions: 0,
          remainingSessions: pkg.sessionCount,
          isActive: true,
          paymentId: payment.id,
          // Payment plan fields
          paymentPlan: paymentPlan,
          totalPrice: totalPrice, // Total price client will pay (can differ from finalPrice for installments)
          installments: installments,
          installmentAmount: installments > 1 ? installmentAmount : null,
          installmentsPayOnSessions: installmentsPayOnSessions,
          paidAmount: installmentAmount, // First installment paid
        },
        include: {
          package: {
            select: {
              id: true,
              name: true,
            },
          },
          payment: true,
        },
      });

      // If installments > 1, record the first installment payment
      if (installments > 1 && data.createdById) {
        await tx.packagePayment.create({
          data: {
            packagePurchaseId: newPurchase.id,
            installmentNumber: 1,
            amount: installmentAmount,
            paymentMethod: data.paymentMethod,
            notes: data.paymentNotes,
            createdById: data.createdById,
          },
        });
      }

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
            categoryId: true,
            categoryRef: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    return purchases as PackagePurchaseWithDetails[];
  },

  // Get active package for a baby (legacy - returns first package with sessions)
  // Consider using getPackagesWithSessionsForBaby instead
  async getActivePackageForBaby(
    babyId: string
  ): Promise<PackagePurchaseWithDetails | null> {
    const purchase = await prisma.packagePurchase.findFirst({
      where: {
        babyId,
        remainingSessions: { gt: 0 },
      },
      orderBy: { createdAt: "asc" },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            categoryId: true,
            categoryRef: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
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

  // Get all packages with remaining sessions for a baby
  async getPackagesWithSessionsForBaby(
    babyId: string
  ): Promise<PackagePurchaseWithDetails[]> {
    const purchases = await prisma.packagePurchase.findMany({
      where: {
        babyId,
        remainingSessions: { gt: 0 },
      },
      orderBy: { createdAt: "asc" },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            categoryId: true,
            categoryRef: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    return purchases as PackagePurchaseWithDetails[];
  },

  // Get total remaining sessions across all packages for a baby
  async getTotalRemainingSessionsForBaby(babyId: string): Promise<number> {
    const result = await prisma.packagePurchase.aggregate({
      where: {
        babyId,
        remainingSessions: { gt: 0 },
      },
      _sum: {
        remainingSessions: true,
      },
    });

    return result._sum.remainingSessions || 0;
  },

  // Parent package methods (for parent services like prenatal massage)
  async getPackagesWithSessionsForParent(
    parentId: string
  ): Promise<PackagePurchaseWithDetails[]> {
    const purchases = await prisma.packagePurchase.findMany({
      where: {
        parentId,
        remainingSessions: { gt: 0 },
      },
      orderBy: { createdAt: "asc" },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            categoryId: true,
            categoryRef: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    return purchases as PackagePurchaseWithDetails[];
  },

  async getTotalRemainingSessionsForParent(parentId: string): Promise<number> {
    const result = await prisma.packagePurchase.aggregate({
      where: {
        parentId,
        remainingSessions: { gt: 0 },
      },
      _sum: {
        remainingSessions: true,
      },
    });

    return result._sum.remainingSessions || 0;
  },
};
