"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { PortalNav } from "@/components/layout/portal-nav";
import { Loader2 } from "lucide-react";

interface PortalLayoutProps {
  children: React.ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  const { data: session, status } = useSession();
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
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-primary-50/50 to-background">
      <PortalNav />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-6">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-primary-600">
            <span className="font-nunito text-lg font-bold">Baby Spa</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Baby Spa.
            Hidroterapia y estimulación temprana para bebés.
          </p>
        </div>
      </footer>
    </div>
  );
}
