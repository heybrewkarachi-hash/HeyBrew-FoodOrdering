import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { Providers } from "./providers";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HeyBrew Admin",
    template: "%s · HeyBrew Admin",
  },
  description: "HeyBrew staff admin — orders, catalog, and store settings",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
