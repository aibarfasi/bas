import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export function getWagmiConfig() {
  return createConfig({
    chains: [bsc, bscTestnet],
    connectors: [injected({ shimDisconnect: true })],
    transports: {
      [bsc.id]: http(process.env.NEXT_PUBLIC_BSC_RPC),
      [bscTestnet.id]: http(process.env.NEXT_PUBLIC_BSC_TESTNET_RPC),
    },
    ssr: true,
    storage: createStorage({ storage: cookieStorage }),
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getWagmiConfig>;
  }
}
