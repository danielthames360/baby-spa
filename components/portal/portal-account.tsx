"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDateForDisplay } from "@/lib/utils/date-utils";
import {
  Wallet,
  Package,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Banknote,
  QrCode,
  Loader2,
  Check,
  AlertCircle,
  Calendar,
  Baby,
  User,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ============================================================
// TYPES
// ============================================================

interface Payment {
  id: string;
  installmentNumber: number;
  amount: number;
  paymentMethod: string;
  paidAt: string;
}

interface PackageWithPending {
  id: string;
  packageName: string;
  clientName: string;
  clientType: "baby" | "parent";
  totalPrice: number;
  paidAmount: number;
  pendingAmount: number;
  percentagePaid: number;
  paymentPlan: string;
  totalInstallments: number;
  paidInstallments: number;
  installmentAmount: number | null;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  nextPaymentSession: number | null;
  purchaseDate: string;
  payments: Payment[];
}

interface PackagePaid {
  id: string;
  packageName: string;
  clientName: string;
  clientType: "baby" | "parent";
  totalPrice: number;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  purchaseDate: string;
}

interface FinancialSummary {
  summary: {
    totalPending: number;
    packagesWithPending: number;
    packagesPaid: number;
  };
  packagesWithPending: PackageWithPending[];
  packagesPaid: PackagePaid[];
}

// ============================================================
// CONSTANTS (outside component)
// ============================================================

const PAYMENT_METHOD_ICONS: Record<string, typeof CreditCard> = {
  CASH: Banknote,
  CARD: CreditCard,
  TRANSFER: Wallet,
  QR: QrCode,
};

// ============================================================
// COMPONENT
// ============================================================

export function PortalAccount() {
  const t = useTranslations();
  const locale = useLocale();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);

  // Fetch financial summary and settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryRes, settingsRes] = await Promise.all([
          fetch("/api/portal/financial-summary"),
          fetch("/api/settings/payment"),
        ]);

        if (!summaryRes.ok) throw new Error("Failed to fetch summary");

        const summaryData = await summaryRes.json();
        setData(summaryData);

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setWhatsappNumber(settingsData.settings.whatsappNumber);
        }
      } catch (error) {
        console.error("Error fetching financial data:", error);
        toast.error(t("common.error"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  // Toggle expanded package
  const togglePackage = (packageId: string) => {
    setExpandedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(packageId)) {
        next.delete(packageId);
      } else {
        next.add(packageId);
      }
      return next;
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Bs ${amount.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString, locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Get payment method label
  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      CASH: t("payment.methods.cash"),
      CARD: t("payment.methods.card"),
      TRANSFER: t("payment.methods.transfer"),
      QR: t("payment.methods.qr"),
    };
    return labels[method] || method;
  };

  // Handle WhatsApp contact
  const handleWhatsAppContact = () => {
    if (!whatsappNumber) return;
    const message = encodeURIComponent(t("portal.account.whatsappMessage"));
    window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${message}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("common.error")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent">
          {t("portal.account.title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("portal.account.subtitle")}
        </p>
      </div>

      {/* Summary Card */}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
        <h2 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
          <Wallet className="h-5 w-5 text-teal-500" />
          {t("portal.account.summary")}
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{t("portal.account.totalPending")}</p>
            <p className={cn(
              "text-3xl font-bold",
              data.summary.totalPending > 0 ? "text-amber-600" : "text-teal-600"
            )}>
              {formatCurrency(data.summary.totalPending)}
            </p>
          </div>

          {data.summary.totalPending > 0 ? (
            <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700">
              <AlertCircle className="h-4 w-4" />
              {t("portal.account.pendingPackages", { count: data.summary.packagesWithPending })}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1.5 text-sm font-medium text-teal-700">
              <Check className="h-4 w-4" />
              {t("portal.account.allPaid")}
            </div>
          )}
        </div>
      </div>

      {/* Packages with Pending */}
      {data.packagesWithPending.length > 0 && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Package className="h-5 w-5 text-amber-500" />
            {t("portal.account.packagesWithBalance")}
          </h2>

          {data.packagesWithPending.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-2xl border border-white/50 bg-white/70 shadow-lg backdrop-blur-sm overflow-hidden"
            >
              {/* Package Header */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{pkg.packageName}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                      {pkg.clientType === "baby" ? (
                        <Baby className="h-3.5 w-3.5" />
                      ) : (
                        <User className="h-3.5 w-3.5" />
                      )}
                      <span>{pkg.clientName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{t("portal.account.pending")}</p>
                    <p className="text-lg font-bold text-amber-600">
                      {formatCurrency(pkg.pendingAmount)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{t("portal.account.totalPrice")}: {formatCurrency(pkg.totalPrice)}</span>
                    <span>{pkg.percentagePaid}% {t("portal.account.paid")}</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${pkg.percentagePaid}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-teal-600 font-medium">
                      {t("portal.account.paidAmount")}: {formatCurrency(pkg.paidAmount)}
                    </span>
                    <span className="text-amber-600 font-medium">
                      {t("portal.account.remaining")}: {formatCurrency(pkg.pendingAmount)}
                    </span>
                  </div>
                </div>

                {/* Next Payment Info */}
                {pkg.nextPaymentSession && pkg.installmentAmount && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 border border-amber-100">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-700">
                      {t("portal.account.nextInstallment")}: {formatCurrency(pkg.installmentAmount)} -{" "}
                      {t("portal.account.atSession", { session: pkg.nextPaymentSession })}
                    </span>
                  </div>
                )}

                {/* Expand Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePackage(pkg.id)}
                  className="w-full mt-3 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                >
                  {expandedPackages.has(pkg.id) ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      {t("portal.account.hideHistory")}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      {t("portal.account.showHistory")}
                    </>
                  )}
                </Button>
              </div>

              {/* Payment History (Expanded) */}
              {expandedPackages.has(pkg.id) && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    {t("portal.account.paymentHistory")}
                  </h4>
                  {pkg.payments.length > 0 ? (
                    <div className="space-y-2">
                      {pkg.payments.map((payment) => {
                        const Icon = PAYMENT_METHOD_ICONS[payment.paymentMethod] || Wallet;
                        return (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between rounded-lg bg-white p-3 border border-gray-100"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100">
                                <Icon className="h-4 w-4 text-teal-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">
                                  {t("portal.account.installment")} #{payment.installmentNumber}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(payment.paidAt)} • {getPaymentMethodLabel(payment.paymentMethod)}
                                </p>
                              </div>
                            </div>
                            <span className="font-semibold text-teal-600">
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {t("portal.account.noPaymentsYet")}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fully Paid Packages */}
      {data.packagesPaid.length > 0 && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Check className="h-5 w-5 text-teal-500" />
            {t("portal.account.paidPackages")}
          </h2>

          {data.packagesPaid.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{pkg.packageName}</h3>
                    <span className="flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                      <Check className="h-3 w-3" />
                      {t("portal.account.fullyPaid")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                    {pkg.clientType === "baby" ? (
                      <Baby className="h-3.5 w-3.5" />
                    ) : (
                      <User className="h-3.5 w-3.5" />
                    )}
                    <span>{pkg.clientName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{t("portal.account.total")}</p>
                  <p className="font-semibold text-gray-700">{formatCurrency(pkg.totalPrice)}</p>
                </div>
              </div>

              {/* Sessions info */}
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                <span>
                  {t("portal.account.sessionsUsed")}: {pkg.usedSessions}/{pkg.totalSessions}
                </span>
                {pkg.remainingSessions > 0 && (
                  <span className="text-teal-600 font-medium">
                    {pkg.remainingSessions} {t("portal.account.sessionsRemaining")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {data.packagesWithPending.length === 0 && data.packagesPaid.length === 0 && (
        <div className="rounded-2xl border border-white/50 bg-white/70 p-8 shadow-lg backdrop-blur-sm text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t("portal.account.noPackages")}</p>
        </div>
      )}

      {/* WhatsApp Contact */}
      {whatsappNumber && (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {t("portal.account.questions")}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsAppContact}
              className="gap-2 border-teal-200 text-teal-600 hover:bg-teal-50"
            >
              <MessageCircle className="h-4 w-4" />
              {t("portal.account.contactWhatsApp")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
