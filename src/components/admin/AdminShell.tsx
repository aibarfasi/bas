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
        className={`fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-bas-hairline bg-bas-canvas p-4 transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link href="/admin" className="flex items-center" aria-label="BAS operator">
          <BasLogo className="h-7 w-auto" />
        </Link>
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
                      onClick={() => setOpen(false)}
                      className={`flex items-center justify-between rounded-[6px] px-3 py-2 text-sm ${
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
        <div className="mt-4 flex flex-col gap-2 text-xs">
          <button type="button" className="text-left text-bas-muted hover:text-bas-heading" onClick={() => setCmd(true)}>
            Search ⌘K
          </button>
          <Link href="/market" className="text-bas-muted hover:text-bas-heading">
            View market
          </Link>
          <button type="button" onClick={logout} className="text-left text-bas-down">
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b border-bas-hairline px-4 md:px-6">
          <button type="button" className="text-sm md:hidden" onClick={() => setOpen((v) => !v)}>
            Menu
          </button>
          <p className="hidden text-sm text-bas-muted sm:block">BAS operator console</p>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={toggleMaintenance}
              className={nav?.maintenance ? "text-bas-down" : "text-bas-up"}
            >
              {nav?.maintenance ? "Maintenance" : "Market open"}
            </button>
            <button type="button" className="hidden text-bas-muted md:inline" onClick={() => setCmd(true)}>
              ⌘K
            </button>
            <Link href="/" className="text-bas-primary">
              Home
            </Link>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}
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
