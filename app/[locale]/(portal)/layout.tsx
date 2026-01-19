"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { PortalNav } from "@/components/layout/portal-nav";
import { FloatingBubbles } from "@/components/ui/floating-bubbles";
import { Loader2 } from "lucide-react";

interface PortalLayoutProps {
  children: React.ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  const { data: session, status } = useSession();
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();

  // Verificar si estamos en la página de login
  const isLoginPage = pathname.includes("/portal/login");

  useEffect(() => {
    if (status === "loading") return;

    // Si está en login page y ya tiene sesión, redirigir según rol
    if (isLoginPage && session) {
      if (session.user.role === "PARENT") {
        router.replace("/portal/dashboard");
      } else {
        // Staff users go to admin
        router.replace("/admin/dashboard");
      }
      return;
    }

    // Si no está en login y no tiene sesión, ir a login
    if (!isLoginPage && !session) {
      router.replace("/portal/login");
      return;
    }

    // Si tiene sesión pero no es PARENT, redirigir a admin
    if (!isLoginPage && session && session.user.role !== "PARENT") {
      router.replace("/admin/dashboard");
    }
  }, [session, status, router, isLoginPage]);

  // Si está en login page, renderizar sin protección
  if (isLoginPage) {
    // Si ya tiene sesión de padre, mostrar loading mientras redirige
    if (session && session.user.role === "PARENT") {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    // Renderizar login page
    return <>{children}</>;
  }

  // Para páginas protegidas, mostrar loading mientras verifica
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si no hay sesión o no es PARENT, mostrar loading mientras redirige
  if (!session || session.user.role !== "PARENT") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Usuario PARENT autenticado: mostrar layout completo
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-cyan-50 via-teal-50 to-white">
      {/* Decorative Background Blurs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-16 top-20 h-56 w-56 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-cyan-200/25 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 h-48 w-48 rounded-full bg-teal-100/40 blur-2xl" />
        <div className="absolute -bottom-16 right-1/4 h-64 w-64 rounded-full bg-cyan-100/30 blur-3xl" />
      </div>

      {/* Floating Animated Bubbles */}
      <FloatingBubbles count={15} />

      <div className="relative z-10">
        <PortalNav />

        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-4 py-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/50 bg-white/50 py-6 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-lg font-bold text-transparent">
                Baby Spa
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Baby Spa.{" "}
              {t("common.footerTagline")}.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
