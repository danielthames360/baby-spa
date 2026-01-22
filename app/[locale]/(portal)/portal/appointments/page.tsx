import { getTranslations } from "next-intl/server";
import { PortalAppointments } from "@/components/portal/portal-appointments";

export async function generateMetadata() {
  const t = await getTranslations("portal.appointments");
  return { title: t("title") };
}

export default function PortalAppointmentsPage() {
  return <PortalAppointments />;
}
