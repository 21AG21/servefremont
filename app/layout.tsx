import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { InlineScript } from "@/components/InlineScript";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://servefremont.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "ServeFremont",
  description:
    "Find volunteer spots around Fremont and see how far each one is from you.",
  openGraph: {
    siteName: "ServeFremont",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
  },
};

// Match the browser chrome (mobile URL bar, etc.) to the app background.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Set the initial theme before paint so there's no flash. No storage —
            we always start from the OS preference. The in-app toggle is
            session-only and resets on reload. */}
        <InlineScript html="(function(){try{var m=window.matchMedia('(prefers-color-scheme: dark)');document.documentElement.dataset.theme=m.matches?'dark':'light';}catch(e){}})();" />
      </head>
      <body>
      {children}
      {/* Cookieless analytics (GoatCounter). Off until NEXT_PUBLIC_GOATCOUNTER
          is set to your site code, e.g. "mysite". No cookies, no personal data. */}
      {process.env.NEXT_PUBLIC_GOATCOUNTER && (
        <script
          data-goatcounter={`https://${process.env.NEXT_PUBLIC_GOATCOUNTER}.goatcounter.com/count.js`}
          async
          src="//gc.zgo.at/count.js"
        />
      )}
      <Analytics />
    </body>
    </html>
  );
}
