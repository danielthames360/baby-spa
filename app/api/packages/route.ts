import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { packageService } from "@/lib/services/package-service";
import { packageSchema } from "@/lib/validations/package";

// GET /api/packages - List all packages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const activeOnly = searchParams.get("active") === "true";
    const publicOnly = searchParams.get("publicOnly") === "true";
    const serviceType = searchParams.get("serviceType") as "BABY" | "PARENT" | null;

    let packages = await packageService.list(includeInactive);

    // Filter by active only if requested
    if (activeOnly) {
      packages = packages.filter((pkg) => pkg.isActive);
    }

    // Filter by public only if requested (for catalog/sales)
    if (publicOnly) {
      packages = packages.filter((pkg) => pkg.isPublic);
    }

    // Filter by service type if specified
    if (serviceType) {
      packages = packages.filter((pkg) => pkg.serviceType === serviceType);
    }

    return NextResponse.json({ packages });
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/packages - Create a new package
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN can create packages
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = packageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: validation.error.issues },
        { status: 400 }
      );
    }

    const pkg = await packageService.create(validation.data);

    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (error) {
    console.error("Error creating package:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
