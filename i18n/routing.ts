import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Locales soportados
  locales: ["es", "pt-BR"],

  // Locale por defecto
  defaultLocale: "es",

  // Configuración de dominios para multi-tenant
  // bo.babyspa.online → español (Bolivia)
  // br.babyspa.online → portugués (Brasil)
  domains: [
    {
      domain: "bo.babyspa.online",
      defaultLocale: "es",
      locales: ["es"],
    },
    {
      domain: "br.babyspa.online",
      defaultLocale: "pt-BR",
      locales: ["pt-BR"],
    },
    {
      // Desarrollo local
      domain: "localhost:3000",
      defaultLocale: "es",
      locales: ["es", "pt-BR"],
    },
  ],

  // No mostrar prefijo de locale en la URL cuando es el default del dominio
  localePrefix: {
    mode: "as-needed",
  },
});

export type Locale = (typeof routing.locales)[number];
