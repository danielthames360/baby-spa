import { getTranslations } from "next-intl/server";
import { PortalDashboard } from "@/components/portal/portal-dashboard";

export async function generateMetadata() {
  const t = await getTranslations("portal.dashboard");
  return { title: t("title") };
}

export default function PortalDashboardPage() {
  return <PortalDashboard />;
}
