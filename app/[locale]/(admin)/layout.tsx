"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { FloatingBubbles } from "@/components/ui/floating-bubbles";
import { Loader2 } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const ALLOWED_ROLES = ["ADMIN", "RECEPTION", "THERAPIST"];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.replace("/login");
      return;
    }

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      // Si es PARENT, redirigir al portal
      if (session.user.role === "PARENT") {
        router.replace("/portal/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [session, status, router]);

  // Mostrar loading mientras verifica sesión
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No renderizar si no está autorizado
  if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-cyan-50 via-teal-50 to-white">
      {/* Decorative Background Blurs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-cyan-200/25 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-teal-100/40 blur-2xl" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-cyan-100/30 blur-3xl" />
      </div>

      {/* Floating Animated Bubbles */}
      <FloatingBubbles count={18} />

      {/* Desktop Sidebar */}
      <div className="relative z-10 hidden lg:flex">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <AdminSidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <AdminHeader onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
