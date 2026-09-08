"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { adminFetch } from "@/lib/admin/client";
import type { AuditEvent } from "@/lib/admin/types";
import { timeAgo } from "@/lib/format";

export default function AdminActivityPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<{ events: AuditEvent[] }>("/api/admin/activity")
      .then((d) => setEvents(d.events))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  const rows = useMemo(() => {
    if (!q) return events;
    const n = q.toLowerCase();
    return events.filter((e) => `${e.action} ${e.detail}`.toLowerCase().includes(n));
  }, [events, q]);

  return (
    <div>
      <PageHeader title="Activity" desc="Operator audit trail for this runtime. Last 80 writes." />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter action or detail"
        className="mt-4 h-10 w-full max-w-md rounded-[6px] border border-bas-hairline bg-bas-canvas px-3 text-sm"
      />
      {error ? <p className="mt-3 text-sm text-bas-down">{error}</p> : null}
      <ul className="mt-6 divide-y divide-bas-hairline rounded-[12px] bg-bas-card">
        {rows.map((e) => (
          <li key={e.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:justify-between">
            <div>
              <div className="text-sm text-bas-heading">{e.action}</div>
              <div className="text-xs text-bas-muted">{e.detail}</div>
            </div>
            <div className="num text-xs text-bas-muted">{timeAgo(new Date(e.at).toISOString())}</div>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="px-4 py-6 text-sm text-bas-muted">No matching writes.</li>
        ) : null}
      </ul>
    </div>
  );
}
