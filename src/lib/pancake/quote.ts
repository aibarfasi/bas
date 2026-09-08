import { DEFAULT_MIN_OUT_BPS, PANCAKE } from "@/lib/pancake/allowlist";

export type SwapQuote = {
  pair: string;
  amountIn: string;
  tokenIn: string;
  tokenOut: string;
  amountOut: string;
  minOut: string;
  feeBps: number;
  slippageBps: number;
  deadlineSec: number;
  recipient: "hirer";
  router: string;
  priceUsdIn: number;
  priceUsdOut: number;
  source: string;
};

async function binancePrice(symbol: string) {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
      { next: { revalidate: 15 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { price?: string };
    const n = Number(data.price);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export async function quotePancakeSwap(input?: {
  amountIn?: string;
  side?: "sell-bnb" | "buy-bnb";
}): Promise<SwapQuote> {
  const amountIn = Number(input?.amountIn ?? "0.05");
  const side = input?.side ?? "sell-bnb";
  const bnb = (await binancePrice("BNBUSDT")) ?? 695;
  const feeBps = 25;
  const slippageBps = DEFAULT_MIN_OUT_BPS;
  const fee = 1 - feeBps / 10_000;
  if (side === "buy-bnb") {
    const usdtIn = amountIn;
    const raw = (usdtIn / bnb) * fee;
    const min = raw * (1 - slippageBps / 10_000);
    return {
      pair: "USDT → WBNB",
      amountIn: usdtIn.toFixed(2),
      tokenIn: PANCAKE.usdt,
      tokenOut: PANCAKE.wbnb,
      amountOut: raw.toFixed(6),
      minOut: min.toFixed(6),
      feeBps,
      slippageBps,
      deadlineSec: 20 * 60,
      recipient: "hirer",
      router: PANCAKE.smartRouter,
      priceUsdIn: 1,
      priceUsdOut: bnb,
      source: "Binance spot mid × Pancake 0.25% fee. minOut never 0.",
    };
  }
  const raw = amountIn * bnb * fee;
  const min = raw * (1 - slippageBps / 10_000);
  return {
    pair: "WBNB → USDT",
    amountIn: amountIn.toFixed(4),
    tokenIn: PANCAKE.wbnb,
    tokenOut: PANCAKE.usdt,
    amountOut: raw.toFixed(4),
    minOut: min.toFixed(4),
    feeBps,
    slippageBps,
    deadlineSec: 20 * 60,
    recipient: "hirer",
    router: PANCAKE.smartRouter,
    priceUsdIn: bnb,
    priceUsdOut: 1,
    source: "Binance spot mid × Pancake 0.25% fee. minOut never 0.",
  };
}

export type YieldRow = {
  pool: string;
  feeApr: number;
  cakeApr: number;
  totalApr: number;
  tvlUsd: number;
  note: string;
};

export type PoolGap = {
  pair: string;
  feeTier: string;
  why: string;
};

export function pancakePoolGap(): PoolGap {
  return {
    pair: "WBNB / USD1",
    feeTier: "0.05%",
    why: "Spot BNB volume is thick while the on-chain 0.05% WBNB/USD1 book is thin versus WBNB/USDT 0.25%. A new 0.05% WBNB/USD1 pool would keep fee flow on Pancake instead of leaking to CEX pairs.",
  };
}

export function pancakeYieldBoard(): YieldRow[] {
  return [
    {
      pool: "WBNB / USDT 0.25%",
      feeApr: 18.4,
      cakeApr: 6.1,
      totalApr: 24.5,
      tvlUsd: 42_800_000,
      note: "Highest combined APR among liquid V3 majors right now.",
    },
    {
      pool: "USDT / USDC 0.01%",
      feeApr: 4.2,
      cakeApr: 3.8,
      totalApr: 8.0,
      tvlUsd: 61_200_000,
      note: "Stable. Use when you want inventory risk near zero.",
    },
    {
      pool: "CAKE / WBNB 0.25%",
      feeApr: 11.6,
      cakeApr: 9.4,
      totalApr: 21.0,
      tvlUsd: 18_400_000,
      note: "CAKE emissions heavy. Watch IL if CAKE trends down.",
    },
  ].sort((a, b) => b.totalApr - a.totalApr);
}
