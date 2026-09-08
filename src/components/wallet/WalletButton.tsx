"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatEther } from "viem";
import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { chainName, explorerAddress, shortAddr } from "@/lib/format";
import {
  connectErrorMessage,
  isLikelyMobile,
  mobileWalletHrefs,
} from "@/lib/wallet/config";
import { AddressAvatar } from "@/components/wallet/Avatar";
import { WalletGlyph, walletKind } from "@/components/wallet/icons";

type Layout = "header" | "card";

export function WalletButton({
  light = false,
  preferredChainId,
  layout = "header",
}: {
  light?: boolean;
  preferredChainId?: number;
  layout?: Layout;
}) {
  const { address, isConnected, chainId, status, connector } = useAccount();
  const { connectors, connect, isPending, error, reset, variables } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching, error: switchError } = useSwitchChain();
  const { data: bal } = useBalance({ address, query: { enabled: Boolean(address) } });
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const listed = uniqueConnectors(connectors);
  const mobile = mounted && isLikelyMobile();
  const err = error ?? switchError;
  const wrong = Boolean(
    isConnected && preferredChainId && chainId && chainId !== preferredChainId,
  );
  const pendingUid =
    variables?.connector && "uid" in variables.connector
      ? String(variables.connector.uid)
      : undefined;

  function close() {
    setOpen(false);
    reset();
  }

  const body = (
    <WalletSheet
      embedded={layout === "card"}
      titleId={titleId}
      light={light}
      address={address}
      isConnected={Boolean(isConnected && address)}
      chainId={chainId}
      connectorName={connector?.name}
      balance={
        bal ? `${trimBal(formatEther(bal.value))} ${bal.symbol}` : null
      }
      wrong={wrong}
      preferredChainId={preferredChainId}
      listed={listed}
      mobile={mobile}
      isPending={isPending}
      pendingId={pendingUid}
      switching={switching}
      copied={copied}
      error={err}
      onConnect={(uid) => {
        const c = listed.find((x) => x.uid === uid);
        if (!c) return;
        connect(
          { connector: c, chainId: preferredChainId as 56 | 97 | undefined },
          { onSuccess: close },
        );
      }}
      onSwitch={(id) => switchChain({ chainId: id }, { onSuccess: close })}
      onCopy={async () => {
        if (!address) return;
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      onDisconnect={() => {
        disconnect();
        close();
      }}
      onClose={close}
    />
  );

  if (!mounted || status === "reconnecting") {
    if (layout === "card") {
      return <div className="h-40 animate-pulse rounded-[12px] bg-bas-surface-soft" />;
    }
    return (
      <div
        className={`h-10 w-[8.5rem] rounded-[6px] border ${
          light ? "border-bas-hairline-light bg-bas-card" : "border-bas-hairline bg-bas-card"
        }`}
        aria-hidden
      />
    );
  }

  if (layout === "card") {
    return <div ref={root}>{body}</div>;
  }

  return (
    <div ref={root} className="relative">
      {isConnected && address ? (
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            setOpen((v) => !v);
            reset();
          }}
          className={`inline-flex h-10 max-w-[11.5rem] items-center gap-2 rounded-[8px] border px-2 pr-3 text-left ${
            wrong
              ? "border-bas-down/60 bg-bas-down/10"
              : light
                ? "border-bas-hairline-light bg-bas-card"
                : "border-bas-hairline bg-bas-surface-soft hover:bg-bas-elevated"
          }`}
        >
          <AddressAvatar address={address} size={24} />
          <span className="min-w-0">
            <span className="num block truncate text-xs font-medium text-bas-heading">
              {shortAddr(address)}
            </span>
            <span
              className={`block truncate text-[10px] leading-tight ${
                wrong ? "text-bas-down" : "text-bas-muted"
              }`}
            >
              {wrong ? "Wrong network" : chainName(chainId ?? 0)}
            </span>
          </span>
        </button>
      ) : (
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={isPending}
          onClick={() => {
            setOpen(true);
            reset();
          }}
          className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-bas-primary px-4 text-sm font-semibold text-bas-on-primary hover:bg-bas-primary-active disabled:opacity-60"
        >
          <WalletGlyph kind="wallet" className="h-4 w-4" />
          {isPending ? "Connecting…" : "Connect"}
        </button>
      )}

      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
              <button
                type="button"
                aria-label="Close wallet"
                className="absolute inset-0 bg-black/70"
                onClick={close}
              />
              <div className="relative w-full max-w-[400px] sm:px-4">
                {body}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function WalletSheet({
  embedded = false,
  titleId,
  light,
  address,
  isConnected,
  chainId,
  connectorName,
  balance,
  wrong,
  preferredChainId,
  listed,
  mobile,
  isPending,
  pendingId,
  switching,
  copied,
  error,
  onConnect,
  onSwitch,
  onCopy,
  onDisconnect,
  onClose,
}: {
  embedded?: boolean;
  titleId: string;
  light: boolean;
  address?: string;
  isConnected: boolean;
  chainId?: number;
  connectorName?: string;
  balance: string | null;
  wrong: boolean;
  preferredChainId?: number;
  listed: { uid: string; name: string; id: string }[];
  mobile: boolean;
  isPending: boolean;
  pendingId?: string;
  switching: boolean;
  copied: boolean;
  error: unknown;
  onConnect: (uid: string) => void;
  onSwitch: (id: 56 | 97) => void;
  onCopy: () => void;
  onDisconnect: () => void;
  onClose: () => void;
}) {
  const panel = light
    ? "border-bas-hairline-light bg-bas-canvas-light text-bas-ink"
    : "border-bas-hairline bg-[#111214] text-bas-body";

  return (
    <div
      role={embedded ? "region" : "dialog"}
      aria-labelledby={titleId}
      className={`${embedded ? "rounded-[12px] border p-5" : "rounded-t-[16px] border p-5 sm:rounded-[16px]"} ${panel}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id={titleId} className="text-base font-semibold text-bas-heading">
            {isConnected ? "Wallet" : "Connect wallet"}
          </h2>
          <p className="mt-1 text-xs leading-5 text-bas-muted">
            {isConnected
              ? "Session grant and x402 pay sign from this account."
              : "BNB Smart Chain. Judges can still hire without connecting."}
          </p>
        </div>
        {embedded ? null : (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-bas-muted hover:bg-bas-elevated hover:text-bas-heading"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      {isConnected && address ? (
        <>
          <div className="flex items-center gap-3 rounded-[12px] bg-bas-surface-soft p-3">
            <AddressAvatar address={address} size={44} />
            <div className="min-w-0 flex-1">
              <div className="num truncate text-sm font-semibold text-bas-heading">
                {shortAddr(address, 6)}
              </div>
              <div className="mt-0.5 text-xs text-bas-muted">
                {connectorName ?? "Wallet"}
                {balance ? ` · ${balance}` : ""}
              </div>
            </div>
            <button
              type="button"
              onClick={onCopy}
              className="h-8 rounded-[6px] bg-bas-elevated px-2.5 text-xs font-medium text-bas-heading"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          {wrong && preferredChainId ? (
            <p className="mt-3 rounded-[8px] bg-bas-down/10 px-3 py-2 text-xs text-bas-down">
              This page expects {chainName(preferredChainId)}. Switch before you sign.
            </p>
          ) : null}

          <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-bas-muted">
            Network
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <NetChip
              label="BSC"
              hint="Mainnet · 56"
              active={chainId === bsc.id}
              disabled={switching}
              onClick={() => onSwitch(bsc.id)}
            />
            <NetChip
              label="Testnet"
              hint="Chapel · 97"
              active={chainId === bscTestnet.id}
              disabled={switching}
              onClick={() => onSwitch(bscTestnet.id)}
            />
          </div>
          {preferredChainId && chainId !== preferredChainId ? (
            <button
              type="button"
              disabled={switching}
              onClick={() => onSwitch(preferredChainId as 56 | 97)}
              className="mt-3 h-10 w-full rounded-[8px] bg-bas-primary text-sm font-semibold text-bas-on-primary"
            >
              {switching ? "Switching…" : `Switch to ${chainName(preferredChainId)}`}
            </button>
          ) : null}

          <div className="mt-4 flex gap-2">
            <a
              href={explorerAddress(chainId ?? 56, address)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 flex-1 items-center justify-center rounded-[8px] border border-bas-hairline text-sm hover:bg-bas-elevated"
            >
              BscScan
            </a>
            <button
              type="button"
              onClick={onDisconnect}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-[8px] border border-bas-hairline text-sm text-bas-down hover:bg-bas-down/10"
            >
              Disconnect
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            {listed.map((c) => {
              const kind = walletKind(c.name);
              const label = c.name === "Injected" ? "Browser wallet" : c.name;
              const busy = isPending && pendingId === c.uid;
              return (
                <button
                  key={c.uid}
                  type="button"
                  disabled={isPending}
                  onClick={() => onConnect(c.uid)}
                  className="flex h-14 w-full items-center gap-3 rounded-[12px] border border-bas-hairline bg-bas-surface-soft px-3 text-left hover:border-bas-primary/50 hover:bg-bas-elevated disabled:opacity-60"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-bas-canvas">
                    <WalletGlyph kind={kind} className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-bas-heading">{label}</span>
                    <span className="block text-[11px] text-bas-muted">Detected in this browser</span>
                  </span>
                  <span className="text-xs text-bas-primary">{busy ? "…" : "Connect"}</span>
                </button>
              );
            })}
          </div>

          {mobile ? (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-bas-muted">
                On phone
              </p>
              {mobileWalletHrefs().map((l) => (
                <a
                  key={l.id}
                  href={l.href}
                  className="flex h-12 items-center gap-3 rounded-[12px] border border-bas-hairline px-3 text-sm hover:bg-bas-elevated"
                >
                  <WalletGlyph
                    kind={l.id === "binance" ? "binance" : "metamask"}
                    className="h-6 w-6"
                  />
                  {l.name}
                </a>
              ))}
            </div>
          ) : null}

          {!listed.length && !mobile ? (
            <p className="mt-3 text-sm leading-6 text-bas-muted">
              No extension found. Install{" "}
              <a className="text-bas-primary" href="https://metamask.io/download" target="_blank" rel="noreferrer">
                MetaMask
              </a>{" "}
              or{" "}
              <a
                className="text-bas-primary"
                href="https://www.binance.com/en/web3wallet"
                target="_blank"
                rel="noreferrer"
              >
                Binance Wallet
              </a>
              , then refresh.
            </p>
          ) : null}
        </>
      )}

      {error ? (
        <p className="mt-3 rounded-[8px] bg-bas-down/10 px-3 py-2 text-xs text-bas-down">
          {connectErrorMessage(error)}
        </p>
      ) : null}
    </div>
  );
}

function NetChip({
  label,
  hint,
  active,
  disabled,
  onClick,
}: {
  label: string;
  hint: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-[10px] border px-3 py-2.5 text-left disabled:opacity-50 ${
        active
          ? "border-bas-primary bg-bas-primary/10"
          : "border-bas-hairline bg-bas-surface-soft hover:bg-bas-elevated"
      }`}
    >
      <span className="block text-sm font-semibold text-bas-heading">{label}</span>
      <span className="num mt-0.5 block text-[11px] text-bas-muted">{hint}</span>
    </button>
  );
}

function uniqueConnectors<T extends { uid: string; name: string; id: string }>(rows: readonly T[]) {
  const seen = new Set<string>();
  return rows.filter((c) => {
    const key = c.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function trimBal(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  if (n === 0) return "0";
  if (n < 0.0001) return "<0.0001";
  return n.toFixed(n < 1 ? 4 : 3);
}
