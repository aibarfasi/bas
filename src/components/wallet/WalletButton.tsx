"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortAddr } from "@/lib/format";

export function WalletButton({ light = false }: { light?: boolean }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        className={`num inline-flex h-10 items-center rounded-[6px] border px-3 text-xs ${
          light
            ? "border-bas-hairline-light bg-bas-card text-bas-ink"
            : "border-bas-hairline bg-bas-card text-bas-body"
        }`}
      >
        {shortAddr(address)}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={!injected || isPending}
      onClick={() => injected && connect({ connector: injected })}
      className={`inline-flex h-10 items-center rounded-[6px] px-4 text-sm font-semibold ${
        light
          ? "bg-bas-primary text-bas-on-primary"
          : "bg-bas-primary text-bas-on-primary hover:bg-bas-primary-active"
      }`}
    >
      {isPending ? "Connecting…" : "Connect wallet"}
    </button>
  );
}
