import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Baby Spa",
    template: "%s | Baby Spa",
  },
  description: "Sistema de gestión para spa de bebés - Hidroterapia y estimulación temprana",
};

// Este layout raíz solo maneja el HTML básico
// El locale layout en app/[locale]/layout.tsx maneja los providers
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
