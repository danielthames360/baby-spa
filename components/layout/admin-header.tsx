"use client";

import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { data: session } = useSession();
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const roleLabel = session?.user?.role
    ? t(`roles.${session.user.role.toLowerCase()}`)
    : "";

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/50 bg-white/70 px-4 backdrop-blur-md lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-teal-50 lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5 text-teal-600" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Spacer for desktop */}
      <div className="hidden lg:block" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <NotificationBell />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-teal-50">
              <Avatar className="h-8 w-8 ring-2 ring-teal-200 ring-offset-2">
                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-500 text-sm text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start text-left md:flex">
                <span className="text-sm font-medium text-gray-700">
                  {session?.user?.name}
                </span>
                <span className="text-xs text-teal-600">
                  {roleLabel}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-white/50 bg-white/90 backdrop-blur-md">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-gray-700">{session?.user?.name}</p>
                <p className="text-xs text-gray-500">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-teal-100" />
            <Link href={`/${locale}/admin/profile`}>
              <DropdownMenuItem className="cursor-pointer rounded-lg hover:bg-teal-50">
                <User className="mr-2 h-4 w-4 text-teal-600" />
                {t("nav.profile")}
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator className="bg-teal-100" />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
              className="cursor-pointer rounded-lg text-rose-600 hover:bg-rose-50 focus:text-rose-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("auth.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
