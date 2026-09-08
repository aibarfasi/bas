import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

type WalletWindow = Window & {
  BinanceChain?: { request?: (...args: unknown[]) => unknown };
  binancew3w?: { ethereum?: { request?: (...args: unknown[]) => unknown } };
  ethereum?: {
    isBinance?: boolean;
    providers?: { isBinance?: boolean; request?: (...args: unknown[]) => unknown }[];
    request?: (...args: unknown[]) => unknown;
  };
};

function binanceProvider() {
  if (typeof window === "undefined") return undefined;
  const w = window as WalletWindow;
  if (w.binancew3w?.ethereum) return w.binancew3w.ethereum;
  if (w.BinanceChain?.request) return w.BinanceChain;
  if (w.ethereum?.isBinance) return w.ethereum;
  return w.ethereum?.providers?.find((p) => p.isBinance);
}

export function getWagmiConfig() {
  return createConfig({
    chains: [bsc, bscTestnet],
    connectors: [
      injected({ shimDisconnect: true }),
      injected({
        shimDisconnect: true,
        target: {
          id: "binanceWallet",
          name: "Binance Wallet",
          provider: () => binanceProvider() as never,
        },
      }),
    ],
    transports: {
      [bsc.id]: http(process.env.NEXT_PUBLIC_BSC_RPC),
      [bscTestnet.id]: http(process.env.NEXT_PUBLIC_BSC_TESTNET_RPC),
    },
    ssr: true,
    multiInjectedProviderDiscovery: true,
    storage: createStorage({ storage: cookieStorage }),
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getWagmiConfig>;
  }
}

export function connectErrorMessage(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (/rejected|denied|4001/i.test(msg)) return "Request rejected in the wallet.";
  if (/provider not found|not been authorized|no injected/i.test(msg)) {
    return "No browser wallet found. Install MetaMask or Binance Wallet, or open this page in a wallet browser.";
  }
  if (/chain|4902|unrecognized/i.test(msg)) {
    return "This wallet does not have that BNB Chain network yet. Approve Add network when prompted.";
  }
  return msg.replace(/^ConnectorError:\s*/i, "").slice(0, 180) || "Could not connect.";
}

export function mobileWalletHrefs() {
  if (typeof window === "undefined") return [];
  const href = window.location.href;
  const dapp = `${window.location.host}${window.location.pathname}${window.location.search}`;
  return [
    { id: "metamask", name: "Open in MetaMask", href: `https://metamask.app.link/dapp/${dapp}` },
    {
      id: "binance",
      name: "Open in Binance Web3",
      href: `https://app.binance.com/cedefi/dapp?url=${encodeURIComponent(href)}`,
    },
  ];
}

export function isLikelyMobile() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
