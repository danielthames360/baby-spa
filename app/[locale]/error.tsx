"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-teal-50 to-white p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/50 bg-white/70 p-8 text-center shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        <h1 className="mb-2 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text font-nunito text-2xl font-bold text-transparent">
          ¡Algo salió mal!
        </h1>

        <p className="mb-6 text-gray-600">
          Ha ocurrido un error inesperado. Por favor, intenta nuevamente.
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
            Intentar de nuevo
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-12 rounded-xl px-6 font-semibold"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
