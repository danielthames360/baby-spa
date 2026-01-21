import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sessionService } from "@/lib/services/session-service";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const addProductSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  isChargeable: z.boolean(),
});

// POST /api/sessions/[id]/products - Add product to session
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and RECEPTION can add products
    if (!["ADMIN", "RECEPTION"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: sessionId } = await params;

    const body = await request.json();
    const validationResult = addProductSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { productId, quantity, isChargeable } = validationResult.data;

    const product = await sessionService.addProduct({
      sessionId,
      productId,
      quantity,
      isChargeable,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Error adding product to session:", error);

    if (error instanceof Error) {
      const errorMap: Record<string, { message: string; status: number }> = {
        SESSION_NOT_FOUND: { message: "SESSION_NOT_FOUND", status: 404 },
        SESSION_ALREADY_COMPLETED: {
          message: "SESSION_ALREADY_COMPLETED",
          status: 400,
        },
        PRODUCT_NOT_FOUND: { message: "PRODUCT_NOT_FOUND", status: 404 },
        INSUFFICIENT_STOCK: { message: "INSUFFICIENT_STOCK", status: 400 },
      };

      const mappedError = errorMap[error.message];
      if (mappedError) {
        return NextResponse.json(
          { error: mappedError.message },
          { status: mappedError.status }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id]/products - Remove product from session
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function DELETE(request: NextRequest, _routeParams: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and RECEPTION can remove products
    if (!["ADMIN", "RECEPTION"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sessionProductId = searchParams.get("sessionProductId");

    if (!sessionProductId) {
      return NextResponse.json(
        { error: "sessionProductId is required" },
        { status: 400 }
      );
    }

    await sessionService.removeProduct(sessionProductId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing product from session:", error);

    if (error instanceof Error) {
      const errorMap: Record<string, { message: string; status: number }> = {
        SESSION_PRODUCT_NOT_FOUND: {
          message: "SESSION_PRODUCT_NOT_FOUND",
          status: 404,
        },
        SESSION_ALREADY_COMPLETED: {
          message: "SESSION_ALREADY_COMPLETED",
          status: 400,
        },
      };

      const mappedError = errorMap[error.message];
      if (mappedError) {
        return NextResponse.json(
          { error: mappedError.message },
          { status: mappedError.status }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
