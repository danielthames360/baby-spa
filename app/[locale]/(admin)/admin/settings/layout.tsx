"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Settings,
  CreditCard,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("settings");

  const isOwner = session?.user?.role === "OWNER";

  const SETTINGS_TABS = [
    {
      key: "general",
      href: "/admin/settings",
      icon: CreditCard,
      label: t("tabs.general"),
      description: t("tabs.generalDescription"),
    },
    {
      key: "templates",
      href: "/admin/settings/messages",
      icon: FileText,
      label: t("tabs.templates"),
      description: t("tabs.templatesDescription"),
    },
  ];

  // Redirect non-OWNER users
  useEffect(() => {
    if (status === "authenticated" && !isOwner) {
      router.replace("/admin/dashboard");
    }
  }, [status, isOwner, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  // Determine active tab
  const getActiveTab = () => {
    const pathWithoutLocale = pathname.replace(/^\/(es|pt-BR)/, "");
    if (pathWithoutLocale === "/admin/settings") return "general";
    if (pathWithoutLocale === "/admin/settings/messages") return "templates";
    if (pathWithoutLocale === "/admin/settings/messages/stats") return "stats";
    return "general";
  };

  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-white">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-200">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t("title")}</h1>
            <p className="text-sm text-gray-500">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 transition-all",
                  isActive
                    ? "bg-white shadow-lg shadow-teal-100 ring-2 ring-teal-500"
                    : "bg-white/50 hover:bg-white hover:shadow-md"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    isActive
                      ? "bg-gradient-to-br from-teal-500 to-cyan-500 text-white"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="hidden sm:block">
                  <div
                    className={cn(
                      "font-semibold",
                      isActive ? "text-teal-700" : "text-gray-700"
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

        {/* Content */}
        <div className="rounded-2xl border border-white/50 bg-white/70 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          {children}
        </div>
      </div>
    </div>
  );
}
