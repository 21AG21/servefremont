import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { InlineScript } from "@/components/InlineScript";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ServeFremont",
  description:
    "Find volunteer spots around Fremont and see how far each one is from you.",
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
            data-goatcounter={`https://${process.env.NEXT_PUBLIC_GOATCOUNTER}.goatcounter.com/count`}
            async
            src="//gc.zgo.at/count.js"
          />
        )}
      </body>
    </html>
  );
}
