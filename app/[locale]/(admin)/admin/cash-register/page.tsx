"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CircleDollarSign,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  Loader2,
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CashRegisterStatus } from "@prisma/client";

// ============================================================
// TYPES
// ============================================================

interface CashRegisterExpense {
  id: string;
  amount: number;
  category: string;
  description: string;
  createdAt: string;
  createdBy: { id: string; name: string };
}

interface PaymentDetail {
  id: string;
  amount: number;
  parentType: string;
  parentId: string;
  paymentMethod: string;
  createdAt: string;
}

interface PaymentMethodSummary {
  total: number;
  count: number;
}

interface CashRegisterData {
  id: string;
  openedById: string;
  openedBy: { id: string; name: string };
  openedAt: string;
  initialFund: number;
  closedAt: string | null;
  declaredAmount: number | null;
  expectedAmount: number | null;
  difference: number | null;
  closingNotes: string | null;
  status: CashRegisterStatus;
  reviewedById: string | null;
  reviewedBy: { id: string; name: string } | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  forcedCloseById: string | null;
  forcedCloseBy: { id: string; name: string } | null;
  forcedCloseNotes: string | null;
  expenses: CashRegisterExpense[];
  expensesTotal: number;
  cashIncome?: number;
  // All payments during shift
  allPayments?: PaymentDetail[];
  allPaymentsTotal?: number;
  paymentsByMethod?: Record<string, PaymentMethodSummary>;
}

// ============================================================
// CONSTANTS
// ============================================================

const STATUS_CONFIG = {
  OPEN: {
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: Clock,
    label: "Abierta",
  },
  CLOSED: {
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: AlertTriangle,
    label: "Pendiente",
  },
  APPROVED: {
    color: "bg-sky-100 text-sky-700 border-sky-200",
    icon: CheckCircle2,
    label: "Aprobada",
  },
  FORCE_CLOSED: {
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: Lock,
    label: "Cerrada Forzada",
  },
};

