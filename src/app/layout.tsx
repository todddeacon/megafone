import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megafone.co'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Megafone',
    template: '%s — Megafone',
  },
  description: 'Fan campaigns that get answers. Ask questions, build support, hold clubs accountable.',
  openGraph: {
    siteName: 'Megafone',
    type: 'website',
    locale: 'en_GB',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'Megafone' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@megafone',
    images: ['/api/og'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
