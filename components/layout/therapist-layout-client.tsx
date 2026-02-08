"use client";

import { Session } from "next-auth";
import { TherapistNav } from "@/components/layout/therapist-nav";
import { FloatingBubbles } from "@/components/ui/floating-bubbles";
import { ForcePasswordChange } from "@/components/auth/force-password-change";

interface TherapistLayoutClientProps {
  children: React.ReactNode;
  session: Session;
}

export function TherapistLayoutClient({ children, session: _session }: TherapistLayoutClientProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-cyan-50 via-teal-50 to-white">
      {/* Decorative Background Blurs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-12 top-16 h-48 w-48 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute -right-20 top-1/4 h-56 w-56 rounded-full bg-cyan-200/25 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 h-40 w-40 rounded-full bg-teal-100/40 blur-2xl" />
        <div className="absolute -bottom-12 right-1/3 h-52 w-52 rounded-full bg-cyan-100/30 blur-3xl" />
      </div>

      {/* Floating Animated Bubbles */}
      <FloatingBubbles count={12} />

      <div className="relative z-10">
        <TherapistNav />

        <ForcePasswordChange>
          <main className="flex-1">
            <div className="mx-auto max-w-4xl px-4 py-6">
              {children}
            </div>
          </main>
        </ForcePasswordChange>

        {/* Footer simple */}
        <footer className="border-t border-white/50 bg-white/50 py-4 text-center text-sm text-gray-500 backdrop-blur-sm">
          <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-medium text-transparent">
            Baby Spa
          </span>
          {" "}&copy; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