const PAYMENT_METHOD_ICONS: Record<string, React.ElementType> = {
  CASH: Banknote,
  CARD: CreditCard,
  QR: QrCode,
  TRANSFER: Building,
};

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  SUPPLIES: "Insumos",
  FOOD: "Comida/Refrigerios",
  TRANSPORT: "Transporte",
  BANK_DEPOSIT: "Depósito a banco",
  OTHER: "Otro",
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function CashRegisterPage() {
  const t = useTranslations("cashRegister");
  const [cashRegisters, setCashRegisters] = useState<CashRegisterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [filter, setFilter] = useState<"pending" | "today" | "week" | "month" | "all">("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Force close modal state
  const [forceCloseModalOpen, setForceCloseModalOpen] = useState(false);
  const [forceClosingId, setForceClosingId] = useState<string | null>(null);
  const [forceCloseNotes, setForceCloseNotes] = useState("");

  // Fetch cash registers
  const fetchCashRegisters = useCallback(async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams();

      if (filter === "pending") {
        params.set("status", "CLOSED");
      } else if (filter !== "all") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filter === "today") {
          params.set("fromDate", today.toISOString());
        } else if (filter === "week") {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          params.set("fromDate", weekAgo.toISOString());
        } else if (filter === "month") {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          params.set("fromDate", monthAgo.toISOString());
        }
      }

      const response = await fetch(`/api/cash-register?${params.toString()}`);
      if (!response.ok) throw new Error("Error fetching");

      const data = await response.json();
      setCashRegisters(data.data || []);
      setPendingCount(data.pendingCount || 0);
    } catch (error) {
      console.error("Error fetching cash registers:", error);
      toast.error("Error al cargar los arqueos");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchCashRegisters();
  }, [fetchCashRegisters]);

  // Fetch detail when expanding
  const fetchDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/cash-register/${id}`);
      if (!response.ok) throw new Error("Error fetching detail");

      const detail = await response.json();

      // Update the cash register in the list with full details
      setCashRegisters(prev =>
        prev.map(cr => cr.id === id ? { ...cr, ...detail } : cr)
      );
    } catch (error) {
      console.error("Error fetching detail:", error);
    }
  };

  const handleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      fetchDetail(id);
    }
  };

  // Review (approve)
  const handleReview = async (withNotes: boolean) => {
    if (!reviewingId) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/cash-register/${reviewingId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNotes: withNotes ? reviewNotes : undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al aprobar");
      }

      toast.success(t("admin.reviewModal.success"));
      setReviewModalOpen(false);
      setReviewingId(null);
      setReviewNotes("");
      fetchCashRegisters();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.reviewModal.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Force close
  const handleForceClose = async () => {
    if (!forceClosingId || !forceCloseNotes.trim()) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/cash-register/${forceClosingId}/force-close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forcedCloseNotes: forceCloseNotes }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al forzar cierre");
      }

      toast.success(t("admin.forceCloseModal.success"));
      setForceCloseModalOpen(false);
      setForceClosingId(null);
      setForceCloseNotes("");
      fetchCashRegisters();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.forceCloseModal.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReviewModal = (id: string) => {
    setReviewingId(id);
    setReviewNotes("");
    setReviewModalOpen(true);
  };

  const openForceCloseModal = (id: string) => {
    setForceClosingId(id);
    setForceCloseNotes("");
    setForceCloseModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-3 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-3xl font-bold text-transparent">
          <CircleDollarSign className="h-8 w-8 text-teal-600" />
          {t("admin.title")}
        </h1>
        <p className="mt-1 text-gray-600">{t("admin.subtitle")}</p>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="bg-white/70">
          <TabsTrigger value="pending" className="gap-2">
            {pendingCount > 0 && (
              <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
                {pendingCount}
              </Badge>
            )}
            {t("admin.pending")}
          </TabsTrigger>
          <TabsTrigger value="today">{t("admin.today")}</TabsTrigger>
          <TabsTrigger value="week">{t("admin.thisWeek")}</TabsTrigger>
          <TabsTrigger value="month">{t("admin.thisMonth")}</TabsTrigger>
          <TabsTrigger value="all">{t("admin.all")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      ) : cashRegisters.length === 0 ? (
        <Card className="border-white/50 bg-white/70 backdrop-blur-md">
          <CardContent className="py-12 text-center text-gray-500">
            {t("admin.noRecords")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {cashRegisters.map((cr) => (
            <CashRegisterCard
              key={cr.id}
              data={cr}
              isExpanded={expandedId === cr.id}
              onToggle={() => handleExpand(cr.id)}
              onApprove={() => openReviewModal(cr.id)}
              onForceClose={() => openForceCloseModal(cr.id)}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.reviewModal.title")}</DialogTitle>
            <DialogDescription>
              {cashRegisters.find(cr => cr.id === reviewingId)?.difference !== 0 && (
                <span className="text-amber-600">
                  Diferencia: Bs {cashRegisters.find(cr => cr.id === reviewingId)?.difference?.toFixed(2)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("admin.reviewModal.note")}</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={t("admin.reviewModal.notePlaceholder")}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => handleReview(!!reviewNotes.trim())}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-teal-500 to-cyan-500"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("admin.reviewModal.approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force Close Modal */}
      <Dialog open={forceCloseModalOpen} onOpenChange={setForceCloseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              {t("admin.forceCloseModal.title")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.forceCloseModal.warning")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("admin.forceCloseModal.noteRequired")} *</Label>
              <Textarea
                value={forceCloseNotes}
                onChange={(e) => setForceCloseNotes(e.target.value)}
                placeholder={t("admin.forceCloseModal.notePlaceholder")}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setForceCloseModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleForceClose}
              disabled={isSubmitting || !forceCloseNotes.trim()}
              variant="destructive"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("admin.forceCloseModal.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// CASH REGISTER CARD COMPONENT
// ============================================================

interface CashRegisterCardProps {
  data: CashRegisterData;
  isExpanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onForceClose: () => void;
  t: ReturnType<typeof useTranslations<"cashRegister">>;
}

function CashRegisterCard({
  data,
  isExpanded,
  onToggle,
  onApprove,
  onForceClose,
  t,
}: CashRegisterCardProps) {
  const statusConfig = STATUS_CONFIG[data.status];
  const StatusIcon = statusConfig.icon;

  const openedDate = new Date(data.openedAt);
  const closedDate = data.closedAt ? new Date(data.closedAt) : null;

  // Calculate hours open for OPEN status
  const hoursOpen = data.status === "OPEN"
    ? Math.floor((Date.now() - openedDate.getTime()) / (1000 * 60 * 60))
    : null;

  // Use pre-calculated payment data from service
  const paymentsByMethod = data.paymentsByMethod || {};
  const totalAllPayments = data.allPaymentsTotal || 0;

  return (
    <Card className="overflow-hidden border-white/50 bg-white/70 backdrop-blur-md">
      {/* Header */}
      <CardHeader
        className="cursor-pointer pb-2 hover:bg-white/50"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-semibold">
                {format(openedDate, "dd/MM/yyyy", { locale: es })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-4 w-4" />
              <span>{data.openedBy.name}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                {format(openedDate, "HH:mm")}
                {closedDate && ` - ${format(closedDate, "HH:mm")}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className={cn("gap-1", statusConfig.color)}>
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
            </Badge>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Quick summary for non-expanded state */}
        {!isExpanded && data.status !== "OPEN" && (
          <div className="mt-2 flex items-center gap-6 text-sm text-gray-600">
            {data.difference !== null && (
              <span className={cn(
                "font-medium",
                data.difference === 0 ? "text-emerald-600" :
                data.difference > 0 ? "text-sky-600" : "text-amber-600"
              )}>
                Diferencia: {data.difference >= 0 ? "+" : ""}Bs {data.difference.toFixed(2)}
              </span>
            )}
            {data.status === "APPROVED" && data.reviewNotes === "Auto-aprobado (diferencia = 0)" && (
              <span className="text-gray-500">Auto-aprobado</span>
            )}
          </div>
        )}

        {/* Warning for long-open registers */}
        {data.status === "OPEN" && hoursOpen !== null && hoursOpen > 10 && (
          <div className="mt-2 flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">
              {t("admin.hoursOpen", { hours: hoursOpen })}
            </span>
          </div>
        )}
      </CardHeader>

      {/* Expanded content */}
      {isExpanded && (
        <CardContent className="space-y-6 border-t border-gray-100 pt-4">
          {/* ================================================== */}
          {/* RESUMEN DEL TURNO - Todos los métodos de pago */}
          {/* ================================================== */}
          {Object.keys(paymentsByMethod).length > 0 && (
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <Receipt className="h-5 w-5 text-teal-600" />
                Resumen del Turno
              </h4>

              {/* Payment method cards */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(paymentsByMethod).map(([method, { total, count }]) => {
                  const Icon = PAYMENT_METHOD_ICONS[method] || CreditCard;
                  const methodLabels: Record<string, { label: string; bg: string; border: string; text: string }> = {
                    CASH: { label: "Efectivo", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
                    CARD: { label: "Tarjeta", bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700" },
                    QR: { label: "QR / PIX", bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
                    TRANSFER: { label: "Transferencia", bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700" },
                  };
                  const style = methodLabels[method] || methodLabels.CASH;

                  return (
                    <div
                      key={method}
                      className={cn(
                        "rounded-xl border p-4 transition-all hover:shadow-md",
                        style.bg, style.border
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("rounded-lg p-2", style.bg)}>
                            <Icon className={cn("h-5 w-5", style.text)} />
                          </div>
                          <div>
                            <p className={cn("text-sm font-medium", style.text)}>
                              {style.label}
                            </p>
                            <p className="text-xs text-gray-500">
                              {count} {count === 1 ? "transacción" : "transacciones"}
                            </p>
                          </div>
                        </div>
                        <p className={cn("text-lg font-bold", style.text)}>
                          Bs {total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total cobrado */}
              <div className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 p-4 text-white shadow-lg shadow-teal-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-teal-100">Total Cobrado en el Turno</p>
                    <p className="text-xs text-teal-200">
                      {data.allPayments?.length || 0} transacciones
                    </p>
                  </div>
                  <p className="text-2xl font-bold">
                    Bs {totalAllPayments.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* DETALLE DE TRANSACCIONES */}
          {/* ================================================== */}
          {data.allPayments && data.allPayments.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 font-semibold text-gray-700">
                <CreditCard className="h-4 w-4 text-gray-500" />
                Detalle de Cobros ({data.allPayments.length})
              </h4>
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                {data.allPayments.map((payment) => {
                  const Icon = PAYMENT_METHOD_ICONS[payment.paymentMethod] || CreditCard;
                  const methodColors: Record<string, string> = {
                    CASH: "text-emerald-600 bg-emerald-100",
                    CARD: "text-sky-600 bg-sky-100",
                    QR: "text-purple-600 bg-purple-100",
                    TRANSFER: "text-violet-600 bg-violet-100",
                  };
                  const colorClass = methodColors[payment.paymentMethod] || methodColors.CASH;

                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-lg bg-white p-2.5 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-12 text-xs font-medium text-gray-400">
                          {format(new Date(payment.createdAt), "HH:mm")}
                        </span>
                        <Badge className={cn("text-xs", colorClass)}>
                          <Icon className="mr-1 h-3 w-3" />
                          {payment.paymentMethod === "CASH" ? "Efectivo" :
                           payment.paymentMethod === "CARD" ? "Tarjeta" :
                           payment.paymentMethod === "QR" ? "QR / PIX" :
                           payment.paymentMethod === "TRANSFER" ? "Transfer" : "Efectivo"}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {payment.parentType === "SESSION" ? "Sesión" :
                           payment.parentType === "PACKAGE_PURCHASE" ? "Paquete" :
                           payment.parentType === "PRODUCT_SALE" ? "Producto" :
                           payment.parentType}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        Bs {payment.amount.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* GASTOS DEL TURNO */}
          {/* ================================================== */}
          {data.expenses && data.expenses.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 font-semibold text-gray-700">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Gastos del Turno ({data.expenses.length})
              </h4>
              <div className="rounded-xl border border-red-100 bg-red-50/30 p-3">
                <div className="space-y-2">
                  {data.expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between rounded-lg bg-white p-2.5 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        {expense.createdAt && (
                          <span className="w-12 text-xs font-medium text-gray-400">
                            {format(new Date(expense.createdAt), "HH:mm")}
                          </span>
                        )}
                        <Badge variant="outline" className="border-red-200 bg-red-50 text-xs text-red-700">
                          {EXPENSE_CATEGORY_LABELS[expense.category] || expense.category}
                        </Badge>
                        {expense.description && (
                          <span className="text-sm text-gray-600">{expense.description}</span>
                        )}
                      </div>
                      <span className="font-semibold text-red-600">
                        -Bs {Number(expense.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between border-t border-red-200 pt-3">
                  <span className="font-medium text-red-700">Total Gastos</span>
                  <span className="text-lg font-bold text-red-600">
                    -Bs {data.expensesTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* ARQUEO DE CAJA (Solo Efectivo) */}
          {/* ================================================== */}
          {data.status !== "OPEN" && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <Banknote className="h-5 w-5 text-emerald-600" />
                Arqueo de Caja
                <Badge variant="outline" className="ml-2 text-xs font-normal">Solo Efectivo</Badge>
              </h4>
              <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
                <div className="space-y-3">
                  {/* Cálculo del efectivo */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">{t("admin.detail.initialFund")}</span>
                      <span className="font-medium">Bs {Number(data.initialFund).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">+ Ingresos en efectivo</span>
                      <span className="font-medium text-emerald-600">
                        +Bs {(data.cashIncome || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">- Gastos de caja</span>
                      <span className="font-medium text-red-600">
                        -Bs {data.expensesTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Resultado esperado vs declarado */}
                  <div className="space-y-2 border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">{t("admin.detail.expected")}</span>
                      <span className="text-lg font-semibold">
                        Bs {Number(data.expectedAmount || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">{t("admin.detail.declared")}</span>
                      <span className="text-lg font-semibold">
                        Bs {Number(data.declaredAmount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Diferencia */}
                  <div className={cn(
                    "mt-2 flex items-center justify-between rounded-xl p-4",
                    data.difference === 0
                      ? "bg-emerald-50 border border-emerald-200"
                      : (data.difference || 0) > 0
                        ? "bg-sky-50 border border-sky-200"
                        : "bg-amber-50 border border-amber-200"
                  )}>
                    <span className={cn(
                      "font-semibold",
                      data.difference === 0 ? "text-emerald-700" :
                      (data.difference || 0) > 0 ? "text-sky-700" : "text-amber-700"
                    )}>
                      {t("admin.detail.difference")}
                    </span>
                    <span className={cn(
                      "text-xl font-bold",
                      data.difference === 0 ? "text-emerald-600" :
                      (data.difference || 0) > 0 ? "text-sky-600" : "text-amber-600"
                    )}>
                      {(data.difference || 0) >= 0 ? "+" : ""}
                      Bs {Number(data.difference || 0).toFixed(2)}
                      {data.difference === 0 && (
                        <CheckCircle2 className="ml-2 inline h-5 w-5" />
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {data.closingNotes && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-500">{t("admin.detail.closingNotes")}</p>
              <p className="text-sm text-gray-700">{data.closingNotes}</p>
            </div>
          )}

          {data.reviewNotes && data.reviewNotes !== "Auto-aprobado (diferencia = 0)" && (
            <div className="rounded-lg bg-sky-50 p-3">
              <p className="text-xs font-medium text-sky-600">{t("admin.detail.reviewNotes")}</p>
              <p className="text-sm text-sky-700">{data.reviewNotes}</p>
            </div>
          )}

          {data.forcedCloseNotes && (
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-600">{t("admin.detail.forcedCloseNotes")}</p>
              <p className="text-sm text-amber-700">{data.forcedCloseNotes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            {data.status === "CLOSED" && (
              <>
                <Button
                  variant="outline"
                  onClick={onApprove}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {t("admin.approve")}
                </Button>
              </>
            )}
            {data.status === "OPEN" && (
              <Button
                variant="destructive"
                onClick={onForceClose}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                {t("admin.forceClose")}
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
