import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { EventForm } from "@/components/events/event-form";
import { Button } from "@/components/ui/button";

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  // Only ADMIN and RECEPTION can create events
  if (!["ADMIN", "RECEPTION"].includes(session.user.role)) {
    redirect(`/${locale}/admin`);
  }

  const t = await getTranslations("events");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/admin/events`}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-2xl font-bold text-transparent sm:text-3xl">
          {t("newEvent")}
        </h1>
      </div>

      {/* Form */}
      <EventForm mode="create" />
    </div>
  );
}
