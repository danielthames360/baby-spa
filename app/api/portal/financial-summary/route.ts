import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    // Get parent's babies
    const parentWithBabies = await prisma.parent.findUnique({
      where: { id: parentId },
      select: {
        id: true,
        babies: {
          select: {
            babyId: true,
          },
        },
      },
    });

    if (!parentWithBabies) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    const babyIds = parentWithBabies.babies.map((bp) => bp.babyId);

    // Get all package purchases for parent's babies AND for parent directly
    const packagePurchases = await prisma.packagePurchase.findMany({
      where: {
        OR: [
          { babyId: { in: babyIds } },
          { parentId: parentId },
        ],
        isActive: true,
      },
      include: {
        package: {
          select: {
            id: true,
            name: true,
          },
        },
        baby: {
          select: {
            id: true,
            name: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        installmentPayments: {
          select: {
            id: true,
            installmentNumber: true,
            amount: true,
            paymentMethod: true,
            paidAt: true,
          },
          orderBy: {
            installmentNumber: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate totals and separate pending vs paid
    let totalPending = 0;
    const packagesWithPending: typeof packagePurchases = [];
    const packagesPaid: typeof packagePurchases = [];

    for (const pkg of packagePurchases) {
      const pending = Number(pkg.finalPrice) - Number(pkg.paidAmount);

      if (pending > 0) {
        totalPending += pending;
        packagesWithPending.push(pkg);
      } else {
        packagesPaid.push(pkg);
      }
    }

    // Calculate next installment info for each pending package
    const packagesWithPendingData = packagesWithPending.map((pkg) => {
      const finalPrice = Number(pkg.finalPrice);
      const paidAmount = Number(pkg.paidAmount);
      const pendingAmount = finalPrice - paidAmount;
      const paidInstallments = pkg.installmentPayments.length;
      const percentagePaid = finalPrice > 0 ? (paidAmount / finalPrice) * 100 : 100;

      // Parse which sessions require payment
      const payOnSessions = pkg.installmentsPayOnSessions
        ? pkg.installmentsPayOnSessions.split(",").map(Number)
        : [];

      // Find next payment session
      const nextPaymentSession = payOnSessions.find((s) => s > pkg.usedSessions);

      return {
        id: pkg.id,
        packageName: pkg.package.name,
        clientName: pkg.baby?.name || pkg.parent?.name || "Cliente",
        clientType: pkg.baby ? ("baby" as const) : ("parent" as const),
        totalPrice: finalPrice,
        paidAmount,
        pendingAmount,
        percentagePaid: Math.round(percentagePaid),
        paymentPlan: pkg.paymentPlan,
        totalInstallments: pkg.installments,
        paidInstallments,
        installmentAmount: pkg.installmentAmount ? Number(pkg.installmentAmount) : null,
        totalSessions: pkg.totalSessions,
        usedSessions: pkg.usedSessions,
        remainingSessions: pkg.remainingSessions,
        nextPaymentSession,
        purchaseDate: pkg.createdAt,
        payments: pkg.installmentPayments.map((payment) => ({
          id: payment.id,
          installmentNumber: payment.installmentNumber,
          amount: Number(payment.amount),
          paymentMethod: payment.paymentMethod,
          paidAt: payment.paidAt,
        })),
      };
    });

    const packagesPaidData = packagesPaid.map((pkg) => ({
      id: pkg.id,
      packageName: pkg.package.name,
      clientName: pkg.baby?.name || pkg.parent?.name || "Cliente",
      clientType: pkg.baby ? ("baby" as const) : ("parent" as const),
      totalPrice: Number(pkg.finalPrice),
      totalSessions: pkg.totalSessions,
      usedSessions: pkg.usedSessions,
      remainingSessions: pkg.remainingSessions,
      purchaseDate: pkg.createdAt,
    }));

    return NextResponse.json({
      summary: {
        totalPending,
        packagesWithPending: packagesWithPendingData.length,
        packagesPaid: packagesPaidData.length,
      },
      packagesWithPending: packagesWithPendingData,
      packagesPaid: packagesPaidData,
    });
  } catch (error) {
    console.error("Get financial summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
