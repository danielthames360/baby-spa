import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { inventoryService } from "@/lib/services/inventory-service";
import { registerPurchaseSchema } from "@/lib/validations/inventory";

// POST /api/inventory/purchase - Register a purchase (add stock)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and RECEPTION can register purchases
    if (session.user.role !== "ADMIN" && session.user.role !== "RECEPTION") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = registerPurchaseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: validation.error.issues },
        { status: 400 }
      );
    }

    const movement = await inventoryService.registerPurchase({
      productId: validation.data.productId,
      quantity: validation.data.quantity,
      unitCost: validation.data.unitCost,
      supplier: validation.data.supplier || undefined,
      notes: validation.data.notes || undefined,
    });

    return NextResponse.json({ movement }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PRODUCT_NOT_FOUND") {
        return NextResponse.json(
          { error: "PRODUCT_NOT_FOUND" },
          { status: 404 }
        );
      }
      if (error.message === "QUANTITY_INVALID") {
        return NextResponse.json(
          { error: "QUANTITY_INVALID" },
          { status: 400 }
        );
      }
    }
    console.error("Error registering purchase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
