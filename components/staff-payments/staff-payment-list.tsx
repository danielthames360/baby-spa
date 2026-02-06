"use client";

import { useTranslations } from "next-intl";
import { formatCurrency as formatCurrencyUtil } from "@/lib/utils/currency-utils";
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
  Banknote,
  ArrowDownCircle,
  ArrowUpCircle,
  Gift,
  Minus,
  Award,
  FileCheck,
  DollarSign,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Type icons mapping
const TYPE_ICONS = {
  SALARY: Banknote,
  COMMISSION: DollarSign,
  BONUS: Gift,
  ADVANCE: ArrowUpCircle,
  ADVANCE_RETURN: ArrowDownCircle,
  DEDUCTION: Minus,
  BENEFIT: Award,
  SETTLEMENT: FileCheck,
} as const;

// Type colors mapping - Green tones for income, Red tones for expenses
const TYPE_COLORS = {
  // Income types (green tones)
  SALARY: "bg-emerald-100 text-emerald-800",
  COMMISSION: "bg-green-100 text-green-800",
  BONUS: "bg-teal-100 text-teal-800",
  BENEFIT: "bg-cyan-100 text-cyan-800",
  SETTLEMENT: "bg-lime-100 text-lime-800",
  ADVANCE: "bg-amber-100 text-amber-800", // Special: income but creates debt
  // Expense types (red tones)
  DEDUCTION: "bg-red-100 text-red-800",
  ADVANCE_RETURN: "bg-rose-100 text-rose-800",
} as const;

interface StaffMember {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
  payFrequency: string;
  advanceBalance: number;
}

interface StaffPayment {
  id: string;
  staffId: string;
  type: keyof typeof TYPE_ICONS;
  status: "PENDING" | "PAID";
  grossAmount: number;
  netAmount: number;
  advanceDeducted: number | null;
  description: string;
  periodStart: string | null;
  periodEnd: string | null;
  movementDate: string | null;
  paidAt: string | null;
  createdAt: string;
  deletedAt: string | null;
  staff: {
    id: string;
    name: string;
    baseSalary: number | null;
    payFrequency: string;
  };
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

interface StaffPaymentListProps {
  payments: StaffPayment[];
  pagination: Pagination;
  locale: string;
  emptyMessage: string;
  staffList: StaffMember[];
}

export function StaffPaymentList({
  payments,
  pagination,
  locale,
  emptyMessage,
}: StaffPaymentListProps) {
  const t = useTranslations("staffPayments");
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
      const response = await fetch(`/api/staff-payments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast.success(t("deleteSuccess"));
      router.refresh();
    } catch (error) {
      console.error("Error deleting payment:", error);
      if (error instanceof Error) {
        switch (error.message) {
          case "CANNOT_DELETE_PAYMENT_WITH_SUBSEQUENT_ADVANCE_ACTIVITY":
            toast.error(t("errors.cannotDeleteWithSubsequentActivity"));
            break;
          case "CANNOT_DELETE_MOVEMENT_INCLUDED_IN_SALARY":
            toast.error(t("errors.cannotDeleteIncludedMovement"));
            break;
          default:
            toast.error(t("errors.deleteFailed"));
        }
      } else {
        toast.error(t("errors.deleteFailed"));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (amount: number) => formatCurrencyUtil(amount, locale);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: dateLocale });
  };

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/50 bg-white/70 p-12 text-center shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <Banknote className="mb-4 h-12 w-12 text-gray-400" />
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
              <TableHead>{t("table.staff")}</TableHead>
              <TableHead>{t("table.type")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead>{t("table.description")}</TableHead>
              <TableHead className="text-right">{t("table.amount")}</TableHead>
              <TableHead className="text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => {
              const Icon = TYPE_ICONS[payment.type];
              const colorClass = TYPE_COLORS[payment.type];
              const isNegative = payment.grossAmount < 0;
              const displayDate = payment.movementDate || payment.paidAt || payment.createdAt;

              return (
                <TableRow key={payment.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(displayDate)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {payment.staff.name}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${colorClass} gap-1`}>
                      <Icon className="h-3 w-3" />
                      {t(`types.${payment.type}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payment.status === "PENDING" ? (
                      <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-700">
                        <Clock className="h-3 w-3" />
                        {t("status.PENDING")}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 border-green-300 bg-green-50 text-green-700">
                        <CheckCircle2 className="h-3 w-3" />
                        {t("status.PAID")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {payment.description}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${isNegative ? "text-red-600" : "text-teal-600"}`}>
                    {isNegative ? "" : "+"}{formatCurrency(payment.grossAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                          disabled={deletingId === payment.id}
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
                            {payment.type === "SALARY"
                              ? t("deleteConfirm.salaryDescription")
                              : t("deleteConfirm.description")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {tCommon("cancel")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(payment.id)}
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
