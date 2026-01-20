import { getTranslations } from "next-intl/server";
import { Calendar, Users, Baby, Clock } from "lucide-react";
import { StockAlertsWidget } from "@/components/dashboard";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("dashboard") };
}

export default async function AdminDashboardPage() {
  const t = await getTranslations();

  const statsCards = [
    { icon: Calendar, label: t("common.todayAppointments"), gradient: "from-teal-500 to-cyan-500", shadowColor: "shadow-teal-200" },
    { icon: Users, label: t("common.activeClients"), gradient: "from-cyan-500 to-blue-500", shadowColor: "shadow-cyan-200" },
    { icon: Baby, label: t("common.registeredBabies"), gradient: "from-amber-400 to-orange-400", shadowColor: "shadow-amber-200" },
    { icon: Clock, label: t("common.nextSession"), gradient: "from-rose-400 to-pink-400", shadowColor: "shadow-rose-200" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="rounded-2xl border border-white/50 bg-gradient-to-r from-teal-500 to-cyan-500 p-6 text-white shadow-lg shadow-teal-200/50">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("nav.dashboard")}
        </h1>
        <p className="mt-1 text-teal-100">
          {t("common.welcomeTo")} Baby Spa
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="group rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-md ${card.shadowColor}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="h-8 w-16 animate-pulse rounded-lg bg-gradient-to-r from-gray-100 to-gray-200" />
              </div>
              <p className="mt-4 text-sm font-medium text-gray-600">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Main content area - Two columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
              <Calendar className="h-5 w-5 text-teal-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700">{t("common.recentActivity")}</h2>
          </div>
          <div className="mt-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-gray-50 to-white p-4">
                <div className="h-10 w-10 animate-pulse rounded-full bg-gradient-to-br from-teal-100 to-cyan-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
                </div>
                <div className="h-8 w-20 animate-pulse rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50" />
              </div>
            ))}
          </div>
        </div>

        {/* Stock Alerts */}
        <StockAlertsWidget />
      </div>
    </div>
  );
}
