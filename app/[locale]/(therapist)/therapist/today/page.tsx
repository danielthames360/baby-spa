import { getTranslations, getLocale } from "next-intl/server";
import { Calendar, Play, Baby } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("session");
  return { title: t("todaySessions") };
}

export default async function TherapistTodayPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const dateLocale = locale === "pt-BR" ? "pt-BR" : "es-ES";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-white/50 bg-gradient-to-r from-teal-500 to-cyan-500 p-6 text-white shadow-lg shadow-teal-200/50">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t("session.todaySessions")}
            </h1>
            <p className="text-teal-100">
              {new Date().toLocaleDateString(dateLocale, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Session list */}
      <div className="space-y-4">
        {[
          { time: "09:00", gradient: "from-teal-500 to-cyan-500", shadow: "shadow-teal-200" },
          { time: "10:30", gradient: "from-cyan-500 to-blue-500", shadow: "shadow-cyan-200" },
          { time: "14:00", gradient: "from-amber-400 to-orange-400", shadow: "shadow-amber-200" },
        ].map((session, i) => (
          <div
            key={i}
            className="group flex items-center gap-4 rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            {/* Time badge */}
            <div className={`flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-gradient-to-br ${session.gradient} text-white shadow-md ${session.shadow}`}>
              <span className="text-xs font-medium opacity-80">{t("common.hour")}</span>
              <span className="text-sm font-bold">{session.time}</span>
            </div>

            {/* Baby avatar placeholder */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-cyan-100">
              <Baby className="h-6 w-6 text-teal-600" />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-1">
              <div className="h-5 w-36 animate-pulse rounded-lg bg-gradient-to-r from-gray-100 to-gray-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
            </div>

            {/* Action button */}
            <button className={`flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r ${session.gradient} px-4 text-sm font-medium text-white shadow-md ${session.shadow} transition-all hover:shadow-lg`}>
              <Play className="h-4 w-4" />
              {t("session.start")}
            </button>
          </div>
        ))}
      </div>

      {/* Empty state hint */}
      <div className="rounded-2xl border border-white/50 bg-white/50 p-6 text-center backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100">
          <Calendar className="h-8 w-8 text-teal-600" />
        </div>
        <p className="mt-4 text-sm text-gray-500">
          {t("common.sessionsWillAppear")}
        </p>
      </div>
    </div>
  );
}
