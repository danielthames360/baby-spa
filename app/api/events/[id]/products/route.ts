import { NextRequest } from "next/server";
import { withAuth, validateRequest, handleApiError, successResponse, createdResponse, ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { addEventProductSchema } from "@/lib/validations/event";

// GET /api/events/[id]/products - Get products used in event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION", "THERAPIST"]);

    const { id } = await params;

    const productUsages = await prisma.eventProductUsage.findMany({
      where: { eventId: id },
      include: {
        product: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse({ productUsages });
  } catch (error) {
    return handleApiError(error, "fetching event products");
  }
}

// POST /api/events/[id]/products - Add product usage to event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { id } = await params;
    const body = await request.json();
    const data = validateRequest(body, addEventProductSchema);

    // Get product to get price and check stock
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new ApiError(404, "PRODUCT_NOT_FOUND");
    }

    if (product.currentStock < data.quantity) {
      throw new ApiError(400, "INSUFFICIENT_STOCK");
    }

    const stockAfter = product.currentStock - data.quantity;
    const totalAmount = data.quantity * Number(product.salePrice);

    // Create product usage and deduct from inventory in transaction
    const productUsage = await prisma.$transaction(async (tx) => {
      // Create usage record
      const usage = await tx.eventProductUsage.create({
        data: {
          eventId: id,
          productId: data.productId,
          quantity: data.quantity,
          unitPrice: product.salePrice,
          notes: data.notes,
        },
        include: {
          product: true,
        },
      });

      // Update product stock
      await tx.product.update({
        where: { id: data.productId },
        data: { currentStock: stockAfter },
      });

      // Record inventory movement
      await tx.inventoryMovement.create({
        data: {
          productId: data.productId,
          type: "USAGE",
          quantity: -data.quantity,
          unitPrice: product.salePrice,
          totalAmount,
          notes: `Evento: ${id}`,
          stockAfter,
        },
      });

      return usage;
    });

    return createdResponse({ productUsage });
  } catch (error) {
    return handleApiError(error, "adding product to event");
  }
}
