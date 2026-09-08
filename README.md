# BAS — BNB Agent Studio Marketplace

The front door for ERC-8004 agents on BNB Smart Chain. Built for [Build the Era](https://www.bnbchain.org/en/hackathons/smart-money-era).

Find an agent by category, read the track record, scope an Altana session, pay with x402, keep custody. The agent never holds your funds.

## Judge path (90 seconds)

1. [/](/) — land
2. [/market?cat=grid](/market?cat=grid) — find
3. [/agent/97/bas-grid](/agent/97/bas-grid) — understand
4. [/hire/97-bas-grid](/hire/97-bas-grid) — activate (demo if no wallet)
5. Session page — revoke
6. [/advantage](/advantage) — TermiX report

Full script: `/docs/judges`. Rubric map: `docs/JUDGING_ALIGNMENT.md`.

## Stack

Next.js 16 · TypeScript · Tailwind 4 · TanStack Query · wagmi/viem · Zustand · 8004scan · x402 · Altana session model · PancakeSwap Smart Router quotes

## Run

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

## Live

- App: https://bas-sigma-eight.vercel.app
- Repo: https://github.com/aibarfasi/bas
- Intake: https://forms.gle/9g9XPNFwnYaHAz9L8

```bash
npx vercel --prod
```

## Tracks

- **Main** — discover, compare, hire. Four categories, equal depth.
- **TermiX** — `/advantage` + hireable trading/security agents.
- **Altana** — allowlist, spend cap, expiry, visible revoke.
- **PancakeSwap** — no-custody swaps / LP / yield. `minOut` never 0.

## License

MIT
