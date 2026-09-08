"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const ACTIONS = [
  { href: "/admin", label: "Overview", hint: "Dashboard" },
  { href: "/admin/agents", label: "Sellers", hint: "Featured agents" },
  { href: "/admin/agents/new", label: "Add seller", hint: "Create hireable agent" },
  { href: "/admin/catalog", label: "Catalog", hint: "8004scan list" },
  { href: "/admin/hires", label: "Hires", hint: "Sessions and jobs" },
  { href: "/admin/proofs", label: "Proofs", hint: "Altana and x402" },
  { href: "/admin/allowlist", label: "Allowlist", hint: "Spend contracts" },
  { href: "/admin/health", label: "Health", hint: "Probe faces and rails" },
  { href: "/admin/submission", label: "Submission", hint: "Intake and deploy" },
  { href: "/admin/settings", label: "Settings", hint: "Banner and wallets" },
  { href: "/admin/activity", label: "Activity", hint: "Audit trail" },
  { href: "/market", label: "Open market", hint: "Public catalog" },
  { href: "/docs/judges", label: "Judge path", hint: "90-second demo" },
];

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) {
      setQ("");
      setActive(0);
    }
  }, [open]);

  const rows = useMemo(() => {
    const n = q.toLowerCase();
    return ACTIONS.filter((a) => `${a.label} ${a.hint}`.toLowerCase().includes(n));
  }, [q]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  if (!open) return null;

  function go(href: string) {
    router.push(href);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-start sm:px-4 sm:pt-24">
      <div className="w-full max-w-lg overflow-hidden rounded-t-[16px] border border-bas-hairline bg-bas-canvas sm:rounded-[12px]">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Jump to a page or action"
          className="h-14 w-full border-b border-bas-hairline bg-transparent px-4 text-base text-bas-heading outline-none sm:h-12 sm:text-sm"
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
        <ul className="max-h-[50dvh] overflow-y-auto p-2 sm:max-h-80">
          {rows.map((a, i) => (
            <li key={a.href}>
              <button
                type="button"
                className={`flex min-h-12 w-full items-center justify-between rounded-[6px] px-3 py-2 text-left text-sm ${
                  i === active ? "bg-bas-card" : "hover:bg-bas-card"
                }`}
                onClick={() => go(a.href)}
              >
                <span className="text-bas-heading">{a.label}</span>
                <span className="text-xs text-bas-muted">{a.hint}</span>
              </button>
            </li>
          ))}
          {rows.length === 0 ? (
            <li className="px-3 py-4 text-sm text-bas-muted">No matches</li>
          ) : null}
        </ul>
      </div>
      <button type="button" className="absolute inset-0 -z-10" aria-label="Close" onClick={onClose} />
    </div>
  );
}
