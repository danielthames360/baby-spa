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
import { ExternalLink, Phone, AlertTriangle } from "lucide-react";

interface ReceivableItem {
  id: string;
  babyId: string;
  babyName: string;
  parentName: string;
  parentPhone: string | null;
  packageName: string;
  totalPrice: number;
  paidAmount: number;
  pendingAmount: number;
  installmentsPending: number;
  isOverdue: boolean;
  createdAt: string;
}

interface ReceivablesTableProps {
  items: ReceivableItem[];
  locale: string;
}

export function ReceivablesTable({ items, locale }: ReceivablesTableProps) {
  const t = useTranslations("reports.receivables");

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/50 bg-white/70 p-8 text-center shadow-lg backdrop-blur-md">
        <p className="text-gray-500">{t("noData")}</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      locale === "pt-BR" ? "pt-BR" : "es-BO",
      { day: "2-digit", month: "short", year: "numeric" }
    );
  };

  return (
    <div className="rounded-2xl border border-white/50 bg-white/70 shadow-lg backdrop-blur-md">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-100">
            <TableHead className="text-gray-500">{t("client")}</TableHead>
            <TableHead className="text-gray-500">{t("package")}</TableHead>
            <TableHead className="text-right text-gray-500">{t("total")}</TableHead>
            <TableHead className="text-right text-gray-500">{t("paid")}</TableHead>
            <TableHead className="text-right text-gray-500">{t("pending")}</TableHead>
            <TableHead className="text-center text-gray-500">{t("installments")}</TableHead>
            <TableHead className="text-gray-500">{t("date")}</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className={cn(
                "border-b border-gray-50",
                item.isOverdue && "bg-rose-50/50"
              )}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  {item.isOverdue && (
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{item.babyName}</p>
                    <p className="text-sm text-gray-500">{item.parentName}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-gray-600">{item.packageName}</TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(item.totalPrice, locale)}
              </TableCell>
              <TableCell className="text-right text-emerald-600">
                {formatCurrency(item.paidAmount, locale)}
              </TableCell>
              <TableCell className={cn(
                "text-right font-semibold",
                item.isOverdue ? "text-rose-600" : "text-amber-600"
              )}>
                {formatCurrency(item.pendingAmount, locale)}
              </TableCell>
              <TableCell className="text-center">
                <span className={cn(
                  "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                  item.installmentsPending > 2
                    ? "bg-rose-100 text-rose-700"
                    : item.installmentsPending > 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                )}>
                  {item.installmentsPending} {t("pendingLabel")}
                </span>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatDate(item.createdAt)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {item.parentPhone && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <a href={`tel:${item.parentPhone}`}>
                        <Phone className="h-4 w-4 text-gray-400" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <Link href={`/${locale}/admin/clients/${item.babyId}`}>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
