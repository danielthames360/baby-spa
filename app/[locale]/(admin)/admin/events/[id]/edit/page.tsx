import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { eventService } from "@/lib/services/event-service";
import { EventForm } from "@/components/events/event-form";
import { Button } from "@/components/ui/button";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  // Only ADMIN and RECEPTION can edit events
  if (!["ADMIN", "RECEPTION"].includes(session.user.role)) {
    redirect(`/${locale}/admin/events/${id}`);
  }

  const t = await getTranslations("events");

  let event;
  try {
    event = await eventService.getById(id);
  } catch {
    notFound();
  }

  // Only DRAFT and PUBLISHED events can be edited
  if (!["DRAFT", "PUBLISHED"].includes(event.status)) {
    redirect(`/${locale}/admin/events/${id}`);
  }

  // Serialize for client component
  const initialData = {
    id: event.id,
    name: event.name,
    description: event.description,
    type: event.type,
    date: event.date instanceof Date ? event.date.toISOString().split("T")[0] : String(event.date).split("T")[0],
    startTime: event.startTime,
    endTime: event.endTime,
    maxParticipants: event.maxParticipants,
    blockedTherapists: event.blockedTherapists,
    minAgeMonths: event.minAgeMonths,
    maxAgeMonths: event.maxAgeMonths,
    basePrice: Number(event.basePrice),
    internalNotes: event.internalNotes,
    externalNotes: event.externalNotes,
    status: event.status,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/admin/events/${id}`}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-2xl font-bold text-transparent sm:text-3xl">
            {t("editEvent")}
          </h1>
          <p className="text-sm text-gray-500">{event.name}</p>
        </div>
      </div>

      {/* Form */}
      <EventForm initialData={initialData} mode="edit" />
    </div>
  );
}
