"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Confirm } from "@/components/admin/Confirm";
import { CopyText } from "@/components/admin/CopyText";
import { PageHeader } from "@/components/admin/PageHeader";
import { Chip, ChipRow, EmptyState, SearchField, Skeleton } from "@/components/admin/ResponsiveTable";
import { useToast } from "@/components/admin/Toast";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { downloadCsv } from "@/lib/admin/csv";
import type { DeployMap, SiteSettings } from "@/lib/admin/types";
import { FEATURED_AGENTS } from "@/lib/agents/featured";
import { categoryLabel } from "@/lib/categories";
import { explorerTx, shortAddr } from "@/lib/format";

type CoverFilter = "all" | "mapped" | "demo";
type ConfirmKind =
  | null
  | "import"
  | "save-pause"
  | "discard"
  | { type: "clear"; id: string; name: string };

const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;

const inputCls =
  "admin-field h-12 w-full px-3 text-base sm:h-10 sm:text-sm";

function isHttpUrl(s: string) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function realTx(hash?: string | null) {
  return Boolean(hash && /^0x[a-fA-F0-9]{64}$/.test(hash));
}

function mappedOf(d: DeployMap | undefined) {
  return Boolean(d?.tokenId || d?.txHash);
}

function StatusBadge({ ok, on, off }: { ok: boolean; on: string; off: string }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs ${
        ok
          ? "border-bas-up/40 bg-bas-up/10 text-bas-up"
          : "border-bas-down/40 bg-bas-down/10 text-bas-down"
      }`}
    >
      {ok ? on : off}
    </span>
  );
}

function Mark({ name, ok }: { name: string; ok: boolean }) {
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[11px] font-semibold ${
        ok ? "bg-bas-up/10 text-bas-up" : "bg-bas-elevated text-bas-heading"
      }`}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function Field({
  label,
  hint,
  error,
  action,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block text-xs text-bas-muted">
      <span className="flex items-center justify-between gap-2">
        <span>{label}</span>
        {action}
      </span>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1 text-xs text-bas-down">{error}</p> : hint ? <p className="mt-1 text-[11px]">{hint}</p> : null}
    </label>
  );
}

