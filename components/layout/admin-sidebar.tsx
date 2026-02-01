"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Baby,
  UserRound,
  Package,
  Settings,
  Warehouse,
  CreditCard,
  Receipt,
  PartyPopper,
  ChevronLeft,
  IdCard,
  History,
  BarChart3,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserRole } from "@prisma/client";
import {
  hasPermission,
  Permission,
  MAIN_NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
} from "@/lib/permissions";

// Mapa de iconos por nombre
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Calendar,
  Users,
  Baby,
  UserRound,
  Package,
  Settings,
  Warehouse,
  CreditCard,
  Receipt,
  PartyPopper,
  IdCard,
  History,
  BarChart3,
};

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  userRole: UserRole;
}

export function AdminSidebar({
  collapsed,
  onToggle,
  userRole,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const isActive = (href: string) => {
    // Remove locale prefix for comparison
    const pathWithoutLocale = pathname.replace(/^\/(es|pt-BR)/, "");
    return (
      pathWithoutLocale === href || pathWithoutLocale.startsWith(`${href}/`)
    );
  };

  // Filtrar items según permisos del rol
  const filteredMainNav = MAIN_NAV_ITEMS.filter((item) =>
    item.requiredPermissions.some((p: Permission) => hasPermission(userRole, p))
  );

  const filteredSecondaryNav = SECONDARY_NAV_ITEMS.filter((item) =>
    item.requiredPermissions.some((p: Permission) => hasPermission(userRole, p))
  );

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-white/50 bg-white/70 backdrop-blur-md transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md shadow-teal-200">
            <Image
              src="/images/logoBabySpa.png"
              alt="Baby Spa"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
          </div>
          {!collapsed && (
            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-xl font-bold text-transparent">
              Baby Spa
            </span>
          )}
        </Link>
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 hover:bg-teal-50"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 text-teal-600 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        )}
      </div>

      <Separator className="bg-gradient-to-r from-transparent via-teal-200 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {filteredMainNav.map((item) => {
          const Icon = ICON_MAP[item.icon] || LayoutDashboard;
          const active = isActive(item.href);

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-200"
                  : "text-gray-600 hover:bg-teal-50 hover:text-teal-700",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? t(item.key) : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{t(item.key)}</span>}
            </Link>
          );
        })}

        {filteredSecondaryNav.length > 0 && (
          <>
            <Separator className="my-4 bg-gradient-to-r from-transparent via-teal-200 to-transparent" />

            {filteredSecondaryNav.map((item) => {
              const Icon = ICON_MAP[item.icon] || Settings;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-200"
                      : "text-gray-600 hover:bg-teal-50 hover:text-teal-700",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? t(item.key) : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{t(item.key)}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}
