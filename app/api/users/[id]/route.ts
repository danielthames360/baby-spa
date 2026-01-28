import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/lib/services/user-service";
import { updateUserSchema } from "@/lib/validations/user";
import { withAuth, handleApiError } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(["ADMIN"]);

    const { id } = await params;

    const user = await userService.getById(id);

    if (!user) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({
      ...user,
      baseSalary: user.baseSalary ? Number(user.baseSalary) : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(["ADMIN"]);

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    const user = await userService.update(id, validatedData);

    return NextResponse.json({
      ...user,
      baseSalary: user.baseSalary ? Number(user.baseSalary) : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(["ADMIN"]);

    const { id } = await params;

    const result = await userService.toggleActive(id);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
