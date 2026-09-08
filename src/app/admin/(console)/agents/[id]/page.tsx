"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AgentForm } from "@/components/admin/AgentForm";
import { Confirm } from "@/components/admin/Confirm";
import { useToast } from "@/components/admin/Toast";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
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
    setNotes(next.override?.notes ?? draft.notes);
    toast("ok", "Seller saved");
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
      <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-bas-heading">{agent.name}</h1>
          <p className="num mt-1 text-xs text-bas-muted">{agent.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button href={agentPath(agent.chainId, agent.tokenId)} variant="secondary">
            Public page
          </Button>
          {agent.hireable ? (
            <Button href={hirePath(agent.chainId, agent.tokenId)} variant="secondary">
              Hire
            </Button>
          ) : null}
        </div>
      </div>
      <AgentForm
        key={agent.id + agent.name + notes}
        initial={agent}
        initialNotes={notes}
        submitLabel="Save changes"
        onSubmit={onSubmit}
      />
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
