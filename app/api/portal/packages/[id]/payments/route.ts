import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { transactionService, TransactionWithItems } from "@/lib/services/transaction-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parentId = session.user.parentId;
    if (!parentId) {
      return NextResponse.json({ error: "Parent ID not found" }, { status: 400 });
    }

    const { id: packagePurchaseId } = await params;

    // Get parent's babies
    const parentWithBabies = await prisma.parent.findUnique({
      where: { id: parentId },
      select: {
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

    // Get the package purchase and verify ownership
    const packagePurchase = await prisma.packagePurchase.findUnique({
      where: { id: packagePurchaseId },
      select: {
        id: true,
        babyId: true,
        parentId: true,
        finalPrice: true,
        paidAmount: true,
        paymentPlan: true,
        installments: true,
        installmentAmount: true,
        package: {
          select: {
            name: true,
          },
        },
        baby: {
          select: {
            name: true,
          },
        },
        parent: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!packagePurchase) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Verify ownership
    const isOwner =
      (packagePurchase.babyId && babyIds.includes(packagePurchase.babyId)) ||
      packagePurchase.parentId === parentId;

    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get payments using the new Transaction system
    const transactions: TransactionWithItems[] = await transactionService.getByReference(
      "PackagePurchase",
      packagePurchaseId
    );

    const pendingAmount = packagePurchase.finalPrice.minus(packagePurchase.paidAmount);
    const percentagePaid = packagePurchase.finalPrice.greaterThan(0)
      ? packagePurchase.paidAmount
          .dividedBy(packagePurchase.finalPrice)
          .times(100)
          .toNumber()
      : 100;

    return NextResponse.json({
      package: {
        id: packagePurchase.id,
        name: packagePurchase.package.name,
        clientName: packagePurchase.baby?.name || packagePurchase.parent?.name || "Cliente",
        totalPrice: Number(packagePurchase.finalPrice),
        paidAmount: Number(packagePurchase.paidAmount),
        pendingAmount: Number(pendingAmount),
        percentagePaid: Math.round(percentagePaid),
        paymentPlan: packagePurchase.paymentPlan,
        totalInstallments: packagePurchase.installments,
        installmentAmount: packagePurchase.installmentAmount
          ? Number(packagePurchase.installmentAmount)
          : null,
      },
      payments: transactions.map((transaction) => ({
        id: transaction.id,
        amount: Number(transaction.total),
        paymentMethods: transaction.paymentMethods,
        notes: transaction.notes,
        paidAt: transaction.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get package payments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
