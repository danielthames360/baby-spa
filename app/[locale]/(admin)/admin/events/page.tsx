import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { eventService } from "@/lib/services/event-service";
import { EventList } from "@/components/events/event-list";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { serializeForClient } from "@/lib/utils/serialize";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations("events");

  // Fetch all events and serialize for client components
  const allEventsRaw = await eventService.getAll();
  const allEvents = serializeForClient(allEventsRaw);

  // Get today's date for filtering
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Type for serialized events
  type SerializedEvent = (typeof allEvents)[number];

  // js-combine-iterations: Single iteration to categorize events
  const { upcomingEvents, inProgressEvents, pastEvents, draftEvents } =
    allEvents.reduce(
      (acc, e) => {
        const dateStr = String(e.date);
        const eventDate = new Date(dateStr);

        // Categorize events
        if (e.status === "DRAFT") {
          acc.draftEvents.push(e);
        } else if (e.status === "IN_PROGRESS") {
          acc.inProgressEvents.push(e);
        } else if (e.status === "COMPLETED" || eventDate < today) {
          acc.pastEvents.push(e);
        } else if (e.status === "PUBLISHED" && eventDate >= today) {
          acc.upcomingEvents.push(e);
        }
        return acc;
      },
      {
        upcomingEvents: [] as SerializedEvent[],
        inProgressEvents: [] as SerializedEvent[],
        pastEvents: [] as SerializedEvent[],
        draftEvents: [] as SerializedEvent[],
      }
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-3xl font-bold text-transparent">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("subtitle")}
          </p>
        </div>
        <Link href={`/${locale}/admin/events/new`}>
          <Button className="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600 hover:shadow-xl hover:shadow-teal-400/40">
            <Plus className="mr-2 h-5 w-5" />
            {t("newEvent")}
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-white/70 p-1 backdrop-blur-sm">
          <TabsTrigger
            value="upcoming"
            className="rounded-xl data-[state=active]:bg-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            {t("upcoming")} ({upcomingEvents.length})
          </TabsTrigger>
          <TabsTrigger
            value="inProgress"
            className="rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            {t("inProgress")} ({inProgressEvents.length})
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="rounded-xl data-[state=active]:bg-gray-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            {t("past")} ({pastEvents.length})
          </TabsTrigger>
          <TabsTrigger
            value="drafts"
            className="rounded-xl data-[state=active]:bg-slate-400 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            {t("draft")} ({draftEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          <EventList
            events={upcomingEvents}
            locale={locale}
            emptyMessage={t("empty.filtered")}
          />
        </TabsContent>

        <TabsContent value="inProgress" className="mt-6">
          <EventList
            events={inProgressEvents}
            locale={locale}
            groupByDate={false}
            emptyMessage={t("empty.filtered")}
          />
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          <EventList
            events={pastEvents}
            locale={locale}
            emptyMessage={t("empty.filtered")}
          />
        </TabsContent>

        <TabsContent value="drafts" className="mt-6">
          <EventList
            events={draftEvents}
            locale={locale}
            groupByDate={false}
            emptyMessage={t("empty.filtered")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
