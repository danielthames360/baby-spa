import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/lib/services/user-service";
import { createUserSchema } from "@/lib/validations/user";
import { withAuth, handleApiError, validateRequest } from "@/lib/api-utils";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const listSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "RECEPTION", "THERAPIST"]).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    await withAuth(["OWNER"]);

    const { searchParams } = new URL(request.url);
    const filters = validateRequest(
      Object.fromEntries(searchParams.entries()),
      listSchema
    );

    const result = await userService.list({
      role: filters.role as UserRole | undefined,
      isActive: filters.isActive === "true" ? true : filters.isActive === "false" ? false : undefined,
      search: filters.search,
      page: filters.page,
      limit: filters.limit,
    });

    // Serialize Decimal fields
    const users = result.users.map((user) => ({
      ...user,
      baseSalary: user.baseSalary ? Number(user.baseSalary) : null,
    }));

    return NextResponse.json({ ...result, users });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await withAuth(["OWNER"]);

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    const user = await userService.create(validatedData);

    return NextResponse.json(
      {
        ...user,
        baseSalary: user.baseSalary ? Number(user.baseSalary) : null,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
