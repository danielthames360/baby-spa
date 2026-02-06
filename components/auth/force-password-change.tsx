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

    // Allow access if already on any profile page
    if (pathname.includes("/profile")) {
      return;
    }

    // Redirect to the appropriate profile page based on role
    if (session.user.mustChangePassword) {
      const pathParts = pathname.split("/").filter(Boolean);
      const hasLocalePrefix = ["es", "pt-BR"].includes(pathParts[0]);
      const localePrefix = hasLocalePrefix ? `/${pathParts[0]}` : "";

      // Therapists go to /therapist/profile, everyone else to /admin/profile
      const profilePath =
        session.user.role === "THERAPIST"
          ? `${localePrefix}/therapist/profile`
          : `${localePrefix}/admin/profile`;

      router.replace(profilePath);
    }
  }, [session, status, pathname, router]);

  return <>{children}</>;
}
