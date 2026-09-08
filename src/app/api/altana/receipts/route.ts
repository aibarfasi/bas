import { NextResponse } from "next/server";
import { altanaExplorer } from "@/lib/format";
import { getReceipt, listReceipts, putReceipt, type SessionReceipt } from "@/lib/altana/ledger";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    const row = getReceipt(id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ receipt: row });
  }
  return NextResponse.json({ receipts: listReceipts() });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<SessionReceipt>;
  if (!body.sessionId || !body.action || !body.wallet) {
    return NextResponse.json({ error: "sessionId, action, wallet required" }, { status: 400 });
  }
  const receipt = putReceipt({
    id: `alt_${body.action}_${body.sessionId}`,
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
    demo: Boolean(body.demo),
    explorer: altanaExplorer(body.wallet),
    createdAt: Date.now(),
  });
  return NextResponse.json({ receipt });
}
