import { NextResponse } from "next/server";
import { hydrateFromSql } from "@/lib/admin/store";
import { putReceipt } from "@/lib/altana/ledger";
import { altanaExplorer } from "@/lib/format";
import {
  disputeHireSession,
  getHireJob,
  getHireSession,
  hydrateHires,
  renewHireSession,
  topupHireSession,
} from "@/lib/ops/hires";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await hydrateFromSql();
  await hydrateHires();
  const { id } = await ctx.params;
  const session = getHireSession(id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ session, job: getHireJob(id) });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await hydrateFromSql();
  await hydrateHires();
  const { id } = await ctx.params;
  const session = getHireSession(id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as {
    action?: "renew" | "topup" | "dispute";
    hours?: number;
    extraCap?: string;
    reason?: string;
    sig?: string | null;
  };

  if (body.action === "renew") {
    const next = renewHireSession(id, body.hours ?? 24);
    if (!next) return NextResponse.json({ error: "Cannot renew this session" }, { status: 400 });
    putReceipt({
      id: `alt_renew_${id}_${Date.now().toString(36)}`,
      action: "renew",
      sessionId: next.id,
      agentId: next.agentId,
      agentName: next.agentName,
      wallet: next.wallet,
      owner: next.owner,
      spendCap: next.spendCap,
      spendToken: next.spendToken,
      expiry: next.expiry,
      allowlist: next.allowlist,
      grantSig: next.grantSig,
      revokeSig: next.revokeSig,
      grantHash: next.grantHash,
      revokeHash: next.revokeHash,
      grantTx: next.grantTx,
      revokeTx: next.revokeTx,
      demo: next.demo,
      explorer: altanaExplorer(next.wallet),
      createdAt: Date.now(),
    });
    return NextResponse.json({ session: next });
  }

  if (body.action === "topup") {
    const next = topupHireSession(id, body.extraCap ?? "0.05");
    if (!next) return NextResponse.json({ error: "Cannot raise cap on this session" }, { status: 400 });
    putReceipt({
      id: `alt_topup_${id}_${Date.now().toString(36)}`,
      action: "topup",
      sessionId: next.id,
      agentId: next.agentId,
      agentName: next.agentName,
      wallet: next.wallet,
      owner: next.owner,
      spendCap: next.spendCap,
      spendToken: next.spendToken,
      expiry: next.expiry,
      allowlist: next.allowlist,
      grantSig: next.grantSig,
      revokeSig: next.revokeSig,
      grantHash: next.grantHash,
      revokeHash: next.revokeHash,
      grantTx: next.grantTx,
      revokeTx: next.revokeTx,
      demo: next.demo,
      explorer: altanaExplorer(next.wallet),
      createdAt: Date.now(),
    });
    return NextResponse.json({ session: next });
  }

  if (body.action === "dispute") {
    const reason = (body.reason ?? "").trim() || "Hirer's kill switch";
    const next = disputeHireSession(id, reason, body.sig);
    if (!next) return NextResponse.json({ error: "Cannot dispute this session" }, { status: 400 });
    putReceipt({
      id: `alt_dispute_${id}_${Date.now().toString(36)}`,
      action: "dispute",
      sessionId: next.id,
      agentId: next.agentId,
      agentName: next.agentName,
      wallet: next.wallet,
      owner: next.owner,
      spendCap: next.spendCap,
      spendToken: next.spendToken,
      expiry: next.expiry,
      allowlist: next.allowlist,
      grantSig: next.grantSig,
      revokeSig: next.revokeSig,
      grantHash: next.grantHash,
      revokeHash: next.revokeHash,
      grantTx: next.grantTx,
      revokeTx: next.revokeTx,
      demo: next.demo,
      explorer: altanaExplorer(next.wallet),
      createdAt: Date.now(),
    });
    return NextResponse.json({ session: next });
  }

  return NextResponse.json({ error: "action renew | topup | dispute required" }, { status: 400 });
}
