import { notFound } from "next/navigation";
import { AgentDetailView } from "@/components/agent/AgentDetailView";
import { AppShell } from "@/components/shell/AppShell";
import { getScanAgent } from "@/lib/agents/scan";
import { probeEndpoint } from "@/lib/agents/liveness";

export const revalidate = 60;

export default async function AgentPage({
  params,
}: {
  params: Promise<{ chainId: string; tokenId: string }>;
}) {
  const { chainId, tokenId } = await params;
  const agent = await getScanAgent(Number(chainId), tokenId);
  if (!agent) notFound();

  const endpoint = agent.services.find((s) => s.endpoint)?.endpoint;
  if (endpoint && !agent.liveLocked && agent.source !== "featured") {
    const live = await probeEndpoint(endpoint);
    agent.live = live.live;
    agent.liveReason = live.reason;
  }

  return (
    <AppShell>
      <AgentDetailView agent={agent} />
    </AppShell>
  );
}
