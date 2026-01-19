import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parentService } from "@/lib/services/parent-service";
import { parentSchema } from "@/lib/validations/baby";
import { z } from "zod";

const listParamsSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

// GET /api/parents - List parents
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = listParamsSchema.parse({
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 10,
    });

    const result = await parentService.list(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error listing parents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/parents - Create parent
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = parentSchema.parse(body);

    try {
      const parent = await parentService.create({
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email || undefined,
        birthDate: validatedData.birthDate || undefined,
      });

      return NextResponse.json({ parent }, { status: 201 });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "PHONE_EXISTS") {
          return NextResponse.json({ error: "PHONE_EXISTS" }, { status: 400 });
        }
      }
      throw error;
    }
  } catch (error) {
    console.error("Error creating parent:", error);

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
