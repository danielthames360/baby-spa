import Link from "next/link";
import { Home, ArrowLeft, Baby } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-teal-50 to-white px-4">
      {/* Decorative bubbles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-10 top-20 h-20 w-20 animate-pulse rounded-full bg-teal-200/30" />
        <div className="absolute bottom-32 right-20 h-32 w-32 animate-pulse rounded-full bg-cyan-200/20" style={{ animationDelay: "1s" }} />
        <div className="absolute left-1/4 top-1/2 h-16 w-16 animate-pulse rounded-full bg-teal-300/20" style={{ animationDelay: "2s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Baby icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 shadow-lg shadow-teal-300/50">
          <Baby className="h-12 w-12 text-white" />
        </div>

        {/* 404 Text */}
        <h1 className="mb-2 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-7xl font-bold text-transparent">
          404
        </h1>
        <h2 className="mb-4 text-2xl font-semibold text-gray-700">
          Página no encontrada
        </h2>
        <p className="mb-8 max-w-md text-gray-500">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>

        {/* Navigation buttons */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/portal/login"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
          >
            <Home className="h-5 w-5" />
            Portal de Padres
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-teal-200 bg-white/80 px-6 py-3 font-semibold text-teal-600 transition-all hover:bg-teal-50"
          >
            <ArrowLeft className="h-5 w-5" />
            Acceso Staff
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-8 text-sm text-gray-400">
        Baby Spa &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}
