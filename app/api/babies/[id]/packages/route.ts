import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { packageService } from "@/lib/services/package-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/babies/[id]/packages - Get all packages with remaining sessions for a baby
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [packages, totalRemainingSessions] = await Promise.all([
      packageService.getPackagesWithSessionsForBaby(id),
      packageService.getTotalRemainingSessionsForBaby(id),
    ]);

    return NextResponse.json({
      packages,
      totalRemainingSessions,
    });
  } catch (error) {
    console.error("Error getting packages for baby:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
