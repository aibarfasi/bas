import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { putReceipt } from "@/lib/altana/ledger";
import { altanaExplorer } from "@/lib/format";
import { getHireSession, listHireSessions, revokeHireSession } from "@/lib/ops/hires";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ sessions: listHireSessions() });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const before = getHireSession(body.id);
  const session = revokeHireSession(body.id, "admin");
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (before && !before.revokedAt) {
    putReceipt({
      id: `alt_revoke_${session.id}`,
      action: "revoke",
      sessionId: session.id,
      agentId: session.agentId,
      agentName: session.agentName,
      wallet: session.wallet,
      owner: session.owner,
      spendCap: session.spendCap,
      spendToken: session.spendToken,
      expiry: session.expiry,
      allowlist: session.allowlist,
      grantSig: session.grantSig,
      revokeSig: "admin",
      demo: session.demo,
      explorer: altanaExplorer(session.wallet),
      createdAt: Date.now(),
    });
  }
  return NextResponse.json({ session });
}
