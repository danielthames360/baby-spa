import { getTranslations } from "next-intl/server";
import { PortalAccount } from "@/components/portal/portal-account";

export async function generateMetadata() {
  const t = await getTranslations("portal.account");
  return { title: t("title") };
}

export default function PortalAccountPage() {
  return <PortalAccount />;
}
