"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  MessageSquare,
  Clock,
  BarChart3,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isOwner = session?.user?.role === "OWNER";

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  // Determine active tab
  const getActiveTab = () => {
    const pathWithoutLocale = pathname.replace(/^\/(es|pt-BR)/, "");
    if (pathWithoutLocale.includes("/messages/stats")) return "stats";
    return "pending";
  };

  const activeTab = getActiveTab();

  const tabs = [
    {
      key: "pending",
      href: "/admin/messages/pending",
      icon: Clock,
      label: "Pendientes",
      description: "WhatsApp por enviar",
      visible: true,
    },
    {
      key: "stats",
      href: "/admin/messages/stats",
      icon: BarChart3,
      label: "Métricas",
      description: "Estadísticas de email",
      visible: isOwner, // Solo OWNER
    },
  ];

  const visibleTabs = tabs.filter((t) => t.visible);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-white">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg shadow-green-200">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mensajes</h1>
            <p className="text-sm text-gray-500">
              Gestión de comunicaciones
            </p>
          </div>
        </div>

        {/* Navigation Tabs - Solo mostrar si hay más de 1 tab */}
        {visibleTabs.length > 1 && (
          <div className="mb-6 flex gap-2">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;

              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 transition-all",
                    isActive
                      ? "bg-white shadow-lg shadow-green-100 ring-2 ring-green-500"
                      : "bg-white/50 hover:bg-white hover:shadow-md"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      isActive
                        ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white"
                        : "bg-gray-100 text-gray-500"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="hidden sm:block">
                    <div
                      className={cn(
                        "font-semibold",
                        isActive ? "text-green-700" : "text-gray-700"
                      )}
                    >
                      {tab.label}
                    </div>
                    <div className="text-xs text-gray-500">{tab.description}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Content */}
        <div className="rounded-2xl border border-white/50 bg-white/70 shadow-lg shadow-green-500/10 backdrop-blur-md">
          {children}
        </div>
      </div>
    </div>
  );
}
