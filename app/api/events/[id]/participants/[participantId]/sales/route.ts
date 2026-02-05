import { NextRequest } from "next/server";
import { withAuth, validateRequest, handleApiError, createdResponse, ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { transactionService, PaymentMethodEntry } from "@/lib/services/transaction-service";

const paymentMethodSchema = z.object({
  method: z.enum(["CASH", "QR", "CARD", "TRANSFER"]),
  amount: z.number().positive(),
  reference: z.string().optional(),
});

const saleSchema = z.object({
  products: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })).min(1),
  // Support both legacy single method and new split payments
  paymentMethod: z.enum(["CASH", "QR", "CARD", "TRANSFER"]).optional(),
  paymentMethods: z.array(paymentMethodSchema).optional(),
  babyId: z.string().optional(),
});

// POST /api/events/[id]/participants/[participantId]/sales - Register product sale
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { id: eventId, participantId } = await params;
    const body = await request.json();
    const data = validateRequest(body, saleSchema);

    // Verify event exists and is in progress
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { status: true, name: true },
    });

    if (!event) {
      throw new ApiError(404, "EVENT_NOT_FOUND");
    }

    if (event.status !== "IN_PROGRESS") {
      throw new ApiError(400, "EVENT_NOT_IN_PROGRESS");
    }

    // Verify participant exists (include baby OR parent name)
    const participant = await prisma.eventParticipant.findUnique({
      where: { id: participantId },
      select: {
        id: true,
        baby: { select: { name: true } },
        parent: { select: { name: true } },
      },
    });

    if (!participant) {
      throw new ApiError(404, "PARTICIPANT_NOT_FOUND");
    }

    // Get participant name (baby or parent)
    const participantName = participant.baby?.name || participant.parent?.name || "Participante";

    // Calculate total for validation
    const totalSale = data.products.reduce(
      (sum, p) => sum + p.quantity * p.unitPrice,
      0
    );

    // Normalize payment methods (support both legacy and new format)
    let paymentMethods: PaymentMethodEntry[];
    if (data.paymentMethods && data.paymentMethods.length > 0) {
      paymentMethods = data.paymentMethods;
    } else if (data.paymentMethod) {
      paymentMethods = [{ method: data.paymentMethod, amount: totalSale }];
    } else {
      throw new ApiError(400, "PAYMENT_METHOD_REQUIRED");
    }

    // Validate payment sum
    const paymentSum = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
    if (Math.abs(paymentSum - totalSale) > 0.01) {
      throw new ApiError(400, "PAYMENT_SUM_MISMATCH");
    }

    // Process each product sale in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const sales = [];

      for (const item of data.products) {
        // Get product and verify stock
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, currentStock: true, salePrice: true },
        });

        if (!product) {
          throw new ApiError(404, `PRODUCT_NOT_FOUND: ${item.productId}`);
        }

        if (product.currentStock < item.quantity) {
          throw new ApiError(400, `INSUFFICIENT_STOCK: ${product.name}`);
        }

        const stockAfter = product.currentStock - item.quantity;
        const totalAmount = item.quantity * item.unitPrice;

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: stockAfter },
        });

        // Record inventory movement as SALE
        const movement = await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: "SALE",
            quantity: -item.quantity,
            unitPrice: item.unitPrice,
            totalAmount,
            stockAfter,
            notes: `Venta en evento: ${event.name} - ${participantName}`,
          },
        });

        sales.push({
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: totalAmount,
          movementId: movement.id,
        });
      }

      return sales;
    });

    // Create transaction record for the sale
    const transaction = await transactionService.create({
      type: "INCOME",
      category: "EVENT_PRODUCTS",
      referenceType: "event_participant",
      referenceId: participantId,
      items: result.map((sale) => ({
        itemType: "PRODUCT",
        referenceId: sale.productId,
        description: sale.productName,
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
      })),
      paymentMethods,
      notes: `Venta en evento: ${event.name} - ${participantName}`,
    });

    return createdResponse({
      sales: result,
      total: totalSale,
      transactionId: transaction.id,
      paymentMethods,
    });
  } catch (error) {
    return handleApiError(error, "processing product sale");
  }
}
