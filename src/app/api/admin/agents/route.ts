import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { resolveFeaturedAgents } from "@/lib/admin/catalog";
import { addCustomAgent, getOverrides, putOverride } from "@/lib/admin/store";
import type { AgentDraft } from "@/lib/admin/types";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({
    agents: resolveFeaturedAgents(),
    overrides: getOverrides(),
  });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const draft = (await req.json().catch(() => null)) as AgentDraft | null;
  if (!draft?.name || !draft.tokenId || !draft.owner) {
    return NextResponse.json({ error: "name, tokenId, owner required" }, { status: 400 });
  }
  try {
    const agent = addCustomAgent({
      name: draft.name,
      description: draft.description ?? "",
      category: draft.category ?? "grid",
      tokenId: draft.tokenId,
      chainId: Number(draft.chainId) || 97,
      owner: draft.owner,
      agentWallet: draft.agentWallet ?? draft.owner,
      priceUsd: Number(draft.priceUsd) || 0,
      featured: draft.featured ?? true,
      hireable: draft.hireable ?? true,
      live: draft.live ?? true,
      verified: draft.verified ?? false,
      spendCap: draft.spendCap ?? "0.05",
      spendToken: draft.spendToken ?? "BNB",
      expiryHours: Number(draft.expiryHours) || 24,
      txHash: draft.txHash ?? "",
      registry: draft.registry ?? "",
      categoryReason: draft.categoryReason ?? "",
      notes: draft.notes ?? "",
    });
    if (draft.notes) putOverride({ id: agent.id, notes: draft.notes });
    return NextResponse.json({ agent }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 400 },
    );
  }
}
