import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

// Crear el middleware de internacionalización
const handleI18nRouting = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // Detectar país/base de datos por subdominio
  let country: "bolivia" | "brazil" = "bolivia";

  if (host.startsWith("br.") || host.includes("brazil")) {
    country = "brazil";
  } else if (host.startsWith("bo.") || host.includes("bolivia")) {
    country = "bolivia";
  }

  // Procesar routing de internacionalización
  const response = handleI18nRouting(request);

  // Agregar headers para identificar el país/base de datos
  response.headers.set("x-country", country);
  response.headers.set(
    "x-database",
    country === "brazil" ? "babyspa_brazil" : "babyspa_bolivia"
  );

  return response;
}

export const config = {
  // Matcher para todas las rutas excepto API, archivos estáticos y Next.js internos
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
