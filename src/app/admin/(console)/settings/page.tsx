"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/admin/Toast";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { FEATURED_AGENTS } from "@/lib/agents/featured";
import type { DeployMap, SiteSettings } from "@/lib/admin/types";

export default function AdminSettingsPage() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminFetch<{ settings: SiteSettings }>("/api/admin/settings")
      .then((d) => setSettings(d.settings))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
    setSaved(false);
  }

  function setDeploy(id: string, patch: DeployMap) {
    setSettings((s) =>
      s
        ? {
            ...s,
            deployments: { ...s.deployments, [id]: { ...s.deployments[id], ...patch } },
          }
        : s,
    );
    setSaved(false);
  }

  async function save() {
    if (!settings) return;
    const data = await adminFetch<{ settings: SiteSettings }>("/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
    setSettings(data.settings);
    setSaved(true);
    toast("ok", "Settings saved");
  }

  async function downloadSnapshot() {
    const data = await adminFetch<Record<string, unknown>>("/api/admin/export");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bas-admin.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImport(file: File) {
    const raw = JSON.parse(await file.text()) as Record<string, unknown>;
    await adminFetch("/api/admin/import", { method: "POST", body: JSON.stringify(raw) });
    const data = await adminFetch<{ settings: SiteSettings }>("/api/admin/settings");
    setSettings(data.settings);
    toast("ok", "Snapshot imported");
  }

  if (error) return <p className="text-sm text-bas-down">{error}</p>;
  if (!settings) return <p className="text-sm text-bas-muted">Loading settings…</p>;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Settings"
        desc="Site notice, prize wallet, snapshot backup, and live ERC-8004 ids after bag deploy."
        actions={
          <>
            <Button variant="secondary" onClick={downloadSnapshot}>
              Export JSON
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              Import JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImport(file).catch((err) => toast("err", err instanceof Error ? err.message : "Import failed"));
              }}
            />
          </>
        }
      />

      <div className="mt-6 grid gap-4">
        <Field label="Prize wallet">
          <input
            value={settings.prizeWallet}
            onChange={(e) => set("prizeWallet", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Live URL">
          <input value={settings.liveUrl} onChange={(e) => set("liveUrl", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Repo URL">
          <input value={settings.repoUrl} onChange={(e) => set("repoUrl", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Intake form">
          <input value={settings.intakeUrl} onChange={(e) => set("intakeUrl", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Market banner">
          <textarea
            value={settings.notice}
            onChange={(e) => set("notice", e.target.value)}
            className={`${inputCls} h-20 py-2`}
            placeholder="Optional notice shown above every page"
          />
        </Field>
        <label className="inline-flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.maintenance}
            onChange={(e) => set("maintenance", e.target.checked)}
          />
          Maintenance mode
        </label>
        <label className="inline-flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.hideUncategorized}
            onChange={(e) => set("hideUncategorized", e.target.checked)}
          />
          Hide uncategorized 8004scan agents
        </label>
        <label className="inline-flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(settings.intakeSubmitted)}
            onChange={(e) => set("intakeSubmitted", e.target.checked)}
          />
          Intake form submitted
        </label>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-bas-heading">Deploy map</h2>
      <p className="mt-1 text-sm text-bas-muted">
        After Studio CLI publish, paste real token ids and explorer txs. The
        market starts using them instead of the demo ids.
      </p>
      <div className="mt-4 space-y-4">
        {FEATURED_AGENTS.map((a) => {
          const d = settings.deployments[a.id] ?? {};
          return (
            <div key={a.id} className="rounded-[12px] bg-bas-card p-4">
              <div className="text-sm font-semibold text-bas-heading">{a.name}</div>
              <div className="num text-xs text-bas-muted">{a.id}</div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <input
                  placeholder="Live token id"
                  value={d.tokenId ?? ""}
                  onChange={(e) => setDeploy(a.id, { tokenId: e.target.value })}
                  className={inputCls}
                />
                <input
                  placeholder="Chain id"
                  value={d.chainId ?? ""}
                  onChange={(e) =>
                    setDeploy(a.id, { chainId: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className={inputCls}
                />
                <input
                  placeholder="Registry tx hash"
                  value={d.txHash ?? ""}
                  onChange={(e) => setDeploy(a.id, { txHash: e.target.value })}
                  className={`${inputCls} md:col-span-2`}
                />
                <input
                  placeholder="Altana grant tx"
                  value={d.grantTx ?? ""}
                  onChange={(e) => setDeploy(a.id, { grantTx: e.target.value })}
                  className={inputCls}
                />
                <input
                  placeholder="Altana revoke tx"
                  value={d.revokeTx ?? ""}
                  onChange={(e) => setDeploy(a.id, { revokeTx: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save}>Save settings</Button>
        {saved ? <span className="text-sm text-bas-up">Saved</span> : null}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-xs text-bas-muted">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls =
  "h-12 w-full rounded-[6px] border border-bas-hairline bg-bas-canvas px-3 text-base text-bas-heading sm:h-10 sm:text-sm";
