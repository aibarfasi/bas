import { NextResponse } from "next/server";
import { altanaExplorer, explorerTx } from "@/lib/format";
import { grantCommitment, revokeCommitment } from "@/lib/altana/hash";
import { getReceipt, listReceipts, putReceipt, type SessionReceipt } from "@/lib/altana/ledger";
import { hydrateFromSql } from "@/lib/admin/store";

export async function GET(req: Request) {
  await hydrateFromSql();
  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    const row = getReceipt(id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ receipt: row });
  }
  return NextResponse.json({ receipts: listReceipts() });
}

export async function POST(req: Request) {
  await hydrateFromSql();
  const body = (await req.json().catch(() => ({}))) as Partial<SessionReceipt> & {
    chainId?: number;
  };
  if (!body.sessionId || !body.action || !body.wallet) {
    return NextResponse.json({ error: "sessionId, action, wallet required" }, { status: 400 });
  }
  const grantHash =
    body.grantHash ??
    grantCommitment({
      id: body.sessionId,
      agentId: body.agentId ?? "",
      wallet: body.wallet,
      spendCap: body.spendCap ?? "0",
      spendToken: body.spendToken ?? "BNB",
      expiry: body.expiry ?? 0,
      allowlist: body.allowlist ?? [],
      grantSig: body.grantSig ?? null,
    });
  const revokeHash =
    body.action === "revoke" || body.action === "dispute"
      ? (body.revokeHash ??
        revokeCommitment({
          id: body.sessionId,
          wallet: body.wallet,
          revokeSig: body.revokeSig ?? null,
        }))
      : (body.revokeHash ?? null);
  const tx = body.grantTx || body.revokeTx;
  const receipt = putReceipt({
    id: `alt_${body.action}_${body.sessionId}_${Date.now().toString(36)}`,
    action: body.action,
    sessionId: body.sessionId,
    agentId: body.agentId ?? "",
    agentName: body.agentName ?? "",
    wallet: body.wallet,
    owner: body.owner ?? "",
    spendCap: body.spendCap ?? "0",
    spendToken: body.spendToken ?? "BNB",
    expiry: body.expiry ?? 0,
    allowlist: body.allowlist ?? [],
    grantSig: body.grantSig ?? null,
    revokeSig: body.revokeSig ?? null,
    grantHash,
    revokeHash,
    grantTx: body.grantTx ?? null,
    revokeTx: body.revokeTx ?? null,
    demo: Boolean(body.demo),
    explorer: tx && body.chainId ? explorerTx(body.chainId, tx) : altanaExplorer(body.wallet),
    createdAt: Date.now(),
  });
  return NextResponse.json({ receipt });
}
