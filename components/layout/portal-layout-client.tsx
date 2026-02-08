"use client";

import { Session } from "next-auth";
import { useTranslations } from "next-intl";
import { PortalNav } from "@/components/layout/portal-nav";
import { FloatingBubbles } from "@/components/ui/floating-bubbles";

interface PortalLayoutClientProps {
  children: React.ReactNode;
  session: Session;
}

export function PortalLayoutClient({ children, session: _session }: PortalLayoutClientProps) {
  const t = useTranslations();

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-cyan-50 via-teal-50 to-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-16 top-20 h-56 w-56 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-cyan-200/25 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 h-48 w-48 rounded-full bg-teal-100/40 blur-2xl" />
        <div className="absolute -bottom-16 right-1/4 h-64 w-64 rounded-full bg-cyan-100/30 blur-3xl" />
      </div>

      <FloatingBubbles count={15} />

      <div className="relative z-10">
        <PortalNav />

        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-4 py-6 pb-24 md:pb-6">
            {children}
          </div>
        </main>

        <footer className="hidden md:block border-t border-white/50 bg-white/50 py-6 backdrop-blur-sm">
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
