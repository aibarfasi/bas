"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { WalletButton } from "@/components/wallet/WalletButton";
import { useCompareStore } from "@/lib/compare/store";

const NAV = [
  { href: "/market", label: "Market" },
  { href: "/compare", label: "Compare" },
  { href: "/advantage", label: "Advantage" },
  { href: "/docs/judges", label: "Judges" },
];

export function Header({ light = false }: { light?: boolean }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const count = useCompareStore((s) => s.ids.length);

  return (
    <header
      className={`sticky top-0 z-40 h-16 border-b ${
        light
          ? "border-bas-hairline-light bg-bas-canvas-light"
          : "border-bas-hairline bg-bas-canvas"
      }`}
    >
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-bas-primary">
              BAS
            </span>
            <span
              className={`hidden text-xs sm:inline ${light ? "text-bas-muted" : "text-bas-muted"}`}
            >
              BNB Agent Studio Marketplace
            </span>
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            {NAV.map((item) => {
              const active = path === item.href || path.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm ${
                    active
                      ? "text-bas-primary"
                      : light
                        ? "text-bas-ink hover:text-bas-ink"
                        : "text-bas-body hover:text-white"
                  }`}
                >
                  {item.label}
                  {item.href === "/compare" && count > 0 ? (
                    <span className="num ml-1 text-bas-primary">{count}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <WalletButton light={light} />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[6px] md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <span className="text-lg">☰</span>
          </button>
        </div>
      </div>
      {open ? (
        <div
          className={`border-t px-4 py-3 md:hidden ${
            light
              ? "border-bas-hairline-light bg-bas-canvas-light"
              : "border-bas-hairline bg-bas-card"
          }`}
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}
