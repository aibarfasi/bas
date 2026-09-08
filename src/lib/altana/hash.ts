import { keccak256, stringToHex } from "viem";
import type { HiredSession } from "@/lib/altana/sessions";

export function grantCommitment(session: Pick<
  HiredSession,
  "id" | "agentId" | "wallet" | "spendCap" | "spendToken" | "expiry" | "allowlist" | "grantSig"
>) {
  return keccak256(
    stringToHex(
      JSON.stringify({
        id: session.id,
        agentId: session.agentId,
        wallet: session.wallet.toLowerCase(),
        spendCap: session.spendCap,
        spendToken: session.spendToken,
        expiry: session.expiry,
        allowlist: session.allowlist.map((a) => a.address.toLowerCase()).sort(),
        grantSig: session.grantSig,
      }),
    ),
  );
}

export function revokeCommitment(session: Pick<HiredSession, "id" | "wallet" | "revokeSig">) {
  return keccak256(
    stringToHex(
      JSON.stringify({
        sessionId: session.id,
        wallet: session.wallet.toLowerCase(),
        revokeSig: session.revokeSig,
      }),
    ),
  );
}
