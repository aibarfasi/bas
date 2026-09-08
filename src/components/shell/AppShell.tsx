import { BinanceSidePattern } from "@/components/shell/BinanceSidePattern";
import { Footer } from "@/components/shell/Footer";
import { Header } from "@/components/shell/Header";
import { SiteBanner } from "@/components/shell/SiteBanner";
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
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1440px] flex-1 flex-col border-x border-bas-hairline">
        <Header light={light} />
        <SiteBanner />
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
        <Footer light={light} />
      </div>
    </div>
  );
}
