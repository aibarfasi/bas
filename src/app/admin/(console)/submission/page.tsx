"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Confirm } from "@/components/admin/Confirm";
import { CopyText } from "@/components/admin/CopyText";
import { PageHeader } from "@/components/admin/PageHeader";
import { Chip, ChipRow, EmptyState, ResponsiveTable, SearchField, Skeleton } from "@/components/admin/ResponsiveTable";
import { useToast } from "@/components/admin/Toast";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { downloadCsv } from "@/lib/admin/csv";
import type { SiteSettings } from "@/lib/admin/types";
import { FEATURED_AGENTS } from "@/lib/agents/featured";
import { categoryLabel } from "@/lib/categories";
import { explorerTx, shortAddr } from "@/lib/format";

type CheckFilter = "all" | "ready" | "open";
type CoverFilter = "all" | "mapped" | "demo";
type CheckItem = {
  id: string;
  ok: boolean;
  title: string;
  detail: string;
  href?: string;
  copy?: string;
};

const TRACKS = ["PancakeSwap", "AltLayer", "TermiX"];
const ONE_LINER = "Find, compare, and hire ERC-8004 agents on BSC without giving them your funds.";
const DEADLINE = "9 Sep 2026";

const SCRIPT = [
  { href: "/docs/judges", label: "Judge path", detail: "Open /docs/judges and follow the script." },
  { href: "/market?cat=monitoring", label: "Hire a seller", detail: "Market → Monitoring → BAS Range Guard → Hire (demo is fine)." },
  { href: "/proofs", label: "Public proofs", detail: "/proofs for Altana + x402 receipts. No admin required." },
  { href: "/advantage", label: "Advantage pack", detail: "/advantage for monitoring, trade, security, yield, and equities JSON." },
];

