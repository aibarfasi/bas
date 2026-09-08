"use client";

import { useRouter } from "next/navigation";
import { AgentForm } from "@/components/admin/AgentForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBanner } from "@/components/admin/ResponsiveTable";
import { Button } from "@/components/ui/Button";
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
      <PageHeader
        title="Add seller"
        desc="Appears on the public market immediately. Hire faces reuse the category seller runtime."
        actions={
          <>
            <Button href="/admin/agents" variant="secondary">
              Back to sellers
            </Button>
            <Button href="/admin/catalog" variant="secondary">
              Catalog
            </Button>
          </>
        }
      />
      <StatusBanner
        tone="neutral"
        title="New BAS seller"
        body="Hireable faces reuse the category runtime (Monitoring, Grid, Yield, Health). Token id + chain id become the public URL."
      />
      <AgentForm submitLabel="Create seller" onSubmit={onSubmit} />
    </div>
  );
}
