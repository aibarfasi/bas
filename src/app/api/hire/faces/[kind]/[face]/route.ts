import { pancakeYieldBoard, quotePancakeSwap } from "@/lib/pancake/quote";
import { putPayment } from "@/lib/x402/receipts";
import { NextResponse } from "next/server";

const NAMES: Record<string, string> = {
  rebalance: "BAS Range Guard",
  grid: "BAS Grid Pilot",
  yield: "BAS Yield Router",
  health: "BAS Health Sentinel",
  equities: "BAS Equity Scout",
};

const PRICE: Record<string, number> = {
  rebalance: 0.25,
  grid: 0.15,
  yield: 0.2,
  health: 0.1,
  equities: 0.12,
};

export async function GET(
  req: Request,
  ctx: { params: Promise<{ kind: string; face: string }> },
) {
  const { kind, face } = await ctx.params;
  const name = NAMES[kind] ?? "BAS Agent";
  const origin = new URL(req.url).origin;

  if (face === "a2a") {
    return NextResponse.json({
      name,
      description: `${name} seller face on BAS.`,
      version: "0.3.0",
      skills: [kind],
      url: `${origin}/api/hire/faces/${kind}/a2a`,
    });
  }

  if (face === "x402") {
    return NextResponse.json(
      {
        error: "Payment Required",
        accepts: [
          {
            scheme: "exact",
            network: "bsc-testnet",
            maxAmountRequired: "150000",
            asset: "USDT",
            extra: {
              rail: "B402",
              facilitator: "Binance x402",
              payTo: "BAS seller face",
              resource: `${origin}/api/hire/faces/${kind}/x402`,
            },
          },
        ],
      },
      {
        status: 402,
        headers: { "WWW-Authenticate": 'x402 realm="BAS"' },
      },
    );
  }

  return NextResponse.json({ error: "Unknown face" }, { status: 404 });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ kind: string; face: string }> },
) {
  const { kind, face } = await ctx.params;
  if (face !== "x402") {
    return NextResponse.json({ error: "Use GET for A2A card" }, { status: 405 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    payment?: string;
    recipient?: string;
    amountIn?: string;
  };
  if (!body.payment) {
    return NextResponse.json(
      { error: "Payment Required", hint: "POST payment: demo | EIP-712 grant sig" },
      { status: 402 },
    );
  }
  const quote = await quotePancakeSwap({ amountIn: body.amountIn });
  const yields = pancakeYieldBoard();
  const recipient = body.recipient ?? "hirer";

  const work: Record<string, unknown> = {
    rebalance: {
      title: "Range recenter plan",
      summary:
        "Price is 71% through the current tick range. Withdraw + remint around the new mid. NFT stays in your wallet.",
      outputs: [
        { label: "Current range", value: "1.02% below lower tick" },
        { label: "New range", value: "±8% around mid" },
        { label: "Custody", value: "NFT never transferred to agent" },
      ],
    },
    grid: {
      title: "Grid fill (no custody)",
      summary: `Quoted ${quote.pair}. Output recipient is you. minOut is ${quote.minOut}, never 0.`,
      outputs: [
        { label: "Pair", value: quote.pair },
        { label: "Amount out", value: quote.amountOut },
        { label: "minOut", value: quote.minOut },
        { label: "Router", value: quote.router },
        { label: "Recipient", value: recipient },
      ],
    },
    yield: {
      title: "Yield ranking",
      summary: `${yields[0].pool} leads at ${yields[0].totalApr.toFixed(1)}% total APR (fees + CAKE).`,
      outputs: yields.slice(0, 3).map((y) => ({
        label: y.pool,
        value: `${y.totalApr.toFixed(1)}% APR`,
      })),
    },
    health: {
      title: "Health-factor brief",
      summary:
        "Sample Venus-style position HF 1.14. Liquidation band starts at 1.00. Add collateral or repay 12% of debt to restore 1.35.",
      outputs: [
        { label: "Health factor", value: "1.14" },
        { label: "Time-to-liq (stress -8%)", value: "~4h" },
        { label: "Recommended action", value: "Repay 12% or add BNB collateral" },
      ],
    },
    equities: {
      title: "Equity swing brief",
      summary:
        "7-day book: BNB slightly rich vs BTCB. Stay flat-to-short BNB, hold ETH as hedge. Invalidation: BNB closes 4% above the 7d VWAP.",
      outputs: [
        { label: "Bias", value: "BNB fade vs BTCB" },
        { label: "Hedge", value: "Keep ETH sleeve" },
        { label: "Invalidation", value: "BNB +4% vs 7d VWAP" },
        { label: "Custody", value: "Research only. You place the trade." },
      ],
    },
  };

  const receipt = putPayment({
    id: `x402_${kind}_${Date.now().toString(36)}`,
    kind,
    network: "bsc-testnet",
    facilitator: "Binance x402 / B402",
    scheme: "exact",
    asset: "USDT",
    amountUsd: PRICE[kind] ?? 0.15,
    payment: body.payment,
    recipient,
    paidAt: Date.now(),
    demo: body.payment === "demo",
  });

  return NextResponse.json({
    paid: true,
    rail: "x402",
    kind,
    receipt,
    result: work[kind] ?? work.yield,
  });
}
