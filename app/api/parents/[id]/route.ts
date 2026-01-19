import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parentService } from "@/lib/services/parent-service";
import { updateParentSchema } from "@/lib/validations/baby";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/parents/[id] - Get parent by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const parent = await parentService.getById(id);

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    return NextResponse.json({ parent });
  } catch (error) {
    console.error("Error getting parent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/parents/[id] - Update parent
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate update data
    const validatedData = updateParentSchema.parse(body);

    // Check parent exists
    const existingParent = await parentService.getById(id);
    if (!existingParent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    try {
      const parent = await parentService.update(id, {
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email || undefined,
        birthDate: validatedData.birthDate || undefined,
        documentId: validatedData.documentId,
        documentType: validatedData.documentType,
      });

      return NextResponse.json({ parent });
    } catch (error) {
      if (error instanceof Error && error.message === "PHONE_EXISTS") {
        return NextResponse.json({ error: "PHONE_EXISTS" }, { status: 400 });
      }
      if (error instanceof Error && error.message === "DOCUMENT_EXISTS") {
        return NextResponse.json({ error: "DOCUMENT_EXISTS" }, { status: 400 });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error updating parent:", error);

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
