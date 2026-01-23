"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir a portal/login cuando la página no existe
    router.replace("/portal/login");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-teal-50 to-white">
      <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
    </div>
  );
}
