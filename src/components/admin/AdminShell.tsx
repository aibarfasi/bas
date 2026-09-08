"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BasLogo } from "@/components/brand/BasLogo";
import { CommandPalette } from "@/components/admin/CommandPalette";
import { MarketSwitch } from "@/components/admin/MarketSwitch";
import { ToastProvider, useToast } from "@/components/admin/Toast";
import { IconHome, IconPanel, IconSearch, Kbd } from "@/components/admin/icons";
import { AppearanceToggles } from "@/components/theme/AppearanceToggles";
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

const RAIL_KEY = "bas-admin-rail";

function desktopRail() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
}

function ShellInner({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [drawer, setDrawer] = useState(false);
  const [rail, setRail] = useState(true);
  const [wide, setWide] = useState(false);
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
    try {
      if (localStorage.getItem(RAIL_KEY) === "0") setRail(false);
    } catch {
      /* stay */
    }
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setDrawer(false);
  }, [path]);

  useEffect(() => {
    document.body.style.overflow = drawer || cmd ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer, cmd]);

  function toggleRail() {
    if (desktopRail()) {
      setRail((v) => {
        const next = !v;
        try {
          localStorage.setItem(RAIL_KEY, next ? "1" : "0");
        } catch {
          /* stay */
        }
        return next;
      });
    } else setDrawer((v) => !v);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing =
        e.target instanceof HTMLElement &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) || e.target.isContentEditable);
      if (!typing && e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setCmd(true);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd((v) => !v);
        return;
      }
      if (!typing && e.key === "[" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        toggleRail();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  async function setMaintenance(nextPaused: boolean) {
    await adminFetch("/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({ maintenance: nextPaused }),
    });
    toast("ok", nextPaused ? "Market paused" : "Market open");
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
    <div className="flex h-dvh min-h-0 w-full overflow-hidden bg-bas-canvas p-3 text-bas-body sm:p-4 md:p-5">
      <div className="flex min-h-0 min-w-0 flex-1 gap-3 sm:gap-4 md:gap-5">
          <aside
            className={`admin-panel fixed z-30 flex w-[min(18rem,calc(100vw-1.5rem))] flex-col rounded-[12px] border border-bas-hairline bg-bas-surface-soft p-4 transition-transform md:static md:z-10 md:h-full md:w-56 md:p-4 lg:w-56 ${
              drawer
                ? "inset-y-3 left-3 translate-x-0 sm:inset-y-4 sm:left-4 md:inset-auto"
                : "inset-y-3 left-3 -translate-x-[120%] sm:inset-y-4 sm:left-4 md:inset-auto"
            } ${rail ? "md:flex md:translate-x-0" : "md:hidden"}`}
          >
            <div className="flex items-center">
              <Link href="/admin" className="flex items-center" aria-label="BAS operator">
                <BasLogo className="h-7 w-auto" />
              </Link>
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-bas-muted">Operator</p>
            <nav className="mt-5 flex-1 space-y-5 overflow-y-auto pr-1">
              {GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="mb-1.5 px-3 text-[10px] uppercase tracking-[0.16em] text-bas-muted">
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
                          className={`flex min-h-9 items-center justify-between rounded-[8px] px-3 py-1.5 text-[13px] tracking-[-0.01em] ${
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
            <div className="admin-safe mt-4 flex flex-col gap-1 border-t border-bas-hairline pt-3 text-sm">
              <button type="button" onClick={logout} className="min-h-9 rounded-[8px] px-3 text-left text-[13px] text-bas-down hover:bg-bas-down/10">
                Sign out
              </button>
            </div>
          </aside>

          <div className="admin-panel flex min-h-0 min-w-0 flex-1 flex-col rounded-[12px] border border-bas-hairline bg-bas-surface-soft">
            <header className="relative flex min-h-14 shrink-0 items-center gap-2 border-b border-bas-hairline px-3 sm:gap-3 sm:px-4 md:px-5">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  className="bas-mac-icon bg-bas-card text-bas-heading"
                  onClick={toggleRail}
                  aria-label={(wide ? rail : drawer) ? "Hide sidebar" : "Show sidebar"}
                  title="Toggle sidebar ["
                >
                  <IconPanel close={wide ? rail : drawer} />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-bas-heading">{pageTitle(path)}</p>
                  <p className="hidden text-[11px] text-bas-muted sm:block">Operator</p>
                </div>
              </div>
              <div className="hidden min-w-0 flex-1 justify-center px-2 md:flex">
                <button
                  type="button"
                  onClick={() => setCmd(true)}
                  className="admin-field flex h-8 w-full max-w-xl items-center gap-2 px-3 text-[13px] text-bas-muted transition-colors hover:text-bas-heading"
                >
                  <IconSearch className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-left">Search pages and actions</span>
                  <Kbd>/</Kbd>
                </button>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 md:ml-0">
                <button
                  type="button"
                  className="bas-mac-icon text-bas-muted hover:bg-bas-card hover:text-bas-heading md:hidden"
                  onClick={() => setCmd(true)}
                  aria-label="Search"
                >
                  <IconSearch className="h-5 w-5" />
                </button>
                <MarketSwitch paused={!!nav?.maintenance} onConfirm={setMaintenance} />
                <AppearanceToggles />
                <Link
                  href="/"
                  className="bas-mac-icon text-bas-muted hover:bg-bas-card hover:text-bas-heading"
                  aria-label="Home"
                >
                  <IconHome />
                </Link>
              </div>
            </header>
            <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5">
              {children}
            </main>
          </div>
      </div>
      {drawer ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-bas-overlay md:hidden"
          aria-label="Close menu"
          onClick={() => setDrawer(false)}
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
