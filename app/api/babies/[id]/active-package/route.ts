import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { packageService } from "@/lib/services/package-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/babies/[id]/active-package - Get active package for a baby
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const activePackage = await packageService.getActivePackageForBaby(id);

    return NextResponse.json({ package: activePackage });
  } catch (error) {
    console.error("Error getting active package:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
