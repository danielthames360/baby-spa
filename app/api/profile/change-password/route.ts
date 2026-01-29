import { NextRequest } from "next/server";
import {
  withAuth,
  handleApiError,
  successResponse,
  ApiError,
} from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Esquema de validación para cambio de contraseña
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "CURRENT_PASSWORD_REQUIRED"),
  newPassword: z.string().min(6, "PASSWORD_TOO_SHORT"), // Mínimo 6 caracteres (igual que login)
  confirmPassword: z.string().min(1, "CONFIRM_PASSWORD_REQUIRED"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "PASSWORDS_DO_NOT_MATCH",
  path: ["confirmPassword"],
});

// POST /api/profile/change-password
export async function POST(request: NextRequest) {
  try {
    const session = await withAuth(["OWNER", "ADMIN", "RECEPTION", "THERAPIST"]);
    const body = await request.json();

    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      throw new ApiError(400, firstError.message);
    }

    const { currentPassword, newPassword } = parsed.data;

    // Obtener el usuario actual con su hash de contraseña
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        passwordHash: true,
        mustChangePassword: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND");
    }

    // Verificar la contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new ApiError(400, "CURRENT_PASSWORD_INCORRECT");
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new ApiError(400, "NEW_PASSWORD_SAME_AS_CURRENT");
    }

    // Hashear la nueva contraseña
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña y quitar el flag de mustChangePassword
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    });

    return successResponse({ message: "PASSWORD_CHANGED_SUCCESSFULLY" });
  } catch (error) {
    return handleApiError(error, "changing password");
  }
}
