import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { babyService } from "@/lib/services/baby-service";
import { babyNoteSchema } from "@/lib/validations/baby";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/babies/[id]/notes - Get notes for a baby
export async function GET(_request: NextRequest, { params }: RouteParams) {
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

    const notes = await babyService.getNotes(id);

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Error getting notes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/babies/[id]/notes - Add note to a baby
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate note
    const { note } = babyNoteSchema.parse(body);

    // Check baby exists
    const baby = await babyService.getById(id);
    if (!baby) {
      return NextResponse.json({ error: "Baby not found" }, { status: 404 });
    }

    const newNote = await babyService.addNote(id, session.user.id, note);

    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (error) {
    console.error("Error adding note:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
