"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CATEGORIES, type MarketplaceAgent } from "@/lib/agents/types";
import type { AgentDraft } from "@/lib/admin/types";

const empty: AgentDraft = {
  name: "",
  description: "",
  category: "grid",
  tokenId: "",
  chainId: 97,
  owner: "",
  agentWallet: "",
  priceUsd: 0.15,
  featured: true,
  hireable: true,
  live: true,
  verified: false,
  spendCap: "0.05",
  spendToken: "BNB",
  expiryHours: 24,
  txHash: "",
  registry: "",
  categoryReason: "",
  notes: "",
};

function fromAgent(a: MarketplaceAgent): AgentDraft {
  return {
    name: a.name,
    description: a.description,
    category: a.category,
    tokenId: a.tokenId,
    chainId: a.chainId,
    owner: a.owner,
    agentWallet: a.agentWallet ?? "",
    priceUsd: a.priceUsd ?? 0,
    featured: a.featured,
    hireable: a.hireable,
    live: a.live === true,
    verified: a.verified,
    spendCap: a.policy?.spendCap ?? "0.05",
    spendToken: a.policy?.spendToken ?? "BNB",
    expiryHours: a.policy?.expiryHours ?? 24,
    txHash: a.txHash ?? "",
    registry: a.registry,
    categoryReason: a.categoryReason,
    notes: "",
  };
}

export function AgentForm({
  initial,
  initialNotes,
  submitLabel,
  onSubmit,
}: {
  initial?: MarketplaceAgent | null;
  initialNotes?: string;
  submitLabel: string;
  onSubmit: (draft: AgentDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<AgentDraft>(
    initial ? { ...fromAgent(initial), notes: initialNotes ?? "" } : empty,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof AgentDraft>(key: K, value: AgentDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 grid max-w-3xl gap-4 md:grid-cols-2">
      <Field label="Name">
        <input required value={draft.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Token id">
        <input required value={draft.tokenId} onChange={(e) => set("tokenId", e.target.value)} className={inputCls} />
      </Field>
      <label className="md:col-span-2 text-xs text-bas-muted">
        Description
        <textarea
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
          className={`${inputCls} mt-1 h-24 py-2`}
        />
      </label>
      <Field label="Category">
        <select
          value={draft.category}
          onChange={(e) => set("category", e.target.value as AgentDraft["category"])}
          className={inputCls}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Chain id">
        <input
          type="number"
          value={draft.chainId}
          onChange={(e) => set("chainId", Number(e.target.value))}
          className={inputCls}
        />
      </Field>
      <Field label="Owner">
        <input required value={draft.owner} onChange={(e) => set("owner", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Agent wallet">
        <input value={draft.agentWallet} onChange={(e) => set("agentWallet", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Price USD">
        <input
          type="number"
          step="0.01"
          value={draft.priceUsd}
          onChange={(e) => set("priceUsd", Number(e.target.value))}
          className={inputCls}
        />
      </Field>
      <Field label="Spend cap">
        <input value={draft.spendCap} onChange={(e) => set("spendCap", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Spend token">
        <input value={draft.spendToken} onChange={(e) => set("spendToken", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Expiry hours">
        <input
          type="number"
          value={draft.expiryHours}
          onChange={(e) => set("expiryHours", Number(e.target.value))}
          className={inputCls}
        />
      </Field>
      <Field label="Registry">
        <input value={draft.registry} onChange={(e) => set("registry", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Tx hash">
        <input value={draft.txHash} onChange={(e) => set("txHash", e.target.value)} className={inputCls} />
      </Field>
      <label className="md:col-span-2 text-xs text-bas-muted">
        Category reason
        <input
          value={draft.categoryReason}
          onChange={(e) => set("categoryReason", e.target.value)}
          className={`${inputCls} mt-1`}
        />
      </label>
      <label className="md:col-span-2 text-xs text-bas-muted">
        Operator notes (not public)
        <textarea
          value={draft.notes}
          onChange={(e) => set("notes", e.target.value)}
          className={`${inputCls} mt-1 h-20 py-2`}
        />
      </label>
      <div className="md:col-span-2 flex flex-wrap gap-4 text-sm">
        <Flag label="Featured" checked={draft.featured} onChange={(v) => set("featured", v)} />
        <Flag label="Hireable" checked={draft.hireable} onChange={(v) => set("hireable", v)} />
        <Flag label="Live" checked={draft.live} onChange={(v) => set("live", v)} />
        <Flag label="Verified" checked={draft.verified} onChange={(v) => set("verified", v)} />
      </div>
      {error ? <p className="md:col-span-2 text-sm text-bas-down">{error}</p> : null}
      <div className="md:col-span-2">
        <Button disabled={busy}>{busy ? "Saving…" : submitLabel}</Button>
      </div>
    </form>
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

function Flag({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

const inputCls =
  "h-10 w-full rounded-[6px] border border-bas-hairline bg-bas-canvas px-3 text-sm text-bas-heading";
