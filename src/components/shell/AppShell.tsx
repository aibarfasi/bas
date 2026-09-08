import { Footer } from "@/components/shell/Footer";
import { Header } from "@/components/shell/Header";
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
      className={`flex min-h-full flex-col ${
        light ? "theme-light bg-bas-canvas-light text-bas-ink" : "bg-bas-canvas text-bas-body"
      }`}
    >
      <Header light={light} />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
      <Footer light={light} />
    </div>
  );
}
