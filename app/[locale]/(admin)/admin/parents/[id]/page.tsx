import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { parentService } from "@/lib/services/parent-service";
import { ParentDetails } from "@/components/parents/parent-details";
import { Button } from "@/components/ui/button";

// Helper to serialize Date fields for client components
function serializeParent(parent: NonNullable<Awaited<ReturnType<typeof parentService.getWithDetails>>>) {
  return {
    ...parent,
    birthDate: parent.birthDate?.toISOString() ?? null,
    lastNoShowDate: parent.lastNoShowDate?.toISOString() ?? null,
    convertedAt: parent.convertedAt?.toISOString() ?? null,
    createdAt: parent.createdAt.toISOString(),
    updatedAt: parent.updatedAt.toISOString(),
    babies: parent.babies.map((rel) => ({
      ...rel,
      baby: {
        ...rel.baby,
        birthDate: rel.baby.birthDate.toISOString(),
      },
    })),
    appointments: parent.appointments.map((apt) => ({
      id: apt.id,
      date: apt.date.toISOString(),
      startTime: apt.startTime,
      status: apt.status,
    })),
    packagePurchases: parent.packagePurchases.map((pp) => ({
      id: pp.id,
      remainingSessions: pp.remainingSessions,
      totalSessions: pp.totalSessions,
      isActive: pp.isActive,
      package: pp.package,
      createdAt: pp.createdAt.toISOString(),
    })),
  };
}

export default async function ParentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations("parents");

  let parent;
  try {
    parent = await parentService.getWithDetails(id);
    if (!parent) {
      notFound();
    }
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/admin/parents`}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <span className="text-sm text-gray-500">{t("title")}</span>
      </div>

      {/* Parent Details */}
      <ParentDetails parent={serializeParent(parent)} locale={locale} />
    </div>
  );
}
