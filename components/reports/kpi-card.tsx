"use client";

import { cn } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  Users,
  Baby,
  CalendarCheck,
  CalendarX,
  Package,
  AlertTriangle,
  ClipboardList,
  CreditCard,
  Percent,
  XCircle,
  CheckCircle,
  Clock,
  LucideIcon,
} from "lucide-react";

// Mapa de iconos por nombre
const ICON_MAP: Record<string, LucideIcon> = {
  DollarSign,
  TrendingUp,
  Users,
  Baby,
  CalendarCheck,
  CalendarX,
  Package,
  AlertTriangle,
  ClipboardList,
  CreditCard,
  Percent,
  XCircle,
  CheckCircle,
  Clock,
};

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

// Estilos pastel distintivos - más saturados para mejor diferenciación
const VARIANT_STYLES = {
  default: {
    cardBg: "bg-gradient-to-br from-teal-100/70 via-cyan-50/60 to-white",
    border: "border-l-teal-400",
    shadow: "shadow-teal-500/20",
    iconBg: "bg-gradient-to-br from-teal-200/80 to-cyan-200/80",
    iconColor: "text-teal-700",
    valueColor: "text-teal-700",
    decorationFrom: "from-teal-300/40",
    decorationTo: "to-cyan-300/40",
  },
  success: {
    cardBg: "bg-gradient-to-br from-emerald-100/70 via-green-50/60 to-white",
    border: "border-l-emerald-400",
    shadow: "shadow-emerald-500/20",
    iconBg: "bg-gradient-to-br from-emerald-200/80 to-green-200/80",
    iconColor: "text-emerald-700",
    valueColor: "text-emerald-700",
    decorationFrom: "from-emerald-300/40",
    decorationTo: "to-green-300/40",
  },
  warning: {
    cardBg: "bg-gradient-to-br from-amber-100/70 via-orange-50/60 to-white",
    border: "border-l-amber-500",
    shadow: "shadow-amber-500/20",
    iconBg: "bg-gradient-to-br from-amber-200/80 to-orange-200/80",
    iconColor: "text-amber-700",
    valueColor: "text-amber-700",
    decorationFrom: "from-amber-300/40",
    decorationTo: "to-orange-300/40",
  },
  danger: {
    cardBg: "bg-gradient-to-br from-rose-100/70 via-pink-50/60 to-white",
    border: "border-l-rose-400",
    shadow: "shadow-rose-500/20",
    iconBg: "bg-gradient-to-br from-rose-200/80 to-pink-200/80",
    iconColor: "text-rose-700",
    valueColor: "text-rose-700",
    decorationFrom: "from-rose-300/40",
    decorationTo: "to-pink-300/40",
  },
};

export function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  className,
}: KPICardProps) {
  const styles = VARIANT_STYLES[variant];
  const Icon = ICON_MAP[icon] || DollarSign;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/50 p-6 shadow-lg backdrop-blur-md",
        "border-l-4",
        styles.cardBg,
        styles.border,
        styles.shadow,
        className
      )}
    >
      {/* Background decoration con color del variant */}
      <div className={cn(
        "absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br",
        styles.decorationFrom,
        styles.decorationTo
      )} />
      <div className={cn(
        "absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-gradient-to-br opacity-50",
        styles.decorationFrom,
        styles.decorationTo
      )} />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={cn("text-3xl font-bold tracking-tight", styles.valueColor)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-400">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 text-sm">
              <span
                className={cn(
                  "font-medium",
                  trend.isPositive ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {trend.isPositive ? "+" : "-"}
                {Math.abs(trend.value)}%
              </span>
              <span className="text-gray-400">vs mes anterior</span>
            </div>
          )}
        </div>
        <div className={cn("rounded-xl p-3", styles.iconBg)}>
          <Icon className={cn("h-6 w-6", styles.iconColor)} />
        </div>
      </div>
    </div>
  );
}
