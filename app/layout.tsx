import type { Metadata } from "next";
import { Inter, Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Characterful display face for headings + the verification stamp, used sparingly.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

// Structural UI face for the home screen (Civic Block v2 / 3a): wordmark,
// org names, and listing titles. Squarer and more mechanical than the serif.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
      className={`${inter.variable} ${fraunces.variable} ${spaceGrotesk.variable} h-full antialiased`}
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
