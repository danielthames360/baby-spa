import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parentService } from "@/lib/services/parent-service";

// GET /api/parents/search?query=xxx - Search parents
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";

    if (query.length < 2) {
      return NextResponse.json({ parents: [] });
    }

    const parents = await parentService.search(query);

    return NextResponse.json({ parents });
  } catch (error) {
    console.error("Error searching parents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
