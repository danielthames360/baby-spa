import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { inventoryService } from "@/lib/services/inventory-service";
import { adjustStockSchema } from "@/lib/validations/inventory";

// POST /api/inventory/adjust - Adjust stock manually
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and RECEPTION can adjust stock
    if (session.user.role !== "ADMIN" && session.user.role !== "RECEPTION") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = adjustStockSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: validation.error.issues },
        { status: 400 }
      );
    }

    const movement = await inventoryService.adjustStock({
      productId: validation.data.productId,
      newStock: validation.data.newStock,
      reason: validation.data.reason,
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
      if (error.message === "STOCK_INVALID") {
        return NextResponse.json(
          { error: "STOCK_INVALID" },
          { status: 400 }
        );
      }
      if (error.message === "REASON_REQUIRED") {
        return NextResponse.json(
          { error: "REASON_REQUIRED" },
          { status: 400 }
        );
      }
    }
    console.error("Error adjusting stock:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
