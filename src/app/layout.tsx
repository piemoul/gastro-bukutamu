import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./workspace.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Buku Tamu — Gastro",
  description: "Buku tamu salesman Gastro untuk NFH, FHI, dan Gastro day Bali - Morreti X-perience",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable}`}>
      <body className="font-sans antialiased bg-ink-50 text-ink-900">{children}</body>
    </html>
  );
}
