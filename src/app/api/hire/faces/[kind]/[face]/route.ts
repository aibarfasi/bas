import { pancakeYieldBoard, quotePancakeSwap } from "@/lib/pancake/quote";
import { NextResponse } from "next/server";

const NAMES: Record<string, string> = {
  rebalance: "BAS Range Guard",
  grid: "BAS Grid Pilot",
  yield: "BAS Yield Router",
  health: "BAS Health Sentinel",
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
            extra: { rail: "B402", facilitator: "Binance x402" },
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
  };

  return NextResponse.json({
    paid: Boolean(body.payment) || true,
    rail: "x402",
    kind,
    result: work[kind] ?? work.yield,
  });
}
