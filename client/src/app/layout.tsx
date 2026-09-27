import type { Metadata, Viewport } from "next";
import { Nunito, Source_Sans_3 } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["600", "700", "800"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HeyBrew — Order coffee in Karachi",
    template: "%s · HeyBrew",
  },
  description:
    "Order your daily brew for delivery or pickup. Warm café drinks from HeyBrew.",
  icons: {
    icon: [{ url: "/brand/heybrew-logo.jpg", type: "image/jpeg" }],
    apple: [{ url: "/brand/heybrew-logo.jpg" }],
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    siteName: "HeyBrew",
    title: "HeyBrew — Your daily brew, delivered.",
    description:
      "Order coffee and treats for delivery or pickup in Karachi.",
    images: [
      {
        url: "/brand/heybrew-logo.jpg",
        width: 512,
        height: 512,
        alt: "HeyBrew logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "HeyBrew",
    description: "Your daily brew, delivered.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF6F0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunito.variable} ${sourceSans.variable}`}>
      <body className="min-h-dvh overflow-x-clip">
        <Providers>
          <Header />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
