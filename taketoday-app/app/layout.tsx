import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site";
import { SiteProviders } from "./providers";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  verification: {
    google: "epU6P2tImA1YEYB6xgFCL-vIqNFzPlQ133NiuKcgq8Y",
  },
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    siteName: SITE.name,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(inter.variable, instrument.variable, jetbrains.variable, "font-sans", geist.variable)}
    >
      <body className="grain font-sans bg-paper text-ink min-h-screen">
        <SiteProviders>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </SiteProviders>
        <Analytics />
      </body>
    </html>
  );
}
