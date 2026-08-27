import { ClerkProvider } from "@clerk/nextjs";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";

import { clientEnvironment } from "@/config/env.client";
import { AppProviders } from "@/providers/AppProviders";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "VDA Ledger",
    template: "%s · VDA Ledger",
  },
  description:
    "Import Binance and CoinDCX INR cryptocurrency transactions, review a normalized ledger and holdings, and request backend-calculated Indian VDA tax estimates.",
  applicationName: "VDA Ledger",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#06130A",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
    >
      <body>
        <ClerkProvider
          publishableKey={clientEnvironment.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          appearance={{
            variables: {
              colorPrimary: "#C8F542",
              colorBackground: "#12300F",
              colorForeground: "#FFFFFF",
              borderRadius: "12px",
              fontFamily: "var(--font-geist-sans)",
            },
          }}
        >
          <AppProviders>{children}</AppProviders>
        </ClerkProvider>
      </body>
    </html>
  );
}
