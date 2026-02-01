"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, AlertTriangle, XCircle, CheckCircle } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  category: string | null;
  currentStock: number;
  minStock: number;
  costPrice: number;
  salePrice: number;
  status: "ok" | "low" | "out";
  lastMovementDate: string | null;
}

interface InventoryTableProps {
  items: InventoryItem[];
  locale: string;
}

const STATUS_STYLES = {
  ok: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    icon: CheckCircle,
  },
  low: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    icon: AlertTriangle,
  },
  out: {
    bg: "bg-rose-100",
    text: "text-rose-700",
    icon: XCircle,
  },
};

export function InventoryTable({ items, locale }: InventoryTableProps) {
  const t = useTranslations("reports.inventory");

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/50 bg-white/70 p-8 text-center shadow-lg backdrop-blur-md">
        <p className="text-gray-500">{t("noData")}</p>
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString(
      locale === "pt-BR" ? "pt-BR" : "es-BO",
      { day: "2-digit", month: "short" }
    );
  };

  return (
    <div className="rounded-2xl border border-white/50 bg-white/70 shadow-lg backdrop-blur-md">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-100">
            <TableHead className="text-gray-500">{t("product")}</TableHead>
            <TableHead className="text-gray-500">{t("category")}</TableHead>
            <TableHead className="text-center text-gray-500">{t("stock")}</TableHead>
            <TableHead className="text-center text-gray-500">{t("minStock")}</TableHead>
            <TableHead className="text-right text-gray-500">{t("costPrice")}</TableHead>
            <TableHead className="text-right text-gray-500">{t("salePrice")}</TableHead>
            <TableHead className="text-center text-gray-500">{t("status")}</TableHead>
            <TableHead className="text-gray-500">{t("lastMovement")}</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const statusStyle = STATUS_STYLES[item.status];
            const StatusIcon = statusStyle.icon;

            return (
              <TableRow
                key={item.id}
                className={cn(
                  "border-b border-gray-50",
                  item.status === "out" && "bg-rose-50/50",
                  item.status === "low" && "bg-amber-50/30"
                )}
              >
                <TableCell className="font-medium text-gray-900">
                  {item.name}
                </TableCell>
                <TableCell className="text-gray-600">
                  {item.category || "-"}
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn(
                    "font-semibold",
                    item.status === "out" && "text-rose-600",
                    item.status === "low" && "text-amber-600",
                    item.status === "ok" && "text-gray-900"
                  )}>
                    {item.currentStock}
                  </span>
                </TableCell>
                <TableCell className="text-center text-gray-500">
                  {item.minStock}
                </TableCell>
                <TableCell className="text-right text-gray-600">
                  {formatCurrency(item.costPrice, locale)}
                </TableCell>
                <TableCell className="text-right font-medium text-gray-900">
                  {formatCurrency(item.salePrice, locale)}
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                    statusStyle.bg,
                    statusStyle.text
                  )}>
                    <StatusIcon className="h-3 w-3" />
                    {t(`statuses.${item.status}`)}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(item.lastMovementDate)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <Link href={`/${locale}/admin/inventory`}>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
