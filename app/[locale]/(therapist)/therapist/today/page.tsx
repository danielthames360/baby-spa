import { getTranslations } from "next-intl/server";
import { TherapistTodayList } from "@/components/sessions/therapist-today-list";

export async function generateMetadata() {
  const t = await getTranslations("session");
  return { title: t("todaySessions") };
}

export default async function TherapistTodayPage() {
  return <TherapistTodayList />;
}
