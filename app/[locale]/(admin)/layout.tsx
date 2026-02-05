import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminLayoutClient } from "@/components/layout/admin-layout-client";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const ALLOWED_ROLES = ["OWNER", "ADMIN", "RECEPTION"];

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login");
  }

  // Redirect based on role if not allowed
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    if (session.user.role === "THERAPIST") {
      redirect("/therapist/today");
    } else if (session.user.role === "PARENT") {
      redirect("/portal/dashboard");
    } else {
      redirect("/login");
    }
  }

  return (
    <AdminLayoutClient session={session}>
      {children}
    </AdminLayoutClient>
  );
}
