import { getTranslations } from "next-intl/server";
import { SessionHistory } from "@/components/portal/session-history";

export async function generateMetadata() {
  const t = await getTranslations("portal.history");
  return { title: t("title") };
}

export default function PortalHistoryPage() {
  return <SessionHistory />;
}
