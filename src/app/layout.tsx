import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

// next/font descarga y sirve las fuentes localmente — sin requests externos en runtime.
// display: 'swap' garantiza texto visible durante la carga de la fuente.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Mono sólo se usa en componentes específicos
});

export const metadata: Metadata = {
  title: {
    default: "Contabilidad Iglesia",
    template: "%s | Contabilidad Iglesia",
  },
  description: "Sistema de gestión financiera para iglesias",
  robots: { index: false, follow: false }, // Sistema interno — no indexar
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
