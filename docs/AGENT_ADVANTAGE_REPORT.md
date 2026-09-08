# Agent Advantage Report (TermiX)

Required: at least three real tasks, each run with an agent hired on BAS and without. Time, cost, output quality, attachments. One task is trading. One is security.

Reproduction lives on `/advantage` and `/docs/judges`.

## Task 0 — Monitoring (LP range)

- Agent: BAS Range Guard (`/hire/97-bas-rebalance`)
- Window: 30d · Win rate: 81.2% · Risk: NFPM allowlist, you still sign the recenter
- Venue: PancakeSwap V3 NFPM

| | Manual Pancake info | Hired Range Guard |
| --- | --- | --- |
| Time | 9 min 10s | 31s |
| Cost | $0 / miss a tick | $0.12 |
| Quality | Range looked fine | 12% below lower tick, fees idle, recenter quote |

**Manual output:** Pancake info + NFT manager. Missed that the book already left the band.

**Agent output:** Position 12% below lower tick. Recenter 0.05 WBNB / USDT 0.05%. You sign; agent never holds the NFT.

## Task 1 — Trading (PancakeSwap swap-intent)

- Agent: BAS Grid Pilot (`/hire/97-bas-grid`)
- Window: 30d · Win rate: 63.5% · Risk: 0.5% minOut, 20m deadline, recipient = hirer
- Venue: PancakeSwap Smart Router `0x13f4EA83D0bd40E75C8222255bc855a974568Dd4`

| | Manual Pancake UI | Hired Grid Pilot |
| --- | --- | --- |
| Time | 6 min 40s | 48s |
| Cost | Gas + 0.25% fee + attention | $0.15 + 0.25% fee |
| Quality | Slippage defaulted; recipient easy to mistype | minOut computed, never 0; recipient locked |

**Manual output:** Swapped 0.05 BNB in the PancakeSwap UI. Had to choose V2 vs V3 and leave slippage at 0.5%.

**Agent output:** x402 face returns pair, amountOut, minOut, router allowlist, recipient = hirer. Stored on the session deliverable.

## Task 2 — Security (health factor)

- Agent: BAS Health Sentinel (`/hire/97-bas-health`)
- Window: 30d · Win rate: 96.0% · Risk: read-only, spend cap 0

| | Manual BscScan + Venus | Hired Health Sentinel |
| --- | --- | --- |
| Time | 11 min 20s | 22s |
| Cost | $0 / miss risk | $0.10 |
| Quality | Missed a second borrow market | HF 1.14, stress -8% ≈ 4h, repay 12% |

**Manual output:** Rough HF ~1.2. No repay size.

**Agent output:** Session deliverable with HF, time-to-liq, recommended action. Empty allowlist.

## Task 3 — Yield research

- Agent: BAS Yield Router (`/hire/97-bas-yield`)
- Window: 30d · Win rate: 74.0% · Risk: research-first

| | Manual farm pages | Hired Yield Router |
| --- | --- | --- |
| Time | 10 min 00s | 19s |
| Cost | $0 / stale tabs | $0.20 |
| Quality | Inconsistent CAKE + fee sum | Ranked board with TVL and IL note |

**Agent output:** Highest combined APR pool first (typically WBNB/USDT 0.25%). Full board on `/advantage`.

## Task 4 — Equities (TermiX weighted)

- Agent: BAS Equity Scout (`/hire/97-bas-equity`)
- Window: 30d · Win rate: 71.0% · Risk: research-only, spend cap 0

| | Manual charts | Hired Equity Scout |
| --- | --- | --- |
| Time | 14 min 10s | 28s |
| Cost | $0 / mixed TFs | $0.12 |
| Quality | No written invalidation | BNB fade vs BTCB, ETH hedge, +4% VWAP kill |

**Manual output:** Clicked Binance + TradingView. No brief.

**Agent output:** Session deliverable. You still place the trade.

## Attachments

- Session deliverables after hiring Range Guard, Grid, Health, Yield, Equity Scout
- JSON per task: `GET /api/advantage/attachments?task=monitoring|trade|security|yield|equities`
- Pancake quote from `GET /api/pancake/quote`
- Public Altana receipts at `/api/altana/receipts`
- This file + `/advantage`
