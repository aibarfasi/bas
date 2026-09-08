import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { Providers } from "@/app/providers";
import { appearanceBootScript } from "@/components/theme/ThemeProvider";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-bas-sans",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
});

const plex = IBM_Plex_Mono({
  variable: "--font-bas-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: "%s · BAS",
  },
  description: SITE_DESCRIPTION,
  applicationName: "BAS",
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "BAS",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookie = (await headers()).get("cookie");
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${inter.className} ${plex.variable} min-h-dvh antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceBootScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <Providers cookie={cookie}>{children}</Providers>
      </body>
    </html>
  );
}
