"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";

type Check = { id: string; ok: boolean; detail: string; ms: number };

export default function AdminHealthPage() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [ok, setOk] = useState<boolean | null>(null);
  const [at, setAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const data = await adminFetch<{ ok: boolean; checkedAt: string; checks: Check[] }>(
        "/api/admin/health",
      );
      setChecks(data.checks);
      setOk(data.ok);
      setAt(data.checkedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Health check failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    run();
  }, []);

  return (
    <div>
      <PageHeader
        title="Health"
        desc="Probe 8004scan, Pancake quotes, Altana receipts, and every BAS seller face."
        actions={
          <Button variant="secondary" disabled={busy} onClick={run}>
            {busy ? "Checking…" : "Re-run"}
          </Button>
        }
      />
      <div className="mt-4 text-sm">
        {ok == null ? (
          <span className="text-bas-muted">Running probes…</span>
        ) : ok ? (
          <span className="text-bas-up">All rails responding</span>
        ) : (
          <span className="text-bas-down">One or more rails failed</span>
        )}
        {at ? <span className="num ml-3 text-xs text-bas-muted">{at}</span> : null}
      </div>
      {error ? <p className="mt-3 text-sm text-bas-down">{error}</p> : null}
      <ul className="mt-6 divide-y divide-bas-hairline rounded-[12px] bg-bas-card">
        {checks.map((c) => (
          <li key={c.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-bas-heading">{c.id}</div>
              <div className="text-xs text-bas-muted">{c.detail}</div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="num text-bas-muted">{c.ms}ms</span>
              <span className={c.ok ? "text-bas-up" : "text-bas-down"}>{c.ok ? "ok" : "down"}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
