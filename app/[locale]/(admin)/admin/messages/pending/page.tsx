"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  MessageSquare,
  Phone,
  Copy,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Filter,
  Clock,
  User,
  Baby,
  Calendar,
  CreditCard,
  Heart,
  Users,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PendingMessage {
  id: string;
  category: string;
  templateKey: string;
  recipientType: string;
  recipientId: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  status: string;
  scheduledFor: string;
  createdAt: string;
  sentBy: { id: string; name: string } | null;
}

const CATEGORY_ICONS: Record<string, typeof Calendar> = {
  APPOINTMENT_REMINDER: Calendar,
  PAYMENT_REMINDER: CreditCard,
  MESVERSARY: Heart,
  REENGAGEMENT: Users,
};

const CATEGORY_COLORS: Record<string, string> = {
  APPOINTMENT_REMINDER: "bg-blue-100 text-blue-700",
  PAYMENT_REMINDER: "bg-amber-100 text-amber-700",
  MESVERSARY: "bg-pink-100 text-pink-700",
  REENGAGEMENT: "bg-purple-100 text-purple-700",
};

export default function PendingMessagesPage() {
  const t = useTranslations("messagesModule");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [messages, setMessages] = useState<PendingMessage[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  // Dialog states
  const [selectedMessage, setSelectedMessage] = useState<PendingMessage | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const categoryParam = filter !== "all" ? `&category=${filter}` : "";
      const response = await fetch(`/api/pending-messages?status=PENDING${categoryParam}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setCounts(data.counts);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error(t("pending.toastLoadError"));
    } finally {
      setLoading(false);
    }
  }, [filter, t]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchMessages, 60000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const copyMessage = async (message: PendingMessage) => {
    try {
      await navigator.clipboard.writeText(message.message);
      setCopiedId(message.id);
      toast.success(t("pending.toastCopied"));
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error(t("pending.toastCopyError"));
    }
  };

  const openWhatsApp = (message: PendingMessage) => {
    const phone = message.recipientPhone.replace(/\D/g, "");
    const encodedMessage = encodeURIComponent(message.message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, "_blank");
  };

  const handleMarkAsSent = async () => {
    if (!selectedMessage) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/pending-messages/${selectedMessage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sent" }),
      });

      if (response.ok) {
        toast.success(t("pending.toastSent"));
        setShowConfirmDialog(false);
        setSelectedMessage(null);
        fetchMessages();
      } else {
        toast.error(t("pending.toastUpdateError"));
      }
    } catch {
      toast.error(t("pending.toastUpdateError"));
    } finally {
      setProcessing(false);
    }
  };

  const handleSkip = async () => {
    if (!selectedMessage) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/pending-messages/${selectedMessage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "skipped", skipReason }),
      });

      if (response.ok) {
        toast.success(t("pending.toastSkipped"));
        setShowSkipDialog(false);
        setSelectedMessage(null);
        setSkipReason("");
        fetchMessages();
      } else {
        toast.error(t("pending.toastSkipError"));
      }
    } catch {
      toast.error(t("pending.toastSkipError"));
    } finally {
      setProcessing(false);
    }
  };

  const totalPending = Object.values(counts).reduce((a, b) => a + b, 0);
  const dateLocale = locale === "pt-BR" ? "pt-BR" : "es-BO";

  return (
    <div className="space-y-6 p-6">
      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            {t("pending.title")}
          </h2>
          <p className="text-sm text-gray-500">
            {t("pending.messageCount", { count: totalPending })}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchMessages}
          disabled={loading}
          className="gap-2 rounded-xl"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          {t("pending.refresh")}
        </Button>
      </div>

      {/* Category Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => {
          const count = counts[key] || 0;
          const color = CATEGORY_COLORS[key] || "bg-gray-100 text-gray-700";
          return (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? "all" : key)}
              className={cn(
                "rounded-xl border-2 p-3 text-left transition-all",
                filter === key
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-100 bg-white hover:border-gray-200"
              )}
            >
              <div className={cn("mb-2 inline-flex rounded-lg p-2", color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{count}</div>
              <div className="text-xs text-gray-500">{t(`categories.${key}`)}</div>
            </button>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48 rounded-xl">
            <SelectValue placeholder={t("pending.filterPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("pending.filterAll")}</SelectItem>
            <SelectItem value="APPOINTMENT_REMINDER">{t("pending.filterAppointment")}</SelectItem>
            <SelectItem value="PAYMENT_REMINDER">{t("pending.filterPayment")}</SelectItem>
            <SelectItem value="MESVERSARY">{t("pending.filterMesversary")}</SelectItem>
            <SelectItem value="REENGAGEMENT">{t("pending.filterReengagement")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
          <h3 className="mt-4 text-lg font-semibold text-gray-800">
            {t("pending.emptyTitle")}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {t("pending.emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => {
            const Icon = CATEGORY_ICONS[message.category] || MessageSquare;
            const color = CATEGORY_COLORS[message.category] || "bg-gray-100 text-gray-700";
            const categoryLabel = t(`categories.${message.category}`, { defaultValue: message.category });
            const isCopied = copiedId === message.id;

            return (
              <div
                key={message.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: Info */}
                  <div className="flex-1 space-y-3">
                    {/* Category Badge & Recipient */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium", color)}>
                        <Icon className="h-3 w-3" />
                        {categoryLabel}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        {message.recipientType === "BABY" ? (
                          <Baby className="h-3.5 w-3.5" />
                        ) : (
                          <User className="h-3.5 w-3.5" />
                        )}
                        {message.recipientName}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Phone className="h-3.5 w-3.5" />
                        {message.recipientPhone}
                      </span>
                    </div>

                    {/* Message Preview */}
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="whitespace-pre-wrap text-sm text-gray-700">
                        {message.message.length > 200
                          ? `${message.message.slice(0, 200)}...`
                          : message.message}
                      </p>
                    </div>

                    {/* Scheduled Time */}
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {t("pending.scheduled")} {new Date(message.scheduledFor).toLocaleString(dateLocale)}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyMessage(message)}
                      className={cn(
                        "gap-1 rounded-xl",
                        isCopied && "border-emerald-500 text-emerald-600"
                      )}
                    >
                      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {isCopied ? t("pending.copied") : t("pending.copy")}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => openWhatsApp(message)}
                      className="gap-1 rounded-xl bg-green-500 text-white hover:bg-green-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t("pending.whatsapp")}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedMessage(message);
                        setShowConfirmDialog(true);
                      }}
                      className="gap-1 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {t("pending.markSent")}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedMessage(message);
                        setShowSkipDialog(true);
                      }}
                      className="gap-1 rounded-xl text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="h-4 w-4" />
                      {t("pending.skip")}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Sent Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              {t("pending.confirmSendTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("pending.confirmSendDescription", { name: selectedMessage?.recipientName || "" })}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
            <strong>{t("pending.important")}</strong> {t("pending.confirmSendWarning")}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="rounded-xl"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleMarkAsSent}
              disabled={processing}
              className="gap-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("pending.confirmSendButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip Dialog */}
      <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-gray-500" />
              {t("pending.skipTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("pending.skipDescription", { name: selectedMessage?.recipientName || "" })}
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
            placeholder={t("pending.skipPlaceholder")}
            className="min-h-[80px] rounded-xl"
          />

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowSkipDialog(false);
                setSkipReason("");
              }}
              className="rounded-xl"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleSkip}
              disabled={processing}
              variant="outline"
              className="gap-2 rounded-xl"
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("pending.skipButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
