import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { staffPaymentService } from "@/lib/services/staff-payment-service";
import { StaffPaymentType, PaymentStatus } from "@prisma/client";
import { StaffPaymentList } from "@/components/staff-payments/staff-payment-list";
import { StaffPaymentFilters } from "@/components/staff-payments/staff-payment-filters";
import { StaffPaymentQuickActions } from "@/components/staff-payments/staff-payment-quick-actions";

interface StaffPaymentsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    staffId?: string;
    type?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function StaffPaymentsPage({
  params,
  searchParams,
}: StaffPaymentsPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  // Only OWNER can access this page
  if (session.user.role !== "OWNER") {
    redirect(`/${locale}/admin/dashboard`);
  }

  const t = await getTranslations("staffPayments");
  const resolvedSearchParams = await searchParams;

  // Parse filters from URL
  const staffId = resolvedSearchParams.staffId || undefined;
  const type = resolvedSearchParams.type as StaffPaymentType | undefined;
  const status = resolvedSearchParams.status as PaymentStatus | undefined;
  const from = resolvedSearchParams.from
    ? new Date(resolvedSearchParams.from + "T00:00:00")
    : undefined;
  const to = resolvedSearchParams.to
    ? new Date(resolvedSearchParams.to + "T23:59:59")
    : undefined;
  const page = parseInt(resolvedSearchParams.page || "1", 10);

  // Fetch payments and staff in parallel
  const [paymentsResult, staffWithBalances] = await Promise.all([
    staffPaymentService.list({
      staffId,
      type,
      status,
      from,
      to,
      page,
      limit: 20,
    }),
    staffPaymentService.getStaffWithBalances(),
  ]);

  // Serialize for client components
  const payments = paymentsResult.payments.map((p) => ({
    id: p.id,
    staffId: p.staffId,
    type: p.type,
    status: p.status,
    grossAmount: Number(p.grossAmount),
    netAmount: Number(p.netAmount),
    advanceDeducted: p.advanceDeducted ? Number(p.advanceDeducted) : null,
    description: p.description,
    periodStart: p.periodStart?.toISOString() || null,
    periodEnd: p.periodEnd?.toISOString() || null,
    movementDate: p.movementDate?.toISOString() || null,
    paidAt: p.paidAt?.toISOString() || null,
    createdAt: p.createdAt.toISOString(),
    deletedAt: p.deletedAt?.toISOString() || null,
    staff: {
      id: p.staff.id,
      name: p.staff.name,
      baseSalary: p.staff.baseSalary ? Number(p.staff.baseSalary) : null,
      payFrequency: p.staff.payFrequency,
    },
    createdBy: {
      id: p.createdBy.id,
      name: p.createdBy.name,
    },
  }));
  const pagination = paymentsResult.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-3xl font-bold text-transparent">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      {/* Quick Actions */}
      <StaffPaymentQuickActions locale={locale} staffList={staffWithBalances} />

      {/* Filters */}
      <StaffPaymentFilters
        locale={locale}
        staffList={staffWithBalances}
        initialFilters={{
          staffId: resolvedSearchParams.staffId,
          type: resolvedSearchParams.type,
          status: resolvedSearchParams.status,
          from: resolvedSearchParams.from,
          to: resolvedSearchParams.to,
        }}
      />

      {/* Payments List */}
      <StaffPaymentList
        payments={payments}
        pagination={pagination}
        locale={locale}
        emptyMessage={t("empty")}
        staffList={staffWithBalances}
      />
    </div>
  );
}
