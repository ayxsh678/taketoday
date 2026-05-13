// auth() calls firebase-admin which requires runtime env vars — opt out of
// static generation so firebase is never initialized during the build phase.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TakeToday — News. Simplified.",
  description:
    "The day's most important stories, cut down to what actually matters — and why you should care. No noise. No clickbait.",
  openGraph: {
    title: "TakeToday — News. Simplified.",
    description: "News without noise. Built for people who want the insight.",
    siteName: "TakeToday",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrument.variable} ${jetbrains.variable}`}
    >
      <body className="grain font-sans bg-paper text-ink min-h-screen">
        <SessionProvider session={session}>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <Analytics />
        </SessionProvider>
      </body>
    </html>
  );
}
