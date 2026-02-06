"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { LogOut, User } from "lucide-react";
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

export function TherapistNav() {
  const { data: session } = useSession();
  const t = useTranslations();

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "T";

  return (
    <header className="border-b border-white/50 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/therapist/today" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md shadow-teal-200">
            <Image
              src="/images/logoBabySpa.png"
              alt="Baby Spa"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
          </div>
          <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-xl font-bold text-transparent">
            Baby Spa
          </span>
        </Link>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-teal-50">
              <Avatar className="h-8 w-8 ring-2 ring-teal-200 ring-offset-2">
                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-500 text-sm text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-white/50 bg-white/90 backdrop-blur-md">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-gray-700">{session?.user?.name}</p>
                <p className="text-xs text-teal-600">
                  {t("roles.therapist")}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-teal-100" />
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg hover:bg-teal-50">
              <Link href="/therapist/profile">
                <User className="mr-2 h-4 w-4 text-teal-600" />
                {t("nav.profile")}
              </Link>
            </DropdownMenuItem>
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
