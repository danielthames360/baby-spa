import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { eventService } from "@/lib/services/event-service";
import { EventDetails } from "@/components/events/event-details";
import { Button } from "@/components/ui/button";

// Type for event from service (uses Prisma's Decimal type)
type EventFromService = Awaited<ReturnType<typeof eventService.getById>>;
type ParticipantFromService = EventFromService["participants"][number];
type ProductUsageFromService = EventFromService["productUsages"][number];

// Helper to serialize Decimal fields for client components
function serializeEvent(event: EventFromService) {
  return {
    ...event,
    basePrice: Number(event.basePrice),
    date: event.date instanceof Date ? event.date.toISOString() : event.date,
    createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
    updatedAt: event.updatedAt instanceof Date ? event.updatedAt.toISOString() : event.updatedAt,
    participants: event.participants?.map((p: ParticipantFromService) => ({
      ...p,
      discountAmount: p.discountAmount ? Number(p.discountAmount) : null,
      amountDue: Number(p.amountDue),
      amountPaid: Number(p.amountPaid),
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      paidAt: p.paidAt instanceof Date ? p.paidAt?.toISOString() : p.paidAt,
      baby: p.baby ? {
        ...p.baby,
        birthDate: p.baby.birthDate instanceof Date ? p.baby.birthDate.toISOString() : p.baby.birthDate,
        birthWeight: p.baby.birthWeight ? Number(p.baby.birthWeight) : null,
      } : null,
      parent: p.parent ? {
        ...p.parent,
        convertedAt: p.parent.convertedAt instanceof Date ? p.parent.convertedAt?.toISOString() : p.parent.convertedAt,
      } : null,
    })) || [],
    productUsages: event.productUsages?.map((pu: ProductUsageFromService) => ({
      ...pu,
      unitPrice: Number(pu.unitPrice),
      createdAt: pu.createdAt instanceof Date ? pu.createdAt.toISOString() : pu.createdAt,
      product: pu.product ? {
        ...pu.product,
        salePrice: Number(pu.product.salePrice),
        costPrice: pu.product.costPrice ? Number(pu.product.costPrice) : null,
      } : null,
    })) || [],
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations("events");

  let event;
  try {
    event = await eventService.getById(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/admin/events`}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <span className="text-sm text-gray-500">{t("title")}</span>
      </div>

      {/* Event Details */}
      <EventDetails event={serializeEvent(event)} />
    </div>
  );
}
