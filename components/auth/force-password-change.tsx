"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

/**
 * Componente que verifica si el usuario debe cambiar su contraseña
 * y lo redirige a la página de perfil si es necesario.
 * Verifica en CADA navegación usando el valor de la sesión.
 */
export function ForcePasswordChange({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // No verificar si no hay sesión o está cargando
    if (status !== "authenticated" || !session?.user?.id) {
      return;
    }

    // No verificar si ya estamos en la página de perfil (permitir cambiar contraseña)
    if (pathname.includes("/admin/profile")) {
      return;
    }

    // Verificar si debe cambiar la contraseña (desde la sesión JWT)
    if (session.user.mustChangePassword) {
      // Extraer locale del pathname si existe (formato: /es/admin/... o /pt-BR/admin/...)
      // Con localePrefix: "as-needed", el locale default no aparece en URL
      const pathParts = pathname.split("/").filter(Boolean);
      const hasLocalePrefix = ["es", "pt-BR"].includes(pathParts[0]);
      const profilePath = hasLocalePrefix
        ? `/${pathParts[0]}/admin/profile`
        : "/admin/profile";
      router.replace(profilePath);
    }
  }, [session, status, pathname, router]);

  return <>{children}</>;
}
