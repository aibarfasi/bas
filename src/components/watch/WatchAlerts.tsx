"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { AgentsResponse } from "@/lib/agents/types";
import { toWatchSnapshot, useWatchStore } from "@/lib/watch/store";

export function WatchAlerts() {
  const alerts = useWatchStore((s) => s.alerts);
  const ingest = useWatchStore((s) => s.ingest);
  const dismiss = useWatchStore((s) => s.dismiss);
  const clearAlerts = useWatchStore((s) => s.clearAlerts);
  const watched = useWatchStore((s) => s.items.length);

  useEffect(() => {
    if (!watched) return;
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d: AgentsResponse) => ingest(d.agents.map(toWatchSnapshot)))
      .catch(() => null);
  }, [watched, ingest]);

  if (!alerts.length) return null;

  return (
    <div className="border-b border-bas-hairline bg-bas-card px-4 py-2 md:px-6">
      <div className="mx-auto flex max-w-[1440px] items-start justify-between gap-3">
        <ul className="space-y-1 text-xs text-bas-body">
          {alerts.slice(0, 3).map((a) => (
            <li key={a.id}>
              <Link href="/watch" className="text-bas-primary">
                {a.message}
              </Link>
              <button type="button" className="ml-2 text-bas-muted" onClick={() => dismiss(a.id)}>
                dismiss
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="shrink-0 text-xs text-bas-muted" onClick={clearAlerts}>
          Clear
        </button>
      </div>
    </div>
  );
}
