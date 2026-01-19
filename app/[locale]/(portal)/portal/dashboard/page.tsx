import { getTranslations } from "next-intl/server";
import { Calendar, Sparkles, Heart, Clock } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("dashboard") };
}

export default async function PortalDashboardPage() {
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-gradient-to-r from-teal-500 to-cyan-500 p-6 text-white shadow-lg shadow-teal-200/50">
        {/* Decorative elements */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-200" />
            <h1 className="text-2xl font-bold">{t("auth.welcome")}!</h1>
          </div>
          <p className="mt-1 text-teal-100">
            {t("common.portalWelcomeSubtitle")}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="group rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-gray-600">
              {t("baby.remainingSessions")}
            </p>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <div className="h-10 w-16 animate-pulse rounded-lg bg-gradient-to-r from-teal-100 to-cyan-100" />
            <span className="text-sm text-gray-500">{t("common.sessionsUnit")}</span>
          </div>
        </div>

        <div className="group rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-md shadow-amber-200">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-gray-600">
              {t("appointment.title")}
            </p>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <div className="h-10 w-24 animate-pulse rounded-lg bg-gradient-to-r from-amber-100 to-orange-100" />
          </div>
        </div>
      </div>

      {/* Next appointment */}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-pink-400 text-white shadow-md shadow-rose-200">
            <Calendar className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700">{t("appointment.newAppointment")}</h2>
        </div>
        <div className="mt-6 rounded-xl bg-gradient-to-r from-gray-50 to-white p-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 animate-pulse rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
