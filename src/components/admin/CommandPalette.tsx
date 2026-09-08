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

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const rows = useMemo(() => {
    const n = q.toLowerCase();
    return ACTIONS.filter((a) => `${a.label} ${a.hint}`.toLowerCase().includes(n));
  }, [q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-24">
      <div className="w-full max-w-lg overflow-hidden rounded-[12px] border border-bas-hairline bg-bas-canvas">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Jump to a page or action"
          className="h-12 w-full border-b border-bas-hairline bg-transparent px-4 text-sm text-bas-heading outline-none"
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter" && rows[0]) {
              router.push(rows[0].href);
              onClose();
            }
          }}
        />
        <ul className="max-h-80 overflow-y-auto p-2">
          {rows.map((a) => (
            <li key={a.href}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-[6px] px-3 py-2 text-left text-sm hover:bg-bas-card"
                onClick={() => {
                  router.push(a.href);
                  onClose();
                }}
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
