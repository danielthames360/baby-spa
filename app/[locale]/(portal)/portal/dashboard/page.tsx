import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("dashboard") };
}

export default async function PortalDashboardPage() {
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <div className="rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">{t("auth.welcome")}!</h1>
        <p className="mt-1 text-primary-100">
          Portal para padres de Baby Spa
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">
            {t("baby.remainingSessions")}
          </p>
          <div className="mt-2 h-8 w-16 animate-pulse rounded bg-muted" />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">
            {t("appointment.title")}
          </p>
          <div className="mt-2 h-8 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>

      {/* Next appointment */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-semibold">{t("appointment.newAppointment")}</h2>
        <div className="mt-4 h-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