function FlagSwitch({
  on,
  label,
  hint,
  danger,
  onClick,
}: {
  on: boolean;
  label: string;
  hint: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 rounded-[12px] border border-bas-hairline bg-bas-canvas px-4 py-3 text-left hover:bg-bas-elevated"
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-bas-heading">{label}</div>
        <div className="mt-0.5 text-xs text-bas-muted">{hint}</div>
      </div>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          on ? (danger ? "bg-bas-down" : "bg-bas-up") : "bg-bas-surface-strong"
        }`}
        aria-hidden
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-[left] ${
            on ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function ExtLink({ href }: { href: string }) {
  if (!isHttpUrl(href)) return null;
  return (
    <Button size="sm" variant="ghost" href={href}>
      Open
    </Button>
  );
}

export default function AdminSettingsPage() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [original, setOriginal] = useState<SiteSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [coverFilter, setCoverFilter] = useState<CoverFilter>("all");
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    adminFetch<{ settings: SiteSettings }>("/api/admin/settings")
      .then((d) => {
        setSettings(d.settings);
        setOriginal(d.settings);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
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
  }

  function clearDeploy(id: string) {
    setSettings((s) =>
      s
        ? {
            ...s,
            deployments: {
              ...s.deployments,
              [id]: { tokenId: "", chainId: undefined, txHash: "", grantTx: "", revokeTx: "" },
            },
          }
        : s,
    );
    setConfirm(null);
  }

  const dirty = Boolean(settings && original && JSON.stringify(settings) !== JSON.stringify(original));

  const walletError =
    settings && settings.prizeWallet.trim() && !ADDR_RE.test(settings.prizeWallet.trim())
      ? "Must be a 0x… 40-byte address."
      : "";
  const liveError = settings && settings.liveUrl.trim() && !isHttpUrl(settings.liveUrl.trim()) ? "Need an http(s) URL." : "";
  const repoError = settings && settings.repoUrl.trim() && !isHttpUrl(settings.repoUrl.trim()) ? "Need an http(s) URL." : "";
  const intakeError =
    settings && settings.intakeUrl.trim() && !isHttpUrl(settings.intakeUrl.trim()) ? "Need an http(s) URL." : "";
  const invalid = Boolean(walletError || liveError || repoError || intakeError);

  const coverCounts = useMemo(() => {
    if (!settings) return { all: 0, mapped: 0, demo: 0 };
    const mapped = FEATURED_AGENTS.filter((a) => mappedOf(settings.deployments[a.id])).length;
    return { all: FEATURED_AGENTS.length, mapped, demo: FEATURED_AGENTS.length - mapped };
  }, [settings]);

  const shownSellers = useMemo(() => {
    if (!settings) return [];
    const n = q.trim().toLowerCase();
    return FEATURED_AGENTS.filter((a) => {
      const d = settings.deployments[a.id] ?? {};
      const mapped = mappedOf(d);
      if (coverFilter === "mapped" && !mapped) return false;
      if (coverFilter === "demo" && mapped) return false;
      if (!n) return true;
      return `${a.name} ${a.id} ${a.tokenId} ${categoryLabel(a.category)} ${d.tokenId ?? ""} ${d.txHash ?? ""} ${d.grantTx ?? ""} ${d.revokeTx ?? ""}`
        .toLowerCase()
        .includes(n);
    });
  }, [settings, q, coverFilter]);

  async function save() {
    if (!settings || invalid) return;
    setBusy("save");
    try {
      const data = await adminFetch<{ settings: SiteSettings }>("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      setSettings(data.settings);
      setOriginal(data.settings);
      setConfirm(null);
      toast("ok", "Settings saved");
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  function requestSave() {
    if (!settings || !original) return;
    if (invalid) {
      toast("err", "Fix the highlighted fields first");
      return;
    }
    if (!original.maintenance && settings.maintenance) {
      setConfirm("save-pause");
      return;
    }
    void save();
  }

  async function downloadSnapshot() {
    setBusy("export");
    try {
      const data = await adminFetch<Record<string, unknown>>("/api/admin/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bas-admin.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  async function onImport(file: File) {
    setBusy("import");
    try {
      const raw = JSON.parse(await file.text()) as Record<string, unknown>;
      await adminFetch("/api/admin/import", { method: "POST", body: JSON.stringify(raw) });
      const data = await adminFetch<{ settings: SiteSettings }>("/api/admin/settings");
      setSettings(data.settings);
      setOriginal(data.settings);
      setPendingFile(null);
      setConfirm(null);
      toast("ok", "Snapshot imported");
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const coverFilters: { id: CoverFilter; label: string }[] = [
    { id: "all", label: "All sellers" },
    { id: "mapped", label: "Mapped" },
    { id: "demo", label: "Demo id" },
  ];

  return (
    <div className={dirty ? "pb-24" : ""}>
      <PageHeader
        title="Settings"
        desc="Site notice, prize wallet, snapshot backup, and live ERC-8004 ids after bag deploy."
        actions={
          <>
            <Button variant="secondary" disabled={Boolean(busy)} onClick={() => void downloadSnapshot()}>
              Export JSON
            </Button>
            <Button variant="secondary" disabled={Boolean(busy)} onClick={() => fileRef.current?.click()}>
              Import JSON
            </Button>
            <Button
              variant="secondary"
              disabled={!settings}
              onClick={() =>
                downloadCsv(
                  "bas-deploy-map.csv",
                  FEATURED_AGENTS.map((a) => {
                    const d = settings?.deployments[a.id] ?? {};
                    return {
                      id: a.id,
                      name: a.name,
                      tokenId: d.tokenId || a.tokenId,
                      chainId: d.chainId || a.chainId,
                      txHash: d.txHash ?? "",
                      grantTx: d.grantTx ?? "",
                      revokeTx: d.revokeTx ?? "",
                      mapped: mappedOf(d),
                    };
                  }),
                )
              }
            >
              Export map
            </Button>
            <Button disabled={!dirty || Boolean(busy) || invalid} onClick={requestSave}>
              {busy === "save" ? "Saving…" : "Save"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setPendingFile(file);
                  setConfirm("import");
                }
              }}
            />
          </>
        }
      />

      {loading ? (
        <Skeleton rows={6} />
      ) : !settings ? (
        <p className="mt-4 text-sm text-bas-down">{error ?? "Failed to load settings."}</p>
      ) : (
        <>
          <div
            className={`mt-5 rounded-[12px] border p-4 ${
              dirty
                ? "border-bas-primary/40 bg-bas-primary/10"
                : settings.maintenance
                  ? "border-bas-down/40 bg-bas-down/10"
                  : "border-bas-up/40 bg-bas-up/10"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                dirty ? "text-bas-heading" : settings.maintenance ? "text-bas-down" : "text-bas-up"
              }`}
            >
              {dirty
                ? "Unsaved changes"
                : settings.maintenance
                  ? "Market is paused"
                  : "Settings in sync"}
            </p>
            <p className="mt-1 text-xs text-bas-muted">
              {dirty
                ? "Save to apply URLs, flags, and deploy ids. Discard to revert this page."
                : settings.intakeSubmitted
                  ? "Intake marked submitted. Header market switch applies pause immediately; this page saves with the rest."
                  : "Intake still open — mark it on Submission after you tick the Google Form."}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                [settings.maintenance ? "Paused" : "Open", "Market"],
                [settings.intakeSubmitted ? "Submitted" : "Open", "Intake"],
                [coverCounts.mapped, "Mapped"],
                [coverCounts.demo, "Demo ids"],
              ] as const
            ).map(([n, l]) => (
              <div key={l} className="rounded-[12px] border border-bas-hairline bg-bas-card px-3 py-3">
                <div className="num text-xl font-semibold text-bas-primary">{n}</div>
                <div className="mt-0.5 text-[11px] text-bas-muted">{l}</div>
              </div>
            ))}
          </div>

          {error ? <p className="mt-4 text-sm text-bas-down">{error}</p> : null}

          <section className="mt-6 rounded-[12px] border border-bas-hairline bg-bas-card p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-bas-heading">Site</h2>
                <p className="mt-1 text-sm text-bas-muted">Public URLs and the prize wallet on the intake form.</p>
              </div>
              <Button size="sm" variant="secondary" href="/admin/submission">
                Submission
              </Button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                label="Prize wallet"
                error={walletError}
                action={
                  settings.prizeWallet ? <CopyText value={settings.prizeWallet} label={shortAddr(settings.prizeWallet, 4)} /> : null
                }
              >
                <input
                  value={settings.prizeWallet}
                  spellCheck={false}
                  onChange={(e) => set("prizeWallet", e.target.value)}
                  className={`${inputCls} num`}
                />
              </Field>
              <Field label="Live URL" error={liveError} action={<ExtLink href={settings.liveUrl} />}>
                <input value={settings.liveUrl} onChange={(e) => set("liveUrl", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Repo URL" error={repoError} action={<ExtLink href={settings.repoUrl} />}>
                <input value={settings.repoUrl} onChange={(e) => set("repoUrl", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Intake form" error={intakeError} action={<ExtLink href={settings.intakeUrl} />}>
                <input value={settings.intakeUrl} onChange={(e) => set("intakeUrl", e.target.value)} className={inputCls} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Market banner" hint="Shown above every public page. Leave blank for none.">
                  <textarea
                    value={settings.notice}
                    onChange={(e) => set("notice", e.target.value)}
                    className={`${inputCls} h-20 py-2`}
                    placeholder="Optional notice"
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-[12px] border border-bas-hairline bg-bas-card p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-bas-heading">Flags</h2>
            <p className="mt-1 text-sm text-bas-muted">Saved with the rest of this page. Pause also has a header switch that writes immediately.</p>
            <div className="mt-4 grid gap-3">
              <FlagSwitch
                on={settings.maintenance}
                danger
                label="Maintenance mode"
                hint="Pauses hire and shows the market as closed."
                onClick={() => set("maintenance", !settings.maintenance)}
              />
              <FlagSwitch
                on={settings.hideUncategorized}
                label="Hide uncategorized 8004scan agents"
                hint="Catalog still keeps them; the public market hides the uncategorized set."
                onClick={() => set("hideUncategorized", !settings.hideUncategorized)}
              />
              <FlagSwitch
                on={Boolean(settings.intakeSubmitted)}
                label="Intake form submitted"
                hint="Clears the Submission rail badge. Tick the Google Form in a browser first."
                onClick={() => set("intakeSubmitted", !settings.intakeSubmitted)}
              />
            </div>
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-semibold text-bas-heading">Deploy map</h2>
            <p className="mt-1 text-sm text-bas-muted">
              After Studio CLI publish, paste real token ids and explorer txs. The market uses them instead of demo ids. Explorer
              links appear only for 32-byte hex hashes.
            </p>
            <div className="mt-4 space-y-3">
              <SearchField value={q} onChange={setQ} placeholder="Search seller, token, or tx" />
              <ChipRow>
                {coverFilters.map((f) => (
                  <Chip key={f.id} active={coverFilter === f.id} onClick={() => setCoverFilter(f.id)}>
                    {f.label}{" "}
                    <span className={`num ${coverFilter === f.id ? "" : "text-bas-muted"}`}>{coverCounts[f.id]}</span>
                  </Chip>
                ))}
              </ChipRow>
            </div>
            <p className="mt-4 text-xs text-bas-muted">
              Showing <span className="num">{shownSellers.length}</span> of {FEATURED_AGENTS.length}
            </p>
            {shownSellers.length ? (
              <div className="mt-4 space-y-4">
                {shownSellers.map((a) => {
                  const d = settings.deployments[a.id] ?? {};
                  const mapped = mappedOf(d);
                  const chain = d.chainId || a.chainId;
                  return (
                    <article key={a.id} className="rounded-[12px] border border-bas-hairline bg-bas-card p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <Mark name={a.name} ok={mapped} />
                          <div className="min-w-0">
                            <div className="font-medium text-bas-heading">{a.name}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                              <StatusBadge ok={mapped} on="Mapped" off="Demo id" />
                              <span className="text-bas-muted">{categoryLabel(a.category)}</span>
                              <CopyText value={a.id} />
                              <span className="text-bas-muted">
                                Demo token <CopyText value={a.tokenId} />
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Button size="sm" variant="secondary" href={`/admin/agents/${encodeURIComponent(a.id)}`}>
                            Seller
                          </Button>
                          {mapped ? (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setConfirm({ type: "clear", id: a.id, name: a.name })}
                            >
                              Clear
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <Field label="Live token id">
                          <input
                            placeholder={a.tokenId}
                            value={d.tokenId ?? ""}
                            onChange={(e) => setDeploy(a.id, { tokenId: e.target.value })}
                            className={`${inputCls} num`}
                          />
                        </Field>
                        <Field label="Chain id">
                          <input
                            placeholder={String(a.chainId)}
                            value={d.chainId ?? ""}
                            onChange={(e) =>
                              setDeploy(a.id, { chainId: e.target.value ? Number(e.target.value) : undefined })
                            }
                            className={`${inputCls} num`}
                          />
                        </Field>
                        <div className="md:col-span-2">
                          <Field
                            label="Registry tx"
                            action={
                              realTx(d.txHash) ? (
                                <Button size="sm" variant="ghost" href={explorerTx(chain, d.txHash as string)}>
                                  Explorer
                                </Button>
                              ) : undefined
                            }
                          >
                            <input
                              placeholder="0x…"
                              spellCheck={false}
                              value={d.txHash ?? ""}
                              onChange={(e) => setDeploy(a.id, { txHash: e.target.value })}
                              className={`${inputCls} num`}
                            />
                          </Field>
                        </div>
                        <Field
                          label="Altana grant tx"
                          action={
                            realTx(d.grantTx) ? (
                                <Button size="sm" variant="ghost" href={explorerTx(chain, d.grantTx as string)}>
                                  Explorer
                                </Button>
                              ) : undefined
                          }
                        >
                          <input
                            placeholder="0x…"
                            spellCheck={false}
                            value={d.grantTx ?? ""}
                            onChange={(e) => setDeploy(a.id, { grantTx: e.target.value })}
                            className={`${inputCls} num`}
                          />
                        </Field>
                        <Field
                          label="Altana revoke tx"
                          action={
                            realTx(d.revokeTx) ? (
                                <Button size="sm" variant="ghost" href={explorerTx(chain, d.revokeTx as string)}>
                                  Explorer
                                </Button>
                              ) : undefined
                          }
                        >
                          <input
                            placeholder="0x…"
                            spellCheck={false}
                            value={d.revokeTx ?? ""}
                            onChange={(e) => setDeploy(a.id, { revokeTx: e.target.value })}
                            className={`${inputCls} num`}
                          />
                        </Field>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No matching sellers" body="Clear search or pick another coverage chip." />
            )}
          </section>
        </>
      )}

      {dirty && settings ? (
        <div className="admin-safe fixed inset-x-3 bottom-3 z-20 rounded-[12px] border border-bas-hairline bg-bas-surface-soft p-3 shadow-[0_8px_24px_var(--bas-panel-shadow)] md:bottom-4 md:left-auto md:right-5 md:w-[min(100%-2.5rem,28rem)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-bas-heading">Unsaved changes</p>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={Boolean(busy)} onClick={() => setConfirm("discard")}>
                Discard
              </Button>
              <Button disabled={Boolean(busy) || invalid} onClick={requestSave}>
                {busy === "save" ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {confirm === "import" && pendingFile ? (
        <Confirm
          title="Import snapshot?"
          body={`Replace catalog, hires, proofs, and settings with ${pendingFile.name}. This cannot be undone unless you have an export.`}
          confirm="Import"
          danger
          onCancel={() => {
            setConfirm(null);
            setPendingFile(null);
            if (fileRef.current) fileRef.current.value = "";
          }}
          onConfirm={() => void onImport(pendingFile)}
        />
      ) : null}
      {confirm === "save-pause" ? (
        <Confirm
          title="Pause the market?"
          body="Saving will turn maintenance on. Hire pauses until you open the market again."
          confirm="Pause and save"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => void save()}
        />
      ) : null}
      {confirm === "discard" ? (
        <Confirm
          title="Discard unsaved changes?"
          body="URLs, flags, and deploy map edits on this page go back to the last save."
          confirm="Discard"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            if (original) setSettings(original);
            setConfirm(null);
          }}
        />
      ) : null}
      {confirm && typeof confirm === "object" && confirm.type === "clear" ? (
        <Confirm
          title={`Clear ${confirm.name} mapping?`}
          body="Token id and txs on this page revert to demo until you save. Already-saved mappings stay until Save."
          confirm="Clear"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => clearDeploy(confirm.id)}
        />
      ) : null}
    </div>
  );
}
