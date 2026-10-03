import type { Metadata } from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import { publicEnv } from "@/lib/env";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { BackToTop } from "@/components/motion/back-to-top";
import { PageTransition } from "@/components/motion/page-transition";
import "./globals.css";

/** Display face: tight, condensed-ish grotesk for headline impact. */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
  weight: ["600", "700", "800", "900"],
});

/** Text face: highly legible at body and UI sizes. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/** Technical face: SKUs, specs, order numbers, prices in data tables. */
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-jetbrains",
  display: "swap",
});

const env = publicEnv();

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: {
    default: `${env.storeName} — Premium Motorcycle Gear & Accessories`,
    template: `%s | ${env.storeName}`,
  },
  description:
    "Premium motorcycle helmets, riding jackets, gloves, boots and touring gear. Certified protection, genuine products, secure payments and fast delivery across India.",
  keywords: [
    "motorcycle gear",
    "riding helmets",
    "riding jackets",
    "motorcycle accessories",
    "touring gear",
    "riding boots",
    "riding gloves",
    env.storeName,
  ],
  applicationName: env.storeName,
  authors: [{ name: env.storeName }],
  creator: env.storeName,
  publisher: env.storeName,
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: env.storeName,
    title: `${env.storeName} — Premium Motorcycle Gear & Accessories`,
    description:
      "Premium riding gear and motorcycle essentials built for every journey.",
    url: env.appUrl,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${env.storeName} — Premium Motorcycle Gear & Accessories`,
    description: "Premium riding gear and motorcycle essentials built for every journey.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: "/" },
  category: "shopping",
};

export const viewport = {
  themeColor: "#08090a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
} as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${archivo.variable} ${inter.variable} ${mono.variable}`}
    >
      <body className="min-h-dvh bg-ink-950 text-bone-50 antialiased">
        {/* Keyboard users land here first. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-flame-500 focus:px-4 focus:py-2.5 focus:text-2xs focus:font-bold focus:uppercase focus:tracking-[0.1em] focus:text-ink-950"
        >
          Skip to content
        </a>

        <SmoothScroll>
          <ScrollProgress />
          <div className="flex min-h-dvh flex-col">
            <SiteHeader />

            {/* The header is `sticky`, so it reserves its own space — no
                compensating padding is needed here. */}
            <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
              <PageTransition>{children}</PageTransition>
            </main>

            <SiteFooter />
          </div>
          <BackToTop />
        </SmoothScroll>
      </body>
    </html>
  );
}