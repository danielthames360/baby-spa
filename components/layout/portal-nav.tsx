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
  CreditCard,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const baseNavigation = [
  { key: "dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { key: "appointments", href: "/portal/appointments", icon: Calendar },
  { key: "history", href: "/portal/history", icon: History },
];

interface NavItem {
  key: string;
  href: string;
  icon: typeof LayoutDashboard;
}

export function PortalNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const t = useTranslations();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [babyCardBabyId, setBabyCardBabyId] = useState<string | null>(null);

  // Check if user has any baby with active Baby Card
  useEffect(() => {
    const checkBabyCards = async () => {
      try {
        const response = await fetch("/api/portal/dashboard");
        if (response.ok) {
          const data = await response.json();
          const babyWithCard = data.babies?.find((b: { babyCard?: unknown }) => b.babyCard);
          if (babyWithCard) {
            setBabyCardBabyId(babyWithCard.id);
          }
        }
      } catch (error) {
        console.error("Error checking baby cards:", error);
      }
    };

    if (status === "authenticated") {
      checkBabyCards();
    }
  }, [status]);

  // Build navigation dynamically - include Baby Card link if available
  const navigation: NavItem[] = babyCardBabyId
    ? [
        baseNavigation[0],
        baseNavigation[1],
        { key: "babyCard", href: `/portal/baby-card/${babyCardBabyId}`, icon: CreditCard },
        baseNavigation[2],
      ]
    : baseNavigation;

  const isActive = (href: string) => {
    const pathWithoutLocale = pathname.replace(/^\/(es|pt-BR)/, "");
    return pathWithoutLocale === href || pathWithoutLocale.startsWith(`${href}/`);
  };

  // No mostrar nav si no hay sesión o está cargando
  if (status === "loading" || !session) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/50 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/portal/dashboard" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md shadow-teal-200">
            <Image
              src="/images/logoBabySpa.png"
              alt="Baby Spa"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-lg font-bold text-transparent">
              Baby Spa
            </span>
            <span className="text-xs text-gray-500">
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
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-200"
                    : "text-gray-600 hover:bg-teal-50 hover:text-teal-700"
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
            <p className="text-sm font-medium text-gray-700">{session?.user?.name}</p>
            <p className="text-xs text-teal-600">
              {t("auth.welcome")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: `${window.location.origin}/portal/login` })}
            className="gap-2 rounded-xl border-teal-200 text-teal-600 hover:bg-teal-50 hover:text-teal-700"
          >
            <LogOut className="h-4 w-4" />
            {t("auth.logout")}
          </Button>
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-teal-50 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5 text-teal-600" />
          ) : (
            <Menu className="h-5 w-5 text-teal-600" />
          )}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-white/50 bg-white/90 px-4 py-4 backdrop-blur-md md:hidden">
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
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-200"
                      : "text-gray-600 hover:bg-teal-50"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{t(`nav.${item.key}`)}</span>
                </Link>
              );
            })}

            <hr className="my-2 border-teal-100" />

            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm text-gray-600">
                {session?.user?.name}
              </span>
              <Button
                size="sm"
                onClick={() => signOut({ callbackUrl: `${window.location.origin}/portal/login` })}
                className="gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-200"
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
