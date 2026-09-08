import { NextResponse } from "next/server";
import { hydrateFromSql, putOverride } from "@/lib/admin/store";
import { getClaim, listClaims, putClaim } from "@/lib/admin/store";
import { getScanAgent } from "@/lib/agents/scan";
import { isAddress, recoverMessageAddress } from "viem";

function claimMessage(input: { chainId: number; tokenId: string; owner: string; at: number }) {
  return `BAS claim ${input.chainId}:${input.tokenId} as ${input.owner} at ${input.at}`;
}

export async function GET(req: Request) {
  await hydrateFromSql();
  const agentId = new URL(req.url).searchParams.get("agentId");
  if (agentId) {
    const claim = getClaim(agentId);
    if (!claim) return NextResponse.json({ error: "Not claimed" }, { status: 404 });
    return NextResponse.json({ claim });
  }
  return NextResponse.json({ claims: listClaims() });
}

export async function POST(req: Request) {
  await hydrateFromSql();
  const body = (await req.json().catch(() => ({}))) as {
    chainId?: number;
    tokenId?: string;
    owner?: string;
    sig?: string;
    at?: number;
    job?: string;
    pancake?: string;
    priceUsd?: number | null;
  };
  if (!body.chainId || !body.tokenId || !body.owner || !body.sig || !body.at) {
    return NextResponse.json({ error: "chainId, tokenId, owner, sig, at required" }, { status: 400 });
  }
  if (!isAddress(body.owner)) {
    return NextResponse.json({ error: "Invalid owner address" }, { status: 400 });
  }
  const age = Math.abs(Date.now() - body.at);
  if (age > 15 * 60 * 1000) {
    return NextResponse.json({ error: "Claim signature expired. Sign again." }, { status: 400 });
  }
  const message = claimMessage({
    chainId: body.chainId,
    tokenId: body.tokenId,
    owner: body.owner,
    at: body.at,
  });
  let recovered: string;
  try {
    recovered = await recoverMessageAddress({ message, signature: body.sig as `0x${string}` });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  if (recovered.toLowerCase() !== body.owner.toLowerCase()) {
    return NextResponse.json({ error: "Signature does not match owner" }, { status: 403 });
  }
  const agent = await getScanAgent(body.chainId, body.tokenId);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  const allowed = [agent.owner, agent.agentWallet].filter(Boolean).map((a) => a!.toLowerCase());
  if (!allowed.includes(body.owner.toLowerCase())) {
    return NextResponse.json(
      { error: "Wallet is not the ERC-8004 owner or agent wallet on this record" },
      { status: 403 },
    );
  }
  const claim = putClaim({
    id: `claim_${agent.id}`,
    agentId: agent.id,
    chainId: agent.chainId,
    tokenId: agent.tokenId,
    owner: body.owner,
    sig: body.sig,
    at: Date.now(),
    job: body.job,
    pancake: body.pancake,
    priceUsd: body.priceUsd,
  });
  putOverride({
    id: agent.id,
    job: body.job,
    pancake: body.pancake,
    priceUsd: body.priceUsd,
    verified: true,
  });
  return NextResponse.json({ claim, message });
}
