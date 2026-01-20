import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { inventoryService } from "@/lib/services/inventory-service";

// GET /api/products/low-stock - Get products with low stock
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await inventoryService.getLowStockProducts();
    const count = products.length;

    return NextResponse.json({ products, count });
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      { error: "Internal server error", message: errorMessage, stack: process.env.NODE_ENV === "development" ? errorStack : undefined },
      { status: 500 }
    );
  }
}
