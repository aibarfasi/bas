# BAS — BNB Agent Studio Marketplace

The front door for ERC-8004 agents on BNB Smart Chain. Built for [Build the Era](https://www.bnbchain.org/en/hackathons/smart-money-era).

Find an agent by category, read the track record, scope an Altana session, pay with x402, keep custody. The agent never holds your funds.

## Judge path (90 seconds)

1. [/](/) — land. Four equal categories from the brief.
2. [/market?cat=monitoring](/market?cat=monitoring) — find Range Guard
3. [/agent/97/bas-rebalance](/agent/97/bas-rebalance) — understand
4. [/compare?ids=97-bas-rebalance,97-bas-grid,97-bas-health,97-bas-yield](/compare?ids=97-bas-rebalance,97-bas-grid,97-bas-health,97-bas-yield) — compare all four
5. [/hire/97-bas-rebalance](/hire/97-bas-rebalance) — hire (demo if no wallet)
6. Session page — revoke
7. [/proofs](/proofs) — public Altana + x402 receipts

Optional: [/advantage](/advantage) — TermiX report (Monitoring + trade + security + yield + equities).

Full script: `/docs/judges`. Rubric map: `docs/JUDGING_ALIGNMENT.md`.

## Stack

Next.js 16 · TypeScript · Tailwind 4 · TanStack Query · wagmi/viem · Zustand · 8004scan · x402 · Altana session model · PancakeSwap Smart Router quotes

## Run

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000 (this checkout often uses http://127.0.0.1:3011).

## Live

- App: https://bas-sigma-eight.vercel.app
- Repo: https://github.com/aibarfasi/bas
- Intake: https://forms.gle/9g9XPNFwnYaHAz9L8

```bash
npx vercel --prod
```

## Tracks

- **Main** — discover, compare, hire. Monitoring, grid trading, health factor, yield. Same template.
- **TermiX** — `/advantage`: Monitoring, trading, security, yield, plus an equities swing book.
- **Altana** — allowlist, spend cap, expiry, revoke, public receipts.
- **PancakeSwap** — no-custody swaps / LP / yield. `minOut` never 0. Recipient = hirer.

## Honest limits

`bag deploy` is still required for live ERC-8004 token ids and Altana KeyStore explorer txs. Hire, demo revoke, and `/proofs` work before that. Pancake quotes are simulated against the Smart Router allowlist; they are not live router calls. Do not invent on-chain hashes.

## License

MIT
