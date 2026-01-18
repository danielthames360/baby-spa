import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Obtener el locale solicitado
  const requested = await requestLocale;

  // Validar que sea un locale soportado, sino usar el default
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,

    // Timezone por defecto (Bolivia usa BOT, Brasil usa BRT)
    timeZone: locale === "pt-BR" ? "America/Sao_Paulo" : "America/La_Paz",

    // Formatos personalizados
    formats: {
      dateTime: {
        short: {
          day: "numeric",
          month: "short",
          year: "numeric",
        },
        long: {
          day: "numeric",
          month: "long",
          year: "numeric",
          weekday: "long",
        },
        time: {
          hour: "2-digit",
          minute: "2-digit",
        },
      },
      number: {
        currency: {
          style: "currency",
          currency: locale === "pt-BR" ? "BRL" : "BOB",
        },
      },
    },

    // Manejo de errores
    onError(error) {
      if (error.code === "MISSING_MESSAGE") {
        console.warn("Missing translation:", error.message);
      } else {
        console.error(error);
      }
    },
  };
});
