"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Baby, Phone, Calendar, Package, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateExactAge, formatAgeShort } from "@/lib/utils/age";

interface BabyCardProps {
  baby: {
    id: string;
    name: string;
    birthDate: Date | string;
    gender: string;
    isActive: boolean;
    parents: {
      relationship: string;
      isPrimary: boolean;
      parent: {
        id: string;
        name: string;
        phone: string;
      };
    }[];
    packagePurchases: {
      remainingSessions: number;
      isActive: boolean;
      package: {
        name: string;
        namePortuguese: string | null;
      };
    }[];
    _count: {
      sessions: number;
    };
  };
  locale?: string;
}

export function BabyCard({ baby, locale = "es" }: BabyCardProps) {
  const t = useTranslations();

  const primaryParent = baby.parents.find((p) => p.isPrimary)?.parent ||
    baby.parents[0]?.parent;

  const activePackage = baby.packagePurchases.find(
    (p) => p.isActive && p.remainingSessions > 0
  );

  const ageResult = calculateExactAge(baby.birthDate);
  const age = formatAgeShort(ageResult, t);

  return (
    <Link href={`/${locale}/admin/clients/${baby.id}`}>
      <Card className="group cursor-pointer rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg shadow-teal-500/10 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/20">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
            <Baby className="h-7 w-7 text-teal-600" />
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-lg font-semibold text-gray-800">
                {baby.name}
              </h3>
              <Badge
                variant="outline"
                className="rounded-full border-teal-200 bg-teal-50 text-xs text-teal-700"
              >
                {age}
              </Badge>
            </div>

            {primaryParent && (
              <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                <span className="truncate">{primaryParent.name}</span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {primaryParent.phone}
                </span>
              </div>
            )}

            <div className="mt-2 flex items-center gap-2">
              {activePackage ? (
                <Badge className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-xs text-white shadow-sm">
                  <Package className="mr-1 h-3 w-3" />
                  {activePackage.remainingSessions} {t("common.sessionsUnit")}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="rounded-full border-amber-200 bg-amber-50 text-xs text-amber-700"
                >
                  {t("baby.noPackage")}
                </Badge>
              )}

              {baby._count.sessions > 0 && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="h-3 w-3" />
                  {baby._count.sessions} {t("session.title").toLowerCase()}
                </span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-300 transition-colors group-hover:text-teal-500" />
        </div>
      </Card>
    </Link>
  );
}
