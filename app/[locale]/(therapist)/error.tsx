"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TherapistError({ error, reset }: ErrorPageProps) {
  const router = useRouter();

  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/50 bg-white/70 p-8 text-center shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        <h1 className="mb-2 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text font-nunito text-2xl font-bold text-transparent">
          Error en el Sistema
        </h1>

        <p className="mb-6 text-gray-600">
          Ha ocurrido un error al cargar esta página. Por favor, intenta nuevamente.
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="mb-6 rounded-lg bg-gray-100 p-3 text-left">
            <p className="text-xs font-semibold text-gray-700">Error:</p>
            <p className="mt-1 text-xs text-gray-600 break-all">{error.message}</p>
            {error.digest && (
              <p className="mt-2 text-xs text-gray-500">Digest: {error.digest}</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            className="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 font-semibold text-white shadow-lg shadow-teal-300/50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>

          <Button
            onClick={() => router.back()}
            variant="outline"
            className="h-12 rounded-xl px-6 font-semibold"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-12 rounded-xl px-6 font-semibold"
          >
            <Link href="/terapeuta">
              <Home className="mr-2 h-4 w-4" />
              Mi Agenda
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
