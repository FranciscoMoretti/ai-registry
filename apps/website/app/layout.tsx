import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

type RootLayoutProps = {
  children: ReactNode;
};

import type { Metadata } from "next";
import Script from "next/script";

const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en" suppressHydrationWarning>
     {process.env.NODE_ENV === "development" && <Script src="https://unpkg.com/react-scan/dist/auto.global.js" />}
    <body
      className={cn(
        geistSans.variable,
        geistMono.variable,
        "overflow-x-hidden font-sans antialiased"
      )}
    >
      <Providers>
        {children}
        <Analytics />

      </Providers>
    </body>
  </html>
);

export default RootLayout;
