"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BasLogo } from "@/components/brand/BasLogo";
import { CommandPalette } from "@/components/admin/CommandPalette";
import { ToastProvider, useToast } from "@/components/admin/Toast";
import { adminFetch } from "@/lib/admin/client";

type NavCounts = {
  sellers: number;
  hireable: number;
  hires: { active: number; sessions: number };
  maintenance: boolean;
  notice: boolean;
  intakeSubmitted: boolean;
};

const GROUPS = [
  {
    label: "Market",
    items: [
      { href: "/admin", label: "Overview" },
      { href: "/admin/agents", label: "Sellers" },
      { href: "/admin/catalog", label: "Catalog" },
    ],
  },
  {
    label: "Ops",
    items: [
      { href: "/admin/hires", label: "Hires" },
      { href: "/admin/proofs", label: "Proofs" },
      { href: "/admin/allowlist", label: "Allowlist" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/health", label: "Health" },
      { href: "/admin/submission", label: "Submission" },
      { href: "/admin/settings", label: "Settings" },
      { href: "/admin/activity", label: "Activity" },
    ],
  },
];

const TABS = [
  { href: "/admin", label: "Home" },
  { href: "/admin/catalog", label: "Catalog" },
  { href: "/admin/hires", label: "Hires" },
  { href: "/admin/health", label: "Health" },
];

function pageTitle(path: string) {
  if (path === "/admin") return "Overview";
  if (path.startsWith("/admin/agents/new")) return "Add seller";
  if (path.startsWith("/admin/agents/")) return "Seller";
  if (path.startsWith("/admin/agents")) return "Sellers";
  if (path.startsWith("/admin/catalog")) return "Catalog";
  if (path.startsWith("/admin/hires")) return "Hires";
  if (path.startsWith("/admin/proofs")) return "Proofs";
  if (path.startsWith("/admin/allowlist")) return "Allowlist";
  if (path.startsWith("/admin/health")) return "Health";
  if (path.startsWith("/admin/submission")) return "Submission";
  if (path.startsWith("/admin/settings")) return "Settings";
  if (path.startsWith("/admin/activity")) return "Activity";
  return "Operator";
}

function ShellInner({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [cmd, setCmd] = useState(false);
  const [nav, setNav] = useState<NavCounts | null>(null);

  async function loadNav() {
    try {
      setNav(await adminFetch<NavCounts>("/api/admin/nav"));
    } catch {
      /* stay */
    }
  }

  useEffect(() => {
    loadNav();
    const t = window.setInterval(loadNav, 30_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    document.body.style.overflow = open || cmd ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, cmd]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  async function toggleMaintenance() {
    const next = !nav?.maintenance;
    await adminFetch("/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({ maintenance: next }),
    });
    toast("ok", next ? "Maintenance on" : "Market open");
    await loadNav();
  }

  function badge(href: string) {
    if (!nav) return null;
    if (href === "/admin/agents") return nav.hireable;
    if (href === "/admin/hires") return nav.hires.active;
    if (href === "/admin/submission") return nav.intakeSubmitted ? null : "!";
    return null;
  }

  return (
    <div className="flex min-h-dvh bg-bas-canvas text-bas-body">
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[min(18rem,88vw)] flex-col border-r border-bas-hairline bg-bas-canvas p-4 pt-[max(1rem,env(safe-area-inset-top))] transition-transform md:static md:w-56 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin" className="flex items-center" aria-label="BAS operator">
            <BasLogo className="h-7 w-auto" />
          </Link>
          <button type="button" className="h-10 px-2 text-sm md:hidden" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
        <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-bas-muted">Operator</p>
        <nav className="mt-6 flex-1 space-y-5 overflow-y-auto">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-3 text-[10px] uppercase tracking-[0.16em] text-bas-muted">
                {group.label}
              </p>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const active =
                    item.href === "/admin" ? path === "/admin" : path.startsWith(item.href);
                  const count = badge(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex min-h-11 items-center justify-between rounded-[6px] px-3 py-2 text-sm ${
                        active
                          ? "bg-bas-primary text-bas-on-primary"
                          : "text-bas-body hover:bg-bas-card"
                      }`}
                    >
                      <span>{item.label}</span>
                      {count != null && count !== 0 ? (
                        <span className={`num text-[11px] ${active ? "" : "text-bas-muted"}`}>
                          {count}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="admin-safe mt-4 flex flex-col gap-2 text-sm">
          <button type="button" className="min-h-11 text-left text-bas-muted hover:text-bas-heading" onClick={() => setCmd(true)}>
            Search
          </button>
          <Link href="/market" className="flex min-h-11 items-center text-bas-muted hover:text-bas-heading">
            View market
          </Link>
          <button type="button" onClick={logout} className="min-h-11 text-left text-bas-down">
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-3 border-b border-bas-hairline bg-bas-canvas/95 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-[6px] bg-bas-card text-sm md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Open menu"
            >
              ☰
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-bas-heading md:hidden">{pageTitle(path)}</p>
              <p className="hidden text-sm text-bas-muted md:block">BAS operator console</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggleMaintenance}
              className={`h-11 rounded-[6px] px-2 text-xs sm:px-3 ${
                nav?.maintenance ? "text-bas-down" : "text-bas-up"
              }`}
            >
              {nav?.maintenance ? "Paused" : "Open"}
            </button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-[6px] text-sm text-bas-muted"
              onClick={() => setCmd(true)}
              aria-label="Search"
            >
              ⌕
            </button>
            <Link href="/" className="hidden h-11 items-center px-2 text-sm text-bas-primary sm:inline-flex">
              Home
            </Link>
          </div>
        </header>
        <main className="flex-1 px-3 py-5 sm:px-4 md:px-6 md:py-6 pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-6">
          {children}
        </main>
      </div>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <nav className="admin-safe fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-bas-hairline bg-bas-canvas/95 backdrop-blur-md md:hidden">
        {TABS.map((item) => {
          const active =
            item.href === "/admin" ? path === "/admin" : path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-12 flex-col items-center justify-center text-[11px] ${
                active ? "text-bas-primary" : "text-bas-muted"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          className="flex min-h-12 flex-col items-center justify-center text-[11px] text-bas-muted"
          onClick={() => setOpen(true)}
        >
          More
        </button>
      </nav>
      <CommandPalette open={cmd} onClose={() => setCmd(false)} />
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ShellInner>{children}</ShellInner>
    </ToastProvider>
  );
}
