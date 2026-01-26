"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { User, Phone, Mail, Baby, ChevronRight, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ParentCardProps {
  parent: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    status: string;
    pregnancyWeeks: number | null;
    babies: {
      baby: {
        id: string;
        name: string;
      };
    }[];
  };
  locale: string;
}

export function ParentCard({ parent, locale }: ParentCardProps) {
  const t = useTranslations("parents");

  const isLead = parent.status === "LEAD";
  const hasBabies = parent.babies.length > 0;

  return (
    <Link href={`/${locale}/admin/parents/${parent.id}`}>
      <Card className="group cursor-pointer rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg shadow-teal-500/10 backdrop-blur-md transition-all hover:border-teal-200 hover:shadow-xl hover:shadow-teal-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${
              isLead
                ? "bg-gradient-to-br from-pink-100 to-rose-100"
                : "bg-gradient-to-br from-teal-100 to-cyan-100"
            }`}>
              {isLead ? (
                <Heart className="h-7 w-7 text-pink-500" />
              ) : (
                <User className="h-7 w-7 text-teal-600" />
              )}
            </div>

            {/* Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-800">{parent.name}</h3>
                <Badge
                  variant="outline"
                  className={
                    isLead
                      ? "border-pink-200 bg-pink-50 text-pink-700"
                      : "border-teal-200 bg-teal-50 text-teal-700"
                  }
                >
                  {isLead ? t("status.lead") : t("status.active")}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                {parent.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {parent.phone}
                  </span>
                )}
                {parent.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {parent.email}
                  </span>
                )}
              </div>

              {/* Babies or pregnancy info */}
              <div className="flex items-center gap-2 text-sm">
                {hasBabies ? (
                  <span className="flex items-center gap-1 text-teal-600">
                    <Baby className="h-3.5 w-3.5" />
                    {parent.babies.map((b) => b.baby.name).join(", ")}
                  </span>
                ) : isLead && parent.pregnancyWeeks ? (
                  <span className="flex items-center gap-1 text-pink-600">
                    <Heart className="h-3.5 w-3.5" />
                    {parent.pregnancyWeeks} {t("fields.pregnancyWeeks").toLowerCase()}
                  </span>
                ) : (
                  <span className="text-gray-400">{t("babies.none")}</span>
                )}
              </div>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-teal-500" />
        </div>
      </Card>
    </Link>
  );
}
