"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch, Kbd } from "@/components/admin/icons";

const ACTIONS = [
  { href: "/admin", label: "Overview", hint: "Dashboard", group: "Market" },
  { href: "/admin/agents", label: "Sellers", hint: "Featured agents", group: "Market" },
  { href: "/admin/agents/new", label: "Add seller", hint: "Create hireable agent", group: "Market" },
  { href: "/admin/catalog", label: "Catalog", hint: "8004scan list", group: "Market" },
  { href: "/admin/hires", label: "Hires", hint: "Sessions and jobs", group: "Ops" },
  { href: "/admin/proofs", label: "Proofs", hint: "Altana and x402", group: "Ops" },
  { href: "/admin/allowlist", label: "Allowlist", hint: "Spend contracts", group: "Ops" },
  { href: "/admin/health", label: "Health", hint: "Probe faces and rails", group: "System" },
  { href: "/admin/submission", label: "Submission", hint: "Intake and deploy", group: "System" },
  { href: "/admin/settings", label: "Settings", hint: "Trending, banner, wallets", group: "System" },
  { href: "/admin/activity", label: "Activity", hint: "Audit trail", group: "System" },
  { href: "/market", label: "Open market", hint: "Public catalog", group: "Go" },
  { href: "/", label: "Home", hint: "Marketplace front", group: "Go" },
  { href: "/docs/judges", label: "Judge path", hint: "90-second demo", group: "Go" },
];

function mark(text: string, q: string) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-bas-primary">{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) {
      setQ("");
      setActive(0);
      return;
    }
    const t = window.setTimeout(() => input.current?.focus(), 20);
    return () => window.clearTimeout(t);
  }, [open]);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return ACTIONS.filter((a) => `${a.label} ${a.hint} ${a.group}`.toLowerCase().includes(n));
  }, [q]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  if (!open) return null;

  function go(href: string) {
    router.push(href);
    onClose();
  }

  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-start sm:px-4 sm:pt-[12vh]">
      <button type="button" className="absolute inset-0 bg-bas-overlay/90 backdrop-blur-sm" aria-label="Close search" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="admin-panel relative z-10 w-full max-w-xl overflow-hidden rounded-t-[16px] border border-bas-hairline bg-bas-surface-soft sm:rounded-[12px]"
      >
        <label className="flex items-center gap-3 border-b border-bas-hairline px-4">
          <IconSearch className="h-5 w-5 shrink-0 text-bas-muted" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search pages and actions"
            className="h-14 min-w-0 flex-1 bg-transparent text-base text-bas-heading outline-none placeholder:text-bas-muted sm:h-12 sm:text-sm"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(rows.length - 1, i + 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(0, i - 1));
              }
              if (e.key === "Enter" && rows[active]) go(rows[active].href);
            }}
          />
          <Kbd>esc</Kbd>
        </label>
        <ul className="max-h-[50dvh] overflow-y-auto p-2 sm:max-h-[min(24rem,50dvh)]">
          {rows.map((a, i) => {
            const showGroup = a.group !== lastGroup;
            lastGroup = a.group;
            return (
              <li key={a.href}>
                {showGroup ? (
                  <p className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-[0.16em] text-bas-muted first:pt-1">
                    {a.group}
                  </p>
                ) : null}
                <button
                  type="button"
                  className={`flex min-h-9 w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-left text-[13px] tracking-[-0.01em] ${
                    i === active ? "bg-bas-elevated text-bas-heading" : "text-bas-body hover:bg-bas-card"
                  }`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(a.href)}
                >
                  <span className="truncate font-medium">{mark(a.label, q.trim())}</span>
                  <span className="shrink-0 text-xs text-bas-muted">{mark(a.hint, q.trim())}</span>
                </button>
              </li>
            );
          })}
          {rows.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-bas-muted">
              No matches for “{q.trim()}”
            </li>
          ) : null}
        </ul>
        <div className="hidden items-center gap-4 border-t border-bas-hairline px-4 py-2 text-[11px] text-bas-muted sm:flex">
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            Move
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>↵</Kbd>
            Open
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <Kbd>/</Kbd>
            Open
          </span>
        </div>
      </div>
    </div>
  );
}
