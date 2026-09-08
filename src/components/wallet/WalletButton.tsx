"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
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
import { useAppearance } from "@/lib/theme/store";

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
  const theme = useAppearance((s) => s.theme);
  const macLight = light || theme === "light";
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

  function toggle() {
    setOpen((v) => !v);
    reset();
  }

  const menuProps = {
    titleId,
    light: macLight,
    address,
    isConnected: Boolean(isConnected && address),
    chainId,
    connectorName: connector?.name,
    balance: bal ? `${trimBal(formatEther(bal.value))} ${bal.symbol}` : null,
    wrong,
    preferredChainId,
    listed,
    mobile,
    isPending,
    pendingId: pendingUid,
    switching,
    copied,
    error: err,
    onConnect: (uid: string) => {
      const c = listed.find((x) => x.uid === uid);
      if (!c) return;
      connect(
        { connector: c, chainId: preferredChainId as 56 | 97 | undefined },
        { onSuccess: close },
      );
    },
    onSwitch: (id: 56 | 97) => switchChain({ chainId: id }, { onSuccess: close }),
    onCopy: async () => {
      if (!address) return;
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    },
    onDisconnect: () => {
      disconnect();
      close();
    },
    onClose: close,
  };

  if (layout === "card" && (!mounted || status === "reconnecting")) {
    return <div className="h-40 animate-pulse rounded-[12px] bg-bas-surface-soft" />;
  }

  if (layout === "card") {
    return (
      <div ref={root}>
        <WalletSheet embedded {...menuProps} />
      </div>
    );
  }

  return (
    <div ref={root} className="relative">
      {isConnected && address ? (
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={
            wrong
              ? `Wallet ${shortAddr(address)}, wrong network`
              : `Wallet ${shortAddr(address)}`
          }
          onClick={toggle}
          className="inline-flex h-8 max-w-[11rem] items-center gap-1.5 rounded-full p-[3px] pr-2 text-left"
          style={wrong ? macWarnChip(macLight) : macTrack(macLight)}
        >
          <AddressAvatar address={address} size={26} />
          <span className="min-w-0">
            <span className="num block truncate text-[12px] font-medium leading-none tracking-[-0.01em] text-bas-heading">
              {shortAddr(address)}
            </span>
            <span
              className={`mt-0.5 block truncate text-[10px] leading-none ${
                wrong ? "text-bas-down" : "text-bas-muted"
              }`}
            >
              {wrong ? "Wrong network" : chainName(chainId ?? 0)}
            </span>
          </span>
          <IconChevronDown
            className={`ml-0.5 shrink-0 text-bas-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </button>
      ) : (
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={isPending ? "Connecting wallet" : "Connect wallet"}
          disabled={isPending}
          onClick={toggle}
          className="inline-flex h-8 items-center rounded-full p-[3px] disabled:opacity-60"
          style={macTrack(macLight)}
        >
          <span
            className="inline-flex h-full items-center gap-1.5 rounded-full pl-2.5 pr-2 text-[13px] font-medium tracking-[-0.01em] text-bas-heading"
            style={macRaisedChip(macLight)}
          >
            <IconWallet className="text-bas-primary" />
            {isPending ? "Connecting…" : "Connect"}
            <IconChevronDown
              className={`text-bas-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            />
          </span>
        </button>
      )}

      {open && typeof document !== "undefined"
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close wallet"
                className={`fixed inset-0 z-[80] cursor-default backdrop-blur-sm ${
                  macLight ? "bg-black/25" : "bg-black/55"
                }`}
                onClick={close}
              />
              <div className="pointer-events-none fixed inset-0 z-[81] flex items-center justify-center p-4 sm:p-6">
                <div className="bas-mac-pop-center pointer-events-auto w-full max-w-[400px]">
                  <WalletMenu {...menuProps} />
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}

type PanelProps = {
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
};

function WalletMenu({
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
}: PanelProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={`rounded-[12px] p-5 ${light ? "" : "backdrop-blur-xl backdrop-saturate-150"}`}
      style={macMenu(light)}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-semibold text-bas-heading">
            {isConnected ? "Wallet" : "Connect wallet"}
          </h2>
          <p className="mt-1 text-xs leading-5 text-bas-muted">
            {isConnected
              ? "Session grant and x402 pay from this account."
              : "BNB Smart Chain. Hire still works without connecting."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="bas-mac-icon shrink-0 text-[13px] text-bas-muted hover:bg-bas-elevated hover:text-bas-heading"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {isConnected && address ? (
        <>
          <div
            className="flex items-center gap-2.5 rounded-[8px] px-2 py-2"
            style={{ background: light ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)" }}
          >
            <AddressAvatar address={address} size={32} />
            <div className="min-w-0 flex-1">
              <div className="num truncate text-[13px] font-medium text-bas-heading">
                {shortAddr(address, 6)}
              </div>
              <div className="mt-0.5 truncate text-[11px] text-bas-muted">
                {connectorName ?? "Wallet"}
                {balance ? ` · ${balance}` : ""}
              </div>
            </div>
          </div>
          <div className="mt-1">
            <MenuRow light={light} label={copied ? "Copied" : "Copy address"} onClick={onCopy} />
          </div>
          {wrong && preferredChainId ? (
            <p className="px-2 py-1.5 text-[11px] leading-4 text-bas-down">
              Switch to {chainName(preferredChainId)} before you sign.
            </p>
          ) : null}
          <MenuSep light={light} />
          <p className="px-2 pb-1 pt-0.5 text-[11px] font-medium text-bas-muted">Network</p>
          <MenuRow
            light={light}
            label="BSC"
            hint="56"
            active={chainId === bsc.id}
            disabled={switching}
            onClick={() => onSwitch(bsc.id)}
          />
          <MenuRow
            light={light}
            label="Testnet"
            hint="97"
            active={chainId === bscTestnet.id}
            disabled={switching}
            onClick={() => onSwitch(bscTestnet.id)}
          />
          <MenuSep light={light} />
          <MenuRow
            light={light}
            label="BscScan"
            href={explorerAddress(chainId ?? 56, address)}
          />
          <MenuRow light={light} label="Disconnect" danger onClick={onDisconnect} />
        </>
      ) : (
        <div className="space-y-1">
          {listed.map((c) => {
            const kind = walletKind(c.name);
            const label = c.name === "Injected" ? "Browser wallet" : c.name;
            const busy = isPending && pendingId === c.uid;
            return (
              <MenuRow
                key={c.uid}
                light={light}
                icon={<WalletGlyph kind={kind} className="h-5 w-5" />}
                label={label}
                hint={busy ? "Connecting…" : "Detected"}
                trailing={busy ? "…" : "Connect"}
                disabled={isPending}
                onClick={() => onConnect(c.uid)}
              />
            );
          })}
          {mobile
            ? mobileWalletHrefs().map((l) => (
                <MenuRow
                  key={l.id}
                  light={light}
                  icon={
                    <WalletGlyph
                      kind={l.id === "binance" ? "binance" : "metamask"}
                      className="h-5 w-5"
                    />
                  }
                  label={l.name}
                  hint="Open app"
                  trailing="Open"
                  href={l.href}
                />
              ))
            : null}
          {!listed.length && !mobile ? (
            <p className="px-2 py-2 text-[12px] leading-5 text-bas-muted">
              Install MetaMask or Binance Wallet, then refresh.
            </p>
          ) : null}
        </div>
      )}
      {error ? (
        <p className="mt-1.5 rounded-[8px] bg-bas-down/10 px-2.5 py-2 text-[11px] leading-4 text-bas-down">
          {connectErrorMessage(error)}
        </p>
      ) : null}
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
}: PanelProps & { embedded?: boolean }) {
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
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[13px] text-bas-muted hover:bg-bas-elevated hover:text-bas-heading"
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

function MenuRow({
  light,
  icon,
  label,
  hint,
  trailing,
  active,
  danger,
  disabled,
  href,
  onClick,
}: {
  light: boolean;
  icon?: ReactNode;
  label: string;
  hint?: string;
  trailing?: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const cls = `flex min-h-11 w-full items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-left disabled:opacity-50 ${
    danger ? "text-bas-down" : "text-bas-heading"
  } ${active ? "bg-bas-primary/15" : light ? "hover:bg-black/[0.05]" : "hover:bg-white/[0.08]"}`;
  const inner = (
    <>
      {icon ? (
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]"
          style={{ background: light ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.08)" }}
        >
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">{label}</span>
        {hint ? <span className="mt-0.5 block truncate text-[11px] text-bas-muted">{hint}</span> : null}
      </span>
      {trailing ? (
        <span className="shrink-0 text-xs font-semibold text-bas-primary">{trailing}</span>
      ) : null}
      {active ? <span className="text-[11px] font-semibold text-bas-primary">✓</span> : null}
    </>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" role="menuitem" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" role="menuitem" disabled={disabled} onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function MenuSep({ light }: { light: boolean }) {
  return (
    <div
      className="my-1.5 h-px"
      style={{ background: light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)" }}
    />
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

function IconWallet({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`h-[15px] w-[15px] ${className}`} aria-hidden>
      <path
        fill="currentColor"
        d="M4.1 5.2A2.1 2.1 0 0 1 6.2 3.1h7.6A2.1 2.1 0 0 1 15.9 5.2v.9h.7A1.9 1.9 0 0 1 18.5 8v6.2a2.3 2.3 0 0 1-2.3 2.3H6.2A2.1 2.1 0 0 1 4.1 14.4V5.2Z"
      />
      <circle cx="15.55" cy="11.05" r="1.15" className="fill-bas-heading" />
    </svg>
  );
}

function IconChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={`h-2.5 w-2.5 ${className}`} aria-hidden>
      <path
        fill="currentColor"
        d="M2.22 4.22a.75.75 0 0 1 1.06 0L6 6.94l2.72-2.72a.75.75 0 1 1 1.06 1.06L6.53 8.53a.75.75 0 0 1-1.06 0L2.22 5.28a.75.75 0 0 1 0-1.06Z"
      />
    </svg>
  );
}

function macTrack(light: boolean): CSSProperties {
  return {
    background: light ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)",
    boxShadow: light ? "inset 0 1px 2px rgba(0,0,0,0.06)" : "inset 0 1px 2px rgba(0,0,0,0.35)",
  };
}

function macRaisedChip(light: boolean): CSSProperties {
  return {
    background: light ? "#ffffff" : "rgba(255,255,255,0.22)",
    boxShadow: light
      ? "0 1px 2px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)"
      : "0 1px 2px rgba(0,0,0,0.4), inset 0 0.5px 0 rgba(255,255,255,0.22)",
  };
}

function macWarnChip(light: boolean): CSSProperties {
  return {
    background: light ? "rgba(255,77,79,0.1)" : "rgba(255,77,79,0.16)",
    boxShadow: light
      ? "0 0 0 0.5px rgba(255,77,79,0.35), inset 0 0.5px 0 rgba(255,255,255,0.5)"
      : "0 0 0 0.5px rgba(255,77,79,0.45), inset 0 0.5px 0 rgba(255,255,255,0.12)",
  };
}

function macMenu(light: boolean): CSSProperties {
  return {
    background: light ? "#ffffff" : "rgba(36,36,38,0.78)",
    boxShadow: light
      ? "0 0 0 0.5px rgba(0,0,0,0.1), 0 10px 40px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)"
      : "0 0 0 0.5px rgba(255,255,255,0.12), 0 10px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.28)",
  };
}
