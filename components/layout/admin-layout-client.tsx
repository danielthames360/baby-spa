"use client";

import { useState, useCallback } from "react";
import { Session } from "next-auth";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { FloatingBubbles } from "@/components/ui/floating-bubbles";
import { NotificationToastContainer } from "@/components/notifications/notification-toast-container";
import { ForcePasswordChange } from "@/components/auth/force-password-change";
import { UserRole } from "@prisma/client";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  session: Session;
}

export function AdminLayoutClient({ children, session }: AdminLayoutClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const handleMenuClick = useCallback(() => {
    setMobileMenuOpen(true);
  }, []);

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
          onToggle={handleToggleSidebar}
          userRole={session.user.role as UserRole}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <AdminSidebar userRole={session.user.role as UserRole} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <AdminHeader onMenuClick={handleMenuClick} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <ForcePasswordChange>
            {children}
          </ForcePasswordChange>
        </main>
      </div>

      {/* Toast Notifications */}
      <NotificationToastContainer />
    </div>
  );
}
