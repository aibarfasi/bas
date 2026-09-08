"use client";

import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { WalletButton } from "@/components/wallet/WalletButton";
import { agentPath } from "@/lib/format";

export default function ClaimPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [chainId, setChainId] = useState("56");
  const [tokenId, setTokenId] = useState("");
  const [job, setJob] = useState("");
  const [pancake, setPancake] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function claim() {
    if (!address) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const at = Date.now();
      const message = `BAS claim ${Number(chainId)}:${tokenId} as ${address} at ${at}`;
      const sig = await signMessageAsync({ message });
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chainId: Number(chainId),
          tokenId,
          owner: address,
          sig,
          at,
          job: job || undefined,
          pancake: pancake || undefined,
          priceUsd: priceUsd ? Number(priceUsd) : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string; claim?: { agentId: string } };
      if (!res.ok) throw new Error(data.error || "Claim failed");
      setOk(data.claim?.agentId ?? "claimed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <p className="text-xs text-bas-muted">Seller · ERC-8004 ownership</p>
      <h1 className="mt-2 text-3xl font-semibold text-bas-heading">Claim a listing</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-bas-muted">
        Connect the wallet that owns the ERC-8004 token (or the published agent wallet). Sign a
        message. BAS then lets you publish job copy and price without the operator password.
      </p>

      <div className="mt-6 grid max-w-2xl gap-4">
        <WalletButton layout="card" preferredChainId={Number(chainId) || 56} />
        <div className="rounded-[12px] bg-bas-card p-5">
        <label className="block text-xs text-bas-muted">
          Chain id
          <input
            value={chainId}
            onChange={(e) => setChainId(e.target.value)}
            className="num mt-1 h-10 w-full admin-field px-3 text-bas-heading"
          />
        </label>
        <label className="mt-3 block text-xs text-bas-muted">
          Token id
          <input
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="8004scan token id"
            className="num mt-1 h-10 w-full admin-field px-3 text-bas-heading"
          />
        </label>
        <label className="mt-3 block text-xs text-bas-muted">
          Job (optional)
          <textarea
            value={job}
            onChange={(e) => setJob(e.target.value)}
            rows={3}
            className="mt-1 w-full admin-field px-3 py-2 text-sm text-bas-heading"
          />
        </label>
        <label className="mt-3 block text-xs text-bas-muted">
          Pancake venue (optional)
          <input
            value={pancake}
            onChange={(e) => setPancake(e.target.value)}
            className="mt-1 h-10 w-full admin-field px-3 text-sm text-bas-heading"
          />
        </label>
        <label className="mt-3 block text-xs text-bas-muted">
          Price USD (optional)
          <input
            value={priceUsd}
            onChange={(e) => setPriceUsd(e.target.value)}
            className="num mt-1 h-10 w-full admin-field px-3 text-bas-heading"
          />
        </label>
        {error ? <p className="mt-3 text-sm text-bas-down">{error}</p> : null}
        {ok ? (
          <p className="mt-3 text-sm text-bas-up">
            Claimed.{" "}
            <a className="text-bas-primary" href={agentPath(Number(chainId), tokenId)}>
              Open listing
            </a>
          </p>
        ) : null}
        <Button className="mt-5" disabled={!isConnected || !tokenId || busy} onClick={claim}>
          {busy ? "Claiming…" : "Sign and claim"}
        </Button>
        </div>
      </div>
    </AppShell>
  );
}
