import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { babyService } from "@/lib/services/baby-service";
import { parentService } from "@/lib/services/parent-service";
import { parentSchema } from "@/lib/validations/baby";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/babies/[id]/parents - Add parent to baby
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: babyId } = await params;
    const body = await request.json();

    const {
      parentData,
      existingParentId,
      relationship,
      isPrimary = false,
    } = body;

    // Check if baby exists
    const baby = await babyService.getById(babyId);
    if (!baby) {
      return NextResponse.json({ error: "Baby not found" }, { status: 404 });
    }

    let parentId = existingParentId;

    // Create new parent if no existing ID provided
    if (!parentId && parentData) {
      try {
        const validatedParent = parentSchema.parse(parentData);
        const newParent = await parentService.create({
          name: validatedParent.name,
          phone: validatedParent.phone,
          email: validatedParent.email || undefined,
          birthDate: validatedParent.birthDate || undefined,
        });
        parentId = newParent.id;
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "PHONE_EXISTS") {
            return NextResponse.json(
              { error: "PHONE_EXISTS" },
              { status: 400 }
            );
          }
        }
        throw error;
      }
    }

    if (!parentId) {
      return NextResponse.json(
        { error: "Parent ID or parent data required" },
        { status: 400 }
      );
    }

    // Check if parent is already linked to baby
    const existingLink = baby.parents.find(
      (p) => p.parent.id === parentId
    );
    if (existingLink) {
      return NextResponse.json(
        { error: "Parent already linked to baby" },
        { status: 400 }
      );
    }

    // Add parent to baby
    await babyService.addParent(
      babyId,
      parentId,
      relationship || "GUARDIAN",
      isPrimary
    );

    // Get updated baby data
    const updatedBaby = await babyService.getById(babyId);

    return NextResponse.json({ baby: updatedBaby }, { status: 201 });
  } catch (error) {
    console.error("Error adding parent to baby:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/babies/[id]/parents - Update parent relationship (e.g., set as primary)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: babyId } = await params;
    const body = await request.json();
    const { parentId, isPrimary } = body;

    if (!parentId) {
      return NextResponse.json(
        { error: "Parent ID required" },
        { status: 400 }
      );
    }

    // Check if baby exists
    const baby = await babyService.getById(babyId);
    if (!baby) {
      return NextResponse.json({ error: "Baby not found" }, { status: 404 });
    }

    // Check if parent is linked to baby
    const existingLink = baby.parents.find((p) => p.parent.id === parentId);
    if (!existingLink) {
      return NextResponse.json(
        { error: "Parent not linked to baby" },
        { status: 400 }
      );
    }

    // Set parent as primary
    if (isPrimary) {
      await babyService.setParentAsPrimary(babyId, parentId);
    }

    // Get updated baby data
    const updatedBaby = await babyService.getById(babyId);

    return NextResponse.json({ baby: updatedBaby });
  } catch (error) {
    console.error("Error updating parent relationship:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/babies/[id]/parents - Remove parent from baby
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: babyId } = await params;
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");

    if (!parentId) {
      return NextResponse.json(
        { error: "Parent ID required" },
        { status: 400 }
      );
    }

    // Check if baby exists
    const baby = await babyService.getById(babyId);
    if (!baby) {
      return NextResponse.json({ error: "Baby not found" }, { status: 404 });
    }

    // Remove parent from baby
    try {
      await babyService.removeParent(babyId, parentId);
    } catch (error) {
      if (error instanceof Error && error.message === "CANNOT_REMOVE_ONLY_PARENT") {
        return NextResponse.json(
          { error: "CANNOT_REMOVE_ONLY_PARENT" },
          { status: 400 }
        );
      }
      throw error;
    }

    // Get updated baby data
    const updatedBaby = await babyService.getById(babyId);

    return NextResponse.json({ baby: updatedBaby });
  } catch (error) {
    console.error("Error removing parent from baby:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
