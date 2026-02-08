import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { categoryService } from "@/lib/services/category-service";
import { categoryUpdateSchema } from "@/lib/validations/category";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/categories/[id] - Get a single category
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const category = await categoryService.getById(id);

    if (!category) {
      return NextResponse.json(
        { error: "CATEGORY_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Update a category
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only OWNER and ADMIN can update categories
    if (!["OWNER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = categoryUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: validation.error.issues },
        { status: 400 }
      );
    }

    const category = await categoryService.update(id, validation.data);

    return NextResponse.json({ category });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CATEGORY_NOT_FOUND") {
        return NextResponse.json(
          { error: "CATEGORY_NOT_FOUND" },
          { status: 404 }
        );
      }
      if (error.message === "CATEGORY_NAME_EXISTS") {
        return NextResponse.json(
          { error: "CATEGORY_NAME_EXISTS" },
          { status: 409 }
        );
      }
    }

    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/categories/[id] - Toggle category active status
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only OWNER and ADMIN can toggle category status
    if (!["OWNER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await categoryService.getById(id);

    if (!existing) {
      return NextResponse.json(
        { error: "CATEGORY_NOT_FOUND" },
        { status: 404 }
      );
    }

    const category = existing.isActive
      ? await categoryService.deactivate(id)
      : await categoryService.activate(id);

    return NextResponse.json({ category });
  } catch (error) {
    if (error instanceof Error && error.message === "CATEGORY_NOT_FOUND") {
      return NextResponse.json(
        { error: "CATEGORY_NOT_FOUND" },
        { status: 404 }
      );
    }

    console.error("Error toggling category status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only OWNER and ADMIN can delete categories
    if (!["OWNER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await categoryService.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CATEGORY_NOT_FOUND") {
        return NextResponse.json(
          { error: "CATEGORY_NOT_FOUND" },
          { status: 404 }
        );
      }
      if (error.message === "CATEGORY_IN_USE") {
        return NextResponse.json(
          { error: "CATEGORY_IN_USE" },
          { status: 409 }
        );
      }
    }

    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
