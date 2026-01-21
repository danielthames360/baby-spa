import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { babyService } from "@/lib/services/baby-service";
import { sessionService } from "@/lib/services/session-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/babies/[id]/sessions - Get sessions for a baby
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check baby exists
    const baby = await babyService.getById(id);
    if (!baby) {
      return NextResponse.json({ error: "Baby not found" }, { status: 404 });
    }

    const sessions = await sessionService.getByBabyId(id);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error getting sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
