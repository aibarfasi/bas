import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { Providers } from "@/app/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-bas-sans",
  subsets: ["latin"],
});

const plex = IBM_Plex_Mono({
  variable: "--font-bas-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BAS — BNB Agent Studio Marketplace",
  description:
    "Find, compare, and hire ERC-8004 agents on BNB Smart Chain. Official Build the Era marketplace submission.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plex.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
