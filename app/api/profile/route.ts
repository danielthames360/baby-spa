import { NextRequest } from "next/server";
import {
  withAuth,
  handleApiError,
  successResponse,
  ApiError,
} from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Esquema de validación para actualizar perfil
const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
});

// GET /api/profile - Obtener datos del perfil del usuario actual
export async function GET() {
  try {
    const session = await withAuth(["OWNER", "ADMIN", "RECEPTION", "THERAPIST"]);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND");
    }

    return successResponse(user);
  } catch (error) {
    return handleApiError(error, "getting profile");
  }
}

// PUT /api/profile - Actualizar datos del perfil
export async function PUT(request: NextRequest) {
  try {
    const session = await withAuth(["OWNER", "ADMIN", "RECEPTION", "THERAPIST"]);
    const body = await request.json();

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "INVALID_DATA");
    }

    const { name, email, phone } = parsed.data;

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error, "updating profile");
  }
}
