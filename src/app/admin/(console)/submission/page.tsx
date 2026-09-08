"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/admin/Toast";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { FEATURED_AGENTS } from "@/lib/agents/featured";
import type { SiteSettings } from "@/lib/admin/types";

export default function AdminSubmissionPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<{ settings: SiteSettings }>("/api/admin/settings")
      .then((d) => setSettings(d.settings))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  async function markIntake(value: boolean) {
    const data = await adminFetch<{ settings: SiteSettings }>("/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({ intakeSubmitted: value }),
    });
    setSettings(data.settings);
    toast("ok", value ? "Intake marked submitted" : "Intake marked open");
  }

  if (error) return <p className="text-sm text-bas-down">{error}</p>;
  if (!settings) return <p className="text-sm text-bas-muted">Loading submission…</p>;

  const items = [
    { ok: Boolean(settings.liveUrl), t: "Public URL", d: settings.liveUrl },
    { ok: Boolean(settings.repoUrl), t: "Public repo", d: settings.repoUrl },
    { ok: settings.intakeSubmitted, t: "Intake form submitted in the browser", d: settings.intakeUrl },
    { ok: !settings.maintenance, t: "Market not in maintenance", d: settings.maintenance ? "Paused" : "Open" },
    {
      ok: FEATURED_AGENTS.every((a) => Boolean(settings.deployments[a.id]?.tokenId || settings.deployments[a.id]?.txHash)),
      t: "bag deploy ids pasted",
      d: "Settings → Deploy map",
    },
  ];

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Submission"
        desc="Build the Era intake status. Tick the form in the browser — programmatic POST is 401."
        actions={
          <Button href={settings.intakeUrl} variant="secondary">
            Open intake form
          </Button>
        }
      />

      <ul className="mt-6 divide-y divide-bas-hairline rounded-[12px] bg-bas-card">
        {items.map((item) => (
          <li key={item.t} className="flex items-start justify-between gap-4 px-4 py-3">
            <div>
              <div className="text-sm text-bas-heading">{item.t}</div>
              <div className="break-all text-xs text-bas-muted">{item.d}</div>
            </div>
            <span className={item.ok ? "text-xs text-bas-up" : "text-xs text-bas-down"}>
              {item.ok ? "ready" : "open"}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={() => markIntake(true)}>Mark intake submitted</Button>
        <Button variant="secondary" onClick={() => markIntake(false)}>
          Mark still open
        </Button>
        <Button href="/admin/settings" variant="secondary">
          Deploy map
        </Button>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-bas-heading">Seller deploy coverage</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {FEATURED_AGENTS.map((a) => {
          const d = settings.deployments[a.id] ?? {};
          const ready = Boolean(d.tokenId || d.txHash);
          return (
            <li key={a.id} className="flex justify-between gap-3 rounded-[8px] bg-bas-card px-4 py-3">
              <span>
                {a.name}
                <span className="num ml-2 text-xs text-bas-muted">{d.tokenId || a.tokenId}</span>
              </span>
              <span className={ready ? "text-xs text-bas-up" : "text-xs text-bas-muted"}>
                {ready ? "mapped" : "demo id"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
