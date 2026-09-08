import { BinanceSidePattern } from "@/components/shell/BinanceSidePattern";
import { Footer } from "@/components/shell/Footer";
import { Header } from "@/components/shell/Header";
import { SiteBanner } from "@/components/shell/SiteBanner";
import { WatchAlerts } from "@/components/watch/WatchAlerts";
import type { ReactNode } from "react";

export function AppShell({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <div
      className={`relative flex min-h-dvh w-full flex-1 flex-col overflow-x-hidden ${
        light ? "theme-light bg-bas-canvas-light text-bas-ink" : "bg-bas-canvas text-bas-body"
      }`}
    >
      <BinanceSidePattern />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[8px] focus:bg-bas-primary focus:px-4 focus:py-2 focus:text-[13px] focus:font-medium focus:text-bas-on-primary"
      >
        Skip to content
      </a>
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col border-x border-bas-hairline">
        <Header light={light} />
        <WatchAlerts />
        <SiteBanner />
        <main id="main" className="flex-1 px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
        <Footer light={light} />
      </div>
    </div>
  );
}
