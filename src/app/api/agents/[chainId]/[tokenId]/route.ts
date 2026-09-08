import { getScanAgent } from "@/lib/agents/scan";
import { probeEndpoint } from "@/lib/agents/liveness";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ chainId: string; tokenId: string }> },
) {
  const { chainId, tokenId } = await ctx.params;
  const agent = await getScanAgent(Number(chainId), tokenId);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  const endpoint = agent.services.find((s) => s.endpoint)?.endpoint;
  if (endpoint) {
    const live = await probeEndpoint(endpoint);
    agent.live = live.live;
    agent.liveReason = live.reason;
  }
  return NextResponse.json({ agent });
}
