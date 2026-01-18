"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  History,
  LogOut,
  Waves,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navigation = [
  { key: "dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { key: "appointments", href: "/portal/appointments", icon: Calendar },
  { key: "history", href: "/portal/history", icon: History },
];

export function PortalNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const t = useTranslations();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    const pathWithoutLocale = pathname.replace(/^\/(es|pt-BR)/, "");
    return pathWithoutLocale === href || pathWithoutLocale.startsWith(`${href}/`);
  };

  // No mostrar nav si no hay sesión o está cargando
  if (status === "loading" || !session) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/portal/dashboard" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-md">
            <Waves className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-nunito text-lg font-bold text-primary-700">
              Baby Spa
            </span>
            <span className="text-xs text-muted-foreground">
              {t("auth.loginAsParent")}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-primary-50 hover:text-primary-700"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{t(`nav.${item.key}`)}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info & logout (desktop) */}
        <div className="hidden items-center gap-4 md:flex">
          <div className="text-right">
            <p className="text-sm font-medium">{session?.user?.name}</p>
            <p className="text-xs text-muted-foreground">
              {t("auth.welcome")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/portal/login" })}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            {t("auth.logout")}
          </Button>
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-card px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{t(`nav.${item.key}`)}</span>
                </Link>
              );
            })}

            <hr className="my-2 border-border" />

            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm text-muted-foreground">
                {session?.user?.name}
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/portal/login" })}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                {t("auth.logout")}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
