import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { PortalLayoutClient } from "@/components/layout/portal-layout-client";

interface PortalLayoutProps {
  children: React.ReactNode;
}

export default async function PortalLayout({ children }: PortalLayoutProps) {
  const session = await getSession();

  // If not authenticated, check if we're on the login page
  if (!session) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "";

    // If not on login page, redirect to portal login
    if (!pathname.includes("/portal/login")) {
      redirect("/portal/login");
    }

    // On login page - render without portal layout
    return <>{children}</>;
  }

  // If authenticated but not PARENT, redirect to appropriate dashboard
  if (session.user.role !== "PARENT") {
    if (session.user.role === "THERAPIST") {
      redirect("/therapist/today");
    } else {
      redirect("/admin/dashboard");
    }
  }

  // Authenticated PARENT - show full portal layout
  return (
    <PortalLayoutClient session={session}>
      {children}
    </PortalLayoutClient>
  );
}
