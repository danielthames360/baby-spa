import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { packageService } from "@/lib/services/package-service";

// DELETE /api/package-purchases/[id] - Cancel/void a package purchase
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and RECEPTION can cancel purchases
    if (!["OWNER", "ADMIN", "RECEPTION"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await packageService.cancelPurchase(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling package purchase:", error);

    if (error instanceof Error) {
      if (error.message === "PURCHASE_NOT_FOUND") {
        return NextResponse.json(
          { error: "PURCHASE_NOT_FOUND" },
          { status: 404 }
        );
      }
      if (error.message === "SESSIONS_ALREADY_USED") {
        return NextResponse.json(
          { error: "SESSIONS_ALREADY_USED" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
