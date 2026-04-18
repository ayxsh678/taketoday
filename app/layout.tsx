import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "TakeToday",
  description:
    "News that actually matters — clear, sharp, and meaningful breakdowns for people who hate fluff.",
};

export default function RootLayout({
  children,
  showTicker = true,
}: Readonly<{
  children: React.ReactNode;
  showTicker?: boolean;
}>) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink">
        <Navbar showTicker={showTicker} />
        <main className="mx-auto w-full max-w-[1400px] px-4 pt-8 md:pt-12">
          {children}
        </main>
      </body>
    </html>
  );
}