function StatusBadge({ ok, on = "Ready", off = "Open" }: { ok: boolean; on?: string; off?: string }) {
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

function realTx(hash?: string | null) {
  return Boolean(hash && /^0x[a-fA-F0-9]{64}$/.test(hash));
}

export default function AdminSubmissionPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [checkFilter, setCheckFilter] = useState<CheckFilter>("all");
  const [coverFilter, setCoverFilter] = useState<CoverFilter>("all");
  const [confirm, setConfirm] = useState<null | "submit" | "open">(null);

  async function load() {
    const data = await adminFetch<{ settings: SiteSettings }>("/api/admin/settings");
    setSettings(data.settings);
    setLoading(false);
  }

  useEffect(() => {
    load().catch((e) => {
      setError(e instanceof Error ? e.message : "Failed");
      setLoading(false);
    });
  }, []);

  const deployReady = useMemo(() => {
    if (!settings) return false;
    return FEATURED_AGENTS.every((a) =>
      Boolean(settings.deployments[a.id]?.tokenId || settings.deployments[a.id]?.txHash),
    );
  }, [settings]);

  const items: CheckItem[] = useMemo(() => {
    if (!settings) return [];
    return [
      {
        id: "live",
        ok: Boolean(settings.liveUrl),
        title: "Public URL",
        detail: settings.liveUrl || "Set live URL in Settings",
        href: settings.liveUrl || undefined,
        copy: settings.liveUrl,
      },
      {
        id: "repo",
        ok: Boolean(settings.repoUrl),
        title: "Public repo",
        detail: settings.repoUrl || "Set repo URL in Settings",
        href: settings.repoUrl || undefined,
        copy: settings.repoUrl,
      },
      {
        id: "intake",
        ok: settings.intakeSubmitted,
        title: "Intake form submitted in the browser",
        detail: settings.intakeUrl || "Programmatic POST is 401 — tick the Google Form yourself.",
        href: settings.intakeUrl || undefined,
        copy: settings.intakeUrl,
      },
      {
        id: "market",
        ok: !settings.maintenance,
        title: "Market not in maintenance",
        detail: settings.maintenance ? "Paused — open the market from the header switch." : "Market open",
      },
      {
        id: "deploy",
        ok: deployReady,
        title: "bag deploy ids pasted",
        detail: "Settings → Deploy map. Real token ids replace demo ids after Studio CLI publish.",
        href: "/admin/settings",
      },
    ];
  }, [settings, deployReady]);

  const sellers = useMemo(() => {
    if (!settings) return [];
    return FEATURED_AGENTS.map((a) => {
      const d = settings.deployments[a.id] ?? {};
      const mapped = Boolean(d.tokenId || d.txHash);
      return {
        id: a.id,
        name: a.name,
        category: a.category,
        demoToken: a.tokenId,
        tokenId: d.tokenId || a.tokenId,
        chainId: d.chainId || a.chainId,
        txHash: d.txHash || null,
        grantTx: d.grantTx || null,
        revokeTx: d.revokeTx || null,
        mapped,
      };
    });
  }, [settings]);

  const checkCounts = useMemo(() => {
    const ready = items.filter((i) => i.ok).length;
    return { all: items.length, ready, open: items.length - ready };
  }, [items]);

  const coverCounts = useMemo(() => {
    const mapped = sellers.filter((s) => s.mapped).length;
    return { all: sellers.length, mapped, demo: sellers.length - mapped };
  }, [sellers]);

  const shownChecks = useMemo(() => {
    const n = q.trim().toLowerCase();
    return items.filter((i) => {
      if (checkFilter === "ready" && !i.ok) return false;
      if (checkFilter === "open" && i.ok) return false;
      if (!n) return true;
      return `${i.title} ${i.detail}`.toLowerCase().includes(n);
    });
  }, [items, q, checkFilter]);

  const shownSellers = useMemo(() => {
    const n = q.trim().toLowerCase();
    return sellers.filter((s) => {
      if (coverFilter === "mapped" && !s.mapped) return false;
      if (coverFilter === "demo" && s.mapped) return false;
      if (!n) return true;
      return `${s.name} ${s.id} ${s.tokenId} ${s.demoToken} ${categoryLabel(s.category)} ${s.txHash ?? ""}`
        .toLowerCase()
        .includes(n);
    });
  }, [sellers, q, coverFilter]);

  const allReady = items.length > 0 && items.every((i) => i.ok);

  async function markIntake(value: boolean) {
    setBusy(true);
    try {
      const data = await adminFetch<{ settings: SiteSettings }>("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ intakeSubmitted: value }),
      });
      setSettings(data.settings);
      setConfirm(null);
      toast("ok", value ? "Intake marked submitted" : "Intake marked open");
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  function copyFormAnswers() {
    if (!settings) return;
    const text = [
      "Name: BAS — BNB Agent Studio Marketplace",
      `One liner: ${ONE_LINER}`,
      `Live URL: ${settings.liveUrl}`,
      `Repo: ${settings.repoUrl}`,
      `Intake: ${settings.intakeUrl}`,
      `Tracks: ${TRACKS.join(" · ")}`,
      "Altana (notes): session grant/revoke + public receipts + explorer wallet links. Testnet KeyStore txs after bag deploy.",
      `Prize wallet: ${settings.prizeWallet}`,
    ].join("\n");
    navigator.clipboard.writeText(text).then(
      () => toast("ok", "Form answers copied"),
      () => toast("err", "Copy failed"),
    );
  }

  const checkFilters: { id: CheckFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "ready", label: "Ready" },
    { id: "open", label: "Open" },
  ];
  const coverFilters: { id: CoverFilter; label: string }[] = [
    { id: "all", label: "All sellers" },
    { id: "mapped", label: "Mapped" },
    { id: "demo", label: "Demo id" },
  ];

  return (
    <div>
      <PageHeader
        title="Submission"
        desc={`Build the Era intake. Tick the Google Form in the browser — programmatic POST is 401. Deadline ${DEADLINE}.`}
        actions={
          <>
            <Button variant="secondary" onClick={copyFormAnswers} disabled={!settings}>
              Copy form answers
            </Button>
            <Button href={settings?.intakeUrl || "https://forms.gle/9g9XPNFwnYaHAz9L8"} variant="secondary">
              Open intake form
            </Button>
            <Button
              variant="secondary"
              disabled={!settings}
              onClick={() =>
                downloadCsv("bas-submission.csv", [
                  ...items.map((i) => ({
                    kind: "checklist",
                    id: i.id,
                    title: i.title,
                    ready: i.ok,
                    detail: i.detail,
                  })),
                  ...sellers.map((s) => ({
                    kind: "seller",
                    id: s.id,
                    title: s.name,
                    ready: s.mapped,
                    detail: s.tokenId,
                  })),
                ])
              }
            >
              Export
            </Button>
          </>
        }
      />

      {loading ? (
        <Skeleton rows={6} />
      ) : !settings ? (
        <p className="mt-4 text-sm text-bas-down">{error ?? "Failed to load submission."}</p>
      ) : (
        <>
          <div
            className={`mt-5 rounded-[12px] border p-4 ${
              allReady ? "border-bas-up/40 bg-bas-up/10" : "border-bas-down/40 bg-bas-down/10"
            }`}
          >
            <p className={`text-sm font-semibold ${allReady ? "text-bas-up" : "text-bas-down"}`}>
              {allReady
                ? "Intake packet is ready"
                : `${checkCounts.open} checklist item${checkCounts.open === 1 ? "" : "s"} still open`}
            </p>
            <p className="mt-1 text-xs text-bas-muted">
              {settings.intakeSubmitted
                ? "Form marked submitted. Keep the live URL, repo, market, and deploy map current."
                : "Submit the Google Form in a real browser, then mark it here so the rail badge clears."}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                [checkCounts.ready, "Checklist ready"],
                [checkCounts.open, "Checklist open"],
                [coverCounts.mapped, "Sellers mapped"],
                [coverCounts.demo, "Demo ids"],
              ] as const
            ).map(([n, l]) => (
              <div key={l} className="rounded-[12px] border border-bas-hairline bg-bas-card px-3 py-3">
                <div className="num text-xl font-semibold text-bas-primary">{n}</div>
                <div className="mt-0.5 text-[11px] text-bas-muted">{l}</div>
              </div>
            ))}
          </div>

          <section className="mt-5 rounded-[12px] border border-bas-hairline bg-bas-card p-4 sm:p-5">
            <p className="text-sm font-semibold text-bas-heading">Form packet</p>
            <p className="mt-1 text-xs text-bas-muted">{ONE_LINER}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TRACKS.map((t) => (
                <span
                  key={t}
                  className="inline-flex h-7 items-center rounded-full border border-bas-hairline px-2.5 text-xs"
                >
                  {t}
                </span>
              ))}
              <span className="inline-flex h-7 items-center rounded-full border border-bas-hairline px-2.5 text-xs">
                Altana in notes
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              <span className="text-bas-muted">
                Prize wallet{" "}
                <CopyText value={settings.prizeWallet} label={shortAddr(settings.prizeWallet, 6)} />
              </span>
              <span className="text-bas-muted">Deadline {DEADLINE}</span>
              <Button size="sm" variant="secondary" href="/admin/settings">
                Edit URLs
              </Button>
            </div>
          </section>

          <div className="mt-5 space-y-3">
            <SearchField value={q} onChange={setQ} placeholder="Search checklist or seller" />
            <ChipRow>
              {checkFilters.map((f) => (
                <Chip key={f.id} active={checkFilter === f.id} onClick={() => setCheckFilter(f.id)}>
                  {f.label}{" "}
                  <span className={`num ${checkFilter === f.id ? "" : "text-bas-muted"}`}>
                    {checkCounts[f.id]}
                  </span>
                </Chip>
              ))}
            </ChipRow>
          </div>

          {error ? <p className="mt-4 text-sm text-bas-down">{error}</p> : null}
          <p className="mt-4 text-xs text-bas-muted">
            Checklist <span className="num">{shownChecks.length}</span> of {items.length}
          </p>

          <ResponsiveTable
            rows={shownChecks}
            rowKey={(c) => c.id}
            leading={(c) => <Mark name={c.title} ok={c.ok} />}
            mobilePrimary={(c) => c.title}
            mobileSecondary={(c) => (
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge ok={c.ok} />
                {c.copy ? <CopyText value={c.copy} label={c.detail} /> : <span>{c.detail}</span>}
              </div>
            )}
            mobileActions={(c) =>
              c.href ? (
                <Button size="sm" variant="secondary" href={c.href}>
                  Open
                </Button>
              ) : null
            }
            columns={[
              {
                label: "Item",
                cell: (c) => (
                  <div>
                    <div className="font-medium text-bas-heading">{c.title}</div>
                    <div className="mt-0.5 break-all text-xs text-bas-muted">{c.detail}</div>
                  </div>
                ),
              },
              { label: "Status", cell: (c) => <StatusBadge ok={c.ok} /> },
              {
                label: "Copy",
                cell: (c) => (c.copy ? <CopyText value={c.copy} label={c.copy} /> : <span className="text-bas-muted">—</span>),
              },
              {
                label: "",
                className: "text-right",
                cell: (c) =>
                  c.href ? (
                    <Button size="sm" variant="secondary" href={c.href}>
                      Open
                    </Button>
                  ) : null,
              },
            ]}
            empty={
              <EmptyState
                title="No matching checklist items"
                body="Clear search or pick another chip."
              />
            }
          />

          <div className="mt-6 flex flex-wrap gap-2">
            <Button disabled={busy || settings.intakeSubmitted} onClick={() => setConfirm("submit")}>
              Mark intake submitted
            </Button>
            <Button
              variant="secondary"
              disabled={busy || !settings.intakeSubmitted}
              onClick={() => setConfirm("open")}
            >
              Mark still open
            </Button>
            <Button href="/admin/settings" variant="secondary">
              Deploy map
            </Button>
          </div>

          <h2 className="mt-10 text-lg font-semibold text-bas-heading">Seller deploy coverage</h2>
          <p className="mt-1 text-sm text-bas-muted">
            After <span className="num">bag deploy</span>, paste live token ids and explorer txs. Demo ids stay until then.
          </p>
          <div className="mt-4">
            <ChipRow>
              {coverFilters.map((f) => (
                <Chip key={f.id} active={coverFilter === f.id} onClick={() => setCoverFilter(f.id)}>
                  {f.label}{" "}
                  <span className={`num ${coverFilter === f.id ? "" : "text-bas-muted"}`}>
                    {coverCounts[f.id]}
                  </span>
                </Chip>
              ))}
            </ChipRow>
          </div>
          <p className="mt-4 text-xs text-bas-muted">
            Sellers <span className="num">{shownSellers.length}</span> of {sellers.length}
          </p>

          <ResponsiveTable
            rows={shownSellers}
            rowKey={(s) => s.id}
            leading={(s) => <Mark name={s.name} ok={s.mapped} />}
            mobilePrimary={(s) => s.name}
            mobileSecondary={(s) => (
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge ok={s.mapped} on="Mapped" off="Demo id" />
                <span className="text-xs">{categoryLabel(s.category)}</span>
                <CopyText value={s.tokenId} />
              </div>
            )}
            mobileActions={(s) => (
              <>
                <Button size="sm" variant="secondary" href={`/admin/agents/${encodeURIComponent(s.id)}`}>
                  Seller
                </Button>
                <Button size="sm" variant="secondary" href="/admin/settings">
                  Map
                </Button>
              </>
            )}
            columns={[
              {
                label: "Seller",
                cell: (s) => (
                  <div>
                    <div className="font-medium text-bas-heading">{s.name}</div>
                    <div className="num mt-0.5 text-xs text-bas-muted">{s.id}</div>
                  </div>
                ),
              },
              { label: "Track", cell: (s) => <span className="text-xs">{categoryLabel(s.category)}</span> },
              { label: "Token", cell: (s) => <CopyText value={s.tokenId} /> },
              {
                label: "Tx",
                cell: (s) =>
                  realTx(s.txHash) ? (
                    <a
                      href={explorerTx(s.chainId, s.txHash as string)}
                      target="_blank"
                      rel="noreferrer"
                      className="num text-xs text-bas-primary"
                    >
                      {shortAddr(s.txHash, 4)}
                    </a>
                  ) : (
                    <span className="text-xs text-bas-muted">—</span>
                  ),
              },
              { label: "Status", cell: (s) => <StatusBadge ok={s.mapped} on="Mapped" off="Demo id" /> },
              {
                label: "",
                className: "text-right",
                cell: (s) => (
                  <Button size="sm" variant="secondary" href="/admin/settings">
                    Map
                  </Button>
                ),
              },
            ]}
            empty={
              <EmptyState title="No matching sellers" body="Clear search or pick another coverage chip." />
            }
          />

          <section className="mt-8 rounded-[12px] border border-bas-hairline bg-bas-card p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-bas-heading">Demo script</h2>
            <p className="mt-1 text-sm text-bas-muted">Walk judges through this path. Demo hire is enough.</p>
            <ol className="mt-4 space-y-3">
              {SCRIPT.map((step, i) => (
                <li key={step.href} className="flex gap-3 text-sm">
                  <span className="num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-bas-hairline text-xs text-bas-muted">
                    {i + 1}
                  </span>
                  <div>
                    <Link href={step.href} className="font-medium text-bas-heading hover:text-bas-primary">
                      {step.label}
                    </Link>
                    <p className="mt-0.5 text-xs text-bas-muted">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}

      {confirm ? (
        <Confirm
          title={confirm === "submit" ? "Mark intake submitted?" : "Mark intake still open?"}
          body={
            confirm === "submit"
              ? "Only do this after you ticked the Google Form in a real browser. A programmatic POST returns 401."
              : "The Submission rail badge comes back until you mark the form submitted again."
          }
          confirm={confirm === "submit" ? "Mark submitted" : "Mark open"}
          danger={confirm === "open"}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void markIntake(confirm === "submit")}
        />
      ) : null}
    </div>
  );
}
