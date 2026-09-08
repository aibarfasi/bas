export function shortAddr(addr?: string | null, size = 4) {
  if (!addr) return "—";
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 2 + size)}…${addr.slice(-size)}`;
}

export function agentPath(chainId: number, tokenId: string) {
  return `/agent/${chainId}/${encodeURIComponent(tokenId)}`;
}

export function hirePath(chainId: number, tokenId: string) {
  return `/hire/${chainId}-${encodeURIComponent(tokenId)}`;
}

export function parseHireId(id: string) {
  const idx = id.indexOf("-");
  if (idx < 0) return null;
  const chainId = Number(id.slice(0, idx));
  const tokenId = decodeURIComponent(id.slice(idx + 1));
  if (!Number.isFinite(chainId) || !tokenId) return null;
  return { chainId, tokenId };
}

export function formatPct(n: number | null | undefined, digits = 1) {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

export function formatUsd(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n === 0) return "Free";
  return `$${n.toFixed(n < 1 ? 3 : 2)}`;
}

export function chainName(id: number) {
  if (id === 56) return "BSC";
  if (id === 97) return "BSC testnet";
  return `Chain ${id}`;
}

export function explorerTx(chainId: number, hash: string) {
  const host = chainId === 97 ? "testnet.bscscan.com" : "bscscan.com";
  return `https://${host}/tx/${hash}`;
}

export function explorerAddress(chainId: number, addr: string) {
  const host = chainId === 97 ? "testnet.bscscan.com" : "bscscan.com";
  return `https://${host}/address/${addr}`;
}

export function altanaExplorer(wallet: string) {
  return `https://explorer.altana.network/address/${wallet}`;
}

export function scanAgent(chainId: number, tokenId: string) {
  return `https://8004scan.io/agent/${chainId}/${tokenId}`;
}

export function publishedX402(agent: { services: { name: string; endpoint?: string | null }[] }) {
  return agent.services.find((s) => s.name === "x402" && s.endpoint)?.endpoint ?? null;
}

export function timeAgo(iso?: string | null) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
