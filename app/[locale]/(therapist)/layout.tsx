import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { TherapistLayoutClient } from "@/components/layout/therapist-layout-client";

interface TherapistLayoutProps {
  children: React.ReactNode;
}

export default async function TherapistLayout({ children }: TherapistLayoutProps) {
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login");
  }

  // Only THERAPIST role can access this section
  if (session.user.role !== "THERAPIST") {
    // Redirect based on role
    if (session.user.role === "ADMIN" || session.user.role === "RECEPTION" || session.user.role === "OWNER") {
      redirect("/admin/dashboard");
    } else if (session.user.role === "PARENT") {
      redirect("/portal/dashboard");
    } else {
      redirect("/login");
    }
  }

  return (
    <TherapistLayoutClient session={session}>
      {children}
    </TherapistLayoutClient>
  );
}
