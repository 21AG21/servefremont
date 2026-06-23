import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Characterful display face for headings + the verification stamp, used sparingly.
const fraunces = Fraunces({
  variable: "--font-fraunces",
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
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Set the initial theme before paint so there's no flash. No storage —
            we always start from the OS preference. The in-app toggle is
            session-only and resets on reload. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var m=window.matchMedia('(prefers-color-scheme: dark)');document.documentElement.dataset.theme=m.matches?'dark':'light';}catch(e){}})();",
          }}
        />
      </head>
      <body className="min-h-full">
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
