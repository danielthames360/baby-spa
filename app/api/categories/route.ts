import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { categoryService } from "@/lib/services/category-service";
import { categorySchema } from "@/lib/validations/category";
import { CategoryType } from "@prisma/client";

// GET /api/categories - List all categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as CategoryType | null;
    const includeInactive = searchParams.get("includeInactive") === "true";

    const categories = await categoryService.list(
      type || undefined,
      includeInactive
    );

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only OWNER and ADMIN can create categories
    if (!["OWNER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = categorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: validation.error.issues },
        { status: 400 }
      );
    }

    const category = await categoryService.create(validation.data);

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "CATEGORY_NAME_EXISTS") {
      return NextResponse.json(
        { error: "CATEGORY_NAME_EXISTS" },
        { status: 409 }
      );
    }

    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
