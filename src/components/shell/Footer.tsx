import Link from "next/link";
import { BasLogo } from "@/components/brand/BasLogo";

export function Footer({ light = false }: { light?: boolean }) {
  return (
    <footer
      className={`mt-auto border-t ${
        light
          ? "border-bas-hairline-light bg-bas-surface-soft text-bas-ink"
          : "border-bas-hairline bg-bas-canvas text-bas-muted"
      }`}
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <BasLogo className="h-8 w-auto" />
          <p className="mt-1 max-w-md text-xs leading-5">
            Discover, compare, and hire ERC-8004 agents on BNB Smart Chain.
            Payments via x402 / ERC-8183. Sessions via Altana. Swaps via
            PancakeSwap — output goes to you.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          <Link href="/docs/judges">Judge path</Link>
          <Link href="/proofs">Proofs</Link>
          <Link href="/watch">Watchlist</Link>
          <Link href="/claim">Claim listing</Link>
          <Link href="/admin">Operator</Link>
          <Link href="/advantage">Agent Advantage Report</Link>
          <a href="https://www.bnbchain.org/en/hackathons/smart-money-era">
            Build the Era
          </a>
          <a href="https://8004scan.io">8004scan</a>
        </div>
      </div>
    </footer>
  );
}
