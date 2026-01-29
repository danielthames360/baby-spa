import { getTranslations } from "next-intl/server";
import { PortalProfile } from "@/components/portal/portal-profile";

export async function generateMetadata() {
  const t = await getTranslations("portal.profile");
  return { title: t("title") };
}

export default function PortalProfilePage() {
  return <PortalProfile />;
}
