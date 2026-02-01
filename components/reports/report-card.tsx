"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  CreditCard,
  CalendarX,
  Package,
  ClipboardList,
  ArrowRight,
  LucideIcon,
} from "lucide-react";

// Mapa de iconos por nombre
const ICON_MAP: Record<string, LucideIcon> = {
  TrendingUp,
  CreditCard,
  CalendarX,
  Package,
  ClipboardList,
};

interface ReportCardProps {
  title: string;
  description: string;
  href: string;
  icon: string;
  stats?: {
    label: string;
    value: string | number;
  };
  variant?: "default" | "warning" | "danger";
  disabled?: boolean;
}

const VARIANT_STYLES = {
  default: {
    cardBg: "bg-gradient-to-br from-teal-50/80 via-white/70 to-cyan-50/60",
    iconBg: "bg-gradient-to-br from-teal-200/80 to-cyan-200/80",
    iconColor: "text-teal-700",
    hoverBorder: "hover:border-teal-300",
    decoration: "from-teal-200/40 to-cyan-200/40",
  },
  warning: {
    cardBg: "bg-gradient-to-br from-amber-50/80 via-white/70 to-orange-50/60",
    iconBg: "bg-gradient-to-br from-amber-200/80 to-orange-200/80",
    iconColor: "text-amber-700",
    hoverBorder: "hover:border-amber-300",
    decoration: "from-amber-200/40 to-orange-200/40",
  },
  danger: {
    cardBg: "bg-gradient-to-br from-rose-50/80 via-white/70 to-pink-50/60",
    iconBg: "bg-gradient-to-br from-rose-200/80 to-pink-200/80",
    iconColor: "text-rose-700",
    hoverBorder: "hover:border-rose-300",
    decoration: "from-rose-200/40 to-pink-200/40",
  },
};

export function ReportCard({
  title,
  description,
  href,
  icon,
  stats,
  variant = "default",
  disabled = false,
}: ReportCardProps) {
  const styles = VARIANT_STYLES[variant];
  const Icon = ICON_MAP[icon] || TrendingUp;

  const content = (
    <div
      className={cn(
        "group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/50 p-6 shadow-lg backdrop-blur-md transition-all duration-200",
        styles.cardBg,
        !disabled && styles.hoverBorder,
        !disabled && "hover:shadow-xl cursor-pointer",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      {/* Decoración de fondo */}
      <div className={cn(
        "absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-60",
        styles.decoration
      )} />

      <div className="relative flex items-start justify-between">
        <div className={cn("rounded-xl p-3", styles.iconBg)}>
          <Icon className={cn("h-6 w-6", styles.iconColor)} />
        </div>
        {!disabled && (
          <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-teal-500" />
        )}
      </div>

      <div className="space-y-1">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      {stats && (
        <div className="mt-auto border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500">{stats.label}</p>
          <p className="text-lg font-semibold text-gray-900">{stats.value}</p>
        </div>
      )}
    </div>
  );

  if (disabled) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}
