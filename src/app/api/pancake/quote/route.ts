import { pancakeYieldBoard, quotePancakeSwap } from "@/lib/pancake/quote";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const amountIn = url.searchParams.get("amountIn") ?? undefined;
  const side = (url.searchParams.get("side") ?? "sell-bnb") as
    | "sell-bnb"
    | "buy-bnb";
  const quote = await quotePancakeSwap({ amountIn, side });
  return NextResponse.json({ quote, yields: pancakeYieldBoard() });
}
