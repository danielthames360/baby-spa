import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { inventoryService } from "@/lib/services/inventory-service";
import { productSchema } from "@/lib/validations/inventory";

// GET /api/products - List all products
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const status = searchParams.get("status") as
      | "all"
      | "active"
      | "inactive"
      | "lowStock"
      | "outOfStock"
      | undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const result = await inventoryService.list({
      search,
      categoryId,
      status,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "fetching products");
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only OWNER, ADMIN and RECEPTION can manage inventory
    if (!["OWNER", "ADMIN", "RECEPTION"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = productSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: validation.error.issues },
        { status: 400 }
      );
    }

    const product = await inventoryService.create({
      ...validation.data,
      categoryId: validation.data.categoryId || undefined,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "creating product");
  }
}
