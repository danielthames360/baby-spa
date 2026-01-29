"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  History,
  LogOut,
  User,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Navigation items - 5 items for clean bottom bar
const NAV_ITEMS = [
  { key: "dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { key: "appointments", href: "/portal/appointments", icon: Calendar },
  { key: "history", href: "/portal/history", icon: History },
  { key: "account", href: "/portal/account", icon: Wallet },
  { key: "profile", href: "/portal/profile", icon: User },
];

export function PortalNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const t = useTranslations();

  const isActive = (href: string) => {
    const pathWithoutLocale = pathname.replace(/^\/(es|pt-BR)/, "");
    return pathWithoutLocale === href || pathWithoutLocale.startsWith(`${href}/`);
  };

  // Don't show nav while loading or if no session
  if (status === "loading" || !session) {
    return null;
  }

  const userName = session?.user?.name?.split(" ")[0] || "Usuario";

  return (
    <>
      {/* ============================================= */}
      {/* TOP HEADER - Logo + Desktop Nav + User       */}
      {/* ============================================= */}
      <header className="sticky top-0 z-50 border-b border-white/50 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/portal/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md shadow-teal-200">
              <Image
                src="/images/logoBabySpa.png"
                alt="Baby Spa"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            </div>
            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-lg font-bold text-transparent">
              Baby Spa
            </span>
          </Link>

          {/* Desktop: Centered Navigation */}
          <nav className="hidden md:flex items-center justify-center flex-1 gap-1 px-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-200/50"
                      : "text-gray-600 hover:bg-teal-50 hover:text-teal-700"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{t(`nav.${item.key}`)}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop: Logout button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: `${window.location.origin}/portal/login` })}
            className="hidden md:flex text-gray-400 hover:text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" />
          </Button>

          {/* Mobile: User greeting */}
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-sm text-gray-500">{t("common.hello")},</span>
            <span className="text-sm font-semibold text-teal-700">{userName}</span>
          </div>
        </div>
      </header>

      {/* ============================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR                 */}
      {/* ============================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/50 bg-white/90 backdrop-blur-lg md:hidden safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 min-w-[60px] transition-all",
                  active
                    ? "text-teal-600"
                    : "text-gray-400 hover:text-teal-500"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                    active && "bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-300/50"
                  )}
                >
                  <Icon className={cn("h-5 w-5", !active && "text-current")} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  active ? "text-teal-700" : "text-gray-500"
                )}>
                  {t(`nav.${item.key}`)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
