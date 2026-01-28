"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es, ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Receipt,
  Home,
  Lightbulb,
  ShoppingBag,
  Wrench,
  Megaphone,
  FileText,
  Shield,
  Monitor,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Category icons mapping
const CATEGORY_ICONS = {
  RENT: Home,
  UTILITIES: Lightbulb,
  SUPPLIES: ShoppingBag,
  MAINTENANCE: Wrench,
  MARKETING: Megaphone,
  TAXES: FileText,
  INSURANCE: Shield,
  EQUIPMENT: Monitor,
  OTHER: MoreHorizontal,
} as const;

// Category colors mapping
const CATEGORY_COLORS = {
  RENT: "bg-purple-100 text-purple-800",
  UTILITIES: "bg-yellow-100 text-yellow-800",
  SUPPLIES: "bg-blue-100 text-blue-800",
  MAINTENANCE: "bg-orange-100 text-orange-800",
  MARKETING: "bg-pink-100 text-pink-800",
  TAXES: "bg-gray-100 text-gray-800",
  INSURANCE: "bg-green-100 text-green-800",
  EQUIPMENT: "bg-indigo-100 text-indigo-800",
  OTHER: "bg-slate-100 text-slate-800",
} as const;

interface Expense {
  id: string;
  category: keyof typeof CATEGORY_ICONS;
  description: string;
  amount: number;
  reference: string | null;
  expenseDate: string;
  createdAt: string;
  deletedAt: string | null;
  createdBy: {
    id: string;
    name: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ExpenseListProps {
  expenses: Expense[];
  pagination: Pagination;
  locale: string;
  emptyMessage: string;
}

export function ExpenseList({
  expenses,
  pagination,
  locale,
  emptyMessage,
}: ExpenseListProps) {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const dateLocale = locale === "pt-BR" ? ptBR : es;

  const handlePageChange = (newPage: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(newPage));
    router.push(url.pathname + url.search);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast.success(t("deleteSuccess"));
      router.refresh();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error(t("errors.deleteFailed"));
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "es-BO", {
      style: "currency",
      currency: locale === "pt-BR" ? "BRL" : "BOB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/50 bg-white/70 p-12 text-center shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <Receipt className="mb-4 h-12 w-12 text-gray-400" />
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.date")}</TableHead>
              <TableHead>{t("table.category")}</TableHead>
              <TableHead>{t("table.description")}</TableHead>
              <TableHead>{t("table.reference")}</TableHead>
              <TableHead className="text-right">{t("table.amount")}</TableHead>
              <TableHead className="text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => {
              const Icon = CATEGORY_ICONS[expense.category];
              const colorClass = CATEGORY_COLORS[expense.category];

              return (
                <TableRow key={expense.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(expense.expenseDate + "T12:00:00"), "dd/MM/yyyy", {
                      locale: dateLocale,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${colorClass} gap-1`}>
                      <Icon className="h-3 w-3" />
                      {t(`categories.${expense.category}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {expense.description}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {expense.reference || "-"}
                  </TableCell>
                  <TableCell className="text-right font-bold text-teal-600">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                          disabled={deletingId === expense.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("deleteConfirm.title")}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("deleteConfirm.description")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {tCommon("cancel")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(expense.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            {tCommon("delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {t("pagination.showing", {
              from: (pagination.page - 1) * pagination.limit + 1,
              to: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total,
            })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
