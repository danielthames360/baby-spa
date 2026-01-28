import { getTranslations } from "next-intl/server";
import { PortalBabyCard } from "@/components/portal/portal-baby-card";

interface PageProps {
  params: Promise<{ babyId: string }>;
}

export async function generateMetadata() {
  const t = await getTranslations("babyCard.portal");
  return { title: t("myCard") };
}

export default async function PortalBabyCardPage({ params }: PageProps) {
  const { babyId } = await params;
  return <PortalBabyCard babyId={babyId} />;
}
