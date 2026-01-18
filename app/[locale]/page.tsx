import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function LocaleHomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Redirect based on role
  switch (session.user.role) {
    case "ADMIN":
    case "RECEPTION":
      redirect("/admin/dashboard");
    case "THERAPIST":
      redirect("/therapist/today");
    case "PARENT":
      redirect("/portal/dashboard");
    default:
      redirect("/login");
  }
}
