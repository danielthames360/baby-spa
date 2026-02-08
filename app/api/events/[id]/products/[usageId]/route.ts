import { NextRequest } from "next/server";
import { withAuth, handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/db";

// DELETE /api/events/[id]/products/[usageId] - Remove product usage from event
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; usageId: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { usageId } = await params;

    // Get the usage to restore stock
    const usage = await prisma.eventProductUsage.findUnique({
      where: { id: usageId },
    });

    if (!usage) {
      throw new ApiError(404, "PRODUCT_NOT_FOUND");
    }

    // Delete usage and restore stock in transaction
    await prisma.$transaction(async (tx) => {
      // Delete usage
      await tx.eventProductUsage.delete({
        where: { id: usageId },
      });

      // Restore stock
      const product = await tx.product.update({
        where: { id: usage.productId },
        data: {
          currentStock: { increment: usage.quantity },
        },
      });

      // Record inventory adjustment
      await tx.inventoryMovement.create({
        data: {
          productId: usage.productId,
          type: "ADJUSTMENT",
          quantity: usage.quantity,
          unitPrice: usage.unitPrice,
          totalAmount: Number(usage.unitPrice) * usage.quantity,
          stockAfter: product.currentStock,
          notes: `Producto devuelto de evento (uso eliminado)`,
        },
      });
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error, "removing product from event");
  }
}
