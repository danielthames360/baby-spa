import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { SessionProvider } from "@/components/providers/session-provider";
import { IntroOverlay } from "@/components/layout/intro-overlay";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import { getSession } from "@/lib/auth";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validar que el locale sea soportado
  if (!routing.locales.includes(locale as "es" | "pt-BR")) {
    notFound();
  }

  // Cargar sesión y mensajes en paralelo
  const [session, messages] = await Promise.all([
    getSession(),
    getMessages(),
  ]);

  return (
    <SessionProvider session={session}>
      <NextIntlClientProvider messages={messages}>
        <IntroOverlay>
          {children}
        </IntroOverlay>
        <Toaster position="top-right" />
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
