"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { agentToDraft, emptyDraft } from "@/lib/admin/draft";
import type { AgentDraft } from "@/lib/admin/types";
import { CATEGORIES, type AgentFeedback, type MarketplaceAgent } from "@/lib/agents/types";
import { CATEGORY_META } from "@/lib/categories";
import { AdminSelect } from "@/components/admin/AdminSelect";

export function AgentForm({
  initial,
  initialNotes,
  submitLabel,
  onSubmit,
  onChange,
}: {
  initial?: MarketplaceAgent | null;
  initialNotes?: string;
  submitLabel: string;
  onSubmit: (draft: AgentDraft) => Promise<void>;
  onChange?: (draft: AgentDraft) => void;
}) {
  const [draft, setDraft] = useState<AgentDraft>(
    initial ? agentToDraft(initial, initialNotes ?? "") : emptyDraft(),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(next: AgentDraft) {
    setDraft(next);
    onChange?.(next);
  }

  function set<K extends keyof AgentDraft>(key: K, value: AgentDraft[K]) {
    update({ ...draft, [key]: value });
  }

  function setFeedback(i: number, patch: Partial<AgentFeedback>) {
    update({
      ...draft,
      feedback: draft.feedback.map((row, idx) => (idx === i ? { ...row, ...patch } : row)),
    });
  }

  function fillStory() {
    if (draft.category === "uncategorized") return;
    const cat = CATEGORY_META[draft.category];
    update({
      ...draft,
      job: draft.job || cat.job,
      pancake: draft.pancake || cat.pancake,
      categoryReason: draft.categoryReason || cat.job,
    });
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
    <form onSubmit={submit} className="mt-6 space-y-6">
      <Section
        title="Identity"
        hint="Name, ids, and wallets. This is what 8004scan and the hire path resolve."
      >
        <Field label="Name">
          <input required value={draft.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Token id">
          <input required value={draft.tokenId} onChange={(e) => set("tokenId", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Category">
          <AdminSelect
            aria-label="Category"
            value={draft.category}
            onChange={(v) => set("category", v)}
            options={CATEGORIES.map((c) => ({
              id: c,
              label: c === "uncategorized" ? "Uncategorized" : CATEGORY_META[c].label,
            }))}
          />
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
        <Field label="Registry">
          <input value={draft.registry} onChange={(e) => set("registry", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Tx hash">
          <input value={draft.txHash} onChange={(e) => set("txHash", e.target.value)} className={inputCls} />
        </Field>
        <div className="md:col-span-2 grid gap-3 sm:grid-cols-2">
          <Flag label="Featured" hint="Pinned in the market strip." checked={draft.featured} onChange={(v) => set("featured", v)} />
          <Flag label="Hireable" hint="Shows Hire and session grant." checked={draft.hireable} onChange={(v) => set("hireable", v)} />
          <Flag label="Live" hint="Face responding. Locked after save." checked={draft.live} onChange={(v) => set("live", v)} />
          <Flag label="Verified" hint="Check on the public card." checked={draft.verified} onChange={(v) => set("verified", v)} />
          <Flag label="x402" hint="Pay-to-hire rail advertised." checked={draft.x402} onChange={(v) => set("x402", v)} />
        </div>
      </Section>

      <Section
        title="Story"
        hint="Public copy on the agent page. Empty job/pancake falls back to the category template."
        action={
          <Button size="sm" variant="secondary" onClick={fillStory}>
            Fill from category
          </Button>
        }
      >
        <label className="md:col-span-2 text-xs text-bas-muted">
          Short description
          <textarea
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            className={`${inputCls} mt-1 h-20 py-2`}
          />
        </label>
        <label className="md:col-span-2 text-xs text-bas-muted">
          What it does
          <textarea
            value={draft.job}
            onChange={(e) => set("job", e.target.value)}
            placeholder="Shown as the main job description"
            className={`${inputCls} mt-1 h-20 py-2`}
          />
        </label>
        <label className="md:col-span-2 text-xs text-bas-muted">
          Pancake / venue line
          <textarea
            value={draft.pancake}
            onChange={(e) => set("pancake", e.target.value)}
            placeholder="How it uses PancakeSwap or the venue"
            className={`${inputCls} mt-1 h-16 py-2`}
          />
        </label>
        <label className="md:col-span-2 text-xs text-bas-muted">
          Category reason
          <input
            value={draft.categoryReason}
            onChange={(e) => set("categoryReason", e.target.value)}
            className={`${inputCls} mt-1`}
          />
        </label>
        <label className="md:col-span-2 text-xs text-bas-muted">
          Live reason
          <input
            value={draft.liveReason}
            onChange={(e) => set("liveReason", e.target.value)}
            placeholder="Why this seller is live or down"
            className={`${inputCls} mt-1`}
          />
        </label>
      </Section>

      <Section title="Market" hint="Price, protocols, and listing flags buyers see in the strip.">
        <Field label="Price USD">
          <input
            type="number"
            step="0.01"
            value={draft.priceUsd}
            onChange={(e) => set("priceUsd", Number(e.target.value))}
            className={inputCls}
          />
        </Field>
        <Field label="Protocols (comma separated)">
          <input
            value={draft.protocols}
            onChange={(e) => set("protocols", e.target.value)}
            placeholder="A2A, X402"
            className={inputCls}
          />
        </Field>
      </Section>

      <Section title="Track record" hint="Leave a field blank to hide it on the public page. No dashes.">
        <Field label="Score">
          <input
            type="number"
            step="0.1"
            value={draft.totalScore}
            onChange={(e) => set("totalScore", Number(e.target.value))}
            className={inputCls}
          />
        </Field>
        <Field label="Avg feedback">
          <input
            type="number"
            step="0.1"
            value={draft.averageScore}
            onChange={(e) => set("averageScore", Number(e.target.value))}
            className={inputCls}
          />
        </Field>
        <Field label="Feedback count">
          <input
            type="number"
            value={draft.feedbackCount}
            onChange={(e) => set("feedbackCount", Number(e.target.value))}
            className={inputCls}
          />
        </Field>
        <Field label="Health score">
          <input
            value={draft.healthScore}
            onChange={(e) => set("healthScore", e.target.value)}
            placeholder="blank = hide"
            className={inputCls}
          />
        </Field>
        <Field label="Win rate %">
          <input value={draft.winRate} onChange={(e) => set("winRate", e.target.value)} className={inputCls} />
        </Field>
        <Field label="PnL %">
          <input value={draft.pnlPct} onChange={(e) => set("pnlPct", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Max drawdown %">
          <input value={draft.maxDrawdown} onChange={(e) => set("maxDrawdown", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Fills">
          <input value={draft.fills} onChange={(e) => set("fills", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Window">
          <input value={draft.window} onChange={(e) => set("window", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Venue">
          <input value={draft.venue} onChange={(e) => set("venue", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Risk">
          <input value={draft.risk} onChange={(e) => set("risk", e.target.value)} className={inputCls} />
        </Field>
      </Section>

      <Section title="Session" hint="Altana grant shown on the public hire card.">
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
      </Section>

      <Section
        title="Feedback"
        hint="Replaces the public feedback list. Add or remove rows — buyers only see what you save."
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              update({
                ...draft,
                feedback: [
                  ...draft.feedback,
                  {
                    client: "0x…",
                    score: 90,
                    tag: "quality",
                    comment: "",
                    at: new Date().toISOString(),
                  },
                ],
                feedbackCount: Math.max(draft.feedbackCount, draft.feedback.length + 1),
              })
            }
          >
            Add review
          </Button>
        }
      >
        {draft.feedback.length ? (
          <div className="md:col-span-2 space-y-3">
            {draft.feedback.map((row, i) => (
              <div key={`${row.at}-${i}`} className="grid gap-2 rounded-[8px] border border-bas-hairline p-3 md:grid-cols-2">
                <Field label="Score">
                  <input
                    type="number"
                    value={row.score}
                    onChange={(e) => setFeedback(i, { score: Number(e.target.value) })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Tag">
                  <input value={row.tag} onChange={(e) => setFeedback(i, { tag: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Client">
                  <input
                    value={row.client}
                    onChange={(e) => setFeedback(i, { client: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="When (ISO)">
                  <input value={row.at} onChange={(e) => setFeedback(i, { at: e.target.value })} className={inputCls} />
                </Field>
                <label className="md:col-span-2 text-xs text-bas-muted">
                  Comment
                  <textarea
                    value={row.comment}
                    onChange={(e) => setFeedback(i, { comment: e.target.value })}
                    className={`${inputCls} mt-1 h-16 py-2`}
                  />
                </label>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() =>
                    update({
                      ...draft,
                      feedback: draft.feedback.filter((_, idx) => idx !== i),
                    })
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="md:col-span-2 text-sm text-bas-muted">No reviews yet. Add one to show it on the public page.</p>
        )}
      </Section>

      <Section title="Notes" hint="Operator only. Never shown on the market.">
        <label className="md:col-span-2 text-xs text-bas-muted">
          Internal notes
          <textarea
            value={draft.notes}
            onChange={(e) => set("notes", e.target.value)}
            className={`${inputCls} mt-1 h-20 py-2`}
          />
        </label>
      </Section>

      {error ? <p className="text-sm text-bas-down">{error}</p> : null}
      <div className="sticky bottom-0 z-10 border-t border-bas-hairline bg-bas-canvas py-3">
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : submitLabel}</Button>
      </div>
    </form>
  );
}

function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[12px] border border-bas-hairline bg-bas-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-bas-heading">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-bas-muted">{hint}</p>
        </div>
        {action}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
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
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-[12px] border border-bas-hairline bg-bas-canvas px-3 py-3 text-left hover:bg-bas-elevated"
    >
      <span>
        <span className="block text-sm font-medium text-bas-heading">{label}</span>
        <span className="mt-0.5 block text-[11px] text-bas-muted">{hint}</span>
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-bas-up" : "bg-bas-surface-strong"}`}
        aria-hidden
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-[left] ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

const inputCls =
  "admin-field h-12 w-full px-3 text-base sm:h-10 sm:text-sm";
