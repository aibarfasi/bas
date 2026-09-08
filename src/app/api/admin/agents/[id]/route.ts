import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { resolveAgentById } from "@/lib/admin/catalog";
import {
  clearOverride,
  getCustomAgents,
  getOverrides,
  putOverride,
  removeCustomAgent,
} from "@/lib/admin/store";
import type { AgentPatch } from "@/lib/admin/types";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const decoded = decodeURIComponent(id);
  const agent = resolveAgentById(decoded);
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    agent,
    override: getOverrides()[decoded] ?? null,
    custom: getCustomAgents().some((a) => a.id === decoded),
  });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const decoded = decodeURIComponent(id);
  const body = (await req.json().catch(() => ({}))) as AgentPatch & { reset?: boolean };
  if (body.reset) {
    clearOverride(decoded);
    return NextResponse.json({ ok: true, agent: resolveAgentById(decoded) });
  }
  const { reset: _reset, ...fields } = body;
  const patch = putOverride({ ...fields, id: decoded });
  return NextResponse.json({ override: patch, agent: resolveAgentById(decoded) });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const decoded = decodeURIComponent(id);
  try {
    removeCustomAgent(decoded);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 400 },
    );
  }
}
