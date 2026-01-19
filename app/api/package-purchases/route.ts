import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { packageService } from "@/lib/services/package-service";
import { sellPackageSchema } from "@/lib/validations/package";

// POST /api/package-purchases - Sell a package to a baby
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and RECEPTION can sell packages
    if (!["ADMIN", "RECEPTION"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = sellPackageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: validation.error.issues },
        { status: 400 }
      );
    }

    const purchase = await packageService.sellPackage(validation.data);

    return NextResponse.json({ purchase }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "PACKAGE_NOT_FOUND":
          return NextResponse.json(
            { error: "PACKAGE_NOT_FOUND" },
            { status: 404 }
          );
        case "PACKAGE_INACTIVE":
          return NextResponse.json(
            { error: "PACKAGE_INACTIVE" },
            { status: 400 }
          );
        case "BABY_NOT_FOUND":
          return NextResponse.json(
            { error: "BABY_NOT_FOUND" },
            { status: 404 }
          );
        case "INVALID_DISCOUNT":
          return NextResponse.json(
            { error: "INVALID_DISCOUNT" },
            { status: 400 }
          );
      }
    }

    console.error("Error selling package:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
