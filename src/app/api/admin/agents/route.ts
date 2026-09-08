import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { resolveFeaturedAgents } from "@/lib/admin/catalog";
import { emptyDraft } from "@/lib/admin/draft";
import { addCustomAgent, getOverrides } from "@/lib/admin/store";
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
  const incoming = (await req.json().catch(() => null)) as Partial<AgentDraft> | null;
  const draft = { ...emptyDraft(), ...incoming };
  if (!draft.name || !draft.tokenId || !draft.owner) {
    return NextResponse.json({ error: "name, tokenId, owner required" }, { status: 400 });
  }
  try {
    const agent = addCustomAgent(draft);
    return NextResponse.json({ agent }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 400 },
    );
  }
}
