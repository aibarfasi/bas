"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider, cookieToInitialState } from "wagmi";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { getWagmiConfig } from "@/lib/wallet/config";

export function Providers({
  children,
  cookie,
}: {
  children: ReactNode;
  cookie?: string | null;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
      }),
  );
  const [config] = useState(() => getWagmiConfig());
  const initialState = cookieToInitialState(config, cookie ?? undefined);

  return (
    <WagmiProvider config={config} initialState={initialState} reconnectOnMount>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>{children}</ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
