"use client";

import { useRouter } from "next/navigation";
import { AgentForm } from "@/components/admin/AgentForm";
import { adminFetch } from "@/lib/admin/client";
import type { AgentDraft } from "@/lib/admin/types";
import type { MarketplaceAgent } from "@/lib/agents/types";

export default function NewAgentPage() {
  const router = useRouter();

  async function onSubmit(draft: AgentDraft) {
    const data = await adminFetch<{ agent: MarketplaceAgent }>("/api/admin/agents", {
      method: "POST",
      body: JSON.stringify(draft),
    });
    router.push(`/admin/agents/${encodeURIComponent(data.agent.id)}`);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-bas-heading">Add seller</h1>
      <p className="mt-1 text-sm text-bas-muted">
        Appears on the public market immediately. Hire faces reuse the category
        seller runtime.
      </p>
      <AgentForm submitLabel="Create seller" onSubmit={onSubmit} />
    </div>
  );
}
