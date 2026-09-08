"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AgentDetailView } from "@/components/agent/AgentDetailView";
import { AgentForm } from "@/components/admin/AgentForm";
import { Confirm } from "@/components/admin/Confirm";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/admin/Toast";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { previewFromDraft } from "@/lib/admin/draft";
import type { AgentDraft, AgentPatch } from "@/lib/admin/types";
import type { MarketplaceAgent } from "@/lib/agents/types";
import { agentPath, hirePath } from "@/lib/format";

export default function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const decoded = decodeURIComponent(id);
  const router = useRouter();
  const toast = useToast();
  const [agent, setAgent] = useState<MarketplaceAgent | null>(null);
  const [preview, setPreview] = useState<MarketplaceAgent | null>(null);
  const [custom, setCustom] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ask, setAsk] = useState<"hide" | "delete" | null>(null);

  useEffect(() => {
    adminFetch<{ agent: MarketplaceAgent; custom: boolean; override: AgentPatch | null }>(
      `/api/admin/agents/${encodeURIComponent(decoded)}`,
    )
      .then((d) => {
        setAgent(d.agent);
        setCustom(d.custom);
        setNotes(d.override?.notes ?? "");
        setPreview(d.agent);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [decoded]);

  async function onSubmit(draft: AgentDraft) {
    await adminFetch(`/api/admin/agents/${encodeURIComponent(decoded)}`, {
      method: "PATCH",
      body: JSON.stringify(draft),
    });
    const next = await adminFetch<{ agent: MarketplaceAgent; override: AgentPatch | null }>(
      `/api/admin/agents/${encodeURIComponent(decoded)}`,
    );
    setAgent(next.agent);
    setPreview(next.agent);
    setNotes(next.override?.notes ?? draft.notes);
    toast("ok", "Public page updated");
  }

  async function hide() {
    await adminFetch(`/api/admin/agents/${encodeURIComponent(decoded)}`, {
      method: "PATCH",
      body: JSON.stringify({ hidden: true }),
    });
    toast("ok", "Hidden from market");
    router.push("/admin/agents");
  }

  async function reset() {
    await adminFetch(`/api/admin/agents/${encodeURIComponent(decoded)}`, {
      method: "PATCH",
      body: JSON.stringify({ reset: true }),
    });
    const next = await adminFetch<{ agent: MarketplaceAgent; override: AgentPatch | null }>(
      `/api/admin/agents/${encodeURIComponent(decoded)}`,
    );
    setAgent(next.agent);
    setPreview(next.agent);
    setNotes(next.override?.notes ?? "");
    toast("ok", "Overrides reset");
  }

  async function remove() {
    await adminFetch(`/api/admin/agents/${encodeURIComponent(decoded)}`, {
      method: "DELETE",
    });
    toast("ok", "Seller deleted");
    router.push("/admin/agents");
  }

  if (error) return <p className="text-sm text-bas-down">{error}</p>;
  if (!agent) return <p className="text-sm text-bas-muted">Loading seller…</p>;

  return (
    <div>
      <p className="text-xs text-bas-muted">
        <Link href="/admin/agents">Sellers</Link> / {agent.name}
      </p>
      <PageHeader
        title={agent.name}
        desc={`${agent.id} · every field here is what buyers see. Live status stays locked after you save it.`}
        actions={
          <>
            <Button href={agentPath(agent.chainId, agent.tokenId)} variant="secondary">
              Open public page
            </Button>
            {agent.hireable ? (
              <Button href={hirePath(agent.chainId, agent.tokenId)} variant="secondary">
                Hire
              </Button>
            ) : null}
          </>
        }
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <AgentForm
          key={`${agent.id}-${notes}-${agent.live}-${agent.hireable}`}
          initial={agent}
          initialNotes={notes}
          submitLabel="Publish to market"
          onSubmit={onSubmit}
          onChange={(draft) => setPreview(previewFromDraft(agent, draft))}
        />
        <aside className="xl:sticky xl:top-4 xl:self-start">
          <p className="text-xs font-semibold uppercase tracking-wide text-bas-muted">Buyer preview</p>
          <p className="mt-1 text-xs text-bas-muted">Updates as you type. Save to publish.</p>
          <div className="mt-3 max-h-[70vh] overflow-auto rounded-[12px] border border-bas-hairline p-4">
            {preview ? <AgentDetailView agent={preview} compact /> : null}
          </div>
        </aside>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={reset}>
          Reset overrides
        </Button>
        <Button variant="secondary" onClick={() => setAsk("hide")}>
          Hide from market
        </Button>
        {custom ? (
          <Button variant="danger" onClick={() => setAsk("delete")}>
            Delete seller
          </Button>
        ) : null}
      </div>
      {ask === "hide" ? (
        <Confirm
          title="Hide this seller"
          body="It disappears from the public market. Reset overrides to bring it back."
          confirm="Hide"
          danger
          onCancel={() => setAsk(null)}
          onConfirm={hide}
        />
      ) : null}
      {ask === "delete" ? (
        <Confirm
          title="Delete this seller"
          body="Custom sellers are removed. Seed BAS agents cannot be deleted this way."
          confirm="Delete"
          danger
          onCancel={() => setAsk(null)}
          onConfirm={remove}
        />
      ) : null}
    </div>
  );
}
